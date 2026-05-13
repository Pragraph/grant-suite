"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_SRC =
  "https://ik.imagekit.io/k5rticge6/Research%20Grant%20Landing%20Page.mp4?tr=f-auto,q-80";

const POSTER_SRC =
  "https://ik.imagekit.io/k5rticge6/Research%20Grant%20Landing%20Page.mp4/ik-thumbnail.jpg?tr=so-23,w-1280";

const POSTER_ALT =
  "Research Grant Suite workflow: from research idea to submission-ready proposal";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            /* autoplay rejected — poster stays visible */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={POSTER_SRC}
        alt={POSTER_ALT}
        className="aspect-video w-full object-cover"
        loading="eager"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster={POSTER_SRC}
      aria-hidden="true"
      disablePictureInPicture
    >
      <source src={VIDEO_SRC} type="video/mp4" />
    </video>
  );
}
