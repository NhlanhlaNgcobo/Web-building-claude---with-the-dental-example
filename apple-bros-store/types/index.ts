import type {
  Condition,
  FulfilmentMethod,
  OrderStatus,
  PaymentMethod,
  ProductFamily,
  TradeInCondition,
  TradeInStatus,
} from '@/lib/domain/enums';

export type {
  Condition,
  FulfilmentMethod,
  OrderStatus,
  PaymentMethod,
  ProductFamily,
  TradeInCondition,
  TradeInStatus,
};

/* ------------------------------------------------------------------ */
/* Shared editorial                                                    */
/* ------------------------------------------------------------------ */

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

/* ------------------------------------------------------------------ */
/* Catalogue data transfer objects                                     */
/* ------------------------------------------------------------------ */

export interface ProductImageDto {
  readonly url: string;
  readonly alt: string;
  readonly colourName: string | null;
}

export interface VariantDto {
  readonly id: string;
  readonly sku: string;
  readonly storageGb: number | null;
  readonly colourName: string;
  readonly colourHex: string;
  readonly condition: Condition;
  readonly priceCents: number;
  readonly compareAtCents: number | null;
  readonly stockQuantity: number;
  readonly batteryHealthMin: number | null;
  readonly warrantyMonths: number;
  readonly conditionNote: string | null;
  readonly isActive: boolean;
}

/** Enough to render a card in a grid, and no more. */
export interface ProductCardDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly categorySlug: string;
  readonly categoryName: string;
  readonly imageUrl: string | null;
  readonly imageAlt: string;
  readonly releaseYear: number;
  /** Null when nothing is buyable, which renders as out of stock. */
  readonly fromPriceCents: number | null;
  readonly compareAtCents: number | null;
  readonly savingPercent: number | null;
  /** Best grade currently in stock, for the card badge. */
  readonly bestCondition: Condition | null;
  readonly totalStock: number;
  readonly colourHexes: readonly string[];
}

export interface ProductDetailDto extends ProductCardDto {
  readonly description: string;
  readonly highlights: readonly string[];
  readonly specs: Readonly<Record<string, string>>;
  readonly images: readonly ProductImageDto[];
  readonly variants: readonly VariantDto[];
}

export interface CategoryDto {
  readonly id: string;
  readonly slug: string;
  readonly family: ProductFamily;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly productCount: number;
}

/* ------------------------------------------------------------------ */
/* Basket                                                              */
/* ------------------------------------------------------------------ */

/**
 * A basket line as held in the browser.
 *
 * The snapshot fields exist so the basket can render without a round trip.
 * They are never trusted at checkout: the server re-reads every price and
 * stock level from the database before an order is written.
 */
export interface BasketLine {
  readonly variantId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly variantLabel: string;
  readonly condition: Condition;
  readonly priceCents: number;
  readonly imageUrl: string | null;
  readonly quantity: number;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export interface OrderLineDto {
  readonly name: string;
  readonly variantLabel: string;
  readonly condition: Condition;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly lineTotalCents: number;
  readonly warrantyMonths: number;
  readonly imageUrl: string | null;
}

export interface OrderDto {
  readonly reference: string;
  readonly status: OrderStatus;
  readonly placedAt: string;
  readonly customerName: string;
  readonly fulfilment: FulfilmentMethod;
  readonly paymentMethod: PaymentMethod;
  readonly lines: readonly OrderLineDto[];
  readonly subtotalCents: number;
  readonly shippingCents: number;
  readonly tradeInCents: number;
  readonly totalCents: number;
  readonly deliveryAddress: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Trade in                                                            */
/* ------------------------------------------------------------------ */

export interface TradeInModelDto {
  readonly id: string;
  readonly slug: string;
  readonly family: ProductFamily;
  readonly label: string;
  readonly storageOptions: readonly number[];
  readonly baseValueCents: number;
}

export interface TradeInQuoteDto {
  readonly reference: string;
  readonly status: TradeInStatus;
  readonly deviceLabel: string;
  readonly storageGb: number | null;
  readonly condition: TradeInCondition;
  readonly valueCents: number;
  readonly isAccepted: boolean;
  readonly declineReason: string | null;
  readonly adjustments: readonly {
    readonly label: string;
    readonly deltaCents: number;
  }[];
  readonly baseCents: number;
  readonly expiresAt: string;
}
