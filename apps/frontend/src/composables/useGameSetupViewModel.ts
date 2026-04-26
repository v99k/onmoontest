import { computed, ref } from 'vue';
import axios from 'axios';
import { FIELD_LIMITS } from '@game/shared';
import { createGame } from '../api/client';
import type { CreateGameForm } from '../components/game-setup/types';

type UseGameSetupViewModelOptions = {
  onCreated: (gameId: string) => void;
};

export function useGameSetupViewModel(options: UseGameSetupViewModelOptions) {
  const form = ref<CreateGameForm>({
    n: 5,
    m: 5,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  const errors = computed(() => {
    const validationErrors: string[] = [];
    const { n, m } = form.value;

    if (n < FIELD_LIMITS.MIN_N || n > FIELD_LIMITS.MAX_N) {
      validationErrors.push(`N должно быть в диапазоне [${FIELD_LIMITS.MIN_N}; ${FIELD_LIMITS.MAX_N}]`);
    }

    if (!Number.isInteger(m) || m < FIELD_LIMITS.MIN_M) {
      validationErrors.push(`M должно быть >= ${FIELD_LIMITS.MIN_M}`);
    } else if (m % 2 === 0) {
      validationErrors.push('M должно быть нечётным');
    } else if (m >= n * n) {
      validationErrors.push('M должно быть строго меньше N × N');
    }

    return validationErrors;
  });

  const canSubmit = computed(() => errors.value.length === 0 && !loading.value);

  async function submit(): Promise<void> {
    if (!canSubmit.value) return;

    loading.value = true;
    error.value = null;

    try {
      const { gameId } = await createGame({ n: form.value.n, m: form.value.m });
      options.onCreated(gameId);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const message = e.response?.data?.message ?? e.message;
        error.value = Array.isArray(message) ? message.join('. ') : String(message);
      } else {
        error.value = e instanceof Error ? e.message : 'Не удалось создать игру';
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    FIELD_LIMITS,
    form,
    loading,
    error,
    errors,
    canSubmit,
    submit,
  };
}
