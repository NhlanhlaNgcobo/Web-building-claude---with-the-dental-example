/**
 * Every photograph used on the site, in one place.
 *
 * Replacing these with the practice's own photography is a single-file change:
 * swap the URL, keep the key. The aspect ratio constants below are what keep
 * cropping consistent across cards, portraits and editorial blocks, so a
 * replacement shoot should be supplied at or above the listed widths.
 */

const BASE = 'https://images.unsplash.com/photo-';

/** Build a cropped, quality-capped source URL at a fixed aspect ratio. */
function photo(id: string, width: number, height: number): string {
  const params = new URLSearchParams({
    w: String(width),
    h: String(height),
    q: '80',
    fit: 'crop',
    crop: 'entropy',
    auto: 'format',
  });
  return `${BASE}${id}?${params.toString()}`;
}

/**
 * A single neutral placeholder used for the blur-up transition on every remote
 * image. One shared 8x5 gradient-free swatch keeps the markup small and avoids
 * a per-image round trip to generate real blur data.
 */
export const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="5"><rect width="8" height="5" fill="#e6ecf6"/></svg>',
  ).toString('base64');

/* ------------------------------------------------------------------ */
/* Aspect ratios, applied consistently across the site                 */
/* ------------------------------------------------------------------ */

export const ASPECT = {
  /** Hero and full-width editorial blocks. */
  wide: { w: 1920, h: 1080 },
  /** Treatment and section cards. */
  card: { w: 960, h: 720 },
  /** Dentist portraits, upright editorial crop. */
  portrait: { w: 900, h: 1125 },
  /** Product photography, square. */
  square: { w: 900, h: 900 },
  /** Two-up feature panels. */
  feature: { w: 1280, h: 960 },
} as const;

/* ------------------------------------------------------------------ */
/* Clinic photography                                                  */
/* ------------------------------------------------------------------ */

export const clinicImages = {
  hero: {
    src: photo('1629909613654-28e377c37b09', ASPECT.wide.w, ASPECT.wide.h),
    alt: 'A treatment room at Harbour Dental Studio, with the chair positioned beside a bright window',
  },
  heroPortrait: {
    src: photo('1629909613654-28e377c37b09', 1200, 1500),
    alt: 'A treatment room at Harbour Dental Studio, with the chair positioned beside a bright window',
  },
  reception: {
    src: photo('1629909614456-6b1c5c94cecc', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'The waiting area at the practice, with seating beside a planted corner',
  },
  treatmentRoom: {
    src: photo('1643660526741-094639fbe53a', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A treatment room with the chair reclined and the overhead light drawn back',
  },
  treatmentRoomAlt: {
    src: photo('1643916800611-1302e8d27c38', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A treatment room lit from above by a skylight',
  },
  consultation: {
    src: photo('1777331903190-341a3dd0441b', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A dentist talking through treatment options with a patient before starting',
  },
  consultationRoom: {
    src: photo('1704455306251-b4634215d98f', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A consultation room set up with a desk and seating for treatment planning',
  },
  instruments: {
    src: photo('1606811856475-5e6fcdc6e509', ASPECT.card.w, ASPECT.card.h),
    alt: 'A sterilised dental mirror and probe laid out on a clean surface',
  },
  equipment: {
    src: photo('1598256989800-fe5f95da9787', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'Treatment chair and equipment in a bright clinical room',
  },
  scanner: {
    src: photo('1643660527098-559f89e45a92', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A chairside monitor used to show scans and images during an appointment',
  },
  team: {
    src: photo('1588776814546-daab30f310ce', ASPECT.wide.w, ASPECT.wide.h),
    alt: 'Two clinicians working together during a procedure',
  },
  exterior: {
    src: photo('1616391182219-e080b4d1043a', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'Seating in the practice entrance',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Dentist portraits                                                   */
/* ------------------------------------------------------------------ */

export const dentistImages = {
  'dr-anika-naidoo': photo(
    '1736289173074-df6009da27c9',
    ASPECT.portrait.w,
    ASPECT.portrait.h,
  ),
  'dr-sibusiso-mkhize': photo(
    '1645066928295-2506defde470',
    ASPECT.portrait.w,
    ASPECT.portrait.h,
  ),
  'dr-leila-govender': photo(
    '1594824476967-48c8b964273f',
    ASPECT.portrait.w,
    ASPECT.portrait.h,
  ),
} as const;

/* ------------------------------------------------------------------ */
/* Treatment photography, keyed by treatment slug                      */
/* ------------------------------------------------------------------ */

export const treatmentImages: Record<string, string> = {
  'dental-examination': photo('1777331903190-341a3dd0441b', ASPECT.card.w, ASPECT.card.h),
  'professional-cleaning': photo('1598256989800-fe5f95da9787', ASPECT.card.w, ASPECT.card.h),
  fillings: photo('1657470179447-0f5aa16daa91', ASPECT.card.w, ASPECT.card.h),
  'root-canal-treatment': photo('1662837625421-5fd8ed6131a0', ASPECT.card.w, ASPECT.card.h),
  crowns: photo('1643660527098-559f89e45a92', ASPECT.card.w, ASPECT.card.h),
  bridges: photo('1704455306251-b4634215d98f', ASPECT.card.w, ASPECT.card.h),
  'tooth-extraction': photo('1606811842243-af7e16970c1f', ASPECT.card.w, ASPECT.card.h),
  'wisdom-tooth-consultation': photo('1643224297379-54023dacf558', ASPECT.card.w, ASPECT.card.h),
  dentures: photo('1616391182219-e080b4d1043a', ASPECT.card.w, ASPECT.card.h),
  'dental-implant-consultation': photo('1643916800611-1302e8d27c38', ASPECT.card.w, ASPECT.card.h),
  'teeth-whitening': photo('1629909613654-28e377c37b09', ASPECT.card.w, ASPECT.card.h),
  'composite-bonding': photo('1606811856475-5e6fcdc6e509', ASPECT.card.w, ASPECT.card.h),
  veneers: photo('1643660526741-094639fbe53a', ASPECT.card.w, ASPECT.card.h),
  'emergency-dentistry': photo('1588776814546-daab30f310ce', ASPECT.card.w, ASPECT.card.h),
  'gum-health': photo('1629909614456-6b1c5c94cecc', ASPECT.card.w, ASPECT.card.h),
};

/* ------------------------------------------------------------------ */
/* Product photography, keyed by product slug                          */
/* ------------------------------------------------------------------ */

export const productImages: Record<string, string> = {
  'home-whitening-kit': photo('1641130331708-dd0cc94ae8e5', ASPECT.square.w, ASPECT.square.h),
  'sensitive-toothpaste': photo('1588774583125-bac783343696', ASPECT.square.w, ASPECT.square.h),
  'electric-toothbrush': photo('1575325342632-92615b50d3e2', ASPECT.square.w, ASPECT.square.h),
  'replacement-brush-heads': photo('1559671216-bda69517c47f', ASPECT.square.w, ASPECT.square.h),
  'interdental-brushes': photo('1582672509455-d2001e78a3a2', ASPECT.square.w, ASPECT.square.h),
  'waxed-dental-floss': photo('1627435602203-ce9de7b535be', ASPECT.square.w, ASPECT.square.h),
  'alcohol-free-mouthwash': photo('1626006864160-aa21716d0204', ASPECT.square.w, ASPECT.square.h),
  'travel-care-kit': photo('1674632655437-077f7edbe65c', ASPECT.square.w, ASPECT.square.h),
  'post-treatment-care-pack': photo('1590928192338-73e004fad28e', ASPECT.square.w, ASPECT.square.h),
};

/** The hostname that must be allowed in next.config.ts remotePatterns. */
export const IMAGE_HOSTNAME = 'images.unsplash.com';
