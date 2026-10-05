import Link from 'next/link';
import { PageHero } from '@/components/layout/PageHero';
import { clinic } from '@/data/clinic';

/**
 * Shared shell for the legal pages.
 *
 * One layout for all five, so replacing the wording is a content change in one
 * file each rather than a redesign. The prose styles are defined here rather
 * than with a typography plugin, which keeps these pages readable without
 * pulling in another dependency for five documents.
 */

export interface LegalSection {
  readonly heading: string;
  readonly paragraphs?: readonly string[];
  readonly list?: readonly string[];
}

const legalPages = [
  { href: '/legal/privacy', label: 'Privacy and POPIA' },
  { href: '/legal/terms', label: 'Terms of use' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/patient-information', label: 'Patient information' },
  { href: '/legal/cancellation', label: 'Cancellation policy' },
];

export function LegalPage({
  title,
  intro,
  updated,
  sections,
  current,
}: {
  readonly title: string;
  readonly intro: string;
  readonly updated: string;
  readonly sections: readonly LegalSection[];
  readonly current: string;
}) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={title}
        lede={intro}
        crumbs={[{ name: title, path: current }]}
      />

      <div className="bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,16rem)_1fr] lg:gap-16">
            {/* Sibling documents */}
            <nav aria-label="Legal documents" className="lg:sticky lg:top-24 lg:self-start">
              <h2 className="text-[0.8125rem] font-semibold text-ink">
                Documents
              </h2>
              <ul className="mt-3 flex flex-col gap-1">
                {legalPages.map((page) => {
                  const active = page.href === current;
                  return (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        aria-current={active ? 'page' : undefined}
                        className={
                          active
                            ? 'block rounded-panel bg-blue-soft px-3 py-2 text-[0.8125rem] font-medium text-blue-deep'
                            : 'block rounded-panel px-3 py-2 text-[0.8125rem] text-grey-strong transition-colors duration-[--duration-feedback] hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue'
                        }
                      >
                        {page.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 rounded-card border border-line bg-canvas p-4">
                <p className="text-[0.8125rem] font-semibold text-ink">
                  Questions about this?
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-grey-strong">
                  Contact the practice and ask for the information officer.
                </p>
                <a
                  href={`mailto:${clinic.email}`}
                  className="mt-2 inline-block break-all text-[0.8125rem] font-medium text-blue underline decoration-blue/30 underline-offset-2 hover:decoration-blue"
                >
                  {clinic.email}
                </a>
              </div>
            </nav>

            {/* Document body */}
            <article className="min-w-0 max-w-2xl">
              <p className="text-[0.8125rem] text-grey-strong">
                Last updated <time dateTime={updated}>{formatUpdated(updated)}</time>
              </p>

              <div className="mt-8 flex flex-col gap-10">
                {sections.map((section) => (
                  <section key={section.heading}>
                    <h2 className="text-[1.125rem] font-semibold text-ink">
                      {section.heading}
                    </h2>
                    {section.paragraphs && (
                      <div className="mt-3 flex flex-col gap-3">
                        {section.paragraphs.map((paragraph) => (
                          <p
                            key={paragraph.slice(0, 40)}
                            className="text-[0.9375rem] leading-relaxed text-charcoal"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    )}
                    {section.list && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {section.list.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-charcoal"
                          >
                            <span
                              className="mt-2 size-1.5 shrink-0 rounded-full bg-blue"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

function formatUpdated(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
