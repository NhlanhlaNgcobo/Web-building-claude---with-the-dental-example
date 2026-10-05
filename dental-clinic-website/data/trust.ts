/**
 * Trust signals.
 *
 * Every item here is a statement about how the practice operates that can be
 * checked against the site itself or against what happens at an appointment.
 * There are no patient numbers, no years-in-business counts, no star ratings and
 * no awards, because none of those could be substantiated.
 */

export interface TrustSignal {
  readonly title: string;
  readonly detail: string;
  /** Lucide icon name, resolved in the component. */
  readonly icon:
    | 'ClipboardList'
    | 'Receipt'
    | 'CalendarCheck'
    | 'Siren'
    | 'ScanLine'
    | 'MessagesSquare';
  /** Where a reader can verify the claim for themselves. */
  readonly href?: string;
}

export const trustSignals: readonly TrustSignal[] = [
  {
    title: 'Written treatment plans',
    detail:
      'Anything beyond a check-up or a cleaning comes to you in writing first: what is recommended, in what order, and what each item costs. You read it before anything is booked.',
    icon: 'ClipboardList',
  },
  {
    title: 'Fees published upfront',
    detail:
      'Our consultation and hygiene fees are on the pricing page rather than available on request. Treatment that genuinely varies is quoted after an examination instead of guessed at.',
    icon: 'Receipt',
    href: '/pricing',
  },
  {
    title: 'Real availability online',
    detail:
      'The booking pages read the practice diary directly, so the times you see are the times that are actually free. No request forms and no waiting for a call back.',
    icon: 'CalendarCheck',
    href: '/book',
  },
  {
    title: 'Time held back for urgent care',
    detail:
      'Appointments are reserved each morning for pain, swelling and broken teeth, which is what makes same-day treatment possible rather than aspirational.',
    icon: 'Siren',
    href: '/emergency',
  },
  {
    title: 'You see what we see',
    detail:
      'Scans and images go on the screen in front of you and get explained as we go. It is much easier to decide about treatment when you can see what is being discussed.',
    icon: 'ScanLine',
  },
  {
    title: 'Straightforward about options',
    detail:
      'Where there is more than one reasonable way forward, including doing nothing for now, we set out each one with its trade-offs rather than presenting a single recommendation.',
    icon: 'MessagesSquare',
  },
];

/**
 * The patient journey, used on the homepage. Describes what actually happens
 * rather than a generic three-step marketing sequence.
 */
export const patientJourney = [
  {
    step: 'Book',
    detail:
      'Choose your appointment type, a dentist or the first available one, then a time from the live diary. It takes about a minute and you get a reference straight away.',
  },
  {
    step: 'First appointment',
    detail:
      'A full examination, images where they add something, and a conversation about what we found. Nothing is treated on the day unless you want it to be.',
  },
  {
    step: 'Your plan',
    detail:
      'If treatment is needed you get it in writing, sequenced sensibly, with costs. Take it away and think about it.',
  },
  {
    step: 'Treatment and maintenance',
    detail:
      'We work through the plan at a pace that suits you, then settle into a check and hygiene interval based on your own risk rather than a default six months.',
  },
] as const;

/**
 * Technology and approach. Described in terms of what it changes for the
 * patient, which is the only reason any of it is worth mentioning.
 */
export const approachPoints = [
  {
    title: 'Digital scanning',
    detail:
      'Crowns, veneers and whitening trays start from a digital scan rather than a tray of impression material, which is quicker and considerably more pleasant if you have a strong gag reflex.',
  },
  {
    title: 'Low-dose digital radiographs',
    detail:
      'Images appear on the screen immediately at a lower radiation dose than film, and we only take them where they will change what we do.',
  },
  {
    title: 'Chairside screen',
    detail:
      'Your scans and intraoral photographs are shown to you on the screen beside the chair, so a discussion about a cracked filling is about something you can actually see.',
  },
  {
    title: 'Conservative by default',
    detail:
      'Where a smaller intervention will do the job we use it, and where watching something is reasonable we say so. Healthy tooth structure does not grow back.',
  },
] as const;
