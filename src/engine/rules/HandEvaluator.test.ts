import { describe, expect, it } from 'vitest';
import type { Card } from '../model/Card';
import { compareHandStrength, evaluateBestHand } from './HandEvaluator';

function c(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit };
}

describe('evaluateBestHand', () => {
  it('recognizes a flush over a straight', () => {
    const sevenFlush: Card[] = [
      c(2, 'hearts'),
      c(5, 'hearts'),
      c(9, 'hearts'),
      c(11, 'hearts'),
      c(13, 'hearts'),
      c(3, 'clubs'),
      c(4, 'spades'),
    ];
    const strength = evaluateBestHand(sevenFlush);
    expect(strength.category).toBe('flush');
  });

  it('recognizes the wheel (A-2-3-4-5) as the lowest straight', () => {
    const wheel: Card[] = [
      c(14, 'hearts'),
      c(2, 'clubs'),
      c(3, 'diamonds'),
      c(4, 'spades'),
      c(5, 'hearts'),
      c(9, 'clubs'),
      c(10, 'diamonds'),
    ];
    const strength = evaluateBestHand(wheel);
    expect(strength.category).toBe('straight');
    expect(strength.scoreVector[1]).toBe(5);
  });

  it('ranks four-of-a-kind above a full house', () => {
    const quad: Card[] = [
      c(9, 'hearts'),
      c(9, 'clubs'),
      c(9, 'diamonds'),
      c(9, 'spades'),
      c(2, 'hearts'),
      c(3, 'clubs'),
      c(4, 'diamonds'),
    ];
    const fullHouse: Card[] = [
      c(8, 'hearts'),
      c(8, 'clubs'),
      c(8, 'diamonds'),
      c(6, 'spades'),
      c(6, 'hearts'),
      c(2, 'clubs'),
      c(3, 'diamonds'),
    ];
    const quadStrength = evaluateBestHand(quad);
    const fullHouseStrength = evaluateBestHand(fullHouse);
    expect(quadStrength.category).toBe('four-of-a-kind');
    expect(fullHouseStrength.category).toBe('full-house');
    expect(compareHandStrength(quadStrength, fullHouseStrength)).toBeGreaterThan(0);
  });

  it('breaks ties between two pairs using kickers', () => {
    const higherKicker: Card[] = [
      c(10, 'hearts'),
      c(10, 'clubs'),
      c(6, 'diamonds'),
      c(6, 'spades'),
      c(13, 'hearts'),
      c(2, 'clubs'),
      c(3, 'diamonds'),
    ];
    const lowerKicker: Card[] = [
      c(10, 'diamonds'),
      c(10, 'spades'),
      c(6, 'hearts'),
      c(6, 'clubs'),
      c(9, 'diamonds'),
      c(2, 'hearts'),
      c(3, 'clubs'),
    ];
    const a = evaluateBestHand(higherKicker);
    const b = evaluateBestHand(lowerKicker);
    expect(a.category).toBe('two-pair');
    expect(b.category).toBe('two-pair');
    expect(compareHandStrength(a, b)).toBeGreaterThan(0);
  });
});
