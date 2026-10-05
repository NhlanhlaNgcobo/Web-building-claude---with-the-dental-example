import type { Faq } from '@/types';

/** General questions, used on the homepage and the contact page. */
export const generalFaqs: readonly Faq[] = [
  {
    question: 'Are you taking new patients?',
    answer:
      'Yes. Book a new patient consultation and you will get a longer first appointment that covers a full examination, a baseline set of images and a written treatment plan if anything needs doing.',
  },
  {
    question: 'How quickly can I be seen?',
    answer:
      'The booking page shows genuine availability from the practice diary, so what you see there is what is actually free. Appointments are held back each morning for urgent problems, which means someone in pain can usually be seen the same day.',
  },
  {
    question: 'Do you work with medical aid?',
    answer:
      'We are a private practice and fees are settled directly with us. We provide a detailed invoice with the relevant codes so you can submit a claim to your scheme. What your scheme pays back depends on your plan and your available dental benefit, so it is worth checking with them before larger treatment.',
  },
  {
    question: 'Will I know what treatment costs before it happens?',
    answer:
      'Yes. Beyond a straightforward examination or cleaning, you get a written plan setting out what is recommended, the sequence and the cost of each item. Nothing is booked until you have had a chance to read it.',
  },
  {
    question: 'Do I need to pay a deposit to book?',
    answer:
      'Most appointments need no deposit. Whitening consultations and emergency appointments do, because they hold back time that is in short supply. Where a deposit applies it is shown clearly before you confirm, and it comes off the cost of your appointment.',
  },
  {
    question: 'What if I am nervous about dental treatment?',
    answer:
      'Say so when you book and we will allow more time. A fair number of our patients have avoided the dentist for years. The first appointment is an assessment and a conversation, and nothing is treated on the day unless you want it to be.',
  },
  {
    question: 'Can I cancel or move my appointment?',
    answer:
      'Yes. Use the booking reference in your confirmation to view, move or cancel it online. We ask for at least twenty four hours notice so the time can be offered to someone else.',
  },
  {
    question: 'Where do I park?',
    answer:
      'There is secure on-site parking behind the building, reached through the service lane beside it. There is a guard on duty during opening hours. Street parking on Florida Road is metered on weekdays.',
  },
];

/** Shown on the pricing page, where the questions are about fees. */
export const pricingFaqs: readonly Faq[] = [
  {
    question: 'Why are prices shown as a starting figure?',
    answer:
      'Because the honest answer for most treatment is that it depends. A filling involving one surface of a tooth is not the same job as one involving three. A molar root canal has three or four canals where a front tooth has one. Quoting a single fixed price for work that varies this much would be misleading, so we show the starting fee and then give you an exact figure in writing once we have examined the tooth.',
  },
  {
    question: 'What is fixed and what is not?',
    answer:
      'Examinations, cleanings and consultations have set fees, and those are the figures on this page. Treatment that depends on what we find follows an examination and comes to you as a written plan with exact costs before anything is booked.',
  },
  {
    question: 'Are radiographs included?',
    answer:
      'They are charged separately because they are not needed at every appointment. Where an image will change what we do, we explain why and tell you the cost before taking it.',
  },
  {
    question: 'How do I pay?',
    answer:
      'Card or electronic transfer at the practice. For appointments that require a deposit you can pay it when you book, or arrange it with reception. We do not store card details.',
  },
  {
    question: 'Do you offer payment plans?',
    answer:
      'For larger treatment such as implants, veneers or multiple crowns, speak to reception when your plan is drawn up and we will tell you what arrangements are currently possible. We would rather have that conversation properly than advertise terms that may not apply to your situation.',
  },
];

/** Shown on the emergency page. */
export const emergencyFaqs: readonly Faq[] = [
  {
    question: 'What counts as a dental emergency?',
    answer:
      'Pain that is keeping you awake or not responding to pain relief, swelling around a tooth or in the face, a broken or knocked-out tooth, a crown or filling that has come out, or pain following recent treatment. If you are unsure, phone us and we will tell you how soon you need to be seen.',
  },
  {
    question: 'When should I go to hospital instead?',
    answer:
      'Go to your nearest hospital emergency department, or call 10177 for an ambulance, if you have a suspected fracture to the jaw or face, bleeding you cannot control, difficulty breathing or swallowing, or swelling that is closing your eye or your throat. We are a dental practice and not an emergency department.',
  },
  {
    question: 'Will my problem be fixed in one visit?',
    answer:
      'The aim of an emergency appointment is to find the cause and get you comfortable, which often means settling an infection or placing a temporary repair. The permanent repair is usually planned properly at a later appointment rather than rushed on the day.',
  },
  {
    question: 'What can I do before my appointment?',
    answer:
      'Over-the-counter pain relief taken as directed on the packet usually helps. A cold compress held against the cheek can ease swelling. Avoid very hot or very cold food and drink, and do not place aspirin directly on the gum.',
  },
  {
    question: 'A tooth has been knocked out. What should I do?',
    answer:
      'Phone us immediately, because time genuinely affects whether it can be saved. Hold the tooth by the crown rather than the root, do not scrub it clean, and keep it moist in milk or held inside your cheek on the way to us.',
  },
];
