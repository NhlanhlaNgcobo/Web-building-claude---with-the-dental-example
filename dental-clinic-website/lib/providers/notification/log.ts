import { providerOk } from '../result';
import type { NotificationProvider } from './types';

/**
 * The default notification provider: write to the server log.
 *
 * Sends nothing, contacts nothing, needs no account. It exists so that the
 * booking flow has a complete, working notification step today, and so that
 * the practice can see in the server output exactly what would have been sent
 * before any transport is connected.
 *
 * Message bodies are composed by lib/providers/notification/templates.ts, not
 * here, so swapping in a real transport later does not rewrite a single word
 * of patient-facing copy.
 */
export const logNotificationProvider: NotificationProvider = {
  name: 'log',
  isConfigured: true,
  supportedChannels: ['email', 'sms'],

  async send(input) {
    const deliveries = input.channels.map((channel) => {
      const address = channel === 'email' ? input.recipient.email : input.recipient.mobile;
      if (!address) {
        return { channel, status: 'skipped' as const, skipReason: 'no_address' as const };
      }
      if (!logNotificationProvider.supportedChannels.includes(channel)) {
        return {
          channel,
          status: 'skipped' as const,
          skipReason: 'channel_unsupported' as const,
        };
      }
      return { channel, status: 'sent' as const };
    });

    console.info('[notification]', {
      event: input.event.type,
      to: input.recipient.name,
      channels: deliveries.map((d) => `${d.channel}:${d.status}`),
      scheduledFor: input.sendAt?.toISOString() ?? 'immediately',
      idempotencyKey: input.idempotencyKey,
    });

    return providerOk({ deliveries });
  },
};
