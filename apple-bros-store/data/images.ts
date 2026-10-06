/**
 * Every photograph on the site, in one place.
 *
 * Replacing these with the shop's own product photography is a single-file
 * change: swap the id, keep the key. Product photography should be shot on
 * white at a consistent distance, because a grid of cut-out devices is what
 * makes a catalogue look expensive and a grid of mismatched crops is what
 * makes it look like a marketplace listing.
 */

const BASE = 'https://images.unsplash.com/photo-';

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

/** One neutral swatch, used for the blur-up on every remote image. */
export const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#f1f1f3"/></svg>',
  ).toString('base64');

export const ASPECT = {
  /** Hero and full-width editorial. */
  wide: { w: 1920, h: 1080 },
  /** Product cards and the product gallery. Square suits cut-out devices. */
  square: { w: 1000, h: 1000 },
  /** Category tiles. */
  tile: { w: 900, h: 675 },
  /** Two-up feature panels. */
  feature: { w: 1280, h: 960 },
} as const;

/* ------------------------------------------------------------------ */
/* Site photography                                                    */
/* ------------------------------------------------------------------ */

export const siteImages = {
  hero: {
    src: photo('1592750475338-74b7b21085ab', ASPECT.wide.w, ASPECT.wide.h),
    alt: 'An iPhone photographed against a plain background, showing its rear camera array',
  },
  heroAlt: {
    src: photo('1726587912121-ea21fcc57ff8', ASPECT.wide.w, ASPECT.wide.h),
    alt: 'Two iPhones side by side on a plain grey background',
  },
  workbench: {
    src: photo('1601283269280-df0b0cb47da3', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A device being tested on a clean white workbench',
  },
  lineup: {
    src: photo('1561419489-5650de8b8849', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A MacBook Air, iPad and iPhone arranged together on a desk',
  },
  tradeIn: {
    src: photo('1726574686436-5ef90358e032', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'A person holding an iPhone, ready to hand it over',
  },
  accessories: {
    src: photo('1593273757264-9ff6e8ba5ee7', ASPECT.feature.w, ASPECT.feature.h),
    alt: 'Charging cables and adapters arranged on a white surface',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Category tiles                                                      */
/* ------------------------------------------------------------------ */

export const categoryImages: Record<string, string> = {
  iphone: photo('1591337676887-a217a6970a8a', ASPECT.tile.w, ASPECT.tile.h),
  ipad: photo('1571599164516-bacd34e651f7', ASPECT.tile.w, ASPECT.tile.h),
  mac: photo('1588524594091-77b993b0619f', ASPECT.tile.w, ASPECT.tile.h),
  watch: photo('1602174528421-6c3e5b00e565', ASPECT.tile.w, ASPECT.tile.h),
  audio: photo('1781275370365-d97490e563d6', ASPECT.tile.w, ASPECT.tile.h),
  accessories: photo('1593273757264-9ff6e8ba5ee7', ASPECT.tile.w, ASPECT.tile.h),
};

/* ------------------------------------------------------------------ */
/* Product photography, keyed by product slug                          */
/* ------------------------------------------------------------------ */

const P = (id: string) => photo(id, ASPECT.square.w, ASPECT.square.h);

export const productImages: Record<string, readonly { src: string; alt: string }[]> = {
  'iphone-16-pro': [
    { src: P('1726587912121-ea21fcc57ff8'), alt: 'iPhone 16 Pro, rear view showing the camera array' },
    { src: P('1592750475338-74b7b21085ab'), alt: 'iPhone 16 Pro photographed at an angle' },
  ],
  'iphone-16': [
    { src: P('1757710436034-f1d7372ec1be'), alt: 'iPhone 16 in a bright finish' },
    { src: P('1726732946451-98690db97aae'), alt: 'Two iPhone 16 handsets side by side' },
  ],
  'iphone-15-pro': [
    { src: P('1592750475338-74b7b21085ab'), alt: 'iPhone 15 Pro, rear view showing the triple camera' },
    { src: P('1678685888221-cda773a3dcdb'), alt: 'iPhone 15 Pro held in one hand' },
  ],
  'iphone-15': [
    { src: P('1757709608566-4b9fd41a7af5'), alt: 'iPhone 15 in a warm finish' },
    { src: P('1596558450268-9c27524ba856'), alt: 'iPhone 15 home screen' },
  ],
  'iphone-14': [
    { src: P('1591337676887-a217a6970a8a'), alt: 'iPhone 14, rear view showing the dual camera' },
    { src: P('1616410011236-7a42121dd981'), alt: 'Three iPhone 14 handsets in different finishes' },
  ],
  'iphone-13': [
    { src: P('1612531386530-97286d97c2d2'), alt: 'iPhone 13 photographed on a plain surface' },
    { src: P('1764746250417-2cc103a45a56'), alt: 'iPhone 13 at an angle on a dark surface' },
  ],
  'macbook-air-m3': [
    { src: P('1588524594091-77b993b0619f'), alt: 'MacBook Air open on a desk' },
    { src: P('1599355397843-718871791ad3'), alt: 'MacBook Air closed, viewed from above' },
  ],
  'macbook-pro-14': [
    { src: P('1682427286790-56b350b3cb9c'), alt: 'MacBook Pro open on a wooden desk' },
    { src: P('1623970440870-9e0935f7d08b'), alt: 'MacBook Pro with an iPhone resting on it' },
  ],
  'ipad-air-m2': [
    { src: P('1571599164516-bacd34e651f7'), alt: 'iPad Air viewed from the front' },
    { src: P('1734530982412-772985990038'), alt: 'iPad Air alongside a laptop and mouse' },
  ],
  'ipad-10th-gen': [
    { src: P('1734530982412-772985990038'), alt: 'iPad on a table with accessories' },
    { src: P('1571599164516-bacd34e651f7'), alt: 'iPad viewed from the front' },
  ],
  'apple-watch-series-9': [
    { src: P('1602174528421-6c3e5b00e565'), alt: 'Apple Watch Series 9 with a blue band' },
    { src: P('1630453016489-051c93aba7ef'), alt: 'Apple Watch resting beside a MacBook' },
  ],
  'apple-watch-se': [
    { src: P('1602174528367-7ed9fc0737e4'), alt: 'Apple Watch SE with a black band' },
    { src: P('1602655787017-e3851403fb7c'), alt: 'Apple Watch SE beside an iPhone' },
  ],
  'airpods-pro-2': [
    { src: P('1609692814858-f7cd2f0afa4f'), alt: 'AirPods Pro beside an iPhone and a watch' },
    { src: P('1781275370365-d97490e563d6'), alt: 'AirPods Max and a MacBook on a desk' },
  ],
  'usb-c-charge-cable': [
    { src: P('1593273757264-9ff6e8ba5ee7'), alt: 'A white charging cable coiled on a plain surface' },
  ],
  'magsafe-charger': [
    { src: P('1593273757264-9ff6e8ba5ee7'), alt: 'A wireless charging puck and cable' },
  ],
  'silicone-case': [
    { src: P('1736173155811-e8142fd553ee'), alt: 'A protective phone case on a table' },
  ],
};

export const IMAGE_HOSTNAME = 'images.unsplash.com';
