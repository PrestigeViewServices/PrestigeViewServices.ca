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
    id: "interlock-walkway-after",
    src: "/images/gallery/landscaping/interlock-walkway-after-charcoal-border.webp",
    alt: "New interlock front walkway with charcoal paver border built by PVS in Petawawa",
    caption: "Interlock · new walkway",
    width: 1200,
    height: 1600,
  },
  {
    id: "lawn-backyard-stripes",
    src: "/images/gallery/lawn-mowing/stand-on-mower-backyard-stripes.webp",
    alt: "Freshly striped backyard lawn cut with a stand-on mower in Petawawa",
    caption: "Lawn care · fresh stripes",
    width: 1200,
    height: 1600,
  },
  {
    id: "windows-heritage-home",
    src: "/images/gallery/window-cleaning/heritage-home-bay-window-clean.webp",
    alt: "Heritage brick home in Pembroke with clean bay windows after professional window cleaning",
    caption: "Window cleaning · heritage home",
    width: 1200,
    height: 1600,
  },
  {
    id: "landscaping-pool-reclaim",
    src: "/images/gallery/landscaping/pool-deck-after-topsoil-pool.webp",
    alt: "Backyard pool surrounded by freshly graded topsoil after a PVS landscaping rebuild",
    caption: "Landscaping · poolside reclaim",
    width: 1200,
    height: 1600,
  },
  {
    id: "snow-sunrise-clearing",
    src: "/images/gallery/snow-removal/tractor-snowblowing-sunrise-residential.webp",
    alt: "PVS tractor snow-blowing a residential driveway at sunrise after an overnight storm",
    caption: "Snow removal · sunrise clearing",
    width: 1350,
    height: 1800,
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
