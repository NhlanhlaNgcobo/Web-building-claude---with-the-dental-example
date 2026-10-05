import { dentistImages } from './images';

/**
 * Dentist profiles and working patterns.
 *
 * Biographies deliberately describe approach and clinical interests rather than
 * listing qualifications, registration numbers or years of experience, none of
 * which should be published here without being verified against the
 * practitioner's actual records.
 */

export interface DentistSeed {
  readonly slug: string;
  readonly title: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: string;
  readonly bio: string;
  readonly focusAreas: readonly string[];
  readonly photoUrl: string;
  /** Lower values are offered first when day load is equal. */
  readonly sortOrder: number;
  /** Which appointment types this dentist takes. */
  readonly serviceSlugs: readonly string[];
  /** Weekly pattern. dayOfWeek is 0 for Sunday through 6 for Saturday. */
  readonly schedule: readonly {
    readonly dayOfWeek: number;
    readonly start: string;
    readonly end: string;
    readonly breakStart?: string;
    readonly breakEnd?: string;
  }[];
}

export const dentistSeeds: readonly DentistSeed[] = [
  {
    slug: 'dr-anika-naidoo',
    title: 'Dr',
    firstName: 'Anika',
    lastName: 'Naidoo',
    role: 'Principal dentist',
    bio: 'Anika founded the practice around a simple idea: that most people are uneasy at the dentist because nobody has explained what is actually happening. She works slowly, shows patients what she is looking at on the screen, and will not start treatment until the plan and the cost are both clear. Her clinical work centres on restoring teeth and on cosmetic dentistry, where she is deliberately conservative about removing healthy tooth.',
    focusAreas: [
      'Restorative dentistry',
      'Crowns and veneers',
      'Teeth whitening',
      'Treatment planning',
    ],
    photoUrl: dentistImages['dr-anika-naidoo'],
    sortOrder: 10,
    serviceSlugs: [
      'new-patient-consultation',
      'routine-examination',
      'scale-and-polish',
      'emergency-consultation',
      'whitening-consultation',
      'filling-consultation',
      'crown-consultation',
      'implant-consultation',
      'general-consultation',
    ],
    schedule: [
      { dayOfWeek: 1, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 2, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 3, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 4, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 5, start: '08:00', end: '16:00', breakStart: '12:30', breakEnd: '13:30' },
    ],
  },
  {
    slug: 'dr-sibusiso-mkhize',
    title: 'Dr',
    firstName: 'Sibusiso',
    lastName: 'Mkhize',
    role: 'Dentist, surgical and implant interest',
    bio: 'Sibusiso handles most of the surgical work at the practice, including extractions, wisdom teeth and implant placement. He is straightforward about what each option involves and is just as likely to tell a patient that a tooth is worth keeping as that it needs to come out. He also takes Saturday appointments, which suits people who cannot get away during the week.',
    focusAreas: [
      'Oral surgery',
      'Dental implants',
      'Wisdom teeth',
      'Root canal treatment',
    ],
    photoUrl: dentistImages['dr-sibusiso-mkhize'],
    sortOrder: 20,
    serviceSlugs: [
      'new-patient-consultation',
      'routine-examination',
      'emergency-consultation',
      'filling-consultation',
      'crown-consultation',
      'implant-consultation',
      'general-consultation',
    ],
    schedule: [
      { dayOfWeek: 2, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 3, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 4, start: '08:00', end: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { dayOfWeek: 5, start: '08:00', end: '16:00', breakStart: '12:30', breakEnd: '13:30' },
      { dayOfWeek: 6, start: '08:00', end: '13:00' },
    ],
  },
  {
    slug: 'dr-leila-govender',
    title: 'Dr',
    firstName: 'Leila',
    lastName: 'Govender',
    role: 'Dentist, preventative and gum health interest',
    bio: 'Leila spends most of her time on the things that stop problems starting: thorough examinations, gum treatment, and working out why decay keeps appearing in the same place. She is the person reception books nervous patients and children in with, because she is unhurried and explains everything before she does it.',
    focusAreas: [
      'Preventative dentistry',
      'Gum health',
      'Nervous patients',
      'Hygiene and maintenance',
    ],
    photoUrl: dentistImages['dr-leila-govender'],
    sortOrder: 30,
    serviceSlugs: [
      'new-patient-consultation',
      'routine-examination',
      'scale-and-polish',
      'emergency-consultation',
      'whitening-consultation',
      'filling-consultation',
      'general-consultation',
    ],
    schedule: [
      { dayOfWeek: 1, start: '08:00', end: '17:00', breakStart: '12:30', breakEnd: '13:30' },
      { dayOfWeek: 3, start: '08:00', end: '17:00', breakStart: '12:30', breakEnd: '13:30' },
      { dayOfWeek: 5, start: '08:00', end: '16:00', breakStart: '12:30', breakEnd: '13:30' },
    ],
  },
];

export function getDentistSeed(slug: string): DentistSeed | undefined {
  return dentistSeeds.find((d) => d.slug === slug);
}

/** 'Dr Anika Naidoo' */
export function dentistFullName(d: {
  title: string;
  firstName: string;
  lastName: string;
}): string {
  return `${d.title} ${d.firstName} ${d.lastName}`;
}

/** 'Dr Naidoo', for compact use in slot lists and the diary. */
export function dentistShortName(d: {
  title: string;
  lastName: string;
}): string {
  return `${d.title} ${d.lastName}`;
}
