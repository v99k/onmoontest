import type { ClientCell, PlayerInfo } from '@game/shared';

export type FinishTone = 'win' | 'lose' | 'draw';
export type FinishBanner = { title: string; subtitle: string; tone: FinishTone };
export type BoardCell = { c: ClientCell; x: number; y: number };
export type FinishedOutcome =
  | { kind: 'draw' }
  | { kind: 'win'; winner: PlayerInfo }
  | { kind: 'lose'; winner: PlayerInfo };
