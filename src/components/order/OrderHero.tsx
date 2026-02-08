"use client";

import Image from "next/image";
import { useInView } from "@/hooks/useInView";

export default function OrderHero() {
  const [ref, visible] = useInView(0.1);

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        position: "relative",
        height: "clamp(200px, 28vw, 280px)",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
        alt="Restaurant ambiance"
        fill
        sizes="100vw"
        priority
        style={{
          objectFit: "cover",
          filter: "brightness(0.3) saturate(1.2)",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(8,6,3,0.4) 0%, rgba(8,6,3,0.6) 50%, rgba(8,6,3,0.98) 100%)",
        }}
      />

      {/* Gold accent line at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(201,160,80,0.2), transparent)",
          transform: visible ? "scaleX(1)" : "scaleX(0)",
          transition: "transform 1s cubic-bezier(0.22,1,0.36,1) 0.2s",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 1440,
          margin: "0 auto",
          padding:
            "clamp(24px, 4vw, 40px) clamp(16px, 3vw, 48px)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "clamp(8px, 1.2vw, 10px)",
            fontWeight: 600,
            letterSpacing: "clamp(3px, 0.6vw, 5px)",
            textTransform: "uppercase",
            color: "#C9A050",
            marginBottom: "clamp(8px, 1.5vw, 12px)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-12px)",
            transition:
              "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s",
          }}
        >
          <span
            style={{
              width: "clamp(16px, 2.5vw, 24px)",
              height: 1,
              background: "#C9A050",
              display: "inline-block",
            }}
          />
          Takeout &amp; Pickup
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.1,
            margin: "0 0 clamp(6px, 1vw, 10px)",
          }}
        >
          Build Your{" "}
          <em
            style={{
              fontStyle: "italic",
              color: "#E8D5A3",
            }}
          >
            Order
          </em>
        </h1>

        {/* Description — hidden on very small screens to save space */}
        <p
          className="order-hero-desc"
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: "clamp(13px, 1.5vw, 15px)",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.4)",
            maxWidth: 480,
            lineHeight: 1.7,
            margin: "0 0 clamp(10px, 1.5vw, 16px)",
          }}
        >
          Curated dishes prepared fresh for pickup. Select your favorites and
          we&apos;ll have them ready when you arrive.
        </p>

        {/* Stars + info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(4px, 0.8vw, 8px)",
            flexWrap: "wrap",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="#C9A050"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(10px, 1.2vw, 11px)",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: 0.5,
              marginLeft: 4,
            }}
          >
            4.9 · 320+ reviews · Open until 11 PM
          </span>
        </div>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        @media (max-width: 480px) {
          .order-hero-desc { display: none; }
        }
      `}</style>
    </section>
  );
}