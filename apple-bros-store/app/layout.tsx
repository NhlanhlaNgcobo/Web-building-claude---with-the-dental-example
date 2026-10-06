import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { store, siteUrl } from '@/data/store';
import './globals.css';

/**
 * One family for everything structural, plus a mono reserved for technical
 * data: storage sizes, battery health, SKUs, prices in a table. Specifications
 * set in mono read as specifications, which is exactly the signal a shop
 * selling graded hardware wants to send.
 *
 * Both are loaded through next/font, so the CSS is inlined, the files are
 * self-hosted, and there is no layout shift from a late webfont.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--font-mono-spec',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${store.name} | Refurbished Apple devices in South Africa`,
    template: `%s | ${store.name}`,
  },
  description:
    'Graded, tested and guaranteed Apple devices. iPhone, Mac, iPad, Apple Watch and AirPods, every one with published condition grades, stated battery health and twelve months of cover.',
  applicationName: store.name,
  creator: store.name,
  publisher: store.name,
  formatDetection: { telephone: true, address: false, email: true },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    siteName: store.name,
    url: siteUrl(),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  other: {
    // Stated in the document itself as well as in the footer, so it travels
    // with the page wherever it is scraped or syndicated.
    'trademark-notice': store.independenceNotice,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Not capped: somebody reading a battery health figure must be able to
  // zoom in on it.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-ZA" className={`${jakarta.variable} ${mono.variable}`}>
      <body>
        {/* First tabbable element on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-toast focus:rounded-panel focus:bg-ink focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
