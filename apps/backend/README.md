# pair-reverse-minesweeper/backend

## Предисловие

Игра очень простая, решил сделать все одним модулем, так как не вижу тут обособленных сущностей игрока или чего-то еще.

# Контракты

## REST:
### Create a game
```
curl -X POST http://localhost:3000/game -d '{"n": 6, "m": 5}'
```
Response:
```
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Создает рум с игрой

Errors:
400 - Bad Request

## WebSocket:
### Error format:
```
{
  "code": "string",
  "message": "string"
}
```
### Join a game
Event: `joinGame`
Payload:
```
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "playerToken": "123e4567-e89b-12d3-a456-426614174000"
}
```

OK:
```
{
  "playerId": "123e4567-e89b-12d3-a456-426614174000",
  "label": "Player 1"
}
```

Bad:
- `GAME_NOT_FOUND` - Если игра не найдена
- `GAME_FULL` - Если игра уже заполнена
- `INVALID_MOVE` - Непредвиденная ошибка, информация в `message`

### Make a move
Event: `makeMove`
Payload:
```
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "x": 0,
  "y": 0
}
```

OK:
```
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000",
  "x": 0,
  "y": 0
}
```

Bad:
- `GAME_NOT_FOUND` - Если игра не найдена
- `NOT_YOUR_TURN` - Если не ваш ход или вы не участник партии
- `INVALID_MOVE` - Непредвиденная ошибка, информация в `message`

### Request a restart
Event: `requestRestart`
Payload:
```
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000"
}
```

OK:
```
{
  "gameId": "123e4567-e89b-12d3-a456-426614174000"
}
```

Bad:
- `GAME_NOT_FOUND` - Если игра не найдена
- `NOT_YOUR_TURN` - Вы не участник партии
- `INVALID_MOVE` - Непредвиденная ошибка, информация в `message`
