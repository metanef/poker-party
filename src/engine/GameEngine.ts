import { buildFullDeck, type Card } from './model/Card';
import { Deck } from './model/Deck';
import type { ExchangeChoice, Player } from './model/Player';
import type { HandResult, TableState, LogMessage } from './model/Table';
import { HAND_STAGES, isExchangeStage, type HandStage, type Stage } from './fsm/stages';
import { validateExchangeChoice } from './rules/ExchangeRules';
import { compareHandStrength, describeHandFr, evaluateBestHand } from './rules/HandEvaluator';

const EXCHANGE_TIMEOUT_MS = 20_000;

function clonePlayer(player: Player): Player {
  return {
    ...player,
    holeCards: [...player.holeCards],
    lastChoice: player.lastChoice ? { ...player.lastChoice } : null,
  };
}

function cloneTable(table: TableState): TableState {
  return {
    ...table,
    communityCards: [...table.communityCards],
    players: table.players.map(clonePlayer),
    lastHandResult: table.lastHandResult
      ? { ...table.lastHandResult, handLabels: { ...table.lastHandResult.handLabels } }
      : null,
    logs: table.logs ? [...table.logs] : [],
  };
}

export function addLog(
  table: TableState,
  type: 'system' | 'chat',
  content: string,
  playerName?: string,
  playerAvatar?: string,
  playerId?: string,
): TableState {
  const next = cloneTable(table);
  const newLog: LogMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    content,
    playerName,
    playerAvatar,
    playerId,
  };
  next.logs = [...next.logs, newLog].slice(-100);
  return next;
}

function activePlayers(table: TableState): Player[] {
  return table.players.filter((p) => p.active);
}

/**
 * Deals a fresh hand: shuffles a new deck, gives every active player 2
 * private hole cards, and reveals the 3 flop cards. This covers stages
 * 1 (dealing) and 2 (flop) of the fixed 8-stage sequence, since no player
 * decision happens between them.
 */
export function startHand(table: TableState, deck: Deck = Deck.shuffled()): TableState {
  const next = cloneTable(table);
  next.handNumber += 1;
  next.lastHandResult = null;
  next.gameOverMessage = null;
  next.exchangeDeadline = null;
  next.exchangeRound = null;

  for (const player of next.players) {
    if (!player.active) continue;
    player.holeCards = deck.draw(2);
    player.hasActedThisRound = false;
    player.lastChoice = null;
  }

  next.communityCards = deck.draw(3);
  next.stage = 'flop';
  next.deckSize = deck.remaining;
  return addLog(next, 'system', `Début de la Manche ${next.handNumber}.`);
}

/** Begins one of the 3 fixed exchange rounds (stages 3, 5, 7). */
export function beginExchangeRound(
  table: TableState,
  round: 1 | 2 | 3,
  now: number,
  timeoutMs = EXCHANGE_TIMEOUT_MS,
): TableState {
  const next = cloneTable(table);
  const stage: HandStage = round === 1 ? 'echange1' : round === 2 ? 'echange2' : 'echange3';
  next.stage = stage;
  next.exchangeRound = round;
  next.exchangeDeadline = now + timeoutMs;
  for (const player of next.players) {
    if (!player.active) continue;
    player.hasActedThisRound = false;
    player.lastChoice = null;
  }
  return next;
}

export interface ApplyExchangeResult {
  table: TableState;
  valid: boolean;
  error?: string;
}

/**
 * Applies one player's exchange decision. Never trusts non-host clients to
 * compute game state -- this is the single place a choice is validated and
 * resolved, meant to run only on the host's client.
 */
export function applyExchangeChoice(
  table: TableState,
  playerId: string,
  choice: ExchangeChoice,
  deck: Deck,
): ApplyExchangeResult {
  const player = table.players.find((p) => p.id === playerId);
  const validation = validateExchangeChoice(table.stage, player, choice);
  if (!validation.valid || !player) {
    return { table, valid: false, error: validation.error };
  }

  const next = cloneTable(table);
  const nextPlayer = next.players.find((p) => p.id === playerId) as Player;

  let logMsg = '';
  if (choice.type === 'change') {
    const replacements = deck.draw(choice.cardIndices.length);
    choice.cardIndices.forEach((cardIdx, i) => {
      nextPlayer.holeCards[cardIdx] = replacements[i];
    });
    logMsg = `${player.pseudo} a changé ${choice.cardIndices.length} carte${choice.cardIndices.length > 1 ? 's' : ''}.`;
  } else {
    logMsg = `${player.pseudo} a gardé toutes ses cartes.`;
  }

  nextPlayer.hasActedThisRound = true;
  nextPlayer.lastChoice = choice;
  next.deckSize = deck.remaining;
  
  const loggedTable = addLog(next, 'system', logMsg);
  return { table: loggedTable, valid: true };
}

/** True once every active, connected player has acted, or the deadline has passed. */
export function isExchangeRoundComplete(table: TableState, now: number): boolean {
  if (!isExchangeStage(table.stage)) return true;
  if (table.exchangeDeadline !== null && now >= table.exchangeDeadline) return true;
  return activePlayers(table).every((p) => p.hasActedThisRound);
}

/**
 * Marks any active player who has not responded by the deadline as having
 * chosen "Continuer sans changer" (per the spec's default).
 */
export function finalizeExchangeRound(table: TableState): TableState {
  const next = cloneTable(table);
  for (const player of next.players) {
    if (player.active && !player.hasActedThisRound) {
      player.hasActedThisRound = true;
      player.lastChoice = { type: 'keep' };
    }
  }
  next.exchangeDeadline = null;
  return next;
}

/** Reveals the turn (stage 4) or river (stage 6) card, advancing past an exchange round. */
export function advancePastExchange(table: TableState, deck: Deck): TableState {
  const next = cloneTable(table);
  if (table.stage === 'echange1') {
    next.communityCards.push(...deck.draw(1));
    next.stage = 'turn';
  } else if (table.stage === 'echange2') {
    next.communityCards.push(...deck.draw(1));
    next.stage = 'river';
  } else if (table.stage === 'echange3') {
    next.stage = 'showdown';
  }
  next.deckSize = deck.remaining;
  return next;
}

/** After a reveal stage (turn/river), advances into the next exchange round. */
export function nextExchangeRoundAfterReveal(stage: Stage): 1 | 2 | 3 | null {
  if (stage === 'turn') return 2;
  if (stage === 'river') return 3;
  return null;
}

/**
 * Resolves the showdown (stage 8): evaluates all active players' best
 * 7-card hand, assigns +1 point to the winner, and a clothing loss to the
 * loser. Ties at either end are a no-op for that side, per the spec.
 */
export function resolveShowdown(table: TableState): TableState {
  const next = cloneTable(table);
  const players = activePlayers(next);

  const strengths = players.map((p) => ({
    player: p,
    strength: evaluateBestHand([...p.holeCards, ...next.communityCards]),
  }));

  let best = strengths[0];
  let worst = strengths[0];
  for (const entry of strengths) {
    if (compareHandStrength(entry.strength, best.strength) > 0) best = entry;
    if (compareHandStrength(entry.strength, worst.strength) < 0) worst = entry;
  }

  const winners = strengths.filter((e) => compareHandStrength(e.strength, best.strength) === 0);
  const losers = strengths.filter((e) => compareHandStrength(e.strength, worst.strength) === 0);

  const tiedForWin = winners.length > 1;
  const tiedForLoss = losers.length > 1;
  const singleWinner = !tiedForWin && winners.length === 1 && strengths.length > 1;
  const singleLoser = !tiedForLoss && losers.length === 1 && strengths.length > 1;

  if (singleWinner) {
    const winnerPlayer = next.players.find((p) => p.id === winners[0].player.id) as Player;
    winnerPlayer.points += 1;
  }

  let gameOverMessage: string | null = null;
  if (singleLoser) {
    const loserPlayer = next.players.find((p) => p.id === losers[0].player.id) as Player;
    loserPlayer.clothingRemaining = Math.max(0, loserPlayer.clothingRemaining - 1);
    if (loserPlayer.clothingRemaining === 0) {
      gameOverMessage = `${loserPlayer.pseudo} n'a plus de vêtement à retirer.`;
    }
  }

  const handLabels: Record<string, string> = {};
  for (const entry of strengths) {
    handLabels[entry.player.id] = describeHandFr(entry.strength);
  }

  const result: HandResult = {
    handNumber: next.handNumber,
    winnerIds: winners.map((w) => w.player.id),
    loserIds: losers.map((l) => l.player.id),
    tiedForWin,
    tiedForLoss,
    handLabels,
  };

  next.stage = 'showdown';
  next.lastHandResult = result;
  next.gameOverMessage = gameOverMessage;

  let loggedTable = next;
  if (winners.length > 0) {
    const winnerNames = winners.map((w) => w.player.pseudo).join(', ');
    const handLabel = handLabels[winners[0].player.id];
    loggedTable = addLog(
      loggedTable,
      'system',
      `${winnerNames} remporte${winners.length > 1 ? 'nt' : ''} la manche avec : ${handLabel}.`
    );
  }
  
  if (singleLoser) {
    const loserPlayer = loggedTable.players.find((p) => p.id === losers[0].player.id) as Player;
    loggedTable = addLog(
      loggedTable,
      'system',
      `${loserPlayer.pseudo} perd la manche et retire un vêtement (👕 restants : ${loserPlayer.clothingRemaining}).`
    );
  }

  if (gameOverMessage) {
    loggedTable = addLog(loggedTable, 'system', `Fin de la partie : ${gameOverMessage}`);
  }

  return loggedTable;
}

/**
 * A player who has reached 3 points may choose to put back one clothing
 * item, resetting their points to 0. This is always an explicit player
 * choice, never automatic.
 */
export function restoreClothing(table: TableState, playerId: string): TableState {
  const player = table.players.find((p) => p.id === playerId);
  if (!player || player.points < 3) return table;
  const next = cloneTable(table);
  const nextPlayer = next.players.find((p) => p.id === playerId) as Player;
  nextPlayer.clothingRemaining += 1;
  nextPlayer.points -= 3;
  
  const loggedTable = addLog(next, 'system', `${player.pseudo} a racheté un vêtement (👕 +1, score : ${nextPlayer.points}).`);
  return loggedTable;
}

export function pauseTable(table: TableState): TableState {
  const next = cloneTable(table);
  next.paused = true;
  return next;
}

export function resumeTable(table: TableState): TableState {
  const next = cloneTable(table);
  next.paused = false;
  return next;
}

export function canStartNewHand(table: TableState): boolean {
  return !table.paused && table.gameOverMessage === null;
}

export { EXCHANGE_TIMEOUT_MS, HAND_STAGES, buildFullDeck };
export type { Card };
