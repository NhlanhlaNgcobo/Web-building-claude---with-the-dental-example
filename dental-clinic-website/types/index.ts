import type {
  AppointmentStatus,
  BookingSource,
  DepositStatus,
  DepositType,
  FulfilmentMethod,
  OrderStatus,
  ProductCategory,
  ServiceCategory,
} from '@/lib/domain/enums';
import type { LocalDate, LocalMinutes } from '@/lib/availability/types';

export type {
  AppointmentStatus,
  BookingSource,
  DepositStatus,
  DepositType,
  FulfilmentMethod,
  OrderStatus,
  ProductCategory,
  ServiceCategory,
};

/* ------------------------------------------------------------------ */
/* Editorial content                                                   */
/* ------------------------------------------------------------------ */

export interface TreatmentStep {
  readonly title: string;
  readonly detail: string;
}

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * A treatment is the editorial unit: what a patient reads about. A service is
 * the bookable unit: what occupies a slot in the diary. They are related but
 * not identical, because several treatments can share one appointment type.
 */
export interface Treatment {
  readonly slug: string;
  readonly name: string;
  readonly category: ServiceCategory;
  /** One sentence, used on cards and in search results. */
  readonly summary: string;
  /** Opening paragraph on the treatment page. */
  readonly intro: string;
  /** Body paragraphs explaining the treatment. */
  readonly explanation: readonly string[];
  /** Who the treatment may suit. Phrased as considerations, never a diagnosis. */
  readonly suitableFor: readonly string[];
  /** What happens during the appointment, in order. */
  readonly whatHappens: readonly TreatmentStep[];
  readonly durationMinutes: number;
  /** Indicative price in cents, or null where a fee follows an assessment. */
  readonly priceFromCents: number | null;
  readonly priceNote?: string;
  readonly faqs: readonly Faq[];
  readonly relatedTreatmentSlugs: readonly string[];
  /** The appointment type booked from this page. */
  readonly bookingServiceSlug: string;
  /** Page-specific call to action, never a generic "Learn more". */
  readonly ctaLabel: string;
  /** Terms a patient might search, mapped to this treatment. */
  readonly searchTerms: readonly string[];
  /** Higher-value treatment where payment plan information may be relevant. */
  readonly supportsPaymentPlan: boolean;
}

export interface AreaPage {
  readonly slug: string;
  readonly name: string;
  readonly headline: string;
  readonly intro: string;
  readonly travel: string;
  readonly parking: string;
  readonly landmarks: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Booking data transfer objects                                       */
/* ------------------------------------------------------------------ */

/** A slot as sent to the browser: minutes resolved to displayable strings. */
export interface SlotDto {
  readonly date: LocalDate;
  readonly startMinutes: LocalMinutes;
  readonly endMinutes: LocalMinutes;
  /** '10:15' */
  readonly startLabel: string;
  /** '10:45' */
  readonly endLabel: string;
  /** ISO UTC instant. */
  readonly startTime: string;
  readonly dentistId: string;
  readonly dentistName: string;
  readonly alternateDentistIds: readonly string[];
}

export interface DayAvailabilityDto {
  readonly date: LocalDate;
  /** 'Thursday, 8 October 2026' */
  readonly dateLabel: string;
  /** 'Thursday' */
  readonly weekday: string;
  readonly slots: readonly SlotDto[];
  /** Plain language reason the day is empty, or null when slots exist. */
  readonly unavailableMessage: string | null;
  /** Suggestions shown instead of a bare "no availability" message. */
  readonly nextAvailable: readonly SlotDto[];
}

export interface NextAvailableDto {
  readonly slots: readonly SlotDto[];
  readonly daysScanned: number;
  /** True when the search ran out of days before finding enough slots. */
  readonly exhausted: boolean;
}

export interface ServiceSummaryDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly shortDescription: string;
  readonly durationMinutes: number;
  readonly priceFromCents: number | null;
  readonly depositType: DepositType;
  readonly depositAmountCents: number | null;
  readonly isEmergency: boolean;
  readonly category: ServiceCategory;
}

export interface DentistSummaryDto {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly role: string;
  readonly focusAreas: readonly string[];
  readonly photoUrl: string;
}

export interface BookingConfirmationDto {
  readonly reference: string;
  readonly status: AppointmentStatus;
  readonly patientFirstName: string;
  readonly serviceName: string;
  readonly dentistName: string;
  readonly date: LocalDate;
  readonly dateLabel: string;
  readonly startLabel: string;
  readonly endLabel: string;
  readonly durationMinutes: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly priceFromCents: number | null;
  readonly depositType: DepositType;
  readonly depositAmountCents: number | null;
  readonly depositStatus: DepositStatus;
  readonly isEmergency: boolean;
  readonly notes: string | null;
  readonly manageToken: string;
}

/* ------------------------------------------------------------------ */
/* Basket                                                             */
/* ------------------------------------------------------------------ */

export interface BasketLine {
  readonly productId: string;
  readonly slug: string;
  readonly name: string;
  readonly priceCents: number;
  readonly imageUrl: string;
  readonly quantity: number;
}

export interface BasketState {
  readonly lines: readonly BasketLine[];
}
