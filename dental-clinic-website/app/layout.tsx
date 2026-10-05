import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { clinic, siteUrl } from '@/data/clinic';
import { JsonLd, dentistSchema } from '@/lib/seo';
import './globals.css';

/**
 * Inter carries everything structural. Instrument Serif appears only on a
 * small number of editorial headings, where its single weight and narrow
 * proportions read as considered rather than decorative.
 *
 * Both are loaded through next/font, so the CSS is inlined, the files are
 * self-hosted, and there is no layout shift from a late-arriving webfont.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-instrument-serif',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${clinic.name} | Dentist in Durban`,
    template: `%s | ${clinic.name}`,
  },
  description:
    'A private dental practice on Florida Road, Morningside. Examinations, hygiene, cosmetic and restorative treatment, with same-day urgent appointments and online booking.',
  applicationName: clinic.name,
  authors: [{ name: clinic.name }],
  creator: clinic.name,
  publisher: clinic.name,
  formatDetection: { telephone: true, address: false, email: true },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    siteName: clinic.name,
    url: siteUrl(),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Deliberately not capped: a patient who needs to zoom in to read a time
  // must be able to.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0b0d' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en-ZA"
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <body>
        {/* First tabbable element on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-panel focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <JsonLd schema={dentistSchema()} />
      </body>
    </html>
  );
}
