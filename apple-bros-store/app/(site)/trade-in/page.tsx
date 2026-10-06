import type { Metadata } from 'next';
import { Ban, Check } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { TradeInCalculator } from '@/components/tradein/TradeInCalculator';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { tradeInExclusions } from '@/data/tradein-models';
import { formatPrice } from '@/lib/currency';
import {
  CONDITION_RATE,
  MINIMUM_VIABLE_CENTS,
  QUOTE_VALID_DAYS,
} from '@/lib/tradein/calculator';
import { JsonLd, breadcrumbSchema, faqSchema, pageMetadata } from '@/lib/seo';
import { listTradeInModels } from '@/lib/tradein/service';

export const metadata: Metadata = pageMetadata({
  title: 'Trade in your Apple device',
  description:
    'Four questions and you get a figure with the arithmetic shown. The quote stands for two weeks and comes off the price of your next device.',
  path: '/trade-in',
});

/** The price list moves with the market, so it is read fresh rather than built in. */
export const revalidate = 600;

const faqs = [
  {
    question: 'How do you work out the figure?',
    answer:
      'We start from the most we pay for that model, which is a flawless unlocked unit at the largest storage size, then deduct for smaller storage, for condition, for a network lock and for a battery below 80% that will need replacing. Every deduction is shown to you with its reason, so the figure is never a number from nowhere.',
  },
  {
    question: 'What if the device is worse than I said?',
    answer:
      'We tell you and show you the revised figure against the same published rules. You are free to say no and we return the device at our cost. What we do not do is find reasons to move the number once we have the device in our hands.',
  },
  {
    question: 'How long does the quote last?',
    answer: `${QUOTE_VALID_DAYS} days. Trade in values follow a market that moves, so a quote that never expired would be a promise we could not keep. If yours lapses, run it again and you will get the current figure.`,
  },
  {
    question: 'Do I have to buy something?',
    answer:
      'No. You can take the value as a cash payout, or set it against a purchase, whichever suits. The figure is the same either way.',
  },
  {
    question: 'What do I need to do before bringing it in?',
    answer:
      'Back it up, sign out of your Apple Account, turn off Find My and erase all content and settings. We cannot buy a device with activation lock still on it, because it cannot be wiped or resold.',
  },
  {
    question: 'What if it is worth very little?',
    answer: `If the figure comes out below ${formatPrice(MINIMUM_VIABLE_CENTS)} we say so rather than offering you a token amount, and we will recycle the device properly at no charge. That is more useful than a drawer.`,
  },
];

export default async function TradeInPage() {
  const models = await listTradeInModels();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Trade in', path: '/trade-in' },
  ];

  return (
    <>
      <JsonLd schema={breadcrumbSchema(crumbs)} />
      <JsonLd schema={faqSchema(faqs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 max-w-3xl text-[2rem] text-ink sm:text-[2.5rem]">
            Your old one is worth something
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            Answer four questions and the figure appears as you go, with every
            deduction shown. No email address needed to see it, and no haggling
            when the device arrives.
          </p>
        </div>
      </div>

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <TradeInCalculator models={models} />
        </div>
      </div>

      {/* ---------------- How the rates work ---------------- */}
      <Section tone="paper" ariaLabelledBy="rates-heading">
        <SectionHeading
          id="rates-heading"
          eyebrow="Published rates"
          title="The arithmetic, in the open"
          lede="These are the same numbers the calculator uses. They are here so you can check our working rather than take our word for it."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Reveal>
            <h3 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              What each condition is worth
            </h3>
            <dl className="mt-4 overflow-hidden rounded-card border border-line bg-white">
              {(
                [
                  ['flawless', 'No marks at all'],
                  ['light_marks', 'Small scuffs you have to look for'],
                  ['visible_wear', 'Obvious scratches or dings'],
                  ['damaged', 'Cracked glass, a dent, or a fault'],
                ] as const
              ).map(([grade, description], index) => (
                <div
                  key={grade}
                  className={`flex items-baseline justify-between gap-6 px-5 py-4 ${index > 0 ? 'border-t border-line' : ''}`}
                >
                  <dt className="text-pretty text-[0.875rem] text-ink">
                    {description}
                  </dt>
                  <dd className="text-spec shrink-0 text-[0.875rem] font-medium text-ink">
                    {Math.round(CONDITION_RATE[grade] * 100)}%
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-grey">
              Of the top price for your model. Four options rather than ten,
              because nobody can reliably grade their own device and a quote
              that has to be revised on arrival is the worst outcome for
              everybody.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h3 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              What we cannot buy
            </h3>
            <ul className="mt-4 flex flex-col gap-4">
              {tradeInExclusions.map((exclusion) => (
                <li key={exclusion.title} className="flex items-start gap-3">
                  <Ban
                    className="mt-0.5 size-4 shrink-0 text-red"
                    aria-hidden="true"
                  />
                  <div>
                    <h4 className="text-[0.875rem] font-semibold text-ink">
                      {exclusion.title}
                    </h4>
                    <p className="mt-1 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                      {exclusion.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* ---------------- What happens next ---------------- */}
      <Section tone="white" ariaLabelledBy="process-heading">
        <SectionHeading
          id="process-heading"
          eyebrow="What happens"
          title="Four steps, no surprises"
        />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'You get a figure',
              detail:
                'From the answers above, with the deductions shown. Nothing is recorded until you ask for it to be.',
            },
            {
              title: 'Bring it in or post it',
              detail:
                'Drop it at the shop, or we send a courier at our cost once the quote is locked in.',
            },
            {
              title: 'We check it',
              detail:
                'Against the same published rules. If it matches what you told us, the figure does not move.',
            },
            {
              title: 'You get paid',
              detail:
                'As an EFT within one working day, or straight off the price of whatever you are buying.',
            },
          ].map((step, index) => (
            <Reveal as="li" key={step.title} delay={Math.min(index, 3) * 60}>
              <div className="flex h-full flex-col rounded-card border border-line bg-white p-5">
                <span className="text-spec flex size-7 items-center justify-center rounded-full bg-red-soft text-[0.75rem] font-semibold text-red-deep">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[0.9375rem] font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                  {step.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>

        <div className="mt-10 flex items-start gap-3 rounded-card border border-line bg-paper p-5">
          <Check className="mt-0.5 size-5 shrink-0 text-leaf" aria-hidden="true" />
          <p className="text-pretty text-[0.875rem] leading-relaxed text-ink">
            Every device we take in is wiped to the manufacturer standard before
            it goes anywhere near a shelf. Your data does not leave with the
            device.
          </p>
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section tone="paper" ariaLabelledBy="faq-heading">
        <SectionHeading
          id="faq-heading"
          eyebrow="Questions"
          title="The ones people ask"
        />
        <div className="mt-8 max-w-3xl">
          <FaqAccordion faqs={faqs} />
        </div>
      </Section>
    </>
  );
}
