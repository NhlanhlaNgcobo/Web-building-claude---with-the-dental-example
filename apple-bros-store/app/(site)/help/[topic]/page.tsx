import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { helpTopicBySlug, helpTopics } from '@/data/help';
import { JsonLd, breadcrumbSchema, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return helpTopics.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/help/[topic]'>): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = helpTopicBySlug(slug);
  if (!topic) {
    return pageMetadata({
      title: 'Not found',
      description: 'This help page does not exist.',
      path: `/help/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: topic.title,
    description: topic.metaDescription,
    path: `/help/${topic.slug}`,
  });
}

export default async function HelpTopicPage({
  params,
}: PageProps<'/help/[topic]'>) {
  const { topic: slug } = await params;
  const topic = helpTopicBySlug(slug);
  if (!topic) notFound();

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Help', path: '/help' },
    { name: topic.title, path: `/help/${topic.slug}` },
  ];

  const others = helpTopics.filter((t) => t.slug !== topic.slug);

  return (
    <>
      <JsonLd schema={breadcrumbSchema(crumbs)} />

      <div className="border-b border-line bg-white pt-16 lg:pt-[4.5rem]">
        <div className="container-page py-8 lg:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="text-display mt-5 max-w-3xl text-[2rem] text-ink sm:text-[2.5rem]">
            {topic.title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-grey-strong">
            {topic.summary}
          </p>
        </div>
      </div>

      <div className="bg-white py-12 lg:py-16">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_16rem] lg:gap-16">
          <article className="max-w-2xl">
            {topic.sections.map((section) => (
              <section key={section.heading} className="mb-10 last:mb-0">
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
                  <ul className="mt-4 flex flex-col gap-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5">
                        <Check
                          className="mt-1 size-3.5 shrink-0 text-leaf"
                          aria-hidden="true"
                        />
                        <span className="text-pretty text-[0.9375rem] leading-relaxed text-ink">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-[0.6875rem] font-semibold uppercase text-grey-strong">
              Also worth reading
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/help/${other.slug}`}
                    className="block rounded-card border border-line bg-paper p-4 transition-[border-color] duration-[--duration-feedback] hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  >
                    <span className="block text-[0.9375rem] font-semibold text-ink">
                      {other.title}
                    </span>
                    <span className="mt-1 block text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                      {other.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-card border border-line bg-white p-4">
              <p className="text-[0.875rem] font-semibold text-ink">
                Still not answered?
              </p>
              <p className="mt-1 text-pretty text-[0.8125rem] leading-relaxed text-grey-strong">
                Send us the question and we will answer it properly.
              </p>
              <ButtonLink href="/contact" variant="secondary" size="sm" className="mt-4">
                Contact us
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
