import type { ExchangeChoice, Player } from '../model/Player';
import { isExchangeStage, type Stage } from '../fsm/stages';

export interface ExchangeValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a player's exchange choice against the current table stage.
 * A player may only exchange their own private cards, only during an
 * active exchange stage, and at most 2 cards at a time.
 */
export function validateExchangeChoice(
  stage: Stage,
  player: Player | undefined,
  choice: ExchangeChoice,
): ExchangeValidationResult {
  if (!player) {
    return { valid: false, error: 'Joueur introuvable.' };
  }
  if (!isExchangeStage(stage)) {
    return { valid: false, error: "Aucun tour de change n'est actif." };
  }
  if (!player.active) {
    return { valid: false, error: 'Ce joueur ne participe pas à cette manche.' };
  }
  if (player.hasActedThisRound) {
    return { valid: false, error: 'Ce joueur a déjà joué ce tour de change.' };
  }
  if (choice.type === 'keep') {
    return { valid: true };
  }

  const { cardIndices } = choice;
  const uniqueIndices = new Set(cardIndices);
  if (uniqueIndices.size !== cardIndices.length) {
    return { valid: false, error: 'Sélection de cartes en double.' };
  }
  if (cardIndices.length < 1 || cardIndices.length > 2) {
    return {
      valid: false,
      error: 'Un joueur ne peut changer que 1 ou 2 cartes.',
    };
  }
  for (const idx of cardIndices) {
    if (idx < 0 || idx >= player.holeCards.length) {
      return { valid: false, error: 'Index de carte invalide.' };
    }
  }
  return { valid: true };
}
