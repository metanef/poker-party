import {
  advancePastExchange,
  applyExchangeChoice,
  beginExchangeRound,
  canStartNewHand,
  EXCHANGE_TIMEOUT_MS,
  finalizeExchangeRound,
  isExchangeRoundComplete,
  nextExchangeRoundAfterReveal,
  pauseTable,
  resolveShowdown,
  restoreClothing,
  resumeTable,
  startHand,
} from '../engine/GameEngine';
import { Deck } from '../engine/model/Deck';
import { createPlayer, type ExchangeChoice, type Player } from '../engine/model/Player';
import { createEmptyTable, type TableState } from '../engine/model/Table';
import { generateRoomCode } from './roomCode';
import { toPublicTable } from './publicTable';
import type {
  CreateTableParams,
  EmoteEvent,
  ITableTransport,
  JoinTableParams,
  PrivateHand,
  TableSummary,
} from './ITableTransport';

const BOT_NAMES = ['Bot Camille', 'Bot Alex', 'Bot Sami'];
const BOT_AVATARS = ['\u{1F916}', '\u{1F47E}', '\u{1F9E9}'];
const NEXT_HAND_DELAY_MS = 4500;
const REVEAL_PAUSE_MS = 1600;

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Solo mode: runs the exact same GameEngine + FSM as multiplayer, but the
 * "network" is simulated in-memory in this browser tab, and empty seats are
 * filled with simple bots so the game is playable without a friend online.
 */
export class LocalTableTransport implements ITableTransport {
  readonly localPlayerId = randomId();

  private table: TableState | null = null;
  private deck: Deck | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  /**
   * Bumped every time a new exchange round starts (or ends early). Bot
   * actions and the round's timeout fallback capture the generation at
   * schedule time and no-op if it no longer matches -- otherwise a stale
   * timer left over from a round that already finished (e.g. because
   * everyone acted quickly) would fire later and force-finalize whatever
   * round is current at that time, skipping it without waiting for input.
   */
  private exchangeGeneration = 0;

  private tableListeners = new Set<(table: TableState | null) => void>();
  private privateListeners = new Set<(hand: PrivateHand | null) => void>();
  private emoteListeners = new Set<(event: EmoteEvent) => void>();

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private schedule(fn: () => void, delayMs: number) {
    const id = setTimeout(fn, delayMs);
    this.timers.push(id);
  }

  private notifyTable() {
    const publicTable = this.table ? toPublicTable(this.table) : null;
    this.tableListeners.forEach((l) => l(publicTable));
  }

  private notifyPrivateHand() {
    const me = this.table?.players.find((p) => p.id === this.localPlayerId);
    this.privateListeners.forEach((l) =>
      l(me ? { holeCards: me.holeCards } : null),
    );
  }

  async createTable(params: CreateTableParams): Promise<string> {
    this.clearTimers();
    const code = generateRoomCode();
    let table = createEmptyTable({
      code,
      hostId: this.localPlayerId,
      maxPlayers: params.maxPlayers,
      startingClothing: params.startingClothing,
      createdAt: Date.now(),
    });

    const host = createPlayer({
      id: this.localPlayerId,
      pseudo: params.pseudo,
      avatar: params.avatar,
      seatIndex: 0,
      isHost: true,
      startingClothing: params.startingClothing,
    });
    table.players.push(host);

    const botCount = params.maxPlayers - 1;
    for (let i = 0; i < botCount; i++) {
      const bot = createPlayer({
        id: `bot-${i}-${randomId()}`,
        pseudo: BOT_NAMES[i % BOT_NAMES.length],
        avatar: BOT_AVATARS[i % BOT_AVATARS.length],
        seatIndex: i + 1,
        isHost: false,
        startingClothing: params.startingClothing,
      });
      bot.consentGiven = true;
      bot.ready = true;
      table.players.push(bot);
    }

    this.table = table;
    this.notifyTable();
    this.notifyPrivateHand();
    return code;
  }

  async joinTable(_params: JoinTableParams): Promise<void> {
    throw new Error(
      "Le mode solo ne permet pas de rejoindre une table : créez votre propre table contre des IA.",
    );
  }

  async leaveTable(): Promise<void> {
    this.clearTimers();
    this.table = null;
    this.deck = null;
    this.notifyTable();
    this.notifyPrivateHand();
  }

  async sendConsent(): Promise<void> {
    if (!this.table) return;
    const me = this.table.players.find((p) => p.id === this.localPlayerId);
    if (me) me.consentGiven = true;
    this.notifyTable();
  }

  async sendReady(ready: boolean): Promise<void> {
    if (!this.table) return;
    const me = this.table.players.find((p) => p.id === this.localPlayerId);
    if (me) me.ready = ready;
    this.notifyTable();
  }

  async startGame(): Promise<void> {
    if (!this.table || this.table.hostId !== this.localPlayerId) return;
    if (this.table.players.length < 2) return;
    this.deck = Deck.shuffled();
    this.table = startHand(this.table, this.deck);
    this.notifyTable();
    this.notifyPrivateHand();
    this.schedule(() => this.runExchangeRound(1), REVEAL_PAUSE_MS);
  }

  private runExchangeRound(round: 1 | 2 | 3) {
    if (!this.table || this.table.paused) return;
    this.exchangeGeneration += 1;
    const generation = this.exchangeGeneration;
    this.table = beginExchangeRound(this.table, round, Date.now(), EXCHANGE_TIMEOUT_MS);
    this.notifyTable();
    this.scheduleBotActions(generation);
    this.schedule(() => this.checkExchangeRoundCompletion(generation), EXCHANGE_TIMEOUT_MS + 250);
  }

  private scheduleBotActions(generation: number) {
    if (!this.table || !this.deck) return;
    for (const player of this.table.players) {
      if (player.id === this.localPlayerId || !player.active) continue;
      const delay = 1500 + Math.random() * (EXCHANGE_TIMEOUT_MS - 3000);
      this.schedule(() => this.applyBotChoice(player.id, generation), delay);
    }
  }

  private applyBotChoice(playerId: string, generation: number) {
    if (generation !== this.exchangeGeneration) return; // round already ended
    if (!this.table || !this.deck) return;
    const player = this.table.players.find((p) => p.id === playerId);
    if (!player || player.hasActedThisRound) return;

    const choice: ExchangeChoice =
      Math.random() < 0.4
        ? { type: 'keep' }
        : {
            type: 'change',
            cardIndices: Math.random() < 0.5 ? [0] : [0, 1],
          };

    const result = applyExchangeChoice(this.table, playerId, choice, this.deck);
    if (result.valid) {
      this.table = result.table;
      this.notifyTable();
      this.maybeAdvanceRound();
    }
  }

  private maybeAdvanceRound() {
    if (!this.table) return;
    if (isExchangeRoundComplete(this.table, Date.now())) {
      this.finishExchangeRound();
    }
  }

  private checkExchangeRoundCompletion(generation: number) {
    if (generation !== this.exchangeGeneration) return; // round already ended earlier
    if (!this.table) return;
    this.finishExchangeRound();
  }

  private finishExchangeRound() {
    if (!this.table || !this.deck) return;
    // Invalidate any still-pending timers (bot actions, timeout fallback)
    // from this round so they can't fire again after we've already moved on.
    this.exchangeGeneration += 1;
    this.table = finalizeExchangeRound(this.table);
    const stageBeforeAdvance = this.table.stage;
    this.table = advancePastExchange(this.table, this.deck);
    this.notifyTable();
    this.notifyPrivateHand();

    if (this.table.stage === 'showdown') {
      this.schedule(() => this.runShowdown(), REVEAL_PAUSE_MS);
      return;
    }

    const nextRound = nextExchangeRoundAfterReveal(this.table.stage);
    if (nextRound) {
      this.schedule(() => this.runExchangeRound(nextRound), REVEAL_PAUSE_MS);
    }
    void stageBeforeAdvance;
  }

  private runShowdown() {
    if (!this.table) return;
    this.table = resolveShowdown(this.table);
    this.notifyTable();
    this.notifyPrivateHand();

    if (canStartNewHand(this.table)) {
      this.schedule(() => this.startNextHand(), NEXT_HAND_DELAY_MS);
    }
  }

  private startNextHand() {
    if (!this.table || !canStartNewHand(this.table)) return;
    this.deck = Deck.shuffled();
    this.table = startHand(this.table, this.deck);
    this.notifyTable();
    this.notifyPrivateHand();
    this.schedule(() => this.runExchangeRound(1), REVEAL_PAUSE_MS);
  }

  async sendExchangeChoice(choice: ExchangeChoice): Promise<void> {
    if (!this.table || !this.deck) return;
    const result = applyExchangeChoice(this.table, this.localPlayerId, choice, this.deck);
    if (result.valid) {
      this.table = result.table;
      this.notifyTable();
      this.maybeAdvanceRound();
    }
  }

  async sendRestoreClothing(): Promise<void> {
    if (!this.table) return;
    this.table = restoreClothing(this.table, this.localPlayerId);
    this.notifyTable();
  }

  async sendPause(paused: boolean): Promise<void> {
    if (!this.table) return;
    this.table = paused ? pauseTable(this.table) : resumeTable(this.table);
    this.notifyTable();
  }

  async sendEmote(emoji: string): Promise<void> {
    const event: EmoteEvent = { playerId: this.localPlayerId, emoji, at: Date.now() };
    this.emoteListeners.forEach((l) => l(event));
  }

  subscribe(listener: (table: TableState | null) => void): () => void {
    this.tableListeners.add(listener);
    listener(this.table ? toPublicTable(this.table) : null);
    return () => this.tableListeners.delete(listener);
  }

  subscribePrivateHand(listener: (hand: PrivateHand | null) => void): () => void {
    this.privateListeners.add(listener);
    const me = this.table?.players.find((p) => p.id === this.localPlayerId);
    listener(me ? { holeCards: me.holeCards } : null);
    return () => this.privateListeners.delete(listener);
  }

  subscribeEmotes(listener: (event: EmoteEvent) => void): () => void {
    this.emoteListeners.add(listener);
    return () => this.emoteListeners.delete(listener);
  }

  async listOpenTables(): Promise<TableSummary[]> {
    if (!this.table || this.table.stage !== 'lobby') return [];
    return [
      {
        code: this.table.code,
        playersConnected: this.table.players.length,
        playersExpected: this.table.maxPlayers,
        stage: this.table.stage,
      },
    ];
  }
}

export type { Player };
