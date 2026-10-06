import 'server-only';

import { prisma } from '@/lib/db';
import { OrderError } from '@/lib/orders/errors';
import { generateTradeInReference } from '@/lib/orders/reference';
import {
  QUOTE_VALID_DAYS,
  calculateTradeIn,
  quoteExpiryFrom,
  type TradeInQuote,
} from './calculator';
import type { TradeInCondition, TradeInModelDto } from '@/types';

/**
 * Trade in, with a database behind it.
 *
 * The arithmetic is entirely in calculator.ts, which touches no I/O and is
 * covered by tests. This module only fetches the price list, calls that
 * function, and writes the result down. Keeping the split means the rules can
 * be proven without a database, and the database layer has no rules in it to
 * get wrong.
 */

export interface QuoteAnswers {
  readonly modelSlug: string;
  readonly storageGb: number | null;
  readonly condition: TradeInCondition;
  readonly isUnlocked: boolean;
  readonly powersOn: boolean;
  readonly batteryHealth: number | null;
}

function parseStorageOptions(raw: string): number[] {
  return raw
    .split('\n')
    .map((line) => Number.parseInt(line.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

export async function listTradeInModels(): Promise<TradeInModelDto[]> {
  const rows = await prisma.tradeInModel.findMany({
    where: { isActive: true },
    orderBy: [{ family: 'asc' }, { sortOrder: 'asc' }],
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    family: row.family as TradeInModelDto['family'],
    label: row.label,
    storageOptions: parseStorageOptions(row.storageOptions),
    baseValueCents: row.baseValueCents,
  }));
}

/**
 * Price a device.
 *
 * The storage the customer picked is validated against the sizes the model
 * actually shipped in, because a 2 TB iPhone would otherwise quote at the top
 * of the range. The figure also has to be reproducible: the same answers must
 * always produce the same number, which is why nothing here consults a clock
 * except to set the expiry.
 */
export async function quoteTradeIn(
  answers: QuoteAnswers,
): Promise<{ quote: TradeInQuote; model: TradeInModelDto; expiresAt: Date }> {
  const row = await prisma.tradeInModel.findFirst({
    where: { slug: answers.modelSlug, isActive: true },
  });
  if (!row) {
    throw new OrderError(
      'TRADE_IN_MODEL_NOT_FOUND',
      'We do not have a price for that model. Send us a message and we will look at it.',
      { status: 404 },
    );
  }

  const storageOptions = parseStorageOptions(row.storageOptions);
  if (
    answers.storageGb !== null &&
    storageOptions.length > 0 &&
    !storageOptions.includes(answers.storageGb)
  ) {
    throw new OrderError(
      'TRADE_IN_STORAGE_NOT_VALID',
      'That storage size was not made for this model. Please pick one of the listed sizes.',
      { status: 400 },
    );
  }

  const model: TradeInModelDto = {
    id: row.id,
    slug: row.slug,
    family: row.family as TradeInModelDto['family'],
    label: row.label,
    storageOptions,
    baseValueCents: row.baseValueCents,
  };

  const quote = calculateTradeIn(
    { baseValueCents: row.baseValueCents, storageOptions },
    {
      storageGb: answers.storageGb,
      condition: answers.condition,
      isUnlocked: answers.isUnlocked,
      powersOn: answers.powersOn,
      batteryHealth: answers.batteryHealth,
    },
  );

  return { quote, model, expiresAt: quoteExpiryFrom() };
}

/**
 * Record a quote the customer wants to act on.
 *
 * The figure is recalculated here rather than accepted from the request. A
 * browser that could post its own trade in value could post any value, and this
 * one comes off the price of a purchase.
 *
 * A declined device is not written down. There is nothing to honour and
 * nothing for the shop to action, so storing somebody's contact details for it
 * would be collecting personal information for no purpose, which POPIA asks us
 * not to do.
 */
export async function submitTradeIn(
  answers: QuoteAnswers & {
    readonly customerName: string;
    readonly customerEmail: string;
    readonly customerMobile: string;
  },
) {
  const { quote, model, expiresAt } = await quoteTradeIn(answers);

  if (!quote.isAccepted) {
    return { accepted: false as const, quote, model, reference: null };
  }

  const created = await prisma.tradeInQuote.create({
    data: {
      reference: generateTradeInReference(),
      status: 'quoted',
      deviceModelId: model.id,
      deviceLabel: model.label,
      storageGb: answers.storageGb,
      condition: answers.condition,
      isUnlocked: answers.isUnlocked,
      powersOn: answers.powersOn,
      batteryHealth: answers.batteryHealth,
      quotedCents: quote.valueCents,
      expiresAt,
      customerName: answers.customerName,
      customerEmail: answers.customerEmail,
      customerEmailNormalized: answers.customerEmail.trim().toLowerCase(),
      customerMobile: answers.customerMobile,
    },
    select: { reference: true, expiresAt: true },
  });

  return {
    accepted: true as const,
    quote,
    model,
    reference: created.reference,
    expiresAt: created.expiresAt,
    validDays: QUOTE_VALID_DAYS,
  };
}
