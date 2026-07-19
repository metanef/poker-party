import {
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  remove,
  onDisconnect,
  type DatabaseReference,
  type DataSnapshot,
} from 'firebase/database';
import { isExchangeStage } from '../engine/fsm/stages';
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
  addLog,
  restartGame,
} from '../engine/GameEngine';
import { Deck } from '../engine/model/Deck';
import { createPlayer, type ExchangeChoice } from '../engine/model/Player';
import { createEmptyTable, type TableState } from '../engine/model/Table';
import { toPublicTable } from './publicTable';
import { generateRoomCode } from './roomCode';
import { getFirebaseAuth, getFirebaseDatabase } from './firebaseClient';
import type {
  CreateTableParams,
  EmoteEvent,
  ITableTransport,
  JoinTableParams,
  PrivateHand,
  TableSummary,
} from './ITableTransport';

const NEXT_HAND_DELAY_MS = 4500;
const REVEAL_PAUSE_MS = 1600;

/** Clé localStorage : code de table -> uid utilisé lors de la dernière connexion. */
const LS_UID_PREFIX = 'poker_party_uid_';

function storeUidForTable(code: string, uid: string): void {
  try {
    localStorage.setItem(LS_UID_PREFIX + code, uid);
  } catch {
    // ignore (navigation privée, etc.)
  }
}

/**
 * Implémentation multijoueur Firebase du modèle "hôte-autorité côté client".
 *
 * Structure Realtime Database :
 *   /tables/{code}/public          - état visible par tous (sans cartes privées)
 *   /tables/{code}/private/{uid}   - cartes privées de l'utilisateur {uid}
 *   /tables/{code}/intents/{uid}   - actions envoyées par les non-hôtes
 *   /tables/{code}/emotes/{uid}    - émotes éphémères
 *
 * Seul l'hôte exécute GameEngine et écrit /public + /private/*.
 * Les autres joueurs envoient des intents et lisent l'état broadcast.
 */
export class FirebaseTableTransport implements ITableTransport {
  private _localPlayerId = '';
  private _authReady: Promise<void>;
  private _authReadyResolve!: () => void;

  private currentTableCode: string | null = null;
  private isHostClient = false;
  private lastConnectTime = 0;

  // État interne côté hôte uniquement
  private hostTable: TableState | null = null;
  private hostDeck: Deck | null = null;
  private hostTimers: ReturnType<typeof setTimeout>[] = [];

  // Listeners Firebase actifs (unsubscribe functions)
  private publicUnsub: (() => void) | null = null;
  private privateUnsub: (() => void) | null = null;
  private emotesUnsub: (() => void) | null = null;
  private intentsUnsub: (() => void) | null = null;
  private presenceUnsub: (() => void) | null = null;

  // Listeners applicatifs
  private tableListeners = new Set<(table: TableState | null) => void>();
  private privateHandListeners = new Set<(hand: PrivateHand | null) => void>();
  private emoteListeners = new Set<(event: EmoteEvent) => void>();

  // Suivi des intents déjà traités (évite les doubles applications)
  private processedIntents = new Set<string>();

  constructor() {
    this._authReady = new Promise<void>((resolve) => {
      this._authReadyResolve = resolve;
    });
    this._initAuth();

    // Listen to Firebase connection state to prevent immediate bot actions on reconnection
    const connectedRef = ref(this.db(), '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        this.lastConnectTime = Date.now();
      }
    });
  }

  get localPlayerId(): string {
    return this._localPlayerId;
  }

  getCurrentTableCode(): string | null {
    return this.currentTableCode;
  }

  // ---------------------------------------------------------------------------
  // Auth anonyme Firebase
  // ---------------------------------------------------------------------------

  private _initAuth(): void {
    const auth = getFirebaseAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this._localPlayerId = user.uid;
        this._authReadyResolve();
      } else {
        signInAnonymously(auth).catch((err: unknown) => {
          console.error('Echec de la connexion anonyme Firebase :', err);
        });
      }
    });
  }

  private async ensureAuth(): Promise<void> {
    await this._authReady;
  }

  // ---------------------------------------------------------------------------
  // Helpers de chemin Firebase
  // ---------------------------------------------------------------------------

  private db() {
    return getFirebaseDatabase();
  }

  private publicRef(code: string): DatabaseReference {
    return ref(this.db(), `tables/${code}/public`);
  }

  private privateRef(code: string, uid: string): DatabaseReference {
    return ref(this.db(), `tables/${code}/private/${uid}`);
  }

  private intentRef(code: string, uid: string): DatabaseReference {
    return ref(this.db(), `tables/${code}/intents/${uid}`);
  }

  private emoteRef(code: string, uid: string): DatabaseReference {
    return ref(this.db(), `tables/${code}/emotes/${uid}`);
  }

  private lobbyRef(code: string): DatabaseReference {
    return ref(this.db(), `lobby/${code}`);
  }

  // ---------------------------------------------------------------------------
  // Sérialisation / désérialisation de TableState
  // ---------------------------------------------------------------------------

  private serializePublicTable(table: TableState): object {
    return JSON.parse(JSON.stringify(toPublicTable(table))) as object;
  }

  private serializePrivateHand(table: TableState, uid: string): object {
    const player = table.players.find((p) => p.id === uid);
    if (!player) return { holeCards: [] };
    return JSON.parse(JSON.stringify({ holeCards: player.holeCards })) as object;
  }

  private deserializeTable(data: unknown): TableState | null {
    if (!data || typeof data !== 'object') return null;
    return data as TableState;
  }

  // ---------------------------------------------------------------------------
  // Publication hôte vers Firebase
  // ---------------------------------------------------------------------------

  private async hostPublish(table: TableState): Promise<void> {
    if (!this.currentTableCode) return;
    const code = this.currentTableCode;
    const db = this.db();

    const updates: Record<string, unknown> = {};
    updates[`tables/${code}/public`] = this.serializePublicTable(table);

    for (const player of table.players) {
      updates[`tables/${code}/private/${player.id}`] =
        this.serializePrivateHand(table, player.id);
    }

    // Index leger, lisible par tous les clients authentifies, utilise pour
    // afficher les "tables en attente" sans avoir a lire tout /tables (dont
    // les cartes privees d'autres joueurs sont protegees par des regles
    // dediees). On ne garde une entree que pendant le lobby.
    if (table.stage === 'lobby') {
      updates[`lobby/${code}`] = {
        code: table.code,
        hostId: table.hostId,
        playersConnected: table.players.length,
        playersExpected: table.maxPlayers,
        stage: table.stage,
      };
    } else {
      updates[`lobby/${code}`] = null;
    }

    await update(ref(db), updates);
  }

  // ---------------------------------------------------------------------------
  // Gestion des timers côté hôte
  // ---------------------------------------------------------------------------

  private clearHostTimers(): void {
    this.hostTimers.forEach(clearTimeout);
    this.hostTimers = [];
  }

  private scheduleHost(fn: () => void, delayMs: number): void {
    const id = setTimeout(fn, delayMs);
    this.hostTimers.push(id);
  }

  // ---------------------------------------------------------------------------
  // FSM hôte - même enchaînement que LocalTableTransport
  // ---------------------------------------------------------------------------

  private hostRunExchangeRound(round: 1 | 2 | 3): void {
    if (!this.hostTable || this.hostTable.paused) return;
    this.hostTable = beginExchangeRound(
      this.hostTable,
      round,
      Date.now(),
      EXCHANGE_TIMEOUT_MS,
    );
    void this.hostPublish(this.hostTable);
    this.scheduleHost(
      () => this.hostCheckExchangeCompletion(round),
      EXCHANGE_TIMEOUT_MS + 250,
    );
  }

  private hostCheckExchangeCompletion(_round: 1 | 2 | 3): void {
    if (!this.hostTable) return;
    this.hostFinishExchangeRound();
  }

  private hostFinishExchangeRound(): void {
    if (!this.hostTable || !this.hostDeck) return;
    this.hostTable = finalizeExchangeRound(this.hostTable);
    this.hostTable = advancePastExchange(this.hostTable, this.hostDeck);
    void this.hostPublish(this.hostTable);

    if (this.hostTable.stage === 'showdown') {
      this.scheduleHost(() => this.hostRunShowdown(), REVEAL_PAUSE_MS);
      return;
    }

    const nextRound = nextExchangeRoundAfterReveal(this.hostTable.stage);
    if (nextRound) {
      this.scheduleHost(
        () => this.hostRunExchangeRound(nextRound),
        REVEAL_PAUSE_MS,
      );
    }
  }

  private hostRunShowdown(): void {
    if (!this.hostTable) return;
    this.hostTable = resolveShowdown(this.hostTable);
    void this.hostPublish(this.hostTable);
  }

  private hostStartNextHand(): void {
    if (!this.hostTable || !canStartNewHand(this.hostTable)) return;
    this.hostDeck = Deck.shuffled();
    this.hostTable = startHand(this.hostTable, this.hostDeck);
    void this.hostPublish(this.hostTable);
    this.scheduleHost(() => this.hostRunExchangeRound(1), REVEAL_PAUSE_MS);
  }

  // ---------------------------------------------------------------------------
  // Ecoute des intents (cote hote uniquement)
  // ---------------------------------------------------------------------------

  private startListeningIntents(code: string): void {
    if (this.intentsUnsub) this.intentsUnsub();

    const intentsRef = ref(this.db(), `tables/${code}/intents`);
    const handler = (snap: DataSnapshot) => {
      if (!snap.exists()) return;
      snap.forEach((childSnap) => {
        const uid = childSnap.key;
        if (!uid) return;
        const data = childSnap.val() as Record<string, unknown>;
        this.processIntent(uid, data);
      });
    };
    onValue(intentsRef, handler);
    this.intentsUnsub = () => off(intentsRef, 'value', handler);
  }

  private processIntent(uid: string, data: Record<string, unknown>): void {
    if (!this.hostTable || !this.currentTableCode) return;

    const intentId = `${uid}:${String(data.type)}:${String(data.ts)}`;
    if (this.processedIntents.has(intentId)) return;
    this.processedIntents.add(intentId);

    const type = data.type as string;

    switch (type) {
      case 'join': {
        // Un nouveau joueur rejoint la table
        const existing = this.hostTable.players.find((p) => p.id === uid);
        if (!existing && this.hostTable.players.length < this.hostTable.maxPlayers) {
          const playerData = data.player as {
            id: string;
            pseudo: string;
            avatar: string;
            seatIndex: number;
            isHost: boolean;
            startingClothing: number;
          };
          const newPlayer = createPlayer({
            id: playerData.id,
            pseudo: playerData.pseudo,
            avatar: playerData.avatar,
            seatIndex: this.hostTable.players.length,
            isHost: false,
            startingClothing: this.hostTable.startingClothing,
          });
          this.hostTable.players.push(newPlayer);
          this.hostTable = addLog(this.hostTable, 'system', `${newPlayer.pseudo} a rejoint la table.`);
          void this.hostPublish(this.hostTable);
        }
        break;
      }
      case 'consent': {
        const player = this.hostTable.players.find((p) => p.id === uid);
        if (player) {
          player.consentGiven = true;
          void this.hostPublish(this.hostTable);
        }
        break;
      }
      case 'ready': {
        const player = this.hostTable.players.find((p) => p.id === uid);
        if (player) {
          player.ready = data.ready as boolean;
          void this.hostPublish(this.hostTable);
        }
        break;
      }
      case 'exchangeChoice': {
        if (!this.hostDeck) break;
        const choice = data.choice as ExchangeChoice;
        const result = applyExchangeChoice(
          this.hostTable,
          uid,
          choice,
          this.hostDeck,
        );
        if (result.valid) {
          this.hostTable = result.table;
          void this.hostPublish(this.hostTable);
          if (isExchangeRoundComplete(this.hostTable, Date.now())) {
            this.clearHostTimers();
            this.hostFinishExchangeRound();
          }
        }
        break;
      }
      case 'restoreClothing': {
        this.hostTable = restoreClothing(this.hostTable, uid);
        void this.hostPublish(this.hostTable);
        break;
      }
      case 'pause': {
        const paused = data.paused as boolean;

        this.clearHostTimers();
        if (paused) {
          const remaining = this.hostTable.exchangeDeadline
            ? Math.max(0, this.hostTable.exchangeDeadline - Date.now())
            : null;
          this.hostTable = pauseTable(this.hostTable);
          this.hostTable.exchangeDeadline = remaining;
        } else {
          const remaining = this.hostTable.exchangeDeadline;
          this.hostTable = resumeTable(this.hostTable);
          this.hostTable.exchangeDeadline = remaining ? Date.now() + remaining : null;
          if (remaining) {
            this.scheduleHost(
              () => this.hostFinishExchangeRound(),
              remaining + 250,
            );
          }
        }
        void this.hostPublish(this.hostTable);
        break;
      }
      case 'startNextHand': {
        if (this.hostTable && this.hostTable.stage === 'showdown' && canStartNewHand(this.hostTable)) {
          if (uid === this.hostTable.hostId) {
            this.hostDeck = Deck.shuffled();
            this.hostTable = startHand(this.hostTable, this.hostDeck);
            void this.hostPublish(this.hostTable);
            this.scheduleHost(() => this.hostRunExchangeRound(1), REVEAL_PAUSE_MS);
          }
        }
        break;
      }
      case 'restartGame': {
        if (this.hostTable && uid === this.hostTable.hostId) {
          this.hostTable = restartGame(this.hostTable);
          this.hostDeck = null;
          void this.hostPublish(this.hostTable);
        }
        break;
      }
      case 'chat': {
        const content = data.content as string;
        const player = this.hostTable.players.find((p) => p.id === uid);
        if (player && content) {
          this.hostTable = addLog(
            this.hostTable,
            'chat',
            content,
            player.pseudo,
            player.avatar,
            uid
          );
          void this.hostPublish(this.hostTable);
        }
        break;
      }
      default:
        break;
    }

    // Supprimer l'intent apres traitement
    void remove(ref(this.db(), `tables/${this.currentTableCode}/intents/${uid}`));
  }

  // ---------------------------------------------------------------------------
  // Envoi d'un intent (cote non-hote)
  // ---------------------------------------------------------------------------

  private async sendIntent(data: Record<string, unknown>): Promise<void> {
    await this.ensureAuth();
    if (!this.currentTableCode) {
      throw new Error('Vous n\'etes connecte a aucune table.');
    }
    await set(this.intentRef(this.currentTableCode, this._localPlayerId), {
      ...data,
      ts: Date.now(),
    });
  }

  // ---------------------------------------------------------------------------
  // Abonnements publics (tous les clients)
  // ---------------------------------------------------------------------------

  private startListeningPublic(code: string): void {
    if (this.publicUnsub) this.publicUnsub();
    const r = this.publicRef(code);
    const handler = (snap: DataSnapshot) => {
      const table = this.deserializeTable(snap.val());
      this.tableListeners.forEach((l) => l(table));
    };
    onValue(r, handler);
    this.publicUnsub = () => off(r, 'value', handler);
  }

  private startListeningPrivate(code: string, uid: string): void {
    if (this.privateUnsub) this.privateUnsub();
    const r = this.privateRef(code, uid);
    const handler = (snap: DataSnapshot) => {
      const data = snap.val() as { holeCards: TableState['players'][number]['holeCards'] } | null;
      this.privateHandListeners.forEach((l) =>
        l(data ? { holeCards: data.holeCards ?? [] } : null),
      );
    };
    onValue(r, handler);
    this.privateUnsub = () => off(r, 'value', handler);
  }

  private startListeningEmotes(code: string): void {
    if (this.emotesUnsub) this.emotesUnsub();
    const r = ref(this.db(), `tables/${code}/emotes`);
    const handler = (snap: DataSnapshot) => {
      if (!snap.exists()) return;
      snap.forEach((childSnap) => {
        const uid = childSnap.key;
        if (!uid) return;
        const data = childSnap.val() as { emoji: string; at: number } | null;
        if (!data) return;
        const event: EmoteEvent = {
          playerId: uid,
          emoji: data.emoji,
          at: data.at,
        };
        this.emoteListeners.forEach((l) => l(event));
      });
    };
    onValue(r, handler);
    this.emotesUnsub = () => off(r, 'value', handler);
  }

  // ---------------------------------------------------------------------------
  // Présence et bot temporaire
  // ---------------------------------------------------------------------------

  private setupPresence(code: string, uid: string): void {
    const db = this.db();
    const presenceRef = ref(db, `tables/${code}/presence/${uid}`);
    void set(presenceRef, true);
    void onDisconnect(presenceRef).remove();
  }

  private startListeningPresence(code: string): void {
    if (this.presenceUnsub) this.presenceUnsub();
    const db = this.db();
    const presenceRef = ref(db, `tables/${code}/presence`);
    const handler = (snap: DataSnapshot) => {
      if (!this.hostTable) return;
      const presenceData = snap.val() as Record<string, boolean> | null;
      let changed = false;

      const updatedPlayers = this.hostTable.players.map((p) => {
        const isOnline = presenceData ? Boolean(presenceData[p.id]) : false;
        const isHost = p.id === this.hostTable?.hostId;
        const isBot = p.id.startsWith('bot-');
        const shouldBeConnected = isOnline || isHost || isBot;

        if (p.connected !== shouldBeConnected) {
          p.connected = shouldBeConnected;
          changed = true;
          const status = shouldBeConnected ? "s'est connecté" : "s'est déconnecté";
          this.hostTable = addLog(this.hostTable!, 'system', `${p.pseudo} ${status}.`);
        }
        return p;
      });

      if (changed) {
        this.hostTable.players = updatedPlayers;
        void this.hostPublish(this.hostTable);
      }
    };
    onValue(presenceRef, handler);
    this.presenceUnsub = () => off(presenceRef, 'value', handler);
  }

  // ---------------------------------------------------------------------------
  // Nettoyage
  // ---------------------------------------------------------------------------

  private stopAllListeners(): void {
    this.publicUnsub?.();
    this.publicUnsub = null;
    this.privateUnsub?.();
    this.privateUnsub = null;
    this.emotesUnsub?.();
    this.emotesUnsub = null;
    this.intentsUnsub?.();
    this.intentsUnsub = null;
    this.presenceUnsub?.();
    this.presenceUnsub = null;
  }

  // ---------------------------------------------------------------------------
  // ITableTransport - implementation publique
  // ---------------------------------------------------------------------------

  async createTable(params: CreateTableParams): Promise<string> {
    await this.ensureAuth();
    const uid = this._localPlayerId;
    const code = generateRoomCode();

    const table = createEmptyTable({
      code,
      hostId: uid,
      maxPlayers: params.maxPlayers,
      startingClothing: params.startingClothing,
      buybackCost: params.buybackCost,
      createdAt: Date.now(),
    });

    const host = createPlayer({
      id: uid,
      pseudo: params.pseudo,
      avatar: params.avatar,
      seatIndex: 0,
      isHost: true,
      startingClothing: params.startingClothing,
    });
    host.consentGiven = true;
    host.ready = true;
    table.players.push(host);

    this.currentTableCode = code;
    this.isHostClient = true;
    this.hostTable = table;
    this.hostDeck = null;
    this.processedIntents.clear();

    storeUidForTable(code, uid);

    await this.hostPublish(table);
    this.startListeningPublic(code);
    this.startListeningPrivate(code, uid);
    this.startListeningEmotes(code);
    this.startListeningIntents(code);
    this.setupPresence(code, uid);
    this.startListeningPresence(code);

    return code;
  }

  async joinTable(params: JoinTableParams): Promise<void> {
    await this.ensureAuth();
    const { code, pseudo, avatar } = params;
    const uid = this._localPlayerId;

    // Verifier l'existence de la table
    const snap = await get(this.publicRef(code));
    if (!snap.exists()) {
      throw new Error(`Aucune table trouvee avec le code "${code}".`);
    }

    const table = this.deserializeTable(snap.val());
    if (!table) {
      throw new Error('Donnees de table invalides. Veuillez reessayer.');
    }

    // Verifier si le joueur est deja assis (reconnexion)
    const existingPlayer = Array.isArray(table.players)
      ? table.players.find((p) => p.id === uid)
      : undefined;

    if (table.stage !== 'lobby' && !existingPlayer) {
      throw new Error(
        'Cette partie est deja en cours. Impossible de rejoindre maintenant.',
      );
    }

    if (!existingPlayer) {
      const playerCount = Array.isArray(table.players) ? table.players.length : 0;
      if (playerCount >= table.maxPlayers) {
        throw new Error('Cette table est complete. Impossible de rejoindre.');
      }

      // Envoyer un intent "join" que l'hote va traiter
      const newPlayer = createPlayer({
        id: uid,
        pseudo,
        avatar,
        seatIndex: playerCount,
        isHost: false,
        startingClothing: table.startingClothing,
      });

      await set(this.intentRef(code, uid), {
        type: 'join',
        player: JSON.parse(JSON.stringify(newPlayer)) as object,
        ts: Date.now(),
      });
    }

    this.currentTableCode = code;
    this.isHostClient = false;
    this.hostTable = null;
    this.hostDeck = null;

    storeUidForTable(code, uid);

    this.startListeningPublic(code);
    this.startListeningPrivate(code, uid);
    this.startListeningEmotes(code);
    this.setupPresence(code, uid);
  }

  async tryAutoReconnect(code: string): Promise<boolean> {
    await this.ensureAuth();
    const uid = this._localPlayerId;

    const snap = await get(this.publicRef(code));
    if (!snap.exists()) return false;

    const table = this.deserializeTable(snap.val());
    if (!table) return false;

    const player = table.players.find((p) => p.id === uid);
    if (!player) return false;

    this.currentTableCode = code;
    this.isHostClient = player.isHost;

    if (this.isHostClient) {
      this.hostTable = table;
      this.hostDeck = Deck.shuffled();

      this.startListeningIntents(code);
      this.startListeningPresence(code);

      if (isExchangeStage(table.stage) && table.exchangeDeadline) {
        const timeRemaining = table.exchangeDeadline - Date.now();
        this.scheduleHost(
          () => this.hostFinishExchangeRound(),
          Math.max(0, timeRemaining + 250),
        );
      }
    }

    this.startListeningPublic(code);
    this.startListeningPrivate(code, uid);
    this.startListeningEmotes(code);
    this.setupPresence(code, uid);

    return true;
  }

  async leaveTable(): Promise<void> {
    const code = this.currentTableCode;
    const uid = this._localPlayerId;
    if (code && uid) {
      void remove(ref(this.db(), `tables/${code}/presence/${uid}`));
    }
    this.clearHostTimers();
    this.stopAllListeners();
    this.currentTableCode = null;
    this.isHostClient = false;
    this.hostTable = null;
    this.hostDeck = null;
    this.processedIntents.clear();
    this.tableListeners.forEach((l) => l(null));
    this.privateHandListeners.forEach((l) => l(null));
  }

  async deleteTable(): Promise<void> {
    if (!this.currentTableCode) {
      throw new Error("Vous n'etes connecte a aucune table.");
    }
    if (!this.isHostClient) {
      throw new Error("Seul l'hote peut supprimer la table.");
    }
    const code = this.currentTableCode;
    const db = this.db();

    await remove(ref(db, `tables/${code}`));
    await remove(ref(db, `lobby/${code}`));

    this.clearHostTimers();
    this.stopAllListeners();
    this.currentTableCode = null;
    this.isHostClient = false;
    this.hostTable = null;
    this.hostDeck = null;
    this.processedIntents.clear();
    this.tableListeners.forEach((l) => l(null));
    this.privateHandListeners.forEach((l) => l(null));
  }

  async updateTableSettings(params: { maxPlayers: number; startingClothing: number; buybackCost: number }): Promise<void> {
    await this.ensureAuth();
    if (!this.isHostClient || !this.hostTable) {
      throw new Error("Seul l'hote peut modifier les parametres de la table.");
    }

    const currentConnectedCount = this.hostTable.players.length;
    const resolvedMaxPlayers = Math.max(currentConnectedCount, params.maxPlayers);

    this.hostTable.maxPlayers = resolvedMaxPlayers;
    this.hostTable.startingClothing = params.startingClothing;
    this.hostTable.buybackCost = params.buybackCost;

    // Update existing players' starting clothing & remaining clothing in the lobby
    for (const player of this.hostTable.players) {
      player.startingClothing = params.startingClothing;
      player.clothingRemaining = params.startingClothing;
    }

    await this.hostPublish(this.hostTable);
  }

  async sendConsent(): Promise<void> {
    if (this.isHostClient && this.hostTable) {
      const player = this.hostTable.players.find(
        (p) => p.id === this._localPlayerId,
      );
      if (player) {
        player.consentGiven = true;
        await this.hostPublish(this.hostTable);
      }
      return;
    }
    await this.sendIntent({ type: 'consent' });
  }

  async sendReady(ready: boolean): Promise<void> {
    if (this.isHostClient && this.hostTable) {
      const player = this.hostTable.players.find(
        (p) => p.id === this._localPlayerId,
      );
      if (player) {
        player.ready = ready;
        await this.hostPublish(this.hostTable);
      }
      return;
    }
    await this.sendIntent({ type: 'ready', ready });
  }

  async startGame(): Promise<void> {
    await this.ensureAuth();
    if (!this.isHostClient || !this.hostTable) {
      throw new Error("Seul l'hote peut demarrer la partie.");
    }
    if (this.hostTable.players.length < 2) {
      throw new Error('Il faut au moins 2 joueurs pour demarrer la partie.');
    }
    this.hostDeck = Deck.shuffled();
    this.hostTable = startHand(this.hostTable, this.hostDeck);
    this.hostTable = addLog(this.hostTable, 'system', "La partie commence ! Bon jeu à tous !");
    await this.hostPublish(this.hostTable);
    this.scheduleHost(() => this.hostRunExchangeRound(1), REVEAL_PAUSE_MS);
  }

  async sendExchangeChoice(choice: ExchangeChoice): Promise<void> {
    if (this.isHostClient && this.hostTable && this.hostDeck) {
      const result = applyExchangeChoice(
        this.hostTable,
        this._localPlayerId,
        choice,
        this.hostDeck,
      );
      if (result.valid) {
        this.hostTable = result.table;
        await this.hostPublish(this.hostTable);
        if (isExchangeRoundComplete(this.hostTable, Date.now())) {
          this.clearHostTimers();
          this.hostFinishExchangeRound();
        }
      }
      return;
    }
    await this.sendIntent({ type: 'exchangeChoice', choice });
  }

  async startNextHand(): Promise<void> {
    if (this.isHostClient && this.hostTable) {
      if (!canStartNewHand(this.hostTable)) return;
      this.hostDeck = Deck.shuffled();
      this.hostTable = startHand(this.hostTable, this.hostDeck);
      await this.hostPublish(this.hostTable);
      this.scheduleHost(() => this.hostRunExchangeRound(1), REVEAL_PAUSE_MS);
      return;
    }
    await this.sendIntent({ type: 'startNextHand' });
  }

  async restartGame(): Promise<void> {
    if (this.isHostClient && this.hostTable) {
      this.hostTable = restartGame(this.hostTable);
      this.hostDeck = null;
      await this.hostPublish(this.hostTable);
      return;
    }
    await this.sendIntent({ type: 'restartGame' });
  }

  async sendRestoreClothing(): Promise<void> {
    if (this.isHostClient && this.hostTable) {
      this.hostTable = restoreClothing(this.hostTable, this._localPlayerId);
      await this.hostPublish(this.hostTable);
      return;
    }
    await this.sendIntent({ type: 'restoreClothing' });
  }

  async sendPause(paused: boolean): Promise<void> {
    if (this.isHostClient && this.hostTable) {
      this.clearHostTimers();
      if (paused) {
        const remaining = this.hostTable.exchangeDeadline
          ? Math.max(0, this.hostTable.exchangeDeadline - Date.now())
          : null;
        this.hostTable = pauseTable(this.hostTable);
        this.hostTable.exchangeDeadline = remaining;
      } else {
        const remaining = this.hostTable.exchangeDeadline;
        this.hostTable = resumeTable(this.hostTable);
        this.hostTable.exchangeDeadline = remaining ? Date.now() + remaining : null;
        if (remaining) {
          this.scheduleHost(
            () => this.hostFinishExchangeRound(),
            remaining + 250,
          );
        }
      }
      await this.hostPublish(this.hostTable);
      return;
    }
    await this.sendIntent({ type: 'pause', paused });
  }

  async sendEmote(emoji: string): Promise<void> {
    await this.ensureAuth();
    if (!this.currentTableCode) return;
    const at = Date.now();
    await set(this.emoteRef(this.currentTableCode, this._localPlayerId), {
      emoji,
      at,
    });
  }

  async sendChatMessage(content: string): Promise<void> {
    await this.ensureAuth();
    if (!this.currentTableCode) return;
    
    if (this.isHostClient && this.hostTable) {
      const player = this.hostTable.players.find((p) => p.id === this._localPlayerId);
      this.hostTable = addLog(
        this.hostTable,
        'chat',
        content,
        player?.pseudo || 'Joueur',
        player?.avatar || '👤',
        this._localPlayerId
      );
      await this.hostPublish(this.hostTable);
      return;
    }
    
    await this.sendIntent({ type: 'chat', content });
  }

  subscribe(listener: (table: TableState | null) => void): () => void {
    this.tableListeners.add(listener);
    if (this.currentTableCode) {
      get(this.publicRef(this.currentTableCode))
        .then((snap) => listener(this.deserializeTable(snap.val())))
        .catch(() => listener(null));
    } else {
      listener(null);
    }
    return () => this.tableListeners.delete(listener);
  }

  subscribePrivateHand(listener: (hand: PrivateHand | null) => void): () => void {
    this.privateHandListeners.add(listener);
    if (this.currentTableCode) {
      get(this.privateRef(this.currentTableCode, this._localPlayerId))
        .then((snap) => {
          const data = snap.val() as { holeCards: TableState['players'][number]['holeCards'] } | null;
          listener(data ? { holeCards: data.holeCards ?? [] } : null);
        })
        .catch(() => listener(null));
    } else {
      listener(null);
    }
    return () => this.privateHandListeners.delete(listener);
  }

  subscribeEmotes(listener: (event: EmoteEvent) => void): () => void {
    this.emoteListeners.add(listener);
    return () => this.emoteListeners.delete(listener);
  }

  async listOpenTables(): Promise<TableSummary[]> {
    await this.ensureAuth();
    const db = this.db();
    const lobbyRef = ref(db, 'lobby');
    const snap = await get(lobbyRef);
    if (!snap.exists()) return [];

    const results: TableSummary[] = [];
    snap.forEach((entrySnap) => {
      const entry = entrySnap.val() as TableSummary | null;
      if (!entry || entry.stage !== 'lobby') return;
      results.push({
        code: entry.code,
        playersConnected: entry.playersConnected,
        playersExpected: entry.playersExpected,
        stage: entry.stage,
      });
    });

    return results;
  }
}
