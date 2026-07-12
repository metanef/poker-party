/**
 * The 8 fixed stages of a hand, in strict order. No stage is ever skipped or
 * reordered. `lobby` is the meta-stage before the first hand starts.
 */
export const HAND_STAGES = [
  'dealing',
  'flop',
  'exchange1',
  'turn',
  'exchange2',
  'river',
  'exchange3',
  'showdown',
] as const;

export type HandStage = (typeof HAND_STAGES)[number];

export type Stage = 'lobby' | HandStage;

export const EXCHANGE_STAGES: HandStage[] = [
  'exchange1',
  'exchange2',
  'exchange3',
];

export function isExchangeStage(stage: Stage): boolean {
  return (EXCHANGE_STAGES as Stage[]).includes(stage);
}

export function nextStage(stage: HandStage): HandStage | null {
  const idx = HAND_STAGES.indexOf(stage);
  if (idx === -1 || idx === HAND_STAGES.length - 1) return null;
  return HAND_STAGES[idx + 1];
}
