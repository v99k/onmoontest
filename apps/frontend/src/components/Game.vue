<script setup lang="ts">
import { useGameViewModel } from '../composables/useGameViewModel';

const props = defineProps<{ gameId: string }>();
const emit = defineEmits<{ (e: 'leave'): void }>();
const {
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
} = useGameViewModel(() => props.gameId);
</script>

<template>
  <section class="card game" :class="{ 'game--my-turn': isMyTurn }">
    <header class="game__header">
      <div class="game__id">
        <span class="game__id-label">ID партии</span>
        <code class="game__id-value">{{ gameId }}</code>
        <button class="btn btn--ghost" type="button" @click="copyInvite">Скопировать ссылку</button>
      </div>
      <button class="btn btn--ghost" type="button" @click="emit('leave')">← На главную</button>
    </header>

    <div class="scoreboard">
      <article
        class="player"
        :class="{
          'player--active': game?.activePlayerId === me?.id,
          'player--me': true,
          'player--off': me && !me.connected,
        }"
      >
        <span class="player__label">{{ me?.label ?? playerLabel ?? 'Вы' }}</span>
        <span class="player__score">{{ me?.score ?? 0 }}</span>
        <span class="player__tag">вы</span>
      </article>

      <div class="vs">
        <span class="vs__line" />
        <span class="vs__text">{{ turnHint }}</span>
        <span class="vs__line" />
      </div>

      <article
        class="player"
        :class="{
          'player--active': opponent && game?.activePlayerId === opponent.id,
          'player--off': opponent && !opponent.connected,
        }"
      >
        <span class="player__label">{{ opponent?.label ?? 'Соперник' }}</span>
        <span class="player__score">{{ opponent?.score ?? 0 }}</span>
        <span class="player__tag">{{ opponent ? '' : 'не подключён' }}</span>
      </article>
    </div>

    <div v-if="game" class="board" :style="{ '--n': game.n }">
      <button
        v-for="(cell, idx) in boardCells"
        :key="idx"
        type="button"
        class="cell"
        :class="cellModifier(cell.c)"
        :disabled="cell.c.isOpened || !isMyTurn || status !== 'PLAYING'"
        :aria-label="`Клетка ${cell.x + 1}, ${cell.y + 1}`"
        @click="handleCellClick(cell.x, cell.y, cell.c)"
      >
        <span class="cell__content">{{ cellLabel(cell.c) }}</span>
      </button>
    </div>

    <p v-if="!connected" class="game__warn">Соединение потеряно. Пытаемся переподключиться…</p>

    <Transition name="finish">
      <div
        v-if="finishBanner"
        class="finish"
        :class="`finish--${finishBanner.tone}`"
        role="dialog"
        aria-modal="true"
        :aria-label="finishBanner.title"
      >
        <div class="finish__backdrop" />
        <div class="finish__card">
          <span class="finish__eyebrow">Игра окончена</span>
          <h3 class="finish__title">{{ finishBanner.title }}</h3>
          <p class="finish__subtitle">{{ finishBanner.subtitle }}</p>

          <ul v-if="game" class="finish__scores">
            <li
              v-for="p in game.players"
              :key="p.id"
              class="finish__score"
              :class="{
                'finish__score--winner': p.id === game.winnerId,
                'finish__score--me': p.id === playerId,
              }"
            >
              <span class="finish__score-label">
                {{ p.label }}<span v-if="p.id === playerId" class="finish__score-tag">вы</span>
              </span>
              <span class="finish__score-value">{{ p.score }}</span>
            </li>
          </ul>

          <div class="finish__actions">
            <button class="btn btn--primary" type="button" @click="requestRestart(gameId)">
              Сыграть ещё раз
            </button>
            <button class="btn btn--ghost" type="button" @click="emit('leave')">На главную</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </section>
</template>
