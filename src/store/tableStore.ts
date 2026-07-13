import { create } from 'zustand';
import type { TableState } from '@/engine/model/Table';
import type { PrivateHand } from '@/realtime/ITableTransport';

export interface EmoteBubble {
  id: string;
  playerId: string;
  emoji: string;
  at: number;
}

interface TableStoreState {
  table: TableState | null;
  privateHand: PrivateHand | null;
  emotes: EmoteBubble[];
  setTable: (table: TableState | null) => void;
  setPrivateHand: (hand: PrivateHand | null) => void;
  pushEmote: (emote: EmoteBubble) => void;
  pruneOldEmotes: (now: number, maxAgeMs?: number) => void;
}

/**
 * Client-side session/lobby state. This never computes game logic itself --
 * it only mirrors whatever the active `ITableTransport` publishes.
 */
export const useTableStore = create<TableStoreState>((set) => ({
  table: null,
  privateHand: null,
  emotes: [],
  setTable: (table) => set({ table }),
  setPrivateHand: (privateHand) => set({ privateHand }),
  pushEmote: (emote) => set((s) => ({ emotes: [...s.emotes, emote] })),
  pruneOldEmotes: (now, maxAgeMs = 2000) =>
    set((s) => ({ emotes: s.emotes.filter((e) => now - e.at < maxAgeMs) })),
}));
