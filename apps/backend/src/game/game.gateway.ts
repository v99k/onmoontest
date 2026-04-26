import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameInstance } from './game-instance';
import { GameService } from './game.service';
import * as shared from '@game/shared';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	private readonly server!: Server;
	private readonly logger = new Logger(GameGateway.name);
	constructor(private readonly gameService: GameService) {}

	public handleConnection(client: Socket): void {
		this.logger.log(`Connected: ${client.id}`);
	}

	public handleDisconnect(client: Socket): void {
		this.logger.log(`Disconnected: ${client.id}`);
		for (const game of this.gameService.findGamesOfSocket(client.id)) {
			game.markDisconnectedBySocket(client.id);
			this.broadcastState(game);
		}
	}

	// TODO для незанятого слота можно добавить зрительский режим.
	// When client joins a game
	@SubscribeMessage(shared.WsEvent.JoinGame)
	public handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: shared.JoinGamePayload): void {
		const game = this.gameService.tryGet(payload?.gameId);
		if (!game) {
			this.emitError(client, this.buildError('GAME_NOT_FOUND'));
			return;
		}

		const token = payload?.playerToken && payload.playerToken.length > 0 ? payload.playerToken : randomUUID();

		try {
			const info = game.addPlayer(token, client.id);
			void client.join(game.id);
			const joined: shared.JoinedPayload = {
				playerId: token,
				label: info.label,
				isSpectator: false,
			};
			client.emit(shared.WsEvent.Joined, joined);
			this.broadcastState(game);
		} catch (e) {
			const message = e instanceof Error ? e.message : undefined;
			if (message === 'GAME_FULL') {
				this.emitError(client, this.buildError('GAME_FULL'));
				return;
			}
			this.emitError(client, this.buildError('INVALID_MOVE', message));
		}
	}

	// When client makes a move
	@SubscribeMessage(shared.WsEvent.MakeMove)
	public handleMove(@ConnectedSocket() client: Socket, @MessageBody() payload: shared.MakeMovePayload): void {
		const game = this.gameService.tryGet(payload?.gameId);
		if (!game) {
			this.emitError(client, this.buildError('GAME_NOT_FOUND'));
			return;
		}
		const token = game.getTokenBySocket(client.id);
		if (!token) {
			this.emitError(client, this.buildError('NOT_YOUR_TURN', 'Вы не участник этой партии'));
			return;
		}

		try {
			game.openCell(token, payload.x, payload.y);
			this.broadcastState(game);
		} catch (e) {
			const message = e instanceof Error ? e.message : undefined;
			this.emitError(client, this.buildError(this.ensureErrorCode(message)));
		}
	}

	// When client requests a restart
	@SubscribeMessage(shared.WsEvent.RequestRestart)
	public handleRestart(@ConnectedSocket() client: Socket, @MessageBody() payload: shared.JoinGamePayload): void {
		const game = this.gameService.tryGet(payload?.gameId);
		if (!game) {
			this.emitError(client, this.buildError('GAME_NOT_FOUND'));
			return;
		}
		const token = game.getTokenBySocket(client.id);
		if (!token) {
			this.emitError(client, this.buildError('NOT_YOUR_TURN', 'Вы не участник этой партии'));
			return;
		}
		game.restart();
		this.broadcastState(game);
	}

	// --- Helpers --- //

	private broadcastState(game: GameInstance): void {
		this.server.to(game.id).emit(shared.WsEvent.GameUpdated, game.getClientState());
	}

	private emitError(client: Socket, payload: shared.GameErrorPayload): void {
		client.emit(shared.WsEvent.GameError, payload);
	}

	private ensureErrorCode(message: string | undefined): shared.GameErrorPayload['code'] {
		switch (message) {
			case 'NOT_YOUR_TURN':
			case 'OUT_OF_BOUNDS':
			case 'CELL_ALREADY_OPENED':
			case 'GAME_FINISHED':
				return message;
			default:
				return 'INVALID_MOVE';
		}
	}

	private humanizeError(code: shared.GameErrorPayload['code']) {
		const errorMessages: Record<shared.GameErrorPayload['code'], string> = {
			NOT_YOUR_TURN: 'Сейчас не ваш ход',
			OUT_OF_BOUNDS: 'Клетка вне поля',
			CELL_ALREADY_OPENED: 'Клетка уже открыта',
			GAME_FINISHED: 'Игра уже завершена',
			GAME_FULL: 'В партии уже два игрока',
			GAME_NOT_FOUND: 'Игра не найдена',
			INVALID_MOVE: 'Неправильный ход',
		};

		return errorMessages[code] ?? 'Неправильный ход';
	}

	private buildError(code: shared.GameErrorPayload['code'], overrideMessage?: string): shared.GameErrorPayload {
		return { code, message: overrideMessage ?? this.humanizeError(code) };
	}
}
