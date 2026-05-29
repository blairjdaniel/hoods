"use client";

import React, { useEffect, useState } from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  objectKey: string; // key relative to the R2 bucket prefix, e.g. 'UTH/IMG_5698.JPG' or '004.png'
  fallback?: string;
  expireSeconds?: number;
  bucket?: string;
};

export default function R2Image({ objectKey, fallback, expireSeconds = 60, bucket, ...imgProps }: Props){
  const [src, setSrc] = useState<string | undefined>(fallback);

  useEffect(()=>{
    let mounted = true;
    async function load(){
      try{
        let url = `/api/r2-url?key=${encodeURIComponent(objectKey)}&expires=${expireSeconds}`;
        if (typeof bucket === 'string' && bucket.length) {
          url += `&bucket=${encodeURIComponent(bucket)}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('r2-url failed');
        const json = await res.json();
        if (json.url && mounted) setSrc(json.url);
      }catch(e){
        // keep fallback
        console.warn('R2Image load failed', objectKey, e);
      }
    }
    load();
    return ()=>{ mounted = false };
  }, [objectKey, expireSeconds, bucket]);

  return <img {...imgProps} src={src} />;
}
