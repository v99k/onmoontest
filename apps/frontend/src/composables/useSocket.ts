import { onBeforeUnmount, ref, shallowRef } from 'vue';
import { io, type Socket } from 'socket.io-client';
import {
  WsEvent,
  type ClientGameState,
  type GameErrorPayload,
  type JoinedPayload,
  type MakeMovePayload,
} from '@game/shared';

interface UseSocketOptions {
  url?: string;
  onError?: (e: GameErrorPayload) => void;
}

const TOKEN_KEY_PREFIX = 'pms:token:';
const tokenKey = (gameId: string): string => TOKEN_KEY_PREFIX + gameId;

// TODO: лучше использовать куки, конечно, но я не стал усложнять
function readToken(gameId: string): string | undefined {
  try {
    return sessionStorage.getItem(tokenKey(gameId)) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeToken(gameId: string, token: string): void {
  try {
    sessionStorage.setItem(tokenKey(gameId), token);
  } catch {
    // ignore
  }
}

export function useSocket(options: UseSocketOptions = {}) {
  const url = options.url ?? import.meta.env.VITE_BACKEND_URL ?? window.location.origin;

  const socket: Socket = io(url, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  const connected = ref(socket.connected);
  const playerId = ref<string | null>(null);
  const playerLabel = ref<string | null>(null);
  const game = shallowRef<ClientGameState | null>(null);

  let currentGameId: string | null = null;

  function emitJoin(gameId: string): void {
    socket.emit(WsEvent.JoinGame, { gameId, playerToken: readToken(gameId) });
  }

  socket.on('connect', () => {
    connected.value = true;
    if (currentGameId) {
      // addPlayer на бэке идемпотентен по токену
      emitJoin(currentGameId);
    }
  });

  socket.on('disconnect', () => {
    connected.value = false;
  });

  socket.on(WsEvent.Joined, (payload: JoinedPayload) => {
    playerId.value = payload.playerId;
    playerLabel.value = payload.label;
    if (currentGameId) {
      writeToken(currentGameId, payload.playerId);
    }
  });

  socket.on(WsEvent.GameUpdated, (state: ClientGameState) => {
    game.value = state;
  });

  socket.on(WsEvent.GameError, (err: GameErrorPayload) => {
    options.onError?.(err);
  });

  function joinGame(gameId: string): void {
    currentGameId = gameId;
    if (socket.connected) {
      emitJoin(gameId);
    }
  }

  function makeMove(move: MakeMovePayload): void {
    socket.emit(WsEvent.MakeMove, move);
  }

  function requestRestart(gameId: string): void {
    socket.emit(WsEvent.RequestRestart, { gameId });
  }

  onBeforeUnmount(() => {
    socket.removeAllListeners();
    socket.disconnect();
  });

  return {
    socket,
    connected,
    playerId,
    playerLabel,
    game,
    joinGame,
    makeMove,
    requestRestart,
  };
}
