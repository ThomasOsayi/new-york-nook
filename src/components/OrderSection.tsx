"use client";

import Link from "next/link";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    img: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=500&q=80",
    title: "Browse & Select",
    desc: "Explore our full menu with photos and descriptions. Add items to your cart with custom notes.",
    step: "01",
  },
  {
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80",
    title: "Customize & Pay",
    desc: "Choose your pickup time, add special requests, and pay securely online.",
    step: "02",
  },
  {
    img: "https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?w=500&q=80",
    title: "Pickup & Enjoy",
    desc: "Get real-time notifications when your order is ready. Walk in, grab, and go.",
    step: "03",
  },
];

export default function OrderSection() {
  const [ref, visible] = useInView();

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "url('https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1800&q=80') center/cover",
          filter: "brightness(0.25) saturate(1.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg,rgba(8,6,3,0.9) 0%,rgba(20,16,10,0.7) 50%,rgba(8,6,3,0.95) 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(60px, 10vw, 120px) clamp(16px, 4vw, 60px)",
          maxWidth: 1200,
          margin: "0 auto",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(36px, 6vw, 64px)" }}>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(9px, 1.4vw, 11px)",
              letterSpacing: "clamp(3px, 0.8vw, 6px)",
              color: "#C9A050",
              textTransform: "uppercase",
            }}
          >
            From Our Kitchen to Yours
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 400,
              color: "#fff",
              margin: "16px 0 0",
            }}
          >
            Order Takeout
          </h2>
          <div
            style={{
              width: 60,
              height: 2,
              background: "linear-gradient(90deg,transparent,#C9A050,transparent)",
              margin: "24px auto 0",
              transform: visible ? "scaleX(1)" : "scaleX(0)",
              transition: "transform 1s cubic-bezier(0.22,1,0.36,1) 0.3s",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "clamp(14px, 1.8vw, 16px)",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
              maxWidth: 500,
              margin: "clamp(16px, 3vw, 24px) auto 0",
              lineHeight: 1.8,
            }}
          >
            Enjoy our signature Russian cuisine at home.
          </p>
        </div>

        {/* Step cards */}
        <div
          className="order-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "clamp(12px, 2vw, 20px)",
          }}
        >
          {steps.map((card, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(183,143,82,0.1)",
                background: "rgba(8,6,3,0.6)",
                backdropFilter: "blur(10px)",
                transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${0.15 + i * 0.1}s`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(183,143,82,0.35)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(183,143,82,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  height: "clamp(140px, 18vw, 180px)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={card.img}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.6) saturate(1.2)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "clamp(10px, 2vw, 16px)",
                    left: "clamp(10px, 2vw, 16px)",
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(28px, 4vw, 42px)",
                    color: "rgba(201,160,80,0.2)",
                    fontWeight: 700,
                  }}
                >
                  {card.step}
                </div>
              </div>
              <div style={{ padding: "clamp(18px, 3vw, 28px) clamp(16px, 2.5vw, 24px)" }}>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(18px, 2.2vw, 22px)",
                    fontWeight: 400,
                    color: "#fff",
                    margin: "0 0 10px",
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(12px, 1.4vw, 13px)",
                    color: "rgba(255,255,255,0.35)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: "clamp(32px, 5vw, 48px)" }}>
          <Link
            href="/order"
            className="btn-gold-filled"
            style={{
              fontSize: "clamp(11px, 1.4vw, 12px)",
              padding: "18px clamp(32px, 5vw, 56px)",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Start Your Order →
          </Link>
        </div>
      </div>
    </section>
  );
}