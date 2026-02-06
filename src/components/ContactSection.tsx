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

        {/* Interactive Google Map */}
        <div
          style={{
            position: "relative",
            height: 400,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3303.8!2d-118.3475!3d34.0978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bed5c765c5e7%3A0x3f61a2b2b0e9a0e2!2s7065%20Sunset%20Blvd%2C%20Los%20Angeles%2C%20CA%2090028!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
            width="100%"
            height="100%"
            style={{
              border: 0,
              filter: "invert(0.9) hue-rotate(180deg) brightness(0.7) contrast(1.1) saturate(0.3)",
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="New York Nook Location"
          />

          {/* Overlay label at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "20px 24px",
              background: "linear-gradient(180deg, transparent 0%, rgba(8,6,3,0.9) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pointerEvents: "none",
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 16,
                  color: "#fff",
                  display: "block",
                  marginBottom: 2,
                }}
              >
                New York Nook
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                7065 Sunset Blvd, Hollywood, CA 90028
              </span>
            </div>
            <a
              href="https://maps.google.com/?q=7065+Sunset+Blvd+Hollywood+CA+90028"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                background: "rgba(8,6,3,0.8)",
                border: "1px solid rgba(183,143,82,0.3)",
                color: "#C9A050",
                padding: "10px 24px",
                cursor: "pointer",
                textDecoration: "none",
                pointerEvents: "auto",
                transition: "all 0.3s",
              }}
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}