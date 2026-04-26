<script setup lang="ts">
import { useGameSetupViewModel } from '../composables/useGameSetupViewModel';

const emit = defineEmits<{ (e: 'created', gameId: string): void }>();

const { FIELD_LIMITS, form, loading, error, errors, canSubmit, submit } = useGameSetupViewModel({
  onCreated: (gameId) => emit('created', gameId),
});
</script>

<template>
  <section class="card setup">
    <h2 class="card__title">Новая партия</h2>
    <p class="card__hint">
      Поле N×N, на нём случайно расставлены M алмазов.<br />
      N — от {{ FIELD_LIMITS.MIN_N }} до {{ FIELD_LIMITS.MAX_N }}; M — нечётное и меньше N×N.
    </p>

    <form class="form" @submit.prevent="submit">
      <label class="field">
        <span class="field__label">Размер поля N</span>
        <input v-model.number="form.n" class="field__input" type="number" :min="FIELD_LIMITS.MIN_N"
          :max="FIELD_LIMITS.MAX_N" step="1" required />
      </label>

      <label class="field">
        <span class="field__label">Алмазов M (нечётное)</span>
        <input v-model.number="form.m" class="field__input" type="number" :min="FIELD_LIMITS.MIN_M" step="2" required />
      </label>

      <ul v-if="errors.length" class="form__errors">
        <li v-for="msg in errors" :key="msg">{{ msg }}</li>
      </ul>
      <p v-if="error" class="form__error-banner">{{ error }}</p>

      <button class="btn btn--primary" type="submit" :disabled="!canSubmit">
        <span v-if="loading">Создаём…</span>
        <span v-else>Создать игру</span>
      </button>
    </form>

    <p class="setup__tip">
      После создания вы получите ссылку — отправьте её сопернику, чтобы он присоединился.
    </p>
  </section>
</template>
