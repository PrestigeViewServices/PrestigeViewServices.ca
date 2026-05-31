"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type Props = Omit<ImageProps, "onError"> & {
  /** What to render if the image 404s (or otherwise fails to load). */
  fallback: React.ReactNode;
};

/**
 * Wraps next/image with a graceful onError fallback. Used by <BrandLockup />
 * so the page still renders cleanly when the logo file hasn't been dropped
 * into /public/images/ yet.
 */
export function LogoWithFallback({ fallback, alt, ...imageProps }: Props) {
  const [errored, setErrored] = useState(false);
  if (errored) return <>{fallback}</>;
  return <Image alt={alt} {...imageProps} onError={() => setErrored(true)} />;
}
