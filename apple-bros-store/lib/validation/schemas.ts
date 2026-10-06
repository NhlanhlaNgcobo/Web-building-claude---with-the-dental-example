import { z } from 'zod';
import {
  Condition,
  FulfilmentMethod,
  PaymentMethod,
  TradeInCondition,
} from '@/lib/domain/enums';

/**
 * Every input boundary in one file.
 *
 * Nothing that arrives from a browser reaches a query or a write without
 * passing through a schema here. The messages are written for the customer who
 * will read them under a field, not for a developer reading a log, which is why
 * they say what to do rather than what was wrong with the bytes.
 */

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/**
 * South African mobile numbers.
 *
 * Accepts the three forms people actually type: 0821234567, 082 123 4567 and
 * +27821234567. Normalised to the national form so two records for the same
 * person cannot differ only by punctuation.
 */
export const saMobile = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .refine(
    (value) => /^(?:\+?27|0)[6-8]\d{8}$/.test(value),
    'Enter a South African mobile number, for example 082 123 4567.',
  )
  .transform((value) =>
    value.startsWith('+27')
      ? `0${value.slice(3)}`
      : value.startsWith('27')
        ? `0${value.slice(2)}`
        : value,
  );

export const personName = z
  .string()
  .trim()
  .min(2, 'Please enter your name.')
  .max(80, 'That is longer than we can store. Please shorten it.');

export const emailAddress = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.string().email('Enter an email address we can send your order to.'));

export const cuid = z.string().trim().min(1).max(64);

export const quantity = z
  .number()
  .int('Quantities are whole numbers.')
  .min(1, 'A line needs at least one item.')
  // Matches BASKET_MAX_QUANTITY. A limit here as well as in the browser,
  // because the browser value is a convenience and this one is the rule.
  .max(5, 'We limit each item to five per order.');

/* ------------------------------------------------------------------ */
/* Stock                                                               */
/* ------------------------------------------------------------------ */

export const stockRequestSchema = z.object({
  // Capped so a crafted request cannot ask about the whole catalogue at once.
  variantIds: z.array(cuid).min(1).max(50),
});

/* ------------------------------------------------------------------ */
/* Orders                                                             */
/* ------------------------------------------------------------------ */

export const basketLineSchema = z.object({
  variantId: cuid,
  quantity,
});

/**
 * Note what the order payload does not contain: a price, a subtotal or a
 * total. Those are read from the database inside the order transaction. A
 * client that could send its own prices could send its own discounts.
 */
export const createOrderSchema = z
  .object({
    lines: z.array(basketLineSchema).min(1, 'Your basket is empty.').max(20),
    customerName: personName,
    customerEmail: emailAddress,
    customerMobile: saMobile,
    fulfilment: FulfilmentMethod.schema,
    paymentMethod: PaymentMethod.schema,
    /** Required for delivery, ignored for collection. */
    addressLine1: z.string().trim().max(120).optional(),
    addressLine2: z.string().trim().max(120).optional(),
    suburb: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    province: z.string().trim().max(80).optional(),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'A South African postal code is four digits.')
      .optional(),
    notes: z.string().trim().max(500).optional(),
    /** An accepted trade-in quote to set against the total. */
    tradeInReference: z.string().trim().max(20).optional(),
    marketingOptIn: z.boolean().default(false),
    acceptedTerms: z.literal(true, {
      message: 'Please accept the terms to place your order.',
    }),
  })
  .superRefine((value, ctx) => {
    if (value.fulfilment !== 'delivery') return;
    // Delivery needs somewhere to deliver to. Checked here rather than with
    // per-field .optional() chains so the rule reads as one rule.
    const required = [
      ['addressLine1', 'Enter the street address.'],
      ['suburb', 'Enter the suburb.'],
      ['city', 'Enter the city or town.'],
      ['province', 'Choose the province.'],
      ['postalCode', 'Enter the four digit postal code.'],
    ] as const;

    for (const [field, message] of required) {
      if (!value[field] || String(value[field]).length === 0) {
        ctx.addIssue({ code: 'custom', path: [field], message });
      }
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderLookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(4, 'Enter the reference from your confirmation email.')
    .max(20),
  email: emailAddress,
});

/* ------------------------------------------------------------------ */
/* Trade in                                                            */
/* ------------------------------------------------------------------ */

export const tradeInQuoteSchema = z.object({
  modelSlug: z.string().trim().min(1).max(80),
  storageGb: z.number().int().positive().max(8192).nullable(),
  condition: TradeInCondition.schema,
  powersOn: z.boolean(),
  isUnlocked: z.boolean(),
  batteryHealth: z.number().int().min(0).max(100).nullable(),
});

export type TradeInQuoteInput = z.infer<typeof tradeInQuoteSchema>;

export const tradeInSubmitSchema = tradeInQuoteSchema.extend({
  customerName: personName,
  customerEmail: emailAddress,
  customerMobile: saMobile,
});

/* ------------------------------------------------------------------ */
/* Search and enquiries                                                */
/* ------------------------------------------------------------------ */

export const searchSchema = z.object({
  q: z.string().trim().max(80).default(''),
});

export const enquirySchema = z.object({
  name: personName,
  email: emailAddress,
  mobile: saMobile.optional(),
  subject: z.string().trim().min(2).max(120),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a little more so we can help.')
    .max(2000),
  /**
   * POPIA: consent to be contacted about this enquiry is implicit in sending
   * it, but consent to anything else is not, so it is a separate box that
   * defaults to off.
   */
  marketingOptIn: z.boolean().default(false),
});

/** Re-exported so routes import one module at the boundary. */
export { Condition, FulfilmentMethod, PaymentMethod, TradeInCondition };
