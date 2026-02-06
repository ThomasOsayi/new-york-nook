"use client";

import { useInView } from "@/hooks/useInView";

const cateringImages = [
  "https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=600&q=80",
  "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600&q=80",
];

const services = [
  { label: "Private Dining", detail: "Up to 40 guests" },
  { label: "Corporate Events", detail: "Meetings & galas" },
  { label: "Wedding Catering", detail: "Full service" },
  { label: "Custom Menus", detail: "Chef collaboration" },
];

export default function CateringSection() {
  const [ref, visible] = useInView();

  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ padding: "120px 0", background: "#080603" }}>
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(20px,4vw,60px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
          transition: "all 1s ease",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 0, minHeight: 600, border: "1px solid rgba(183,143,82,0.1)" }} className="catering-grid">
          {/* Image grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4, background: "#0A0806" }}>
            {cateringImages.map((url, i) => (
              <div key={i} style={{ overflow: "hidden" }}>
                <img
                  src={url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) saturate(1.1)", transition: "all 0.6s" }}
                  onMouseEnter={(e) => ((e.target as HTMLImageElement).style.filter = "brightness(0.9) saturate(1.3)")}
                  onMouseLeave={(e) => ((e.target as HTMLImageElement).style.filter = "brightness(0.7) saturate(1.1)")}
                />
              </div>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: "60px 56px", display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(180deg,rgba(18,14,9,0.95),rgba(12,10,7,1))" }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 6, color: "#C9A050", textTransform: "uppercase", marginBottom: 16 }}>Events & Private Dining</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,3.5vw,48px)", fontWeight: 400, color: "#fff", margin: "0 0 24px", lineHeight: 1.15 }}>
              Catering &<br />
              <span style={{ fontStyle: "italic", color: "#C9A050" }}>Private Events</span>
            </h2>
            <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.4)", fontStyle: "italic", lineHeight: 1.9, marginBottom: 36, maxWidth: 420 }}>
              From intimate gatherings to grand celebrations, our catering brings the New York Nook experience to your event.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 40 }}>
              {services.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 6, height: 6, background: "#C9A050", transform: "rotate(45deg)" }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.6)", letterSpacing: 1 }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{s.detail}</span>
                </div>
              ))}
            </div>

            {/* TODO: Link to catering inquiry form or email */}
            <button className="btn-gold-outline">Inquire Now</button>
          </div>
        </div>
      </div>
    </section>
  );
}
