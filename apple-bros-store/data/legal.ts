import { store } from './store';

/**
 * Legal copy.
 *
 * Written to be read rather than to be impenetrable. Two documents, because a
 * shop of this size genuinely has two: what you agree to when you buy, and what
 * we do with your information.
 *
 * These are a starting point drafted against the Consumer Protection Act and
 * POPIA. They are not legal advice, and the shop should have them reviewed
 * before launch. That note is in the README rather than on the page, because a
 * disclaimer about the disclaimer helps nobody.
 */

export interface LegalSection {
  readonly heading: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
}

export interface LegalDocument {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly updated: string;
  readonly sections: readonly LegalSection[];
}

export const legalDocuments: readonly LegalDocument[] = [
  {
    slug: 'terms',
    title: 'Terms of sale',
    summary: 'What you agree to when you buy something from us.',
    updated: '2026-10-06',
    sections: [
      {
        heading: 'Who you are buying from',
        body: [
          `${store.legalName}, trading as ${store.name}, of ${store.address.line1}, ${store.address.line2}, ${store.address.suburb}, ${store.address.city}.`,
          store.independenceNotice,
        ],
      },
      {
        heading: 'Prices',
        body: [
          'All prices on this site are in South African Rand and include VAT at 15%. The price you see is the price you pay, and delivery is shown separately before you confirm.',
          'We correct pricing errors when we find them. If something was listed at an obviously wrong price and you have ordered it, we will contact you and either honour it or cancel and refund you in full. We will not quietly ship a different item or charge you a different amount.',
        ],
      },
      {
        heading: 'Stock',
        body: [
          'Most of what we sell is a single unit rather than a line of identical ones. Stock is committed to your order the moment it is placed, which is why an item can disappear from the site while you are looking at it.',
          'If we cannot fulfil something you have ordered and paid for, we refund that line in full within three working days and tell you why.',
        ],
      },
      {
        heading: 'Condition and grading',
        body: [
          'Every used device is sold under a published grade with a guaranteed minimum battery health. Those definitions form part of this agreement, and you can read them on the grading page.',
          'A device that arrives below its stated grade is not what you ordered. Tell us and we will put it right under the returns terms below, at our cost.',
        ],
      },
      {
        heading: 'Warranty',
        body: [
          `Used devices carry a ${store.usedWarrantyMonths} month warranty from us, covering functional faults that are not accidental damage, liquid damage or ordinary battery decline. Sealed stock carries the manufacturer warranty instead.`,
          'The warranty is in addition to your rights under the Consumer Protection Act, not instead of them. Nothing in these terms takes away a right the law gives you.',
        ],
      },
      {
        heading: 'Returns',
        body: [
          `You may return an unwanted item within ${store.returnWindowDays} days of receiving it for a full refund, provided it is in the condition you received it in and complete. We pay the return postage where the item is faulty or not as described; you pay it where you have simply changed your mind.`,
          'Section 44 of the Electronic Communications and Transactions Act gives you seven days to cancel a purchase made at a distance. Our window is longer and does not replace that right.',
        ],
      },
      {
        heading: 'Payment',
        body: [
          'Your order is placed and your stock held when you confirm it. Payment follows by bank transfer against your reference, or at the counter when you collect.',
          'We hold an unpaid order for seven days. After that the stock is released back to the shelf and anything already paid is refunded.',
        ],
      },
      {
        heading: 'Delivery',
        body: [
          `We courier anywhere in South Africa, usually within ${store.deliveryDays.min} to ${store.deliveryDays.max} working days. Risk passes to you when the parcel is handed over and signed for.`,
          'If a parcel goes missing in transit, that is ours to resolve with the courier, not yours. Tell us and we will replace or refund.',
        ],
      },
      {
        heading: 'Trade in',
        body: [
          'A trade in quote is based on what you tell us about the device and stands for fourteen days. We confirm it against the same published rules when the device reaches us.',
          'If the device is materially different from how it was described, we will tell you the revised figure and show you why. You are free to decline, and we return the device at our cost.',
          'We cannot buy a device that is still signed in to an Apple Account, or one that comes back flagged on the stolen property register.',
        ],
      },
      {
        heading: 'Limits',
        body: [
          'We are responsible for the device we sold you and for getting it to you. We are not responsible for data you did not back up, or for consequential losses such as lost earnings. Back up before you send a device to anyone, including us.',
        ],
      },
      {
        heading: 'Disputes',
        body: [
          `If something goes wrong, phone us first on ${store.telephone.display}. Almost everything is solved that way. If it is not, you may refer the matter to the National Consumer Commission or to the Consumer Goods and Services Ombud at no cost to you.`,
          'These terms are governed by the law of the Republic of South Africa.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy notice',
    summary: 'What we collect, why, how long we keep it and what you can ask us to do.',
    updated: '2026-10-06',
    sections: [
      {
        heading: 'The short version',
        body: [
          'We collect the least we can get away with, use it only to sell you a device and support it afterwards, and never sell it to anybody. There are no customer accounts on this site, so there is no password of yours for us to lose.',
        ],
      },
      {
        heading: 'Who is responsible',
        body: [
          `${store.legalName} is the responsible party under the Protection of Personal Information Act. You can reach us at ${store.email} or on ${store.telephone.display} about anything on this page.`,
        ],
      },
      {
        heading: 'What we collect, and why',
        body: ['Each of these exists because something cannot happen without it.'],
        bullets: [
          'Name, email and mobile number when you order: to fulfil the order, to send your confirmation and reference, and so the courier can reach you',
          'Delivery address when you choose delivery: to deliver',
          'Name, email and mobile number on a trade in quote: to honour the quote and arrange collection of the device',
          'Your message when you use the contact form: to answer it. Contact form messages are not stored in a database',
          'Device and browser information in our server logs: to keep the site working and to spot abuse',
        ],
      },
      {
        heading: 'What we do not collect',
        body: [
          'We do not take card details on this site, at all. Payment is by bank transfer or at the counter, so there is no card number for us to hold and nothing of that kind to be breached here.',
          'We do not build a profile of you across other websites, and we do not load advertising trackers.',
        ],
      },
      {
        heading: 'Your basket',
        body: [
          'Your basket is stored in your own browser rather than on our servers. We cannot see it, it stays on that device, and clearing your browser data removes it.',
        ],
      },
      {
        heading: 'Marketing',
        body: [
          'We only email you about stock if you tick the box asking us to, and that box is never ticked for you. Every such email has a one-click unsubscribe, and unsubscribing has no effect on messages about an order you have placed.',
        ],
      },
      {
        heading: 'Who else sees it',
        body: [
          'The courier, so they can deliver to you. Our hosting provider, because the site runs on their servers. Nobody else, and we do not sell personal information to anybody for any purpose.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          `Order records for five years, because tax law requires it. Trade in quotes for twelve months. Server logs for thirty days. After a warranty ends, you can ask us to delete the rest of what we hold about you and we will, keeping only what the law obliges us to.`,
        ],
      },
      {
        heading: 'What you can ask us to do',
        body: ['POPIA gives you these rights, and we will act on any of them within thirty days.'],
        bullets: [
          'Ask what we hold about you, and get a copy',
          'Ask us to correct anything that is wrong',
          'Ask us to delete what we hold, subject to records we must legally keep',
          'Object to us using your information for marketing, at any time',
          'Complain to the Information Regulator of South Africa if you are not satisfied with how we have handled it',
        ],
      },
      {
        heading: 'Security',
        body: [
          'The site runs over HTTPS. Order records are held in an access-controlled database. Staff access to the shop system is password protected and limited to people who need it.',
          'If a breach ever affected your information, we would tell you and the Information Regulator, as POPIA requires, rather than hoping nobody noticed.',
        ],
      },
    ],
  },
];

export function legalDocumentBySlug(slug: string): LegalDocument | null {
  return legalDocuments.find((doc) => doc.slug === slug) ?? null;
}
