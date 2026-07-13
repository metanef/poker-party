import type { ExchangeChoice } from '../engine/model/Player';
import type { TableState } from '../engine/model/Table';

export interface TableSummary {
  code: string;
  playersConnected: number;
  playersExpected: number;
  stage: TableState['stage'];
}

export interface CreateTableParams {
  pseudo: string;
  avatar: string;
  maxPlayers: number;
  startingClothing: number;
}

export interface JoinTableParams {
  code: string;
  pseudo: string;
  avatar: string;
}

/** A player's own private hole cards, only ever visible to that player. */
export interface PrivateHand {
  holeCards: TableState['players'][number]['holeCards'];
}

export type EmoteEvent = {
  playerId: string;
  emoji: string;
  at: number;
};

/**
 * Common interface implemented identically by `LocalTableTransport` (solo
 * play against bots) and `FirebaseTableTransport` (real multi-device play).
 * UI code depends only on this interface -- it never branches on which
 * transport is active.
 *
 * Non-host clients never compute game state themselves: they call the
 * `send*` intent methods and read back whatever `subscribe` delivers.
 */
export interface ITableTransport {
  /** The stable id of the local player on this device/browser. */
  readonly localPlayerId: string;

  /** Creates a new table and returns its short room code. Caller becomes host. */
  createTable(params: CreateTableParams): Promise<string>;

  /** Joins an existing table by its short code. */
  joinTable(params: JoinTableParams): Promise<void>;

  /** Leaves the current table. */
  leaveTable(): Promise<void>;

  /** Host-only: permanently deletes the current table and its lobby entry. */
  deleteTable(): Promise<void>;

  /** Records this player's explicit consent for the current table. */
  sendConsent(): Promise<void>;

  /** Marks this player as ready in the waiting room. */
  sendReady(ready: boolean): Promise<void>;

  /** Host-only: starts the game once >= 2 players are present and consenting. */
  startGame(): Promise<void>;

  /** Host-only: starts the next hand/round after a showdown. */
  startNextHand(): Promise<void>;

  /** Sends this player's exchange decision as an intent -- never computed locally. */
  sendExchangeChoice(choice: ExchangeChoice): Promise<void>;

  /** Host-only: a player at 3 points chooses to put back one clothing item. */
  sendRestoreClothing(): Promise<void>;

  /** Toggles pause. Any player may pause; resuming is host-only in the UI layer. */
  sendPause(paused: boolean): Promise<void>;

  /** Sends an ephemeral emote bubble, e.g. "😅". */
  sendEmote(emoji: string): Promise<void>;

  /** Sends a real-time chat message to the table. */
  sendChatMessage(content: string): Promise<void>;

  /** Subscribes to the public table state (private cards excluded). */
  subscribe(listener: (table: TableState | null) => void): () => void;

  /** Subscribes to this player's own private hole cards. */
  subscribePrivateHand(listener: (hand: PrivateHand | null) => void): () => void;

  /** Subscribes to incoming emote events. */
  subscribeEmotes(listener: (event: EmoteEvent) => void): () => void;

  /** Lists currently open (not yet started) tables, for the lobby. */
  listOpenTables(): Promise<TableSummary[]>;
}
