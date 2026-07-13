import { buildFullDeck, type Card } from './Card';

/**
 * Pure, immutable-style deck helper. No UI or network dependencies.
 */
export class Deck {
  private cards: Card[];

  constructor(cards?: Card[]) {
    this.cards = cards ? [...cards] : buildFullDeck();
  }

  static shuffled(random: () => number = Math.random): Deck {
    const deck = new Deck();
    deck.shuffle(random);
    return deck;
  }

  shuffle(random: () => number = Math.random): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /** Draws `count` cards from the top of the deck, removing them. */
  draw(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error('Impossible de piocher : le paquet est vide.');
    }
    return this.cards.splice(0, count);
  }

  get remaining(): number {
    return this.cards.length;
  }

  toArray(): Card[] {
    return [...this.cards];
  }
}
