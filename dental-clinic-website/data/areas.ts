import type { AreaPage } from '@/types';

/**
 * Location pages.
 *
 * The route at /areas/[slug] is deliberately driven from this file so that the
 * practice can add a genuinely useful page for a new area later. There are two
 * entries, not twelve: each one carries real travel, parking and landmark
 * information specific to that area. A page that only swaps a place name into
 * the same paragraph is worth nothing to a reader and nothing in search, so the
 * architecture supports more while the content stays limited to what we can
 * actually say something useful about.
 */
export const areas: readonly AreaPage[] = [
  {
    slug: 'umhlanga',
    name: 'Umhlanga',
    headline: 'A Durban dental practice within easy reach of Umhlanga',
    intro:
      'We see a good number of patients who live or work in Umhlanga and prefer to come into Morningside rather than stay on the ridge. The run down the M4 is short outside peak hours, and because our Saturday morning list is open you can usually avoid the commute entirely.',
    travel:
      'From Umhlanga Rocks, join the M4 south and come off at Argyle Road, then continue to Florida Road and turn right. It is roughly twenty minutes outside peak traffic, and closer to thirty five between seven and eight in the morning. Coming south after nine tends to be straightforward.',
    parking:
      'Park in the secure visitor bays behind the building, reached through the service lane. There is no need to look for space on Florida Road itself, which is metered on weekdays and busy over lunch.',
    landmarks: [
      'About twenty minutes from Umhlanga Village outside peak hours',
      'Straightforward run from Gateway along the M4',
      'Saturday morning appointments available, which avoids weekday traffic entirely',
    ],
  },
  {
    slug: 'morningside',
    name: 'Morningside',
    headline: 'Your dental practice on Florida Road, Morningside',
    intro:
      'We are on Florida Road itself, which makes us the local practice for Morningside, Windermere and the streets running down toward Problem Mkhize Road. For a good number of our patients this is a walk rather than a drive.',
    travel:
      'We are on Florida Road between the Innes Road and Lillian Ngoyi Road intersections. If you are coming from Windermere Road, cut across on Gordon Road. From the Berea, come along Musgrave and down Innes.',
    parking:
      'Secure visitor bays behind the building through the service lane, with a guard on duty during opening hours. If you are walking, the entrance is directly off Florida Road beside the pedestrian gate.',
    landmarks: [
      'On Florida Road between Innes Road and Lillian Ngoyi Road',
      'Walking distance from much of Morningside and Windermere',
      'A short drive from the Berea along Innes Road',
    ],
  },
];

export function getArea(slug: string): AreaPage | undefined {
  return areas.find((a) => a.slug === slug);
}
