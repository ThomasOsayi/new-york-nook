"use client";

import { useInView } from "@/hooks/useInView";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════
   ReservationSection — CTA driving to /reserve
   Similar pattern to OrderSection
   ══════════════════════════════════════════ */
export default function ReservationSection() {
  const [ref, visible] = useInView();
  const router = useRouter();

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "url('https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1800&q=80') center/cover",
          filter: "brightness(0.15)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(8,6,3,0.9) 0%, rgba(8,6,3,0.6) 50%, rgba(8,6,3,0.9) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(80px, 12vw, 140px) clamp(16px, 4vw, 60px)",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Label */}
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(9px, 1.4vw, 11px)",
            letterSpacing: "clamp(3px, 0.8vw, 6px)",
            color: "#C9A050",
            textTransform: "uppercase",
            display: "block",
            marginBottom: 20,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s",
          }}
        >
          Your Table Awaits
        </span>

        {/* Headline */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 400,
            color: "#fff",
            margin: "0 0 clamp(16px, 3vw, 24px)",
            lineHeight: 1.1,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s",
          }}
        >
          Reserve a{" "}
          <span style={{ fontStyle: "italic" }}>Table</span>
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: "clamp(14px, 1.8vw, 17px)",
            color: "rgba(255,255,255,0.4)",
            fontStyle: "italic",
            lineHeight: 1.8,
            maxWidth: 560,
            margin: "0 auto clamp(28px, 4vw, 40px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s",
          }}
        >
          Choose your preferred date, time, and table — from intimate window
          seats to our private dining room.
        </p>

        {/* ── Three feature cards ── */}
        <div
          className="res-features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(12px, 2vw, 20px)",
            marginBottom: "clamp(32px, 5vw, 48px)",
          }}
        >
          {[
            {
              icon: "🗓️",
              title: "Pick Your Date",
              desc: "Browse available dates, skip the phone call",
            },
            {
              icon: "🪑",
              title: "Choose Your Spot",
              desc: "Interactive floor plan — window, booth, or private dining",
            },
            {
              icon: "✨",
              title: "Instant Confirmation",
              desc: "Receive your booking details immediately",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(183,143,82,0.1)",
                padding: "clamp(20px, 3vw, 32px) clamp(16px, 2vw, 24px)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.25 + i * 0.08}s`,
              }}
            >
              <div
                style={{
                  fontSize: "clamp(24px, 3vw, 32px)",
                  marginBottom: 12,
                }}
              >
                {card.icon}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(14px, 1.5vw, 16px)",
                  color: "#fff",
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(11px, 1.2vw, 13px)",
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: 1.6,
                }}
              >
                {card.desc}
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA Button ── */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.5s",
            marginBottom: "clamp(28px, 4vw, 40px)",
          }}
        >
          <button
            onClick={() => router.push("/reserve")}
            className="btn-gold-filled"
            style={{
              padding: "18px 56px",
              fontSize: 12,
              letterSpacing: 3,
            }}
          >
            Book Your Table →
          </button>
        </div>

        {/* ── Info notes ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "clamp(16px, 3vw, 32px)",
            flexWrap: "wrap",
          }}
        >
          {[
            "Tuesday – Sunday, 5 PM – 11 PM",
            "Parties of 8+ please call",
            "Smart casual dress code",
          ].map((note, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.55 + i * 0.06}s`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 1,
                  background: "rgba(183,143,82,0.35)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(10px, 1.2vw, 12px)",
                  color: "rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                {note}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        @media (max-width: 768px) {
          .res-features-grid {
            grid-template-columns: 1fr !important;
            max-width: 360px !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }
      `}</style>
    </section>
  );
}