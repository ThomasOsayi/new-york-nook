"use client";

import { useInView } from "@/hooks/useInView";

const contactBlocks = [
  { icon: "📍", label: "Location", main: "7065 Sunset Blvd", sub: "Hollywood, CA 90028" },
  { icon: "📞", label: "Reservations", main: "(323) 410-1400", sub: "Call or text anytime", href: "tel:+13234101400" },
  { icon: "🕐", label: "Hours", main: "Tue – Sun 5–11 PM", sub: "Monday Closed" },
];

export default function ContactSection() {
  const [ref, visible] = useInView();

  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ padding: "120px 0", background: "#080603" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 clamp(20px,4vw,60px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
          transition: "all 1s ease",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 6, color: "#C9A050", textTransform: "uppercase" }}>Find Us</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 400, color: "#fff", margin: "16px 0 0" }}>Visit</h2>
          <div style={{ width: 60, height: 2, background: "linear-gradient(90deg,transparent,#C9A050,transparent)", margin: "24px auto 0" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, marginBottom: 64 }} className="contact-grid">
          {contactBlocks.map((b, i) => (
            <div key={i} style={{ textAlign: "center", padding: 36, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{b.icon}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 500, letterSpacing: 4, color: "#C9A050", textTransform: "uppercase", marginBottom: 16 }}>{b.label}</p>
              {b.href ? (
                <a href={b.href} style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff", textDecoration: "none", display: "block", marginBottom: 6 }}>{b.main}</a>
              ) : (
                <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff", margin: "0 0 6px" }}>{b.main}</p>
              )}
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>{b.sub}</p>
            </div>
          ))}
        </div>

        {/* TODO: Replace with a real Google Maps embed or Mapbox GL component */}
        <div style={{ position: "relative", height: 350, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
          <img
            src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1400&q=80"
            alt="Hollywood"
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.25) saturate(0.8)" }}
          />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 16, height: 16, background: "#C9A050", borderRadius: "50%", marginBottom: 12, boxShadow: "0 0 24px rgba(201,160,80,0.4)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff", marginBottom: 4 }}>New York Nook</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>7065 Sunset Blvd, Hollywood</span>
            <a
              href="https://maps.google.com/?q=7065+Sunset+Blvd+Hollywood+CA+90028"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: 20,
                fontFamily: "var(--font-body)",
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                background: "rgba(8,6,3,0.7)",
                border: "1px solid rgba(183,143,82,0.3)",
                color: "#C9A050",
                padding: "10px 24px",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Open in Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
