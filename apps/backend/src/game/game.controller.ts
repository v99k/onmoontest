import { Body, Controller, Post } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { GameService } from './game.service';
import { type CreateGameResponse } from '@game/shared';

@Controller('game')
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Post()
	public create(@Body() dto: CreateGameDto): CreateGameResponse {
		const game = this.gameService.create(dto.n, dto.m);
		return { gameId: game.id };
	}
}
