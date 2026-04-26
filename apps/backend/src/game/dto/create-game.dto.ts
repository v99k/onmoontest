import { IsInt, Max, Min } from 'class-validator';
import * as shared from '@game/shared';

export class CreateGameDto implements shared.CreateGamePayload {
	@IsInt({ message: 'N должно быть целым числом' })
	@Min(shared.FIELD_LIMITS.MIN_N, { message: `N должно быть >= ${shared.FIELD_LIMITS.MIN_N}` })
	@Max(shared.FIELD_LIMITS.MAX_N, { message: `N должно быть <= ${shared.FIELD_LIMITS.MAX_N}` })
	n!: number;

	@IsInt({ message: 'M должно быть целым числом' })
	@Min(shared.FIELD_LIMITS.MIN_M, { message: `M должно быть >= ${shared.FIELD_LIMITS.MIN_M}` })
	m!: number;
}
