import { randomUUID } from 'node:crypto';
import { ClientCell, ClientGameState, GameStatus, PlayerInfo } from '@game/shared';
import { Cell } from './types/game.interfaces';
import { OpenCellOutcome } from './types/game.types';

export class GameInstance {
	public readonly id: string = randomUUID();
	public readonly n: number;
	public readonly m: number;

	private readonly field: Cell[][];

	private readonly playerTokens: string[] = [];
	private readonly socketByToken = new Map<string, string>();
	private readonly tokenBySocket = new Map<string, string>();
	private readonly scores = new Map<string, number>();
	private readonly connected = new Map<string, boolean>();

	private activePlayerTokenInternal: string | null = null;
	private statusInternal: GameStatus = 'WAITING';
	private winnerTokenInternal: string | null = null;
	private totalFoundInternal = 0;

	constructor(n: number, m: number) {
		// TODO: additionally validate params here
		this.n = n;
		this.m = m;
		this.field = this.generateField(n, m);
	}

	public get status(): GameStatus {
		return this.statusInternal;
	}

	public get activePlayerId(): string | null {
		return this.activePlayerTokenInternal;
	}

	public get winnerId(): string | null {
		return this.winnerTokenInternal;
	}

	public hasToken(token: string): boolean {
		return this.playerTokens.includes(token);
	}

	public hasSocket(socketId: string): boolean {
		return this.tokenBySocket.has(socketId);
	}

	public getTokenBySocket(socketId: string): string | undefined {
		return this.tokenBySocket.get(socketId);
	}

	public isFull(): boolean {
		return this.playerTokens.length >= 2;
	}

	public addPlayer(token: string, socketId: string): PlayerInfo {
		if (this.hasToken(token)) {
			// reconnect: rewrite the token ↔ socket mapping
			const previousSocket = this.socketByToken.get(token);

			if (previousSocket && previousSocket !== socketId) {
				this.tokenBySocket.delete(previousSocket);
			}

			this.socketByToken.set(token, socketId);
			this.tokenBySocket.set(socketId, token);
			this.connected.set(token, true);
			return this.buildPlayerInfo(token);
		}

		if (this.isFull()) {
			throw new Error('GAME_FULL');
		}

		this.playerTokens.push(token);
		this.scores.set(token, 0);
		this.socketByToken.set(token, socketId);
		this.tokenBySocket.set(socketId, token);
		this.connected.set(token, true);

		if (this.playerTokens.length === 2 && this.statusInternal === 'WAITING') {
			this.statusInternal = 'PLAYING';
			this.activePlayerTokenInternal = this.playerTokens[0];
		}
		return this.buildPlayerInfo(token);
	}

	// TODO(cleanup): по таймеру удалять партии, у которых оба игрока offline дольше N минут.
	public markDisconnectedBySocket(socketId: string): void {
		const token = this.tokenBySocket.get(socketId);

		if (!token) return;

		this.tokenBySocket.delete(socketId);

		if (this.socketByToken.get(token) === socketId) {
			this.socketByToken.delete(token);
			this.connected.set(token, false);
		}
	}

	public openCell(token: string, x: number, y: number): OpenCellOutcome {
		if (this.statusInternal !== 'PLAYING') {
			throw new Error('GAME_FINISHED');
		}
		if (!this.hasToken(token)) {
			throw new Error('NOT_YOUR_TURN');
		}
		if (this.activePlayerTokenInternal !== token) {
			throw new Error('NOT_YOUR_TURN');
		}
		if (x < 0 || y < 0 || x >= this.n || y >= this.n) {
			throw new Error('OUT_OF_BOUNDS');
		}
		const cell = this.field[y][x];
		if (cell.isOpened) {
			throw new Error('CELL_ALREADY_OPENED');
		}

		cell.isOpened = true;

		if (cell.hasDiamond) {
			const next = (this.scores.get(token) ?? 0) + 1;
			this.scores.set(token, next);
			this.totalFoundInternal += 1;

			if (this.totalFoundInternal === this.m) {
				this.finish();
				return { kind: 'finished', winnerId: this.winnerTokenInternal };
			}
			return { kind: 'diamond' };
		}

		this.passTurn();
		return { kind: 'number', adjacent: cell.adjacent };
	}

	public restart(): void {
		const fresh = this.generateField(this.n, this.m);
		for (let y = 0; y < this.n; y++) {
			for (let x = 0; x < this.n; x++) {
				this.field[y][x] = fresh[y][x];
			}
		}
		for (const t of this.playerTokens) this.scores.set(t, 0);
		this.totalFoundInternal = 0;
		this.winnerTokenInternal = null;

		if (this.playerTokens.length === 2) {
			this.statusInternal = 'PLAYING';
			this.activePlayerTokenInternal = this.playerTokens[0];
		} else {
			this.statusInternal = 'WAITING';
			this.activePlayerTokenInternal = null;
		}
	}

	// TODO:решил не заморачиваться и обновлять все поле целиком,
	// в будущем можно сделать механизм сервер-авторити поизящнее
	public getClientState(): ClientGameState {
		const field: ClientCell[][] = this.field.map((row) =>
			row.map<ClientCell>((cell) => {
				if (!cell.isOpened) return { isOpened: false };
				return cell.hasDiamond
					? { isOpened: true, hasDiamond: true }
					: { isOpened: true, hasDiamond: false, adjacent: cell.adjacent };
			}),
		);

		return {
			gameId: this.id,
			n: this.n,
			m: this.m,
			field,
			players: this.playerTokens.map((t) => this.buildPlayerInfo(t)),
			activePlayerId: this.activePlayerTokenInternal,
			status: this.statusInternal,
			winnerId: this.winnerTokenInternal,
			draw: this.statusInternal === 'FINISHED' && this.winnerTokenInternal === null,
			totalFound: this.totalFoundInternal,
		};
	}

	private passTurn(): void {
		if (this.playerTokens.length < 2 || this.activePlayerTokenInternal === null) return;
		const idx = this.playerTokens.indexOf(this.activePlayerTokenInternal);
		this.activePlayerTokenInternal = this.playerTokens[(idx + 1) % this.playerTokens.length];
	}

	private finish(): void {
		this.statusInternal = 'FINISHED';
		this.activePlayerTokenInternal = null;

		let winner: string | null = null;
		let bestScore = -1;
		let tie = false;
		for (const t of this.playerTokens) {
			const s = this.scores.get(t) ?? 0;
			if (s > bestScore) {
				bestScore = s;
				winner = t;
				tie = false;
			} else if (s === bestScore) {
				tie = true;
			}
		}
		this.winnerTokenInternal = tie ? null : winner;
	}

	private buildPlayerInfo(token: string): PlayerInfo {
		const idx = this.playerTokens.indexOf(token);
		return {
			id: token,
			label: idx === 0 ? 'Игрок 1' : 'Игрок 2',
			score: this.scores.get(token) ?? 0,
			connected: this.connected.get(token) ?? false,
		};
	}

	private generateField(n: number, m: number): Cell[][] {
		const total = n * n;
		const indices = Array.from({ length: total }, (_, i) => i);

		// Fisher–Yates shuffle, берём первые M — гарантирует равновероятную выборку.
		for (let i = indices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[indices[i], indices[j]] = [indices[j], indices[i]];
		}
		const diamondSet = new Set(indices.slice(0, m));

		const field: Cell[][] = Array.from({ length: n }, (_, y) =>
			Array.from({ length: n }, (_, x) => ({
				hasDiamond: diamondSet.has(y * n + x),
				isOpened: false,
				adjacent: 0,
			})),
		);

		for (let y = 0; y < n; y++) {
			for (let x = 0; x < n; x++) {
				if (field[y][x].hasDiamond) continue;
				field[y][x].adjacent = this.countAdjacent(field, x, y, n);
			}
		}

		return field;
	}

	private countAdjacent(field: Cell[][], x: number, y: number, n: number): number {
		let count = 0;
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue;
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
				if (field[ny][nx].hasDiamond) count++;
			}
		}
		return count;
	}
}
