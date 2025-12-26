const API_URL = 'https://functions.poehali.dev/2908ea2b-6f58-47b4-8a4d-f1154dce3ac0';
const TELEGRAM_AUTH_URL = 'https://functions.poehali.dev/26aef7a0-d2a3-482f-b5a6-5347f19823c9';

export interface User {
  id: number;
  username: string;
  telegram_id?: number;
  total_games: number;
  total_wins: number;
  created_at?: string;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface Room {
  id: number;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  player_count?: number;
  current_phase?: string;
  phase_ends_at?: string;
  players?: Player[];
}

export interface Player {
  id: number;
  username: string;
  role?: string;
  is_alive: boolean;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  total_games: number;
  total_wins: number;
  win_rate: number;
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const url = `${API_URL}?path=${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function registerUser(username: string, telegram_id?: number): Promise<User> {
  return apiRequest('register', {
    method: 'POST',
    body: JSON.stringify({ username, telegram_id }),
  });
}

export async function getUser(id: number): Promise<User> {
  return apiRequest(`user&id=${id}`);
}

export async function listRooms(): Promise<Room[]> {
  return apiRequest('rooms');
}

export async function createRoom(name: string, host_user_id: number, max_players = 12): Promise<Room> {
  return apiRequest('room/create', {
    method: 'POST',
    body: JSON.stringify({ name, host_user_id, max_players }),
  });
}

export async function joinRoom(room_id: number, user_id: number): Promise<{ success: boolean; joined: boolean }> {
  return apiRequest('room/join', {
    method: 'POST',
    body: JSON.stringify({ room_id, user_id }),
  });
}

export async function getRoomInfo(id: number): Promise<Room> {
  return apiRequest(`room/info&id=${id}`);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return apiRequest('leaderboard');
}

export async function getUserAchievements(user_id: number): Promise<Achievement[]> {
  return apiRequest(`achievements&user_id=${user_id}`);
}

export async function votePlayer(room_id: number, actor_id: number, target_id: number): Promise<{ success: boolean; action_id: number }> {
  return apiRequest('game/vote', {
    method: 'POST',
    body: JSON.stringify({ room_id, actor_id, target_id }),
  });
}

export async function loginWithTelegram(authData: TelegramAuthData): Promise<User> {
  const response = await fetch(TELEGRAM_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Auth error: ${response.status}`);
  }

  return response.json();
}