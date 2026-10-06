import type { Condition } from '@/lib/domain/enums';

/**
 * What each condition grade actually means.
 *
 * This is the most important page of copy on the site. Refurbished
 * electronics has a trust problem, and the whole of that problem is vague
 * grading: a customer buys "excellent", receives something scuffed, and never
 * shops there again.
 *
 * So each grade here is specific about what you will see, specific about the
 * guaranteed minimum battery, and specific about what is included. If a
 * device does not meet its grade, it gets regraded and repriced rather than
 * sent out and argued about.
 */

export interface ConditionDefinition {
  readonly grade: Condition;
  readonly label: string;
  /** One line, used on a variant chip and in the picker. */
  readonly summary: string;
  /** What the device will actually look like. */
  readonly cosmetic: string;
  /** Guaranteed minimum battery health, or null for sealed stock. */
  readonly batteryMin: number | null;
  /** What comes in the box. */
  readonly includes: readonly string[];
  /** Who this grade suits, so the choice is easy to make. */
  readonly suits: string;
  /** Rough saving against new, for the comparison table. */
  readonly typicalSaving: string;
}

export const conditionDefinitions: readonly ConditionDefinition[] = [
  {
    grade: 'new',
    label: 'Brand new, sealed',
    summary: 'Factory sealed, never opened',
    cosmetic:
      'Exactly as it left the factory. The box is sealed and has not been opened by us or anyone else.',
    batteryMin: null,
    includes: [
      'Sealed manufacturer box with all original contents',
      'Full manufacturer warranty',
      'Our 14 day returns on top',
    ],
    suits: 'Anyone who wants the device untouched and does not mind paying for it.',
    typicalSaving: 'Below recommended retail',
  },
  {
    grade: 'pristine',
    label: 'Pristine',
    summary: 'Indistinguishable from new',
    cosmetic:
      'No marks at all under normal light, held at arm length or closer. Most of these are open-box or display units that were barely used.',
    batteryMin: 95,
    includes: [
      'New accessories, not the originals',
      'Plain protective box rather than the retail packaging',
      '12 month Apple Bros warranty',
    ],
    suits:
      'Anyone who wants a device that looks new but would rather not pay for the sealed box.',
    typicalSaving: 'Around 15% below new',
  },
  {
    grade: 'excellent',
    label: 'Excellent',
    summary: 'Tiny marks you have to look for',
    cosmetic:
      'You may find one or two very light marks on the frame if you hold it to the light and look for them. The screen is flawless.',
    batteryMin: 90,
    includes: [
      'New charging cable',
      'Plain protective box',
      '12 month Apple Bros warranty',
    ],
    suits: 'Most people. This is the grade we sell most of, and the best value.',
    typicalSaving: 'Around 25% below new',
  },
  {
    grade: 'good',
    label: 'Good',
    summary: 'Light scratches, nothing on the screen',
    cosmetic:
      'Visible light scratches or small marks on the frame and back, the kind a device picks up in a pocket. The screen has no scratches that catch a fingernail.',
    batteryMin: 85,
    includes: [
      'New charging cable',
      'Plain protective box',
      '12 month Apple Bros warranty',
    ],
    suits:
      'Anyone putting a case on it anyway, which is most people, and who would rather have the money.',
    typicalSaving: 'Around 35% below new',
  },
  {
    grade: 'fair',
    label: 'Fair',
    summary: 'Clearly used, works perfectly',
    cosmetic:
      'Obvious scratches, possibly a small dent on the frame, and there may be light marks on the screen that are visible when it is off. Everything works exactly as it should.',
    batteryMin: 80,
    includes: [
      'New charging cable',
      'Plain protective box',
      '12 month Apple Bros warranty',
    ],
    suits:
      'Anyone who cares how it works and not how it looks, or buying for a child.',
    typicalSaving: 'Around 45% below new',
  },
];

export function conditionDefinition(
  grade: Condition,
): ConditionDefinition | undefined {
  return conditionDefinitions.find((d) => d.grade === grade);
}

/**
 * What every device goes through before it is listed.
 *
 * Specific and checkable rather than a vague promise of quality. A customer
 * can ask about any one of these steps and get a straight answer.
 */
export const refurbishmentSteps = [
  {
    title: 'Full diagnostic',
    detail:
      'Every function is tested: screen, cameras, speakers, microphones, Face ID or Touch ID, every button, charging, and all radios including cellular, Wi-Fi and Bluetooth.',
  },
  {
    title: 'Battery check',
    detail:
      'Battery health is measured and recorded. Anything below the minimum for its grade gets a new battery before it is listed, not a lower grade.',
  },
  {
    title: 'Data wiped properly',
    detail:
      'Every device is erased and the activation lock is confirmed removed. We will not list a device still linked to someone else, which is also why we cannot buy one.',
  },
  {
    title: 'Graded against the published scale',
    detail:
      'Cosmetic condition is graded by a person against the definitions on this page. If it does not meet a grade, it is listed at the grade it does meet.',
  },
  {
    title: 'Cleaned and packed',
    detail:
      'Cleaned, fitted with a new charging cable, and packed in a protective box. The original retail packaging is not included unless the device is sealed.',
  },
] as const;

/**
 * Honest answers to the questions people actually ask about used devices.
 */
export const refurbishedFaqs = [
  {
    question: 'Is a refurbished iPhone as good as a new one?',
    answer:
      'Functionally, yes: every device is tested against the same checklist and anything that fails is repaired or not sold. The differences are cosmetic condition, the battery, and the packaging. All three are stated on the product page before you buy, which is the point.',
  },
  {
    question: 'What warranty do I get?',
    answer:
      'Twelve months from us on any used device, covering anything that stops working that is not accidental damage. Sealed new stock carries the manufacturer warranty instead. We are an independent retailer, so a used device is covered by us rather than by Apple.',
  },
  {
    question: 'What does the battery health figure mean?',
    answer:
      'It is the capacity remaining against the battery when it was new, which is the figure your phone shows under Battery Health. Each grade has a guaranteed minimum. Anything that would arrive below it gets a new battery first.',
  },
  {
    question: 'Can I return it if I change my mind?',
    answer:
      'Yes, within 14 days, provided it is in the condition it arrived in. That is more than the seven days the Consumer Protection Act requires for buying at a distance. If something is faulty the window is not the point: contact us and we will sort it out.',
  },
  {
    question: 'Are these devices network locked?',
    answer:
      'No. Everything we sell is unlocked and works on any South African network. If you ever find otherwise, that is a fault and we will take it back.',
  },
  {
    question: 'Where do the devices come from?',
    answer:
      'Trade-ins from customers, business upgrade programmes, and open-box or display stock. Every device is checked against the stolen property register and we confirm the activation lock is clear before it is listed.',
  },
  {
    question: 'Is the box the original one?',
    answer:
      'Only for sealed new stock. Used devices come in a plain protective box with a new charging cable. We would rather spend the money on the battery than on packaging.',
  },
] as const;
