import type { Card, Rank } from '../model/Card';
import { rankLabel } from '../model/Card';

/**
 * Pure 7-card (2 hole + 5 community) poker hand evaluator.
 * No UI or network dependencies.
 */

export type HandCategory =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush';

const CATEGORY_RANK: Record<HandCategory, number> = {
  'high-card': 0,
  pair: 1,
  'two-pair': 2,
  'three-of-a-kind': 3,
  straight: 4,
  flush: 5,
  'full-house': 6,
  'four-of-a-kind': 7,
  'straight-flush': 8,
};

const CATEGORY_LABEL_FR: Record<HandCategory, string> = {
  'high-card': 'Carte haute',
  pair: 'Paire',
  'two-pair': 'Double paire',
  'three-of-a-kind': 'Brelan',
  straight: 'Suite',
  flush: 'Couleur',
  'full-house': 'Full',
  'four-of-a-kind': 'Carré',
  'straight-flush': 'Quinte flush',
};

/**
 * A fully ordered hand strength: [categoryScore, ...tiebreak ranks descending].
 * Comparable lexicographically -- higher is better.
 */
export type HandStrength = {
  category: HandCategory;
  /** [categoryRank, tiebreak1, tiebreak2, ...] descending, ready for lexicographic compare. */
  scoreVector: number[];
  bestFive: Card[];
};

function combinations<T>(items: T[], size: number): T[][] {
  const results: T[][] = [];
  const combo: T[] = [];
  function recurse(start: number) {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      combo.push(items[i]);
      recurse(i + 1);
      combo.pop();
    }
  }
  recurse(0);
  return results;
}

function evaluateFive(cards: Card[]): HandStrength {
  const ranksDesc = [...cards.map((c) => c.rank)].sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);

  const counts = new Map<Rank, number>();
  for (const r of ranksDesc) counts.set(r, (counts.get(r) ?? 0) + 1);

  // Rank groups sorted by (count desc, rank desc) -- standard poker tiebreak order.
  const groups = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  // Straight detection, including the wheel (A-2-3-4-5).
  const uniqueRanksDesc = [...new Set(ranksDesc)];
  let straightHigh: number | null = null;
  if (uniqueRanksDesc.length === 5) {
    if (uniqueRanksDesc[0] - uniqueRanksDesc[4] === 4) {
      straightHigh = uniqueRanksDesc[0];
    } else if (
      uniqueRanksDesc[0] === 14 &&
      uniqueRanksDesc[1] === 5 &&
      uniqueRanksDesc[2] === 4 &&
      uniqueRanksDesc[3] === 3 &&
      uniqueRanksDesc[4] === 2
    ) {
      // Wheel: A-2-3-4-5, plays as a 5-high straight.
      straightHigh = 5;
    }
  }

  const isStraight = straightHigh !== null;

  if (isStraight && isFlush) {
    return {
      category: 'straight-flush',
      scoreVector: [CATEGORY_RANK['straight-flush'], straightHigh as number],
      bestFive: cards,
    };
  }

  if (groups[0][1] === 4) {
    const kicker = groups[1][0];
    return {
      category: 'four-of-a-kind',
      scoreVector: [CATEGORY_RANK['four-of-a-kind'], groups[0][0], kicker],
      bestFive: cards,
    };
  }

  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return {
      category: 'full-house',
      scoreVector: [CATEGORY_RANK['full-house'], groups[0][0], groups[1][0]],
      bestFive: cards,
    };
  }

  if (isFlush) {
    return {
      category: 'flush',
      scoreVector: [CATEGORY_RANK.flush, ...ranksDesc],
      bestFive: cards,
    };
  }

  if (isStraight) {
    return {
      category: 'straight',
      scoreVector: [CATEGORY_RANK.straight, straightHigh as number],
      bestFive: cards,
    };
  }

  if (groups[0][1] === 3) {
    const kickers = groups.slice(1).map((g) => g[0]);
    return {
      category: 'three-of-a-kind',
      scoreVector: [CATEGORY_RANK['three-of-a-kind'], groups[0][0], ...kickers],
      bestFive: cards,
    };
  }

  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairRanks = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    const kicker = groups[2][0];
    return {
      category: 'two-pair',
      scoreVector: [CATEGORY_RANK['two-pair'], ...pairRanks, kicker],
      bestFive: cards,
    };
  }

  if (groups[0][1] === 2) {
    const kickers = groups.slice(1).map((g) => g[0]);
    return {
      category: 'pair',
      scoreVector: [CATEGORY_RANK.pair, groups[0][0], ...kickers],
      bestFive: cards,
    };
  }

  return {
    category: 'high-card',
    scoreVector: [CATEGORY_RANK['high-card'], ...ranksDesc],
    bestFive: cards,
  };
}

export function compareHandStrength(a: HandStrength, b: HandStrength): number {
  const len = Math.max(a.scoreVector.length, b.scoreVector.length);
  for (let i = 0; i < len; i++) {
    const av = a.scoreVector[i] ?? 0;
    const bv = b.scoreVector[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Evaluates the best possible 5-card hand out of the given 7 (2 hole + 5 community) cards. */
export function evaluateBestHand(sevenCards: Card[]): HandStrength {
  if (sevenCards.length < 5) {
    throw new Error('Il faut au moins 5 cartes pour évaluer une main.');
  }
  const fiveCardCombos = combinations(sevenCards, 5);
  let best: HandStrength | null = null;
  for (const combo of fiveCardCombos) {
    const strength = evaluateFive(combo);
    if (!best || compareHandStrength(strength, best) > 0) {
      best = strength;
    }
  }
  return best as HandStrength;
}

/** French, human-readable label for a hand category, e.g. "Paire de Rois". */
export function describeHandFr(strength: HandStrength): string {
  const [, ...tiebreak] = strength.scoreVector;
  const rankName = (r: number) => rankLabel(r as Rank);
  switch (strength.category) {
    case 'straight-flush':
      return `Quinte flush au ${rankName(tiebreak[0])}`;
    case 'four-of-a-kind':
      return `Carré de ${rankName(tiebreak[0])}`;
    case 'full-house':
      return `Full aux ${rankName(tiebreak[0])} par les ${rankName(tiebreak[1])}`;
    case 'flush':
      return `Couleur au ${rankName(tiebreak[0])}`;
    case 'straight':
      return `Suite au ${rankName(tiebreak[0])}`;
    case 'three-of-a-kind':
      return `Brelan de ${rankName(tiebreak[0])}`;
    case 'two-pair':
      return `Double paire, ${rankName(tiebreak[0])} et ${rankName(tiebreak[1])}`;
    case 'pair':
      return `Paire de ${rankName(tiebreak[0])}`;
    case 'high-card':
    default:
      return `Carte haute : ${rankName(tiebreak[0])}`;
  }
}

export function categoryLabelFr(category: HandCategory): string {
  return CATEGORY_LABEL_FR[category];
}
