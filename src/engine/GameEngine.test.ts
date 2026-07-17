import { describe, expect, it } from 'vitest';
import { Deck } from './model/Deck';
import { createPlayer } from './model/Player';
import { createEmptyTable } from './model/Table';
import {
  advancePastExchange,
  applyExchangeChoice,
  beginExchangeRound,
  finalizeExchangeRound,
  resolveShowdown,
  restoreClothing,
  startHand,
} from './GameEngine';

function makeTable(playerCount: number) {
  let table = createEmptyTable({
    code: 'TEST1',
    hostId: 'p0',
    maxPlayers: playerCount,
    startingClothing: 6,
    createdAt: Date.now(),
  });
  for (let i = 0; i < playerCount; i++) {
    table.players.push(
      createPlayer({
        id: `p${i}`,
        pseudo: `Joueur ${i}`,
        avatar: '\u{1F642}',
        seatIndex: i,
        isHost: i === 0,
        startingClothing: 6,
      }),
    );
  }
  return table;
}

describe('a full hand runs through all 8 fixed stages in order', () => {
  it('deals, reveals, exchanges 3 times, and resolves a winner and loser', () => {
    let table = makeTable(3);
    const deck = Deck.shuffled();

    // Stages 1 + 2: dealing + flop.
    table = startHand(table, deck);
    expect(table.stage).toBe('flop');
    expect(table.communityCards).toHaveLength(3);
    for (const p of table.players) expect(p.holeCards).toHaveLength(2);

    // Stage 3: 1st exchange round -- everyone keeps.
    table = beginExchangeRound(table, 1, Date.now());
    expect(table.stage).toBe('echange1');
    for (const p of table.players) {
      const result = applyExchangeChoice(table, p.id, { type: 'keep' }, deck);
      expect(result.valid).toBe(true);
      table = result.table;
    }
    table = finalizeExchangeRound(table);

    // Stage 4: turn.
    table = advancePastExchange(table, deck);
    expect(table.stage).toBe('turn');
    expect(table.communityCards).toHaveLength(4);

    // Stage 5: 2nd exchange round.
    table = beginExchangeRound(table, 2, Date.now());
    expect(table.stage).toBe('echange2');
    table = finalizeExchangeRound(table); // nobody responds -> all "keep"

    // Stage 6: river.
    table = advancePastExchange(table, deck);
    expect(table.stage).toBe('river');
    expect(table.communityCards).toHaveLength(5);

    // Stage 7: 3rd exchange round.
    table = beginExchangeRound(table, 3, Date.now());
    expect(table.stage).toBe('echange3');
    table = finalizeExchangeRound(table);

    // Stage 8: showdown.
    table = advancePastExchange(table, deck);
    expect(table.stage).toBe('showdown');
    table = resolveShowdown(table);

    expect(table.lastHandResult).not.toBeNull();
    const result = table.lastHandResult!;
    // With 3 players and (almost certainly) no ties, exactly one winner and
    // one loser are designated; the middle player is unaffected.
    if (!result.tiedForWin) {
      expect(result.winnerIds).toHaveLength(1);
    }
    if (!result.tiedForLoss) {
      expect(result.loserIds).toHaveLength(1);
    }
  });

  it('rejects an exchange of more than 2 cards', () => {
    let table = makeTable(2);
    const deck = Deck.shuffled();
    table = startHand(table, deck);
    table = beginExchangeRound(table, 1, Date.now());

    const result = applyExchangeChoice(
      table,
      'p0',
      { type: 'change', cardIndices: [0, 1, 0] },
      deck,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects an exchange outside an active exchange stage', () => {
    let table = makeTable(2);
    const deck = Deck.shuffled();
    table = startHand(table, deck); // stage is "flop", not an exchange stage

    const result = applyExchangeChoice(table, 'p0', { type: 'keep' }, deck);
    expect(result.valid).toBe(false);
  });
});

describe('the 3-point clothing restoration rule', () => {
  it('lets a player at 3+ points put back one clothing item and subtracts 3 points', () => {
    let table = makeTable(2);
    const player = table.players.find((p) => p.id === 'p0')!;
    player.points = 4;
    player.clothingRemaining = 4;

    table = restoreClothing(table, 'p0');

    const updated = table.players.find((p) => p.id === 'p0')!;
    expect(updated.clothingRemaining).toBe(5);
    expect(updated.points).toBe(1);
  });

  it('does nothing if the player has fewer than 3 points', () => {
    let table = makeTable(2);
    const player = table.players.find((p) => p.id === 'p0')!;
    player.points = 1;
    player.clothingRemaining = 4;

    table = restoreClothing(table, 'p0');

    const updated = table.players.find((p) => p.id === 'p0')!;
    expect(updated.clothingRemaining).toBe(4);
    expect(updated.points).toBe(1);
  });

  it('respects a custom buybackCost when restoring clothing', () => {
    let table = makeTable(2);
    table.buybackCost = 2;
    const player = table.players.find((p) => p.id === 'p0')!;
    player.points = 2;
    player.clothingRemaining = 4;

    table = restoreClothing(table, 'p0');

    const updated = table.players.find((p) => p.id === 'p0')!;
    expect(updated.clothingRemaining).toBe(5);
    expect(updated.points).toBe(0);
  });
});

describe('resolveShowdown', () => {
  it('resets player ready states, setting host and bots to true, others to false', () => {
    let table = makeTable(3);
    // Let's set some players' ready states to true before showdown
    table.players[0].ready = true; // host
    table.players[1].ready = true; // non-host player 1
    table.players[2].ready = true; // non-host player 2
    
    // Add a bot
    table.players.push(
      createPlayer({
        id: 'bot-1',
        pseudo: 'Bot 1',
        avatar: '🤖',
        seatIndex: 3,
        startingClothing: 6,
      })
    );
    
    // Set stage and cards to allow showdown resolution
    table.stage = 'river';
    for (const player of table.players) {
      player.active = true;
      player.holeCards = [
        { suit: 'hearts', rank: 'A' },
        { suit: 'diamonds', rank: 'K' },
      ];
    }
    table.communityCards = [
      { suit: 'spades', rank: 'Q' },
      { suit: 'clubs', rank: 'J' },
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '2' },
      { suit: 'clubs', rank: '3' },
    ];
    
    table = resolveShowdown(table);
    
    expect(table.stage).toBe('showdown');
    
    // Check ready states after resolveShowdown
    const host = table.players.find((p) => p.id === 'p0')!;
    const bot = table.players.find((p) => p.id === 'bot-1')!;
    const human1 = table.players.find((p) => p.id === 'p1')!;
    const human2 = table.players.find((p) => p.id === 'p2')!;
    
    expect(host.ready).toBe(true);  // host is ready by default
    expect(bot.ready).toBe(true);   // bot is ready by default
    expect(human1.ready).toBe(false); // other human player is reset to false
    expect(human2.ready).toBe(false); // other human player is reset to false
  });
});

