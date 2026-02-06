"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { galleryImages, gallerySpans } from "@/data/gallery";

export default function GallerySection() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [ref, visible] = useInView(0.05);

  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ padding: "120px 0", background: "#0A0806" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,4vw,60px)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 20 }}>
          <div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 6, color: "#C9A050", textTransform: "uppercase" }}>Visual Journey</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 400, color: "#fff", margin: "12px 0 0" }}>The Gallery</h2>
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 2 }}>{galleryImages.length} PHOTOS</span>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridAutoRows: 200,
            gap: 6,
            opacity: visible ? 1 : 0,
            transition: "opacity 1s ease",
          }}
          className="gallery-grid"
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
                animation: `fadeSlideIn 0.5s ease ${i * 0.06}s both`,
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
              <img src={img.url} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.22,1,0.36,1)" }} />
              <div
                className="g-ov"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top,rgba(8,6,3,0.85) 0%,rgba(8,6,3,0.2) 50%,transparent 100%)",
                  opacity: 0,
                  transition: "opacity 0.4s",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: 20,
                }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#fff", fontWeight: 400 }}>{img.label}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "#C9A050", letterSpacing: 2, marginTop: 4 }}>VIEW</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((p) => ((p ?? 0) - 1 + galleryImages.length) % galleryImages.length); }}
            style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "none", border: "1px solid rgba(183,143,82,0.3)", color: "#C9A050", fontSize: 24, width: 50, height: 50, cursor: "pointer", zIndex: 10 }}
          >
            ←
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "85vw", maxHeight: "80vh" }}>
            <img src={galleryImages[lightbox].url.replace("w=800", "w=1400")} alt="" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>{galleryImages[lightbox].label}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox((p) => ((p ?? 0) + 1) % galleryImages.length); }}
            style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "none", border: "1px solid rgba(183,143,82,0.3)", color: "#C9A050", fontSize: 24, width: 50, height: 50, cursor: "pointer", zIndex: 10 }}
          >
            →
          </button>
          <button onClick={() => setLightbox(null)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#C9A050", fontSize: 28, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
