"use client";

import React from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallback?: string;
};

export default function ClientImage({ fallback, onError, ...rest }: Props) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (fallback && img.src !== fallback) img.src = fallback;
    if (onError) onError(e as any);
  };

  return <img {...rest} onError={handleError} />;
}
