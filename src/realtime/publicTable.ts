import type { TableState } from '../engine/model/Table';

/**
 * Strips private hole cards from a table snapshot before it is broadcast
 * publicly. Hole cards are only revealed to everyone once the hand reaches
 * showdown; before that, every player's cards -- including the local
 * player's own -- are hidden from this public channel. A player's own
 * cards are delivered separately via the private-hand subscription.
 */
export function toPublicTable(table: TableState): TableState {
  const revealAll = table.stage === 'showdown';
  return {
    ...table,
    players: table.players.map((p) => ({
      ...p,
      holeCards: revealAll ? p.holeCards : [],
    })),
  };
}
