import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { legalDocumentBySlug, legalDocuments } from '@/data/legal';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return legalDocuments.map((doc) => ({ document: doc.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/legal/[document]'>): Promise<Metadata> {
  const { document: slug } = await params;
  const doc = legalDocumentBySlug(slug);
  if (!doc) {
    return pageMetadata({
      title: 'Not found',
      description: 'This page does not exist.',
      path: `/legal/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: doc.title,
    description: doc.summary,
    path: `/legal/${doc.slug}`,
  });
}

export default async function LegalPage({
  params,
}: PageProps<'/legal/[document]'>) {
  const { document: slug } = await params;
  const doc = legalDocumentBySlug(slug);
  if (!doc) notFound();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: doc.title, path: `/legal/${doc.slug}` },
  ];

  const updated = new Date(doc.updated).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <JsonLd schema={breadcrumbSchema(crumbs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 text-[2rem] text-ink sm:text-[2.5rem]">
            {doc.title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            {doc.summary}
          </p>
          <p className="mt-3 text-[0.8125rem] text-grey">Last updated {updated}</p>
        </div>
      </div>

      <div className="bg-white py-12 lg:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
          {/* A contents list, because these are long and people arrive looking
              for one specific paragraph. */}
          <nav
            aria-label="On this page"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              On this page
            </h2>
            <ol className="mt-4 flex flex-col gap-2">
              {doc.sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#section-${index}`}
                    className="rounded-panel text-[0.8125rem] leading-relaxed text-grey-strong transition-colors duration-[--duration-feedback] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>

            <div className="mt-6 border-t border-line pt-6">
              <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
                The other one
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {legalDocuments
                  .filter((other) => other.slug !== doc.slug)
                  .map((other) => (
                    <li key={other.slug}>
                      <Link
                        href={`/legal/${other.slug}`}
                        className="rounded-panel text-[0.8125rem] font-medium text-ink underline decoration-red decoration-2 underline-offset-2 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                      >
                        {other.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </nav>

          <article className="max-w-2xl">
            {doc.sections.map((section, index) => (
              <section
                key={section.heading}
                id={`section-${index}`}
                className="mb-10 scroll-mt-24 last:mb-0"
              >
                <h2 className="text-[1.25rem] font-bold text-ink">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mt-3 text-pretty text-[1rem] leading-relaxed text-grey-strong"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 flex list-disc flex-col gap-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-pretty text-[0.9375rem] leading-relaxed text-grey-strong marker:text-red"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
        </div>
      </div>
    </>
  );
}
