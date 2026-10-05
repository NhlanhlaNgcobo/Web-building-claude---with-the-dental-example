import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/brand/SocialIcons';
import { Logo } from '@/components/brand/Logo';
import { addressLines, clinic } from '@/data/clinic';
import { treatments } from '@/data/treatments';

const footerTreatments = [
  'dental-examination',
  'professional-cleaning',
  'teeth-whitening',
  'fillings',
  'crowns',
  'dental-implant-consultation',
];

const bookingLinks = [
  { href: '/book', label: 'Book an appointment' },
  { href: '/appointment', label: 'Manage your appointment' },
  { href: '/emergency', label: 'Urgent dental care' },
  { href: '/pricing', label: 'Fees' },
  { href: '/shop', label: 'Dental products' },
];

const practiceLinks = [
  { href: '/about', label: 'About the practice' },
  { href: '/about#team', label: 'Our dentists' },
  { href: '/contact', label: 'Contact and directions' },
  { href: '/areas/umhlanga', label: 'Patients from Umhlanga' },
  { href: '/areas/morningside', label: 'Patients from Morningside' },
];

const legalLinks = [
  { href: '/legal/privacy', label: 'Privacy and POPIA' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/patient-information', label: 'Patient information' },
  { href: '/legal/cancellation', label: 'Cancellation policy' },
];

export function Footer() {
  const linkClass =
    'text-sm text-white/65 transition-colors duration-[--duration-feedback] ' +
    'hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-white rounded-panel';

  return (
    <footer className="bg-ink text-white">
      <div className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Clinic */}
          <div>
            <Logo tone="white" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
              A private dental practice on Florida Road in Morningside, seeing
              patients from across Durban and the north coast.
            </p>

            <address className="mt-6 flex flex-col gap-3 not-italic">
              <a
                href={`tel:${clinic.telephone.e164}`}
                className="flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white"
              >
                <Phone className="size-4 shrink-0 text-blue" aria-hidden="true" />
                <span className="tabular-nums">{clinic.telephone.display}</span>
              </a>
              <a
                href={`mailto:${clinic.email}`}
                className="flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white"
              >
                <Mail className="size-4 shrink-0 text-blue" aria-hidden="true" />
                {clinic.email}
              </a>
              <span className="flex items-start gap-2.5 text-sm text-white/65">
                <MapPin className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
                <span>
                  {addressLines().map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </span>
            </address>
          </div>

          {/* Treatments */}
          <nav aria-labelledby="footer-treatments">
            <h2
              id="footer-treatments"
              className="text-[0.8125rem] font-semibold text-white"
            >
              Treatments
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {footerTreatments.map((slug) => {
                const treatment = treatments.find((t) => t.slug === slug);
                if (!treatment) return null;
                return (
                  <li key={slug}>
                    <Link href={`/treatments/${slug}`} className={linkClass}>
                      {treatment.name}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/treatments" className={`${linkClass} font-medium`}>
                  All treatments
                </Link>
              </li>
            </ul>
          </nav>

          {/* Booking */}
          <nav aria-labelledby="footer-booking">
            <h2
              id="footer-booking"
              className="text-[0.8125rem] font-semibold text-white"
            >
              Appointments
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {bookingLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-[0.8125rem] font-semibold text-white">
              Opening hours
            </h2>
            <ul className="mt-4 flex flex-col gap-1.5">
              {clinic.openingHours.map((day) => (
                <li
                  key={day.day}
                  className="flex justify-between gap-4 text-sm text-white/65"
                >
                  <span>{day.day.slice(0, 3)}</span>
                  <span className="tabular-nums">
                    {day.opens ? `${day.opens} to ${day.closes}` : 'Closed'}
                  </span>
                </li>
              ))}
            </ul>
          </nav>

          {/* Practice */}
          <nav aria-labelledby="footer-practice">
            <h2
              id="footer-practice"
              className="text-[0.8125rem] font-semibold text-white"
            >
              Practice
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {practiceLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-[0.8125rem] font-semibold text-white">
              Legal
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Emergency guidance. Stated plainly, because a dental practice is not
            an emergency department and the site should never imply otherwise. */}
        <div className="mt-14 rounded-card border border-line-dark bg-white/[0.03] p-5">
          <h2 className="text-[0.8125rem] font-semibold text-white">
            In a medical emergency
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/65">
            {clinic.emergency.hospitalGuidance} For urgent dental problems
            during opening hours, phone{' '}
            <a
              href={`tel:${clinic.telephone.e164}`}
              className="font-medium text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"
            >
              {clinic.telephone.display}
            </a>{' '}
            or{' '}
            <Link
              href="/emergency"
              className="font-medium text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"
            >
              find the earliest appointment
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-line-dark pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">
            &copy; {new Date().getFullYear()} {clinic.legalName}. All rights
            reserved.
          </p>
          <div className="flex items-center gap-2">
            <a
              href={clinic.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Harbour Dental Studio on Facebook"
              className="flex size-9 items-center justify-center rounded-panel text-white/55 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <FacebookIcon className="size-4" />
            </a>
            <a
              href={clinic.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Harbour Dental Studio on Instagram"
              className="flex size-9 items-center justify-center rounded-panel text-white/55 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <InstagramIcon className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
