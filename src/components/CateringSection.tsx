"use client";

import { useInView } from "@/hooks/useInView";
import Link from "next/link";

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
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        padding: "clamp(60px, 10vw, 120px) 0",
        background: "#080603",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 60px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          className="catering-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 0,
            minHeight: "clamp(400px, 50vw, 600px)",
            border: "1px solid rgba(183,143,82,0.1)",
          }}
        >
          {/* Image grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 4,
              background: "#0A0806",
              minHeight: "clamp(250px, 35vw, 400px)",
            }}
          >
            {cateringImages.map((url, i) => (
              <div
                key={i}
                style={{
                  overflow: "hidden",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scale(1)" : "scale(0.95)",
                  transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.08}s`,
                }}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.7) saturate(1.1)",
                    transition: "all 0.6s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLImageElement).style.filter =
                      "brightness(0.9) saturate(1.3)")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLImageElement).style.filter =
                      "brightness(0.7) saturate(1.1)")
                  }
                />
              </div>
            ))}
          </div>

          {/* Content */}
          <div
            style={{
              padding: "clamp(28px, 5vw, 60px) clamp(20px, 4.5vw, 56px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background:
                "linear-gradient(180deg,rgba(18,14,9,0.95),rgba(12,10,7,1))",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(9px, 1.4vw, 11px)",
                letterSpacing: "clamp(3px, 0.8vw, 6px)",
                color: "#C9A050",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Events & Private Dining
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.5vw, 48px)",
                fontWeight: 400,
                color: "#fff",
                margin: "0 0 clamp(16px, 2.5vw, 24px)",
                lineHeight: 1.15,
              }}
            >
              Catering &<br />
              <span style={{ fontStyle: "italic", color: "#C9A050" }}>
                Private Events
              </span>
            </h2>
            <p
              style={{
                fontFamily: "var(--font-accent)",
                fontSize: "clamp(13px, 1.5vw, 15px)",
                color: "rgba(255,255,255,0.4)",
                fontStyle: "italic",
                lineHeight: 1.9,
                marginBottom: "clamp(24px, 3.5vw, 36px)",
                maxWidth: 420,
              }}
            >
              From intimate gatherings to grand celebrations, our catering
              brings the New York Nook experience to your event.
            </p>

            {/* Service list */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "clamp(12px, 2vw, 18px)",
                marginBottom: "clamp(28px, 4vw, 40px)",
              }}
            >
              {services.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "clamp(12px, 2vw, 18px)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(12px)",
                    transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.08}s`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "clamp(10px, 1.5vw, 16px)",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        background: "#C9A050",
                        transform: "rotate(45deg)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(12px, 1.3vw, 13px)",
                        color: "rgba(255,255,255,0.6)",
                        letterSpacing: 1,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(10px, 1.1vw, 11px)",
                      color: "rgba(255,255,255,0.25)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "clamp(10px, 2vw, 16px)", flexWrap: "wrap" }}>
              <Link
                href="/catering"
                className="btn-gold-filled"
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                View Packages
                <svg
                  width="14"
                  height="10"
                  viewBox="0 0 16 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M0 6h14M9 1l5 5-5 5" />
                </svg>
              </Link>
              <button className="btn-gold-outline">Inquire Now</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}