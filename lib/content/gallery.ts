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
    id: "sample",
    src: "/images/gallery/sample.svg",
    alt: "Sample placeholder — replace with a real photo",
    caption: "Replace this with a real photo",
    width: 1600,
    height: 1067,
  },
  // Examples — uncomment & drop the matching files into /public/images/gallery/
  // {
  //   id: "lawn-after",
  //   src: "/images/gallery/lawn-after.jpg",
  //   alt: "Freshly mowed lawn with crisp edging — Petawawa",
  //   caption: "Weekly mow & edge · Petawawa",
  //   width: 1600,
  //   height: 1067,
  // },
  // {
  //   id: "windows-after",
  //   src: "/images/gallery/windows-after.jpg",
  //   alt: "Streak-free interior window cleaning result",
  //   caption: "Streak-free windows · Pembroke",
  //   width: 1600,
  //   height: 1067,
  // },
];
