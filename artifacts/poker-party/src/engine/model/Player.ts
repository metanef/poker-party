import type { Card } from './Card';

export type ExchangeChoice =
  | { type: 'change'; cardIndices: number[] }
  | { type: 'keep' };

export interface Player {
  id: string;
  pseudo: string;
  avatar: string;
  seatIndex: number;
  isHost: boolean;
  connected: boolean;
  consentGiven: boolean;
  ready: boolean;
  /** Private hole cards. Only ever sent to this player's own client. */
  holeCards: Card[];
  points: number;
  clothingRemaining: number;
  /** Folded/left the table entirely (kept seat but out of the game). */
  active: boolean;
  /** Whether this player has submitted their choice for the current exchange round. */
  hasActedThisRound: boolean;
  lastChoice: ExchangeChoice | null;
}

export function createPlayer(params: {
  id: string;
  pseudo: string;
  avatar: string;
  seatIndex: number;
  isHost: boolean;
  startingClothing: number;
}): Player {
  return {
    id: params.id,
    pseudo: params.pseudo,
    avatar: params.avatar,
    seatIndex: params.seatIndex,
    isHost: params.isHost,
    connected: true,
    consentGiven: false,
    ready: false,
    holeCards: [],
    points: 0,
    clothingRemaining: params.startingClothing,
    active: true,
    hasActedThisRound: false,
    lastChoice: null,
  };
}
