"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "@/hooks/useInView";
import { galleryImages, gallerySpans } from "@/data/gallery";

export default function GallerySection() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [ref, visible] = useInView(0.05);
  const touchStartX = useRef(0);

  /* Lock body scroll when lightbox is open */
  useEffect(() => {
    if (lightbox !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  /* Keyboard navigation in lightbox */
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") setLightbox((p) => ((p ?? 0) - 1 + galleryImages.length) % galleryImages.length);
      if (e.key === "ArrowRight") setLightbox((p) => ((p ?? 0) + 1) % galleryImages.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  const goPrev = useCallback(() => {
    setLightbox((p) => ((p ?? 0) - 1 + galleryImages.length) % galleryImages.length);
  }, []);
  const goNext = useCallback(() => {
    setLightbox((p) => ((p ?? 0) + 1) % galleryImages.length);
  }, []);

  /* Touch swipe in lightbox */
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const handleLightboxTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        padding: "clamp(60px, 10vw, 120px) 0",
        background: "#0A0806",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 60px)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "clamp(28px, 5vw, 48px)",
            flexWrap: "wrap",
            gap: 20,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(9px, 1.4vw, 11px)",
                letterSpacing: "clamp(3px, 0.8vw, 6px)",
                color: "#C9A050",
                textTransform: "uppercase",
              }}
            >
              Visual Journey
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 52px)",
                fontWeight: 400,
                color: "#fff",
                margin: "12px 0 0",
              }}
            >
              The Gallery
            </h2>
          </div>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: 2,
            }}
          >
            {galleryImages.length} PHOTOS
          </span>
        </div>

        {/* Grid */}
        <div
          className="gallery-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridAutoRows: "clamp(140px, 18vw, 200px)",
            gap: "clamp(4px, 0.6vw, 6px)",
            opacity: visible ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        >
          {galleryImages.map((img, i) => (
            <div
              key={i}
              onClick={() => setLightbox(i)}
              style={{
                gridRow: `span ${gallerySpans[i] || 1}`,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.95)",
                transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s`,
              }}
              onMouseEnter={(e) => {
                const ov = e.currentTarget.querySelector(".g-ov") as HTMLElement;
                const im = e.currentTarget.querySelector("img") as HTMLElement;
                if (ov) ov.style.opacity = "1";
                if (im) im.style.transform = "scale(1.06)";
              }}
              onMouseLeave={(e) => {
                const ov = e.currentTarget.querySelector(".g-ov") as HTMLElement;
                const im = e.currentTarget.querySelector("img") as HTMLElement;
                if (ov) ov.style.opacity = "0";
                if (im) im.style.transform = "scale(1)";
              }}
            >
              <img
                src={img.url}
                alt={img.label}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
              <div
                className="g-ov"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top,rgba(8,6,3,0.85) 0%,rgba(8,6,3,0.2) 50%,transparent 100%)",
                  opacity: 0,
                  transition: "opacity 0.4s",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "clamp(12px, 2vw, 20px)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(14px, 1.8vw, 18px)",
                    color: "#fff",
                    fontWeight: 400,
                  }}
                >
                  {img.label}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    color: "#C9A050",
                    letterSpacing: 2,
                    marginTop: 4,
                  }}
                >
                  VIEW
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          onTouchStart={handleLightboxTouchStart}
          onTouchEnd={handleLightboxTouchEnd}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(0,0,0,0.94)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            animation: "scaleIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards",
            padding: "env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0)",
          }}
        >
          {/* Prev — hidden on very small screens, swipe handles it */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous image"
            style={{
              position: "absolute",
              left: "clamp(8px, 2vw, 20px)",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(183,143,82,0.3)",
              color: "#C9A050",
              fontSize: "clamp(18px, 3vw, 24px)",
              width: "clamp(40px, 5vw, 50px)",
              height: "clamp(40px, 5vw, 50px)",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(183,143,82,0.15)";
              e.currentTarget.style.borderColor = "rgba(183,143,82,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.4)";
              e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)";
            }}
          >
            ←
          </button>

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(85vw, 1000px)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              key={lightbox} /* forces re-render animation on change */
              src={galleryImages[lightbox].url.replace("w=800", "w=1400")}
              alt={galleryImages[lightbox].label}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                animation: "fadeSlideIn 0.3s ease forwards",
              }}
            />
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  color: "#fff",
                }}
              >
                {galleryImages[lightbox].label}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: 2,
                  marginTop: 4,
                }}
              >
                {lightbox + 1} / {galleryImages.length}
              </span>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next image"
            style={{
              position: "absolute",
              right: "clamp(8px, 2vw, 20px)",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(183,143,82,0.3)",
              color: "#C9A050",
              fontSize: "clamp(18px, 3vw, 24px)",
              width: "clamp(40px, 5vw, 50px)",
              height: "clamp(40px, 5vw, 50px)",
              cursor: "pointer",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(183,143,82,0.15)";
              e.currentTarget.style.borderColor = "rgba(183,143,82,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.4)";
              e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)";
            }}
          >
            →
          </button>

          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close lightbox"
            style={{
              position: "absolute",
              top: "clamp(12px, 2vw, 20px)",
              right: "clamp(12px, 2vw, 20px)",
              background: "none",
              border: "none",
              color: "#C9A050",
              fontSize: "clamp(24px, 3.5vw, 28px)",
              cursor: "pointer",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}