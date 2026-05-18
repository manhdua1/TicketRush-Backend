"use client";

import Image, { type ImageLoader } from "next/image";
import { useMemo, useState } from "react";

export type AvatarProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

const passthroughLoader: ImageLoader = ({ src }) => src;

export default function Avatar({ src, alt, className }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedSrc = useMemo(() => {
    if (!src) return "/default-avatar.svg";
    if (hasError) return "/default-avatar.svg";
    return src;
  }, [hasError, src]);

  return (
    <Image
      loader={passthroughLoader}
      unoptimized
      src={resolvedSrc}
      alt={alt}
      width={256}
      height={256}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
