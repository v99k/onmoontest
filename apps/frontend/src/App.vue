<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import GameSetup from './components/GameSetup.vue';
import Game from './components/Game.vue';

const gameId = ref<string | null>(null);

function readHash(): string | null {
	const hash = window.location.hash.replace(/^#/, '').trim();
	return hash.length > 0 ? hash : null;
}

function setGameId(id: string | null): void {
	if (id === null) {
		history.replaceState(null, '', window.location.pathname);
	} else {
		window.location.hash = id;
	}
	gameId.value = id;
}

onMounted(() => {
	gameId.value = readHash();
	window.addEventListener('hashchange', () => {
		gameId.value = readHash();
	});
});

const view = computed<'setup' | 'game'>(() => (gameId.value ? 'game' : 'setup'));
</script>

<template>
	<div class="app">
		<header class="app__header">
			<h1 class="app__title">Парный обратный сапёр</h1>
			<p class="app__subtitle">Кто соберёт больше алмазов — тот и победил</p>
		</header>

		<Transition name="fade" mode="out-in">
			<GameSetup v-if="view === 'setup'" key="setup" @created="(id) => setGameId(id)" />
			<Game v-else :key="gameId ?? 'game'" :game-id="gameId as string" @leave="setGameId(null)" />
		</Transition>

		<footer class="app__footer">
			<span>Игра на двоих</span>
		</footer>
	</div>
</template>
