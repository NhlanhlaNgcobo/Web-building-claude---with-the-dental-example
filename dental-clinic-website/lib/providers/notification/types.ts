import type { ProviderResult } from '../result';

/**
 * Notification provider interface.
 *
 * The event vocabulary below is declared in full now even though only the
 * first five are sent today. Declaring the reminder, recall and follow-up
 * events up front is precisely what lets those features ship later as a
 * template plus a scheduled job, with no change to this interface and no
 * change to any call site.
 *
 * The default provider writes to the server log. Nothing is sent anywhere and
 * no external account is required for the site to work.
 */

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';

export interface BookingNotificationPayload {
  readonly reference: string;
  readonly patientFirstName: string;
  readonly serviceName: string;
  readonly dentistName: string;
  readonly startTime: Date;
  readonly dateLabel: string;
  readonly startLabel: string;
}

export interface OrderNotificationPayload {
  readonly reference: string;
  readonly contactName: string;
  readonly totalCents: number;
  readonly itemCount: number;
}

export type NotificationEvent =
  /* ---- Sent today ---- */
  | { readonly type: 'booking_confirmed'; readonly data: BookingNotificationPayload }
  | {
      readonly type: 'booking_cancelled';
      readonly data: BookingNotificationPayload & { readonly reason?: string };
    }
  | {
      readonly type: 'booking_rescheduled';
      readonly data: BookingNotificationPayload & { readonly previousStart: Date };
    }
  | {
      readonly type: 'deposit_outstanding';
      readonly data: BookingNotificationPayload & {
        readonly amountCents: number;
        readonly payUrl: string | null;
      };
    }
  | { readonly type: 'order_confirmed'; readonly data: OrderNotificationPayload }
  /* ---- Declared for later, deliberately not implemented yet ---- */
  | {
      readonly type: 'appointment_reminder';
      readonly data: BookingNotificationPayload & { readonly hoursBefore: 24 | 48 };
    }
  | {
      readonly type: 'recall_due';
      readonly data: {
        readonly patientFirstName: string;
        readonly lastVisit: Date;
        readonly recallType: string;
      };
    }
  | {
      readonly type: 'treatment_plan_follow_up';
      readonly data: {
        readonly patientFirstName: string;
        readonly planSummary: string;
      };
    };

export interface NotificationRecipient {
  readonly name: string;
  readonly email?: string;
  /** E.164. */
  readonly mobile?: string;
}

export interface SendNotificationInput {
  /** `${event.type}:${appointmentId}`, so a retry does not double send. */
  readonly idempotencyKey: string;
  readonly event: NotificationEvent;
  readonly recipient: NotificationRecipient;
  readonly channels: readonly NotificationChannel[];
  /** Future dated. The log provider records the intent; a real adapter queues it. */
  readonly sendAt?: Date;
}

export interface SendNotificationOutput {
  readonly deliveries: readonly {
    readonly channel: NotificationChannel;
    readonly status: 'sent' | 'queued' | 'skipped' | 'failed';
    readonly skipReason?: 'no_address' | 'channel_unsupported';
  }[];
}

export interface NotificationProvider {
  /** 'log', or a real transport once one is configured. */
  readonly name: string;
  readonly isConfigured: boolean;
  readonly supportedChannels: readonly NotificationChannel[];
  send(
    input: SendNotificationInput,
  ): Promise<ProviderResult<SendNotificationOutput>>;
}
