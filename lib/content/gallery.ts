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
    id: "lawn-two-person-crew",
    src: "/images/gallery/lawn-mowing/two-person-crew-mow-trim-firepit.webp",
    alt: "Two-person PVS lawn crew mowing and string-trimming around a stone fire pit in a fenced backyard",
    caption: "Lawn care · two-person crew",
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
    id: "gutter-harnessed-flush",
    src: "/images/gallery/gutter-cleaning/harnessed-tech-flushing-roof-gutters.webp",
    alt: "Harnessed PVS technician on a roof flushing gutters at a stone two-storey home in the Ottawa Valley",
    caption: "Gutter cleaning · roof flush",
    width: 1200,
    height: 1600,
  },
];
