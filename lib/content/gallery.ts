/**
 * Recent Work gallery, feeds the home page <GalleryStrip />.
 *
 * Add an entry per photo. `src` is relative to /public.
 * Filenames must be lowercase, hyphen-separated, no spaces, see
 * /public/images/README.md for recommended dimensions and starter names.
 *
 * If this array is empty, the gallery section is hidden on the home page.
 */
export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  /** Intrinsic width / height of the source file. */
  width: number;
  height: number;
};

// Home page "Recent Work" strip, one or two picks per service so the
// strip showcases the full range of PVS work at a glance. For the full
// per-service galleries, see lib/content/work-categories.ts.
export const gallery: GalleryPhoto[] = [
  {
    id: "windows-timber-home",
    src: "/images/gallery/window-cleaning/timber-home-streakfree.jpg",
    alt: "Large timber-frame home with streak-free windows after professional exterior window cleaning in the Ottawa Valley",
    caption: "Window cleaning · streak-free",
    width: 900,
    height: 1600,
  },
  {
    id: "lawn-aerial",
    src: "/images/gallery/lawn-mowing/aerial-drone-property.jpg",
    alt: "Aerial drone view of a freshly mowed residential property",
    caption: "Lawn care · aerial",
    width: 1600,
    height: 1200,
  },
  {
    id: "snow-tractor",
    src: "/images/gallery/snow-removal/snow-job-05.jpg",
    alt: "PVS tractor with snowblower clearing a residential driveway in the Ottawa Valley",
    caption: "Snow removal · Ottawa Valley",
    width: 1200,
    height: 1600,
  },
  {
    id: "pressure-deck-after",
    src: "/images/gallery/pressure-washing/pressure-job-07.jpg",
    alt: "Freshly soft-washed wood deck with hot tub and chiminea in golden afternoon light, Ottawa Valley",
    caption: "Pressure wash · deck reveal",
    width: 1600,
    height: 1200,
  },
  {
    id: "junk-trailer",
    src: "/images/gallery/junk-removal/junk-job-01.jpg",
    alt: "PVS trailer loaded with junk and debris ready for disposal",
    caption: "Junk removal · loaded",
    width: 1600,
    height: 1200,
  },
  {
    id: "gutter-clean-after",
    src: "/images/gallery/gutter-cleaning/gutter-clean-after.jpg",
    alt: "Spotless residential gutter and downspout flowing freely after a PVS gutter cleaning in the Ottawa Valley",
    caption: "Gutter cleaning · after",
    width: 1200,
    height: 1600,
  },
];
