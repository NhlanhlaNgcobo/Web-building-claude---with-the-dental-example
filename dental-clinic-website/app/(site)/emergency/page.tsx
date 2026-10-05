import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  Ambulance,
  Check,
  MessageCircle,
  Phone,
  Siren,
} from 'lucide-react';
import { EmergencySearch } from '@/components/booking/EmergencySearch';
import { ButtonAnchor } from '@/components/ui/Button';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { Badge } from '@/components/ui/Primitives';
import { Reveal } from '@/components/ui/Reveal';
import { Section, SectionHeading } from '@/components/ui/Section';
import { clinic, whatsappIntents, whatsappLink } from '@/data/clinic';
import { emergencyFaqs } from '@/data/faqs';
import { BLUR_PLACEHOLDER, clinicImages } from '@/data/images';
import { getTreatment } from '@/data/treatments';
import { JsonLd, faqSchema, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Emergency dentist in Durban',
  description:
    'Urgent dental appointments in Durban for pain, swelling, a broken tooth or a lost filling. Time is held back each morning, and the earliest available times are shown live.',
  path: '/emergency',
});

const whatToDo = [
  {
    problem: 'Toothache that will not settle',
    advice:
      'Take over-the-counter pain relief as directed on the packet. A cold compress against the cheek can help. Avoid very hot or very cold food and drink, and do not put aspirin directly on the gum.',
  },
  {
    problem: 'Swelling around a tooth or in the face',
    advice:
      'Phone us the same day. Swelling means infection is spreading and it does not resolve on its own. If swelling is closing your eye or throat, or you have difficulty breathing or swallowing, go to a hospital emergency department instead.',
  },
  {
    problem: 'A tooth has been knocked out',
    advice:
      'Phone immediately, because time affects whether it can be saved. Hold the tooth by the crown and not the root, do not scrub it, and keep it moist in milk or inside your cheek on the way to us.',
  },
  {
    problem: 'A broken or chipped tooth',
    advice:
      'Keep any pieces. Rinse with warm water and cover a sharp edge with sugar-free chewing gum if it is cutting your tongue. Avoid biting on that side.',
  },
  {
    problem: 'A crown or filling has come out',
    advice:
      'Keep the crown if you have it. Avoid chewing on that side and keep the area clean. This is usually straightforward to re-cement.',
  },
  {
    problem: 'Bleeding that will not stop after an extraction',
    advice:
      'Bite firmly on a clean gauze or a rolled handkerchief for twenty minutes without checking it. If bleeding continues after that, phone us. If it is heavy and uncontrolled, go to a hospital emergency department.',
  },
];

export default function EmergencyPage() {
  const treatment = getTreatment('emergency-dentistry');

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden bg-ink">
        <Image
          src={clinicImages.consultation.src}
          alt={clinicImages.consultation.alt}
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover object-center opacity-35"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/65" />

        <div className="container-page relative pb-16 pt-32 sm:pb-20 sm:pt-36 lg:pb-24 lg:pt-44">
          <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="max-w-2xl">
              <Badge
                tone="critical"
                icon={<Siren className="size-3" aria-hidden="true" />}
              >
                Urgent dental care
              </Badge>

              <h1 className="mt-6 text-[2.25rem] font-semibold leading-[1.08] text-white sm:text-[2.75rem] lg:text-[3.25rem]">
                Need urgent dental care?
              </h1>

              <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-white/75 sm:text-[1.125rem]">
                We hold appointments back each morning for pain, swelling,
                broken teeth and lost fillings, so most urgent problems are
                seen the same day. The times alongside are the genuinely
                earliest available.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonAnchor
                  href={`tel:${clinic.telephone.e164}`}
                  size="lg"
                  variant="onDark"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  Call {clinic.telephone.display}
                </ButtonAnchor>
                <ButtonAnchor
                  href={whatsappLink(whatsappIntents.urgent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="onDarkGhost"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp reception
                </ButtonAnchor>
              </div>

              <p className="mt-6 text-[0.8125rem] text-white/55">
                Emergency consultation from{' '}
                <span className="font-medium tabular-nums text-white/80">
                  R1 100
                </span>
                , with a{' '}
                <span className="font-medium tabular-nums text-white/80">
                  R250
                </span>{' '}
                deposit to hold the appointment.
              </p>
            </div>

            <EmergencySearch />
          </div>
        </div>
      </section>

      {/* ---------------- Hospital guidance, stated prominently ---------------- */}
      <section className="border-b border-[--color-critical]/20 bg-[--color-critical-soft]">
        <div className="container-page py-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-panel bg-white text-[--color-critical]">
              <Ambulance className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-[--color-critical]">
                We are a dental practice, not an emergency department
              </h2>
              <p className="mt-1.5 max-w-4xl text-sm leading-relaxed text-[--color-critical]">
                {clinic.emergency.hospitalGuidance} Ambulance{' '}
                <a
                  href={`tel:${clinic.emergency.ambulanceNumber}`}
                  className="font-semibold tabular-nums underline underline-offset-2"
                >
                  {clinic.emergency.ambulanceNumber}
                </a>
                , or{' '}
                <a
                  href={`tel:${clinic.emergency.nationalEmergencyNumber}`}
                  className="font-semibold tabular-nums underline underline-offset-2"
                >
                  {clinic.emergency.nationalEmergencyNumber}
                </a>{' '}
                from a mobile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- What to do now ---------------- */}
      <Section tone="white" ariaLabelledBy="what-to-do">
        <SectionHeading
          id="what-to-do"
          eyebrow="Before your appointment"
          title="What to do right now"
          lede="Practical steps for the most common urgent problems, to keep you comfortable until we can see you."
        />

        <ul className="mt-12 grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {whatToDo.map((item, index) => (
            <Reveal as="li" key={item.problem} delay={Math.min(index, 3) * 60}>
              <h3 className="flex items-start gap-2.5 text-[0.9375rem] font-semibold text-ink">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-[--color-caution]"
                  aria-hidden="true"
                />
                {item.problem}
              </h3>
              <p className="mt-2 pl-[1.625rem] text-sm leading-relaxed text-grey-strong">
                {item.advice}
              </p>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* ---------------- What the appointment covers ---------------- */}
      <Section tone="canvas" ariaLabelledBy="appointment-heading">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2
              id="appointment-heading"
              className="text-[1.75rem] font-semibold leading-[1.15] text-ink sm:text-[2.125rem]"
            >
              What an emergency appointment covers
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-grey-strong">
              The purpose is to find the cause and get you comfortable. That
              often means settling an infection, dressing an exposed tooth or
              placing a temporary repair.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-grey-strong">
              Definitive treatment is usually planned properly at a later
              appointment rather than rushed on the day, and you will leave
              knowing what that involves and what it costs.
            </p>
            {treatment && (
              <Link
                href="/treatments/emergency-dentistry"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
              >
                More about emergency dentistry
              </Link>
            )}
          </Reveal>

          <Reveal delay={80}>
            <ul className="flex flex-col gap-3">
              {[
                'A focused examination of the problem area',
                'An image where it is needed to find the cause',
                'Treatment to relieve the immediate problem',
                'A clear explanation of what caused it',
                'A written plan and cost for the permanent repair',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-panel bg-white p-4 text-[0.9375rem] text-charcoal"
                >
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-blue"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section tone="white" ariaLabelledBy="emergency-faq">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeading
            id="emergency-faq"
            eyebrow="Questions"
            title="Urgent care questions"
          />
          <Reveal>
            <FaqAccordion faqs={emergencyFaqs} />
          </Reveal>
        </div>
      </Section>

      <JsonLd schema={faqSchema(emergencyFaqs)} />
    </>
  );
}
