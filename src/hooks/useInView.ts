"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref to attach to a DOM element and a boolean
 * indicating whether that element has entered the viewport.
 * Once triggered, stays true (one-shot reveal).
 */
export function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible] as const;
}
