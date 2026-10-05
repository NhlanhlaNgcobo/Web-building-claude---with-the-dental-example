import 'server-only';

import { prisma } from '@/lib/db';
import type { ProductCardData } from '@/components/shop/ProductCard';
import { getRelatedProducts } from '@/lib/queries';

/**
 * Rule-based recommendations.
 *
 * No model, no inference, no chat. The relationships are declared in the data
 * model as ServiceProduct rows and read back here, which keeps them reviewable
 * by the practice rather than emergent from something nobody can inspect.
 *
 * Two rules override everything else:
 *   1. A service with allowsUpsell false returns nothing. That is how an
 *      emergency appointment shows no commercial offers to somebody in pain.
 *   2. At most two items. More than that is a shop, not a recommendation.
 */
export async function recommendationsForAppointment(
  serviceId: string,
): Promise<ProductCardData[]> {
  return getRelatedProducts(serviceId, 2);
}

/** Products related to a treatment, addressed by its booking service slug. */
export async function recommendationsForTreatment(
  bookingServiceSlug: string,
): Promise<ProductCardData[]> {
  const service = await prisma.service.findFirst({
    where: { slug: bookingServiceSlug },
    select: { id: true },
  });
  if (!service) return [];
  return getRelatedProducts(service.id, 2);
}

/**
 * Preparation notes for the confirmation page, by appointment type.
 *
 * Practical and specific. Generic advice nobody acts on would be filler.
 */
export function preparationNotesFor(serviceSlug: string): string[] {
  const universal = [
    'Arrive about five minutes early so reception is not rushing you through.',
    'Bring a list of any medication you take, including anything over the counter.',
  ];

  const bySlug: Record<string, string[]> = {
    'new-patient-consultation': [
      'If you have had treatment elsewhere recently, bring any records or images you have.',
      'Have a think about anything you have noticed yourself. It is often the most useful information in the room.',
    ],
    'routine-examination': [
      'Note down anything you have noticed since your last visit, even if it has settled.',
    ],
    'scale-and-polish': [
      'Brush as normal beforehand. There is no need to do anything extra.',
      'Tell us if your gums have been tender and we will adjust how we work.',
    ],
    'whitening-consultation': [
      'Come with your teeth as they normally are, so we can record an accurate starting shade.',
      'If you have crowns, veneers or white fillings in your smile line, mention them. Those do not change colour.',
    ],
    'emergency-consultation': [
      'If pain relief is helping, take it as directed on the packet before you come in.',
      'Tell reception when you arrive if the pain has changed since you booked.',
    ],
    'implant-consultation': [
      'We will take a three dimensional scan, so allow a little extra time.',
      'Bring details of any medication affecting bone or healing, and let us know if you smoke.',
    ],
    'filling-consultation': [
      'Eat beforehand if you can. Local anaesthetic makes it easy to bite your cheek afterwards.',
    ],
    'crown-consultation': [
      'Allow extra time. A preparation appointment involves a scan and fitting a temporary crown.',
    ],
  };

  return [...(bySlug[serviceSlug] ?? []), ...universal];
}

/**
 * Whether a treatment page should surface the urgent care route prominently.
 *
 * Driven by the treatment's own category rather than by watching what somebody
 * has been reading, which would be both creepy and unreliable.
 */
export function shouldSurfaceEmergency(category: string): boolean {
  return category === 'emergency' || category === 'surgical';
}
