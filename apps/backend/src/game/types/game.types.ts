export type OpenCellOutcome =
	| { kind: 'diamond' }
	| { kind: 'number'; adjacent: number }
	| { kind: 'finished'; winnerId: string | null };
