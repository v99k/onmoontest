import { computed, onMounted, ref } from 'vue';
import type { ClientCell, GameErrorPayload, PlayerInfo } from '@game/shared';
import type { BoardCell, FinishBanner, FinishedOutcome } from '../components/game/types';
import { useSocket } from './useSocket';

export function useGameViewModel(getGameId: () => string) {
  const toast = ref<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function showToast(text: string): void {
    toast.value = text;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.value = null), 2400);
  }

  const { connected, playerId, playerLabel, game, joinGame, makeMove, requestRestart } = useSocket({
    onError: (e: GameErrorPayload) => showToast(e.message),
  });

  onMounted(() => {
    joinGame(getGameId());
  });

  const me = computed<PlayerInfo | null>(
    () => game.value?.players.find((p) => p.id === playerId.value) ?? null,
  );
  const opponent = computed<PlayerInfo | null>(
    () => game.value?.players.find((p) => p.id !== playerId.value) ?? null,
  );
  const activePlayer = computed<PlayerInfo | null>(
    () => game.value?.players.find((p) => p.id === game.value?.activePlayerId) ?? null,
  );
  const boardCells = computed<BoardCell[]>(() => {
    if (!game.value) return [];
    return game.value.field.flatMap((row, y) => row.map((c, x) => ({ c, x, y })));
  });
  const isMyTurn = computed(
    () => game.value?.status === 'PLAYING' && game.value?.activePlayerId === playerId.value,
  );
  const status = computed(() => game.value?.status ?? 'WAITING');

  const finishedOutcome = computed<FinishedOutcome | null>(() => {
    if (!game.value || game.value.status !== 'FINISHED') return null;
    if (game.value.draw) return { kind: 'draw' };
    const winner = game.value.players.find((p) => p.id === game.value!.winnerId);
    if (!winner) return null;
    return winner.id === playerId.value ? { kind: 'win', winner } : { kind: 'lose', winner };
  });

  const winnerLabel = computed<string | null>(() => {
    const outcome = finishedOutcome.value;
    switch (outcome?.kind) {
      case 'draw':
        return 'Ничья';
      case 'win':
        return 'Вы выиграли';
      case 'lose':
        return `Победил ${outcome.winner.label}`;
      default:
        return null;
    }
  });

  const finishBanner = computed<FinishBanner | null>(() => {
    const outcome = finishedOutcome.value;
    switch (outcome?.kind) {
      case 'draw':
        return { title: 'Ничья', subtitle: 'Алмазы поделили поровну', tone: 'draw' };
      case 'win':
        return { title: 'Победа', subtitle: 'Вы собрали больше алмазов', tone: 'win' };
      case 'lose':
        return { title: 'Поражение', subtitle: `Победил ${outcome.winner.label}`, tone: 'lose' };
      default:
        return null;
    }
  });

  const turnHint = computed<string>(() => {
    if (!game.value) return 'Подключаемся…';
    switch (game.value.status) {
      case 'WAITING':
        return 'Ждём второго игрока…';
      case 'FINISHED':
        return winnerLabel.value ?? 'Игра завершена';
      case 'PLAYING':
        return isMyTurn.value ? 'Ваш ход' : `Ход: ${activePlayer.value?.label ?? '—'}`;
      default:
        return 'Подключаемся…';
    }
  });

  const inviteUrl = computed(
    () => `${window.location.origin}${window.location.pathname}#${getGameId()}`,
  );

  function copyInvite(): void {
    navigator.clipboard
      .writeText(inviteUrl.value)
      .then(() => showToast('Ссылка скопирована'))
      .catch(() => showToast('Не удалось скопировать ссылку'));
  }

  function handleCellClick(x: number, y: number, cell: ClientCell): void {
    if (!game.value || game.value.status !== 'PLAYING') return;
    if (!isMyTurn.value) {
      showToast('Сейчас не ваш ход');
      return;
    }
    if (cell.isOpened) return;
    makeMove({ gameId: getGameId(), x, y });
  }

  function cellLabel(cell: ClientCell): string {
    if (!cell.isOpened) return '';
    if (cell.hasDiamond) return '◆';
    return String(cell.adjacent);
  }

  function cellModifier(cell: ClientCell): string {
    if (!cell.isOpened) return 'cell--closed';
    if (cell.hasDiamond) return 'cell--diamond';
    return `cell--n cell--n-${cell.adjacent}`;
  }

  return {
    connected,
    playerId,
    playerLabel,
    game,
    me,
    opponent,
    boardCells,
    isMyTurn,
    status,
    turnHint,
    finishBanner,
    toast,
    copyInvite,
    handleCellClick,
    cellLabel,
    cellModifier,
    requestRestart,
  };
}
