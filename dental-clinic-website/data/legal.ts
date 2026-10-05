import type { LegalSection } from '@/components/layout/LegalPage';
import { clinic, formatAddressOneLine } from './clinic';

/**
 * Legal document content.
 *
 * Written to describe accurately what this application actually does, which is
 * the only honest basis for a privacy notice. Nothing here promises a
 * safeguard that is not implemented, and nothing guarantees an outcome.
 *
 * It is not a substitute for review by a legal practitioner before launch. The
 * README carries that instruction, deliberately rather than putting a caveat
 * on the public page.
 */

export const LAST_UPDATED = '2026-10-05';

/* ------------------------------------------------------------------ */
/* Privacy and POPIA                                                   */
/* ------------------------------------------------------------------ */

export const privacySections: readonly LegalSection[] = [
  {
    heading: 'Who is responsible for your information',
    paragraphs: [
      `${clinic.legalName}, of ${formatAddressOneLine()}, is the responsible party for the personal information described in this notice, as that term is used in the Protection of Personal Information Act 4 of 2013.`,
      `If you have a question about how your information is handled, or you want to exercise any of the rights set out below, contact the practice and ask for the information officer. Email ${clinic.email} or telephone ${clinic.telephone.display}.`,
    ],
  },
  {
    heading: 'What we collect when you book online',
    paragraphs: [
      'Booking an appointment on this website collects only what is needed to hold the appointment and to contact you about it:',
    ],
    list: [
      'Your first name and surname',
      'Your mobile number',
      'Your email address',
      'Whether you have been to the practice before',
      'Any note you choose to add about your visit',
      'The appointment type, dentist, date and time you selected',
    ],
  },
  {
    heading: 'What we deliberately do not collect online',
    paragraphs: [
      'We do not ask for your identity number, your medical aid details, or your medical history through this website. Those are taken at your appointment, in person, where they are actually needed and can be discussed properly.',
      'We do not ask for card details on this website and we do not store them. Where a deposit applies, it is settled at the practice or on a payment provider’s own secure page. Card numbers never reach this application.',
    ],
  },
  {
    heading: 'Why we process it, and on what basis',
    paragraphs: [
      'Your contact details are processed to manage your appointment: to hold the time, to identify you when you look the booking up, and to contact you if something changes. This is necessary to perform the arrangement between you and the practice, and you consent to it when you book.',
      'Clinical records created during treatment are kept because a healthcare provider is obliged to keep them. Those records are governed by professional and statutory retention requirements rather than by this website.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'Appointment and contact records are kept for as long as you remain a patient of the practice and afterwards for the period required of a healthcare provider.',
      'If you place a product order, the order record is kept for the period required for accounting and tax purposes.',
      'A basket you build on this website is stored only in your own browser and is never sent to us unless you place an order.',
    ],
  },
  {
    heading: 'Who we share it with',
    paragraphs: [
      'We do not sell your personal information, and we do not share it for anyone else’s marketing.',
      'Information is shared only where it is necessary to provide the service or where the law requires it: with the clinicians and staff treating you, with a payment provider if you choose to pay a deposit online, with a laboratory where your treatment involves one, and with a professional body or authority where we are obliged to disclose.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: ['Under POPIA you may:'],
    list: [
      'Ask what personal information we hold about you, and ask for a copy',
      'Ask us to correct or complete information that is wrong or out of date',
      'Ask us to delete information we no longer have a lawful reason to keep',
      'Object to processing in the circumstances the Act allows',
      'Withdraw consent to being contacted for anything beyond your care',
      'Complain to the Information Regulator of South Africa',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'Access to patient records is limited to staff who need it to do their work, and the staff area of this website requires a password.',
      'No system is immune from compromise, so we do not claim this one is. What we can say specifically is that this website holds no card data, no identity numbers and no medical history, which limits what a breach could expose.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Where an appointment is booked for a patient under 18, it should be booked by a parent or guardian, who is responsible for the consent recorded at booking.',
    ],
  },
  {
    heading: 'Changes to this notice',
    paragraphs: [
      'If this notice changes, the revised version appears here with a new date at the top. Where a change materially affects how your information is used, we will tell you rather than relying on you noticing.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Terms of use                                                        */
/* ------------------------------------------------------------------ */

export const termsSections: readonly LegalSection[] = [
  {
    heading: 'About these terms',
    paragraphs: [
      `These terms apply to your use of this website, operated by ${clinic.legalName}. Using the site means accepting them.`,
    ],
  },
  {
    heading: 'The information on this site is not dental advice',
    paragraphs: [
      'The treatment pages explain in general terms what a treatment involves and who it may suit. They are written to inform rather than to diagnose, and they cannot tell you what your own teeth need.',
      'Whether a treatment is appropriate for you depends on an examination. Please do not delay seeking care, or decide against care, on the basis of what you read here.',
    ],
  },
  {
    heading: 'Fees shown on this site',
    paragraphs: [
      'Consultation and hygiene fees shown on this site are current at the date above and are the fees for those appointments.',
      'Fees shown as a starting figure are exactly that. The fee for treatment that depends on what we find is confirmed in a written plan after an examination, and that written figure is the one that applies.',
    ],
  },
  {
    heading: 'Online booking',
    paragraphs: [
      'Availability shown on this site is read from the practice diary at the moment you look at it. Occasionally a time is taken between being displayed and your confirming it, in which case you will be told immediately and offered alternatives.',
      'A booking is made when you receive a booking reference. Where a deposit is required, the appointment is held but is confirmed once the deposit reaches us.',
      'Please give at least the notice set out in the cancellation policy if you cannot attend, so the time can be offered to someone else.',
    ],
  },
  {
    heading: 'Product orders',
    paragraphs: [
      'Products ordered through this site are reserved for collection at the practice and paid for when you collect. Nothing is charged online.',
      'Where a product requires professional assessment first, such as a whitening kit, it is dispensed after the relevant consultation.',
    ],
  },
  {
    heading: 'Availability of the site',
    paragraphs: [
      'We aim to keep this site available but do not guarantee uninterrupted access. If online booking is unavailable, please telephone the practice.',
    ],
  },
  {
    heading: 'Our content',
    paragraphs: [
      'The text, photographs, logo and design on this site belong to the practice or are used with permission. Please do not reproduce them without asking.',
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the law of the Republic of South Africa.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Cookies                                                             */
/* ------------------------------------------------------------------ */

export const cookieSections: readonly LegalSection[] = [
  {
    heading: 'The short version',
    paragraphs: [
      'This site sets no advertising cookies and no third-party tracking cookies. There is no consent banner because, as the site currently stands, there is nothing to consent to.',
    ],
  },
  {
    heading: 'What is stored in your browser',
    paragraphs: [
      'Two things are stored locally, and neither is sent to any third party:',
    ],
    list: [
      'Your shopping basket, kept in your browser’s local storage so it survives a page reload. It is only sent to us if you place an order.',
      'A staff session cookie, set only if someone signs in to the staff diary. It is strictly necessary for that area to work, and it is not set for ordinary visitors.',
    ],
  },
  {
    heading: 'Analytics',
    paragraphs: [
      'The site includes the ability to connect an analytics platform, which is not currently connected. No analytics identifiers are set and no behavioural data leaves your browser.',
      'If analytics is connected in future, this page will be updated to say which platform, what it collects, and how to opt out, and a consent mechanism will be added if one is required.',
    ],
  },
  {
    heading: 'Embedded content',
    paragraphs: [
      'The location panel on this site is drawn by us rather than embedded from a mapping provider, so opening a page does not load a third-party map or let anyone else set a cookie through it. The links to Google Maps and Apple Maps are ordinary links: nothing happens until you choose to follow one, and then that provider’s own terms apply.',
    ],
  },
  {
    heading: 'Controlling local storage',
    paragraphs: [
      'You can clear local storage and cookies for this site at any time through your browser settings. Clearing it will empty your basket. It does not affect any appointment you have booked, which is held in the practice diary rather than in your browser.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Patient information                                                 */
/* ------------------------------------------------------------------ */

export const patientInformationSections: readonly LegalSection[] = [
  {
    heading: 'Your first appointment',
    paragraphs: [
      'A new patient consultation runs for 45 minutes. We take a medical and dental history, examine your teeth, gums, bite and soft tissues, and take a baseline set of images where they add something.',
      'Most of that time is spent looking carefully and explaining. If treatment is needed, you leave with a written plan rather than having something started on the day.',
      'Please bring a list of any medication you take, including anything over the counter, and details of any records from a previous practice if you have them.',
    ],
  },
  {
    heading: 'Consent to treatment',
    paragraphs: [
      'Nothing is treated without your agreement. For anything beyond a routine examination or cleaning you will be told what is proposed, what the alternatives are including doing nothing for now, what the risks are, and what it costs, before you decide.',
      'You can change your mind, including part way through a course of treatment. Tell us and we will stop and talk it through.',
    ],
  },
  {
    heading: 'Your records',
    paragraphs: [
      'We keep a clinical record of your treatment, which you are entitled to see. Ask reception and we will arrange it.',
      'If you move to another practice, we can send a copy of your records and images to your new dentist on your written request.',
    ],
  },
  {
    heading: 'Fees and payment',
    paragraphs: [
      'This is a private practice and fees are settled directly with us. We provide a detailed invoice with the relevant codes so you can submit a claim to your medical aid scheme.',
      'What your scheme pays back depends on your plan and your available dental benefit. It is worth checking with them before larger treatment, and we are happy to provide a quote with codes for that purpose.',
    ],
  },
  {
    heading: 'If something goes wrong',
    paragraphs: [
      'If you are unhappy with any aspect of your care, tell us. Ask to speak to the principal dentist, or put it in writing to the practice. We would far rather hear about it and put it right than have you leave dissatisfied.',
      'You are also entitled to raise a concern with the Health Professions Council of South Africa, which regulates dental practitioners.',
    ],
  },
  {
    heading: 'Urgent problems',
    paragraphs: [
      `Appointments are held back each morning for urgent problems. Telephone ${clinic.telephone.display} during opening hours and reception will establish how soon you need to be seen.`,
      clinic.emergency.hospitalGuidance,
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Cancellation policy                                                 */
/* ------------------------------------------------------------------ */

export const cancellationSections: readonly LegalSection[] = [
  {
    heading: 'Notice we ask for',
    paragraphs: [
      `We ask for at least ${clinic.cancellationNoticeHours} hours notice if you cannot attend. That is usually enough for the time to be offered to someone else, which matters most for urgent appointments where somebody is waiting.`,
      `You can cancel or move an appointment yourself online up to ${clinic.cancellationNoticeHours} hours beforehand, using your booking reference together with the email address or mobile number you booked with. Inside that window, please telephone the practice.`,
    ],
  },
  {
    heading: 'Deposits',
    paragraphs: [
      'Where you have paid a deposit and cancel with the notice above, the deposit is refunded or carried over to a rearranged appointment, whichever you prefer.',
      'Where an appointment is missed without notice, or cancelled at very short notice, the deposit may be retained to cover the time that could not be reallocated. Reception will tell you if that applies rather than it happening silently.',
    ],
  },
  {
    heading: 'Appointments without a deposit',
    paragraphs: [
      'Most appointments require no deposit, and we do not invoice for a missed one. We do keep a record, and for a pattern of missed appointments we may ask for a deposit on future bookings.',
    ],
  },
  {
    heading: 'If we have to change your appointment',
    paragraphs: [
      'Occasionally we have to move an appointment, usually because a clinician is unwell or an earlier emergency has overrun. We will contact you as soon as we know and offer you the earliest suitable alternative.',
      'If we cancel at short notice and you had paid a deposit, it is refunded in full or carried over, as you prefer.',
    ],
  },
  {
    heading: 'Running late',
    paragraphs: [
      'If you are running late, telephone us. We can often still see you, or shorten the appointment to deal with the most pressing thing. If you arrive too late for the work booked, we may need to rearrange, because overrunning affects every patient after you.',
    ],
  },
];
