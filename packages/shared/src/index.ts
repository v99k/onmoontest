export type GameStatus = 'WAITING' | 'PLAYING' | 'FINISHED';

export interface Point {
	x: number;
	y: number;
}

export type ClientCell =
	| { isOpened: false }
	| { isOpened: true; hasDiamond: true }
	| { isOpened: true; hasDiamond: false; adjacent: number };

export interface PlayerInfo {
	id: string;
	label: string;
	score: number;
	connected: boolean;
}

export interface ClientGameState {
	gameId: string;
	n: number;
	m: number;
	field: ClientCell[][];
	players: PlayerInfo[];
	activePlayerId: string | null;
	status: GameStatus;
	winnerId: string | null;
	draw: boolean;
	totalFound: number;
}

export interface CreateGamePayload {
	n: number;
	m: number;
}

export interface CreateGameResponse {
	gameId: string;
}

export const WsEvent = {
	/** Клиент → сервер: войти в комнату игры. */
	JoinGame: 'joinGame',
	/** Клиент → сервер: открыть клетку. */
	MakeMove: 'makeMove',
	/** Клиент → сервер: запросить новую партию (после FINISHED). */
	RequestRestart: 'requestRestart',

	/** Сервер → клиент: полное обновление состояния игры. */
	GameUpdated: 'gameUpdated',
	/** Сервер → клиент: ошибка (несуществующая игра, невалидный ход и т.п.). */
	GameError: 'gameError',
	/** Сервер → клиент: «вы — игрок X», передаётся при join. */
	Joined: 'joined',
} as const;

export type WsEventName = (typeof WsEvent)[keyof typeof WsEvent];

export interface JoinGamePayload {
	gameId: string;
	playerToken?: string;
}

export interface MakeMovePayload {
	gameId: string;
	x: number;
	y: number;
}

export interface JoinedPayload {
	playerId: string;
	label: string;
	isSpectator: boolean;
}

export interface GameErrorPayload {
	code:
		| 'GAME_NOT_FOUND'
		| 'INVALID_MOVE'
		| 'NOT_YOUR_TURN'
		| 'GAME_FINISHED'
		| 'CELL_ALREADY_OPENED'
		| 'OUT_OF_BOUNDS'
		| 'GAME_FULL';
	message: string;
}

// Game config limits

export const FIELD_LIMITS = {
	MIN_N: 2,
	MAX_N: 6,
	MIN_M: 1,
} as const;
