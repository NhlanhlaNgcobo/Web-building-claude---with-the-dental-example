import Link from 'next/link';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { addressLines, store } from '@/data/store';

const shopLinks = [
  { href: '/shop/iphone', label: 'iPhone' },
  { href: '/shop/mac', label: 'Mac' },
  { href: '/shop/ipad', label: 'iPad' },
  { href: '/shop/watch', label: 'Apple Watch' },
  { href: '/shop/audio', label: 'AirPods' },
  { href: '/shop/accessories', label: 'Accessories' },
];

const helpLinks = [
  { href: '/grading', label: 'How we grade devices' },
  { href: '/trade-in', label: 'Trade in your device' },
  { href: '/order', label: 'Track your order' },
  { href: '/help/delivery', label: 'Delivery and collection' },
  { href: '/help/warranty', label: 'Warranty and repairs' },
  { href: '/help/returns', label: 'Returns' },
];

const aboutLinks = [
  { href: '/about', label: 'About the shop' },
  { href: '/contact', label: 'Contact us' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/legal/privacy', label: 'Privacy and POPIA' },
];

export function Footer() {
  const linkClass =
    'text-sm text-white/60 transition-colors duration-[--duration-feedback] ' +
    'hover:text-white rounded-panel focus-visible:outline-2 ' +
    'focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <footer className="bg-ink text-white">
      <div className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="white" id="footer" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
              Graded, tested and guaranteed Apple devices, from a shop in
              Rosebank run by people who actually use them.
            </p>

            <address className="mt-6 flex flex-col gap-3 not-italic">
              <a
                href={`tel:${store.telephone.e164}`}
                className="flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white"
              >
                <Phone className="size-4 shrink-0 text-red" aria-hidden="true" />
                <span className="tabular-nums">{store.telephone.display}</span>
              </a>
              <a
                href={`mailto:${store.email}`}
                className="flex items-center gap-2.5 text-sm text-white/80 transition-colors hover:text-white"
              >
                <Mail className="size-4 shrink-0 text-red" aria-hidden="true" />
                {store.email}
              </a>
              <span className="flex items-start gap-2.5 text-sm text-white/60">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-red"
                  aria-hidden="true"
                />
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

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="text-[0.8125rem] font-semibold">
              Shop
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-help">
            <h2 id="footer-help" className="text-[0.8125rem] font-semibold">
              Help
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-about">
            <h2 id="footer-about" className="text-[0.8125rem] font-semibold">
              The shop
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-[0.8125rem] font-semibold">Open</h2>
            <ul className="mt-4 flex flex-col gap-1.5">
              {store.openingHours.map((day) => (
                <li
                  key={day.day}
                  className="flex justify-between gap-4 text-sm text-white/60"
                >
                  <span>{day.day.slice(0, 3)}</span>
                  <span className="tabular-nums">
                    {day.opens ? `${day.opens} to ${day.closes}` : 'Closed'}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/*
          The independence notice, given real prominence rather than buried in
          six point grey. A customer needs to know whose warranty they have,
          and the business needs to be clear it is not claiming an affiliation
          it does not have.
        */}
        <div className="mt-14 flex items-start gap-3 rounded-card border border-line-dark bg-white/[0.03] p-5">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-red"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-[0.8125rem] font-semibold">
              An independent shop
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-white/60">
              {store.independenceNotice} Used devices are covered by our own{' '}
              <span className="tabular-nums">{store.usedWarrantyMonths}</span>{' '}
              month warranty rather than by the manufacturer.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line-dark pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">
            &copy; {new Date().getFullYear()} {store.legalName}. All prices
            include VAT.
          </p>
          {/*
            The company registration and VAT numbers belong here. They are
            omitted rather than invented, because a made-up registration
            number on a live retail site is a real problem. See the launch
            checklist in README.md.
          */}
          <p className="text-xs text-white/45">
            Registered in South Africa.
          </p>
        </div>
      </div>
    </footer>
  );
}
