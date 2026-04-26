import axios from 'axios';
import type { CreateGamePayload, CreateGameResponse } from '@game/shared';

const http = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
});

export async function createGame(payload: CreateGamePayload): Promise<CreateGameResponse> {
  const { data } = await http.post<CreateGameResponse>('/game', payload);
  return data;
}
