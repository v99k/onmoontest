import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GameInstance } from './game-instance';

/**
 * In-memory хранилище активных партий
 * TODO: заменить на Redis, вынести за интерфейс
 */
@Injectable()
export class GameService {
	private readonly games = new Map<string, GameInstance>();

	public create(n: number, m: number): GameInstance {
		try {
			const game = new GameInstance(n, m);
			this.games.set(game.id, game);
			return game;
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Не удалось создать игру';
			throw new BadRequestException(message);
		}
	}

	public get(gameId: string): GameInstance {
		const game = this.games.get(gameId);
		if (!game) {
			throw new NotFoundException('Игра не найдена');
		}
		return game;
	}

	public tryGet(gameId: string): GameInstance | undefined {
		return this.games.get(gameId);
	}

	public remove(gameId: string): void {
		this.games.delete(gameId);
	}

	public findGamesOfSocket(socketId: string): GameInstance[] {
		return [...this.games.values()].filter((g) => g.hasSocket(socketId));
	}
}
