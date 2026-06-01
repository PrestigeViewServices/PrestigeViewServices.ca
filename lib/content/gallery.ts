/**
 * Recent Work gallery — feeds the home page <GalleryStrip />.
 *
 * Add an entry per photo. `src` is relative to /public.
 * Filenames must be lowercase, hyphen-separated, no spaces — see
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

export const gallery: GalleryPhoto[] = [
  {
    id: "windows-interior-team",
    src: "/images/gallery/window-cleaning/interior-team-action.jpg",
    alt: "Two PVS technicians cleaning interior glass partitions on ladders",
    caption: "Interior commercial · Petawawa",
    width: 1200,
    height: 1600,
  },
  {
    id: "windows-aw-rain",
    src: "/images/gallery/window-cleaning/aw-exterior-rain.jpg",
    alt: "PVS technician cleaning A&W storefront windows on a rainy day",
    caption: "A&W exterior · Petawawa",
    width: 1200,
    height: 1600,
  },
  {
    id: "windows-residential-uniform",
    src: "/images/gallery/window-cleaning/residential-pvs-uniform.jpg",
    alt: "PVS technician in branded uniform cleaning a residential window",
    caption: "Residential exterior · Ottawa Valley",
    width: 1600,
    height: 1200,
  },
  {
    id: "windows-neighbours",
    src: "/images/gallery/window-cleaning/neighbours-storefront.jpg",
    alt: "PVS technician cleaning Neighbours storefront windows from a ladder",
    caption: "Neighbours storefront",
    width: 1200,
    height: 1600,
  },
  {
    id: "windows-pembroke-victorian",
    src: "/images/gallery/window-cleaning/pembroke-victorian-home.jpg",
    alt: "Cleaned exterior of a red brick Victorian home in Pembroke",
    caption: "Pembroke Victorian · finished",
    width: 1200,
    height: 1600,
  },
  {
    id: "windows-cape-cod",
    src: "/images/gallery/window-cleaning/cape-cod-home.jpg",
    alt: "Cleaned exterior of a white Cape Cod home with garden beds",
    caption: "Cape Cod residence · finished",
    width: 1200,
    height: 1600,
  },
];
