import type { Card } from './Card';
import type { Player } from './Player';
import type { Stage } from '../fsm/stages';

export interface HandResult {
  handNumber: number;
  winnerIds: string[];
  loserIds: string[];
  tiedForWin: boolean;
  tiedForLoss: boolean;
  /** Player id -> descriptive French label of their best hand (e.g. "Paire de Rois"). */
  handLabels: Record<string, string>;
}

export interface LogMessage {
  id: string;
  timestamp: number;
  type: 'system' | 'chat';
  playerId?: string;
  playerName?: string;
  playerAvatar?: string;
  content: string;
}

export interface TableState {
  code: string;
  hostId: string;
  maxPlayers: number;
  startingClothing: number;
  buybackCost: number;
  stage: Stage;
  handNumber: number;
  /** Community river cards revealed so far (0 to 5). */
  communityCards: Card[];
  players: Player[];
  paused: boolean;
  /** Epoch ms deadline for the current exchange round, if one is active. */
  exchangeDeadline: number | null;
  exchangeRound: 1 | 2 | 3 | null;
  lastHandResult: HandResult | null;
  /** Set once a player has run out of clothing; ends the table. */
  gameOverMessage: string | null;
  deckSize: number;
  createdAt: number;
  logs: LogMessage[];
}

export function createEmptyTable(params: {
  code: string;
  hostId: string;
  maxPlayers: number;
  startingClothing: number;
  buybackCost?: number;
  createdAt: number;
}): TableState {
  return {
    code: params.code,
    hostId: params.hostId,
    maxPlayers: params.maxPlayers,
    startingClothing: params.startingClothing,
    buybackCost: params.buybackCost ?? 3,
    stage: 'lobby',
    handNumber: 0,
    communityCards: [],
    players: [],
    paused: false,
    exchangeDeadline: null,
    exchangeRound: null,
    lastHandResult: null,
    gameOverMessage: null,
    deckSize: 52,
    createdAt: params.createdAt,
    logs: [],
  };
}
