import { store } from './store';

/**
 * Help content.
 *
 * Three pages, each one answering a question somebody actually has before or
 * after buying. Deliberately not a knowledge base of twenty thin articles: a
 * shop this size has three things people need to know, and burying them among
 * filler makes them harder to find rather than easier.
 *
 * Everything here that is a number or a promise is read from data/store.ts, so
 * the copy and the behaviour of the site cannot drift apart.
 */

export interface HelpSection {
  readonly heading: string;
  readonly body: readonly string[];
  readonly bullets?: readonly string[];
}

export interface HelpTopic {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly metaDescription: string;
  readonly sections: readonly HelpSection[];
}

export const helpTopics: readonly HelpTopic[] = [
  {
    slug: 'delivery',
    title: 'Delivery and collection',
    summary: 'What it costs, how long it takes and how to collect in person.',
    metaDescription: `Courier delivery across South Africa in ${store.deliveryDays.min} to ${store.deliveryDays.max} working days, free over R1 500, or collect free from our shop in ${store.address.suburb}.`,
    sections: [
      {
        heading: 'Courier delivery',
        body: [
          `We courier anywhere in South Africa. Orders placed before midday on a working day go out the same day, and most arrive in ${store.deliveryDays.min} to ${store.deliveryDays.max} working days. Outlying areas can take a day or two longer, and the courier will tell you if yours is one of them.`,
          'Delivery is free on orders over R1 500. Below that it is a flat R125, whatever you buy and wherever you are, because a sliding scale by weight and region is a calculation nobody wants to do before they know what they are paying.',
        ],
        bullets: [
          'Somebody over 18 must sign for it, and the courier will ask for identification',
          'We cannot deliver to a post box',
          'Your tracking number is emailed the moment the parcel is collected',
        ],
      },
      {
        heading: 'Collecting from the shop',
        body: [
          `Collection is free and usually ready within a couple of hours during trading hours. We are at ${store.address.line1}, ${store.address.line2}, ${store.address.suburb}. ${store.parking}`,
          'Bring your order reference and the identification document matching the name on the order. We check it because an order collected by the wrong person is a loss we cannot undo.',
        ],
      },
      {
        heading: 'Paying on collection',
        body: [
          'If you chose to pay on collection, you can pay by card or in cash at the counter. We hold collection orders for seven days, then release the stock and refund anything already paid.',
        ],
      },
      {
        heading: 'Checking it before you leave',
        body: [
          'We would rather you opened the box at the counter than in the car park. Test it in front of us, look at it in daylight through the window, ask about anything that is not what you expected. That is a two minute conversation now instead of a return later.',
        ],
      },
    ],
  },
  {
    slug: 'warranty',
    title: 'Warranty and repairs',
    summary: 'What the cover includes, what it does not, and how to claim.',
    metaDescription: `Every used device carries a ${store.usedWarrantyMonths} month warranty from us. What it covers, what it does not, and how to make a claim.`,
    sections: [
      {
        heading: `${store.usedWarrantyMonths} months, from us`,
        body: [
          `Every used device we sell carries a ${store.usedWarrantyMonths} month warranty from The Apple Bros, starting the day you receive it. It is our warranty rather than the manufacturer's, which means you deal with the shop that tested the device instead of a support queue.`,
          'Sealed stock carries the manufacturer warranty instead, because that is what comes in the box. Which one applies is stated on every product page before you buy.',
        ],
      },
      {
        heading: 'What it covers',
        body: [
          'Anything that stops working the way it should, through no fault of yours.',
        ],
        bullets: [
          'Screen, cameras, speakers, microphones and sensors',
          'Charging, battery failure, and buttons',
          'Wi-Fi, Bluetooth and cellular radios',
          'Face ID or Touch ID',
          'Any fault we should have caught in testing',
        ],
      },
      {
        heading: 'What it does not cover',
        body: [
          'Three things, stated plainly rather than buried in a clause.',
        ],
        bullets: [
          'Accidental damage: drops, cracks, crushed screens and bent frames',
          'Liquid damage, which the device records internally and we can see',
          'Ordinary battery decline, which is normal use rather than a fault. A battery that falls below its stated minimum within the warranty period is a fault and is covered',
        ],
      },
      {
        heading: 'Making a claim',
        body: [
          `Phone us on ${store.telephone.display} or email ${store.email} with your order reference and a description of what is happening. We will usually ask you to bring it in or send it to us at our cost.`,
          'We repair it, replace it with the same grade or better, or refund you, in that order of preference. Which one it is depends on what is wrong and what we have, and we will tell you which before we do anything.',
        ],
      },
      {
        heading: 'How long a claim takes',
        body: [
          'Most repairs are done within five working days. If a part has to come in it can be longer, and we will tell you how long rather than leaving you to ask. If we cannot fix it within fourteen days we will replace or refund instead.',
        ],
      },
    ],
  },
  {
    slug: 'returns',
    title: 'Returns and refunds',
    summary: `Our ${store.returnWindowDays} day window, and your rights under the Consumer Protection Act.`,
    metaDescription: `Change your mind within ${store.returnWindowDays} days and send it back. How returns work, what condition the device needs to be in, and how refunds are paid.`,
    sections: [
      {
        heading: `${store.returnWindowDays} days to change your mind`,
        body: [
          `If you buy something and decide it is not for you, send it back within ${store.returnWindowDays} days of receiving it and we will refund you in full.`,
          'South African law gives you seven days to cancel something bought at a distance. We offer fourteen because it is simpler to explain than a right that changes depending on how you bought, and because a week is not long enough to know whether a phone suits you.',
        ],
      },
      {
        heading: 'What condition it needs to be in',
        body: [
          'The same condition you received it in, with everything that came with it. We do not expect the packaging to be pristine. We do expect the device to be in the grade it was sold as.',
          'If it comes back in worse condition than it left, we will tell you what we found, show you, and agree a reduced refund with you rather than deciding it ourselves.',
        ],
        bullets: [
          'Sign out of your Apple Account and turn off Find My before sending it',
          'Include the cable and anything else that came in the box',
          'A sealed device that has been opened is no longer sealed stock, and is refunded at the price of the equivalent open grade',
        ],
      },
      {
        heading: 'Who pays the return postage',
        body: [
          'We do, if the device is faulty or is not what was described. You do, if you simply changed your mind, and we will arrange the courier at our rate so it costs less than booking it yourself.',
        ],
      },
      {
        heading: 'How the refund is paid',
        body: [
          'Back to where it came from, within three working days of the device reaching us and passing its check. An EFT goes back to the account it was paid from. Cash paid at the counter is refunded by EFT to an account in your name.',
          'We do not offer credit notes instead of refunds. If you are owed money, you get money.',
        ],
      },
      {
        heading: 'If something is wrong on arrival',
        body: [
          `Phone us on the day if you can. A fault found on arrival is not a return, it is a warranty claim, and we will treat it as the more urgent thing it is. Our number is ${store.telephone.display}.`,
        ],
      },
    ],
  },
];

export function helpTopicBySlug(slug: string): HelpTopic | null {
  return helpTopics.find((topic) => topic.slug === slug) ?? null;
}
