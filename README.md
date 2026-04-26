# pair-reverse-minesweeper

Парный обратный сапёр — клиент-серверная игра на **NestJS + Vue 3**.

Монорепо на **npm workspaces**:

- `apps/backend` — `@game/backend` ([NestJS](https://nestjs.com), TypeScript)
- `apps/frontend` — `@game/frontend` ([Vue 3](https://vuejs.org) + [Vite](https://vitejs.dev), TypeScript)
- `packages/shared` — `@game/shared` (общие типы/утилиты, TypeScript)

Параллельный запуск задач — через [`npm-run-all`](https://github.com/mysticatea/npm-run-all).

## Требования

- Node.js >= 18
- npm >= 10

## Установка

```bash
npm install
```

## Скрипты

Все команды запускаются из корня монорепо:

| Команда           | Что делает                                                                       |
| ----------------- | --------------------------------------------------------------------------------- |
| `npm run dev`     | `npm-run-all --parallel dev:backend dev:frontend` — оба сервиса в watch-режиме    |
| `npm run build`   | Последовательно: `@game/shared` → `@game/backend` → `@game/frontend`              |
| `npm run lint`    | `npm run lint --workspaces --if-present` — линт во всех воркспейсах, где он есть  |
| `npm run format`  | `npm run format --workspaces --if-present` — форматирование во всех воркспейсах   |

Запуск задач конкретного воркспейса:

```bash
npm run start:dev --workspace=@game/backend
npm run dev       --workspace=@game/frontend
npm run build     --workspace=@game/shared
```

## Структура

```
.
├── apps/
│   ├── backend/    # @game/backend  — NestJS
│   └── frontend/   # @game/frontend — Vue 3 + Vite
├── packages/
│   └── shared/     # @game/shared   — общие типы/утилиты
├── package.json
└── README.md
```
