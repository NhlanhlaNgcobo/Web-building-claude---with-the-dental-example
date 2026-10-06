'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BatteryLow,
  Check,
  Recycle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CheckboxField, TextField } from '@/components/ui/TextField';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/currency';
import {
  TRADE_IN_CONDITION_LABELS,
  TradeInCondition,
} from '@/lib/domain/enums';
import { calculateTradeIn } from '@/lib/tradein/calculator';
import { track } from '@/lib/analytics';
import { store } from '@/data/store';
import type { TradeInCondition as Grade, TradeInModelDto } from '@/types';

/**
 * The trade in calculator.
 *
 * It computes the figure in the browser as the customer answers, using the same
 * pure function the server uses. That is what makes it feel immediate: there is
 * no request per question and no spinner between an answer and a number.
 *
 * The server recalculates from the same rules when the quote is submitted, so
 * the client-side figure is a preview with no authority. If the two ever
 * disagreed, the submitted quote would be the one that counts, and they cannot
 * disagree because there is only one implementation of the arithmetic.
 *
 * Every deduction is shown with its reason. A trade in that produces one number
 * from nowhere is the thing people distrust, and rightly.
 */

const CONDITION_HELP: Record<Grade, string> = {
  flawless: 'No marks at all. Looks like it did in the box.',
  light_marks: 'Small scuffs you have to look for. Screen is clean.',
  visible_wear: 'Obvious scratches or dings. Everything still works.',
  damaged: 'Cracked glass, a dented body, or a fault.',
};

export function TradeInCalculator({
  models,
}: {
  readonly models: readonly TradeInModelDto[];
}) {
  const [modelSlug, setModelSlug] = useState('');
  const [storageGb, setStorageGb] = useState<number | null>(null);
  const [condition, setCondition] = useState<Grade | null>(null);
  const [powersOn, setPowersOn] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [batteryKnown, setBatteryKnown] = useState(false);
  const [batteryHealth, setBatteryHealth] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    reference: string;
    valueCents: number;
    expiresAt: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const model = models.find((m) => m.slug === modelSlug) ?? null;

  // Grouped for the select, so somebody looking for a MacBook is not scrolling
  // past thirty iPhones.
  const grouped = useMemo(() => {
    const map = new Map<string, TradeInModelDto[]>();
    for (const m of models) {
      const key = m.family;
      (map.get(key) ?? map.set(key, []).get(key)!).push(m);
    }
    return [...map.entries()];
  }, [models]);

  const batteryValue =
    batteryKnown && /^\d{1,3}$/.test(batteryHealth.trim())
      ? Math.min(100, Number(batteryHealth.trim()))
      : null;

  /**
   * The quote is derived at render from the answers. There is no state holding
   * it, so it cannot be stale and there is nothing to keep in step.
   */
  const quote =
    model && condition
      ? calculateTradeIn(
          {
            baseValueCents: model.baseValueCents,
            storageOptions: model.storageOptions,
          },
          {
            storageGb:
              model.storageOptions.length > 0 ? storageGb : null,
            condition,
            isUnlocked,
            powersOn,
            batteryHealth: batteryValue,
          },
        )
      : null;

  const needsStorage = model !== null && model.storageOptions.length > 0;
  const ready =
    model !== null && condition !== null && (!needsStorage || storageGb !== null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || !model || !condition || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/trade-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelSlug: model.slug,
          storageGb: needsStorage ? storageGb : null,
          condition,
          powersOn,
          isUnlocked,
          batteryHealth: batteryValue,
          customerName: String(form.get('customerName') ?? ''),
          customerEmail: String(form.get('customerEmail') ?? ''),
          customerMobile: String(form.get('customerMobile') ?? ''),
        }),
      });

      const body: unknown = await response.json();

      if (response.ok) {
        const data = body as {
          accepted: boolean;
          reference: string | null;
          valueCents?: number;
          expiresAt?: string;
          declineReason?: string | null;
        };
        if (data.accepted && data.reference) {
          setSubmitted({
            reference: data.reference,
            valueCents: data.valueCents ?? 0,
            expiresAt: data.expiresAt ?? '',
          });
          track({
            name: 'trade_in_quoted',
            modelSlug: model.slug,
            valueCents: data.valueCents ?? 0,
            accepted: true,
          });
        } else {
          setSubmitError(
            data.declineReason ??
              'We cannot buy this one, but we will recycle it for you at no charge.',
          );
          track({
            name: 'trade_in_declined',
            modelSlug: model.slug,
            reason: data.declineReason ?? 'below_threshold',
          });
        }
        return;
      }

      const failure = body as {
        error?: { message?: string; fieldErrors?: Record<string, string[]> };
      };
      setFieldErrors(failure.error?.fieldErrors ?? {});
      setSubmitError(
        failure.error?.message ??
          'We could not record that quote. Please check your details and try again.',
      );
    } catch {
      setSubmitError(
        'We could not reach the shop just then. Your figure above is still right; try sending it again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <QuoteRecorded quote={submitted} />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-10 lg:grid-cols-[1fr_21rem] lg:gap-12">
      <div className="flex flex-col gap-9">
        {/* ---------------- 1. Which device ---------------- */}
        <Step number={1} title="What are you trading in?">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="model"
              className="text-[0.8125rem] font-medium text-ink"
            >
              Model
            </label>
            <select
              id="model"
              value={modelSlug}
              onChange={(event) => {
                setModelSlug(event.target.value);
                setStorageGb(null);
                track({ name: 'trade_in_started', source: 'calculator' });
              }}
              className="h-12 w-full rounded-panel border border-line-strong bg-white px-3 text-[0.9375rem] text-ink transition-[border-color] duration-[--duration-feedback] focus:border-ink focus:outline-none"
            >
              <option value="">Choose your device</option>
              {grouped.map(([family, items]) => (
                <optgroup key={family} label={familyLabel(family)}>
                  {items.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-grey-strong">
              Not listed? Send us a message and we will look at it.
            </p>
          </div>

          {needsStorage && (
            <fieldset className="mt-5">
              <legend className="mb-3 text-[0.8125rem] font-medium text-ink">
                Storage
              </legend>
              <div className="flex flex-wrap gap-2">
                {model.storageOptions.map((gb) => (
                  <Chip
                    key={gb}
                    selected={storageGb === gb}
                    onSelect={() => setStorageGb(gb)}
                    label={gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`}
                  />
                ))}
              </div>
            </fieldset>
          )}
        </Step>

        {/* ---------------- 2. Condition ---------------- */}
        <Step number={2} title="What condition is it in?" disabled={!model}>
          <fieldset>
            <legend className="sr-only">Condition</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TradeInCondition.values.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={condition === value}
                  onClick={() => setCondition(value)}
                  className={cn(
                    'rounded-card border p-4 text-left',
                    'transition-[border-color,background-color] duration-[--duration-feedback] ease-out',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
                    condition === value
                      ? 'border-ink bg-white'
                      : 'border-line bg-white hover:border-line-strong',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[0.9375rem] font-semibold text-ink">
                      {TRADE_IN_CONDITION_LABELS[value]}
                    </span>
                    {condition === value && (
                      <Check className="size-4 shrink-0 text-red" aria-hidden="true" />
                    )}
                  </span>
                  <span className="mt-1 block text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                    {CONDITION_HELP[value]}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        </Step>

        {/* ---------------- 3. The two that change the figure most ---------------- */}
        <Step number={3} title="Two more things" disabled={!model}>
          <div className="flex flex-col gap-4">
            <CheckboxField
              name="powersOn"
              checked={powersOn}
              onChange={setPowersOn}
              label="It switches on and the screen works."
            />
            <CheckboxField
              name="isUnlocked"
              checked={isUnlocked}
              onChange={setIsUnlocked}
              label="It is not locked to a network."
            />
            <CheckboxField
              name="batteryKnown"
              checked={batteryKnown}
              onChange={setBatteryKnown}
              label="I know the battery health percentage."
            />
            {batteryKnown && (
              <TextField
                name="batteryHealth"
                label="Battery health"
                inputMode="tel"
                maxLength={3}
                placeholder="86"
                value={batteryHealth}
                onChange={(event) => setBatteryHealth(event.target.value)}
                description="On an iPhone: Settings, Battery, Battery Health and Charging."
                className="max-w-48"
              />
            )}
          </div>
        </Step>

        {/* ---------------- 4. Contact ---------------- */}
        <Step number={4} title="Where do we send the quote?" disabled={!ready}>
          <p className="mb-5 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
            We only ask for these once you want the quote recorded. The figure
            above is yours to look at without giving us anything.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="customerName"
              label="Full name"
              required
              autoComplete="name"
              error={fieldErrors.customerName?.[0]}
              className="sm:col-span-2"
            />
            <TextField
              name="customerEmail"
              label="Email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              error={fieldErrors.customerEmail?.[0]}
            />
            <TextField
              name="customerMobile"
              label="Mobile number"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="082 123 4567"
              error={fieldErrors.customerMobile?.[0]}
            />
          </div>
        </Step>
      </div>

      {/* ---------------- The figure ---------------- */}
      <aside
        aria-labelledby="quote-heading"
        className="rounded-card border border-line bg-paper p-5 lg:sticky lg:top-24"
      >
        <h2 id="quote-heading" className="text-[1rem] font-bold text-ink">
          Your figure
        </h2>

        {!quote ? (
          <p className="mt-4 text-pretty text-[0.875rem] leading-relaxed text-grey-strong">
            Pick your device and its condition and the figure appears here, with
            every deduction shown.
          </p>
        ) : !quote.isAccepted ? (
          <div className="mt-4">
            <div className="flex items-start gap-2.5 rounded-panel bg-white p-3.5">
              <Recycle className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden="true" />
              <p className="text-pretty text-[0.8125rem] leading-relaxed text-ink">
                {quote.declineReason}
              </p>
            </div>
            <p className="mt-3 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
              Bring it in anyway and we will recycle it properly at no charge.
              That is better than it sitting in a drawer, and better than us
              offering you fifty Rand to feel generous.
            </p>
          </div>
        ) : (
          <>
            <p
              aria-live="polite"
              className="mt-3 text-[2rem] font-bold tabular-nums leading-none text-ink"
            >
              {formatPrice(quote.valueCents)}
            </p>

            <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-[0.8125rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-grey-strong">Top price for this model</dt>
                <dd className="tabular-nums text-ink">
                  {formatPrice(quote.baseCents)}
                </dd>
              </div>
              {quote.adjustments.map((adjustment) => (
                <div key={adjustment.label} className="flex justify-between gap-3">
                  <dt className="text-pretty text-grey-strong">
                    {adjustment.label}
                  </dt>
                  <dd
                    className={cn(
                      'shrink-0 tabular-nums',
                      adjustment.deltaCents < 0 ? 'text-red-deep' : 'text-leaf',
                    )}
                  >
                    {adjustment.deltaCents < 0 ? '' : '+'}
                    {formatPrice(adjustment.deltaCents)}
                  </dd>
                </div>
              ))}
              <div className="mt-2 flex justify-between gap-3 border-t border-line pt-3">
                <dt className="font-bold text-ink">We pay</dt>
                <dd className="font-bold tabular-nums text-ink">
                  {formatPrice(quote.valueCents)}
                </dd>
              </div>
            </dl>

            {batteryValue !== null && batteryValue < 80 && (
              <p className="mt-4 flex items-start gap-2 rounded-panel bg-white p-3 text-[0.75rem] leading-relaxed text-grey-strong">
                <BatteryLow className="mt-0.5 size-3.5 shrink-0 text-caution" aria-hidden="true" />
                Below 80% the battery needs replacing before we can resell it,
                which is the deduction above.
              </p>
            )}
          </>
        )}

        {submitError && (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-panel border border-red/30 bg-red-soft p-3 text-[0.8125rem] leading-relaxed text-ink"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-deep" aria-hidden="true" />
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          variant="critical"
          size="lg"
          block
          className="mt-6"
          disabled={!ready || !quote?.isAccepted}
          loading={submitting}
          loadingLabel="Recording your quote"
        >
          Lock this figure in
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>

        <p className="mt-3 text-[0.75rem] leading-relaxed text-grey">
          The quote stands for a fortnight. We confirm it when the device
          reaches us, against the same published rules you can see above.
        </p>
      </aside>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function familyLabel(family: string): string {
  switch (family) {
    case 'iphone':
      return 'iPhone';
    case 'ipad':
      return 'iPad';
    case 'mac':
      return 'Mac';
    case 'watch':
      return 'Apple Watch';
    case 'audio':
      return 'AirPods';
    default:
      return 'Other';
  }
}

function Step({
  number,
  title,
  disabled = false,
  children,
}: {
  readonly number: number;
  readonly title: string;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`step-${number}`}
      // inert, rather than aria-disabled, which a section does not support.
      // It takes the whole step out of the tab order and the accessibility
      // tree until the previous answer makes it meaningful.
      inert={disabled}
      className={cn(
        'transition-opacity duration-[--duration-reveal]',
        disabled && 'opacity-45',
      )}
    >
      <h2
        id={`step-${number}`}
        className="flex items-center gap-3 text-[1.125rem] font-bold text-ink"
      >
        <span className="text-spec flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[0.75rem] font-semibold text-white">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Chip({
  label,
  selected,
  onSelect,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'h-10 rounded-panel border px-4 text-[0.875rem] font-semibold',
        'transition-[background-color,border-color,color] duration-[--duration-feedback] ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red',
        selected
          ? 'border-ink bg-ink text-white'
          : 'border-line-strong bg-white text-ink hover:border-ink',
      )}
    >
      {label}
    </button>
  );
}

function QuoteRecorded({
  quote,
}: {
  readonly quote: {
    readonly reference: string;
    readonly valueCents: number;
    readonly expiresAt: string;
  };
}) {
  const expires = quote.expiresAt
    ? new Date(quote.expiresAt).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl rounded-card border border-line bg-white p-6 sm:p-8">
      <span className="flex size-11 items-center justify-center rounded-full bg-leaf-soft">
        <Check className="size-5 text-leaf" aria-hidden="true" />
      </span>

      <h2 className="text-display mt-5 text-[1.75rem] text-ink">
        That figure is yours for a fortnight
      </h2>
      <p className="mt-3 text-pretty text-[1rem] leading-relaxed text-grey-strong">
        Quote the reference below at checkout and it comes off your total, or
        bring the device to the shop and we will pay it out.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-card bg-canvas p-5">
          <p className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
            Reference
          </p>
          <p className="text-spec mt-1 text-[1.25rem] font-medium text-ink">
            {quote.reference}
          </p>
        </div>
        <div className="rounded-card bg-canvas p-5">
          <p className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
            We pay
          </p>
          <p className="mt-1 text-[1.25rem] font-bold tabular-nums text-ink">
            {formatPrice(quote.valueCents)}
          </p>
        </div>
      </div>

      {expires && (
        <p className="mt-4 text-[0.875rem] text-grey-strong">
          Valid until <span className="font-semibold text-ink">{expires}</span>.
        </p>
      )}

      <div className="mt-7 rounded-card border border-line bg-paper p-5">
        <h3 className="text-[0.9375rem] font-bold text-ink">Before you bring it in</h3>
        <ul className="mt-3 flex flex-col gap-2 text-[0.875rem] leading-relaxed text-grey-strong">
          <li>Back it up, then sign out of your Apple Account.</li>
          <li>Turn off Find My, then erase all content and settings.</li>
          <li>Bring the charger if you still have it. It does not change the figure.</li>
        </ul>
        <p className="mt-4 text-[0.8125rem] text-grey">
          {store.address.line1}, {store.address.line2}, {store.address.suburb}.
        </p>
      </div>
    </div>
  );
}
