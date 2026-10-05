import { Car, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/cn';
import { addressLines, clinic, formatAddressOneLine } from '@/data/clinic';

/**
 * Location panel.
 *
 * Deliberately self-contained: no embedded map, no tile server, no API key and
 * no third-party script. An embed would be one more thing that can fail, be
 * blocked, or need a billing account before the site works, and it is not
 * actually what a patient needs. What they need is the address, how to park,
 * and a one-tap handoff to the mapping app already on their phone.
 *
 * The "open in" links are plain URL schemes rather than API calls, so they
 * work with no configuration. If the practice later wants a rendered map,
 * a Google Static Maps or Mapbox image drops into the frame below and the
 * key goes in .env; nothing else here changes.
 */
export function MapPanel({ className }: { readonly className?: string }) {
  const query = encodeURIComponent(
    `${clinic.name}, ${formatAddressOneLine()}`,
  );
  const coords = `${clinic.geo.latitude},${clinic.geo.longitude}`;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-card border border-line bg-white',
        className,
      )}
    >
      {/* Frame. A rendered map tile would sit here once a provider is
          configured. Until then this is an honest abstract placeholder rather
          than a pretend map with invented streets on it. */}
      <div className="relative aspect-[4/3] bg-canvas-deep sm:aspect-[16/10]">
        <svg
          aria-hidden="true"
          className="absolute inset-0 size-full text-line-strong"
          preserveAspectRatio="none"
          viewBox="0 0 400 250"
        >
          <defs>
            <pattern
              id="map-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M40 0H0v40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="400" height="250" fill="url(#map-grid)" />
          {/* A single emphasised line standing in for the main road. */}
          <path
            d="M-10 170 L410 110"
            stroke="currentColor"
            strokeWidth="10"
            opacity="0.5"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-blue text-white shadow-[0_6px_16px_-4px_rgb(7_61_158/0.45)]">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-ink">{clinic.name}</p>
          <address className="text-[0.8125rem] not-italic leading-relaxed text-grey-strong">
            {addressLines().map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      </div>

      <div className="border-t border-line p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-panel border border-line-strong bg-white text-sm font-medium text-ink transition-colors duration-[--duration-feedback] hover:border-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <Navigation className="size-4" aria-hidden="true" />
            Open in Google Maps
            <ExternalLink className="size-3.5 text-grey" aria-hidden="true" />
          </a>
          <a
            href={`https://maps.apple.com/?ll=${coords}&q=${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-panel border border-line-strong bg-white text-sm font-medium text-ink transition-colors duration-[--duration-feedback] hover:border-ink hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <Navigation className="size-4" aria-hidden="true" />
            Open in Apple Maps
            <ExternalLink className="size-3.5 text-grey" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-4 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-grey-strong">
          <Car className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
          <span>{clinic.parking.summary}</span>
        </p>
      </div>
    </div>
  );
}
