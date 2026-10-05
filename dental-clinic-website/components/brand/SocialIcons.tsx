/**
 * Social platform marks.
 *
 * lucide-react removed brand logos in version 1, so these two are inlined.
 * Kept to single paths at the same 24 unit grid as the lucide icons they sit
 * beside, so stroke weight and optical size stay consistent.
 */

export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.24-1.46 1.48-1.46h1.58V4.46A21 21 0 0 0 14.75 4c-2.28 0-3.85 1.4-3.85 3.95v2.55H8.3v3h2.6V21z" />
    </svg>
  );
}

export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
