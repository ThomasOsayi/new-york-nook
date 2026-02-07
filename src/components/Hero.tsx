"use client";

import { useEffect, useState } from "react";
import { useScrollY } from "@/hooks/useScrollY";

interface HeroProps {
  onNav: (section: string) => void;
}

export default function Hero({ onNav }: HeroProps) {
  const [loaded, setLoaded] = useState(false);
  const scrollY = useScrollY();

  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(id);
  }, []);

  return (
    <section
      style={{
        height: "100svh", /* safe viewport height — accounts for mobile browser chrome */
        minHeight: 600,
        position: "relative",
        overflow: "hidden",
        background: "#080603",
      }}
    >
      {/* Parallax background */}
      <div
        style={{
          position: "absolute",
          inset: "-10% 0",
          height: "120%",
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `translateY(${scrollY * 0.15}px)`, /* reduced parallax on purpose — less jarring on mobile */
          filter: "brightness(0.4) saturate(1.2)",
          willChange: "transform",
        }}
      />

      {/* Gradient overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg,rgba(20,12,5,0.7) 0%,rgba(8,6,3,0.4) 40%,rgba(20,12,5,0.8) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
          background: "linear-gradient(to top,#080603 0%,transparent 100%)",
        }}
      />

      {/* Ambient gold glow — adds depth */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: "clamp(300px, 60vw, 800px)",
          height: "clamp(300px, 60vw, 800px)",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(201,160,80,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Corner accents — hidden on small phones */}
      <div
        className="hero-float-left"
        style={{
          position: "absolute",
          top: 100,
          left: 40,
          width: 100,
          height: 100,
          borderLeft: "1px solid rgba(183,143,82,0.2)",
          borderTop: "1px solid rgba(183,143,82,0.2)",
          opacity: loaded ? 0.6 : 0,
          transition: "opacity 1.5s ease 1.2s",
        }}
      />
      <div
        className="hero-float-right"
        style={{
          position: "absolute",
          bottom: 100,
          right: 40,
          width: 100,
          height: 100,
          borderRight: "1px solid rgba(183,143,82,0.2)",
          borderBottom: "1px solid rgba(183,143,82,0.2)",
          opacity: loaded ? 0.6 : 0,
          transition: "opacity 1.5s ease 1.4s",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 clamp(16px, 5vw, 24px)",
        }}
      >
        {/* Tagline */}
        <div
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(24px)",
            transition: "all 1s cubic-bezier(0.22,1,0.36,1) 0.1s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(10px, 3vw, 20px)",
              justifyContent: "center",
              marginBottom: "clamp(18px, 4vw, 28px)",
            }}
          >
            <div
              style={{
                width: "clamp(24px, 5vw, 50px)",
                height: 1,
                background: "linear-gradient(90deg,transparent,#C9A050)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(9px, 1.5vw, 11px)",
                fontWeight: 400,
                letterSpacing: "clamp(3px, 0.8vw, 6px)",
                color: "#C9A050",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Est. Hollywood, CA
            </span>
            <div
              style={{
                width: "clamp(24px, 5vw, 50px)",
                height: 1,
                background: "linear-gradient(90deg,#C9A050,transparent)",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            margin: 0,
            lineHeight: 0.92,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
            transition: "all 1.3s cubic-bezier(0.22,1,0.36,1) 0.2s",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "clamp(11px, 1.8vw, 18px)",
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              letterSpacing: "clamp(4px, 1vw, 8px)",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              marginBottom: "clamp(8px, 1.5vw, 12px)",
            }}
          >
            Fine Russian Cuisine
          </span>
          <span
            style={{
              fontSize: "clamp(48px, 11vw, 140px)",
              color: "#fff",
              display: "block",
            }}
          >
            New York
          </span>
          <span
            style={{
              fontSize: "clamp(48px, 11vw, 140px)",
              background: "linear-gradient(135deg,#C9A050,#E8D5A3,#C9A050)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "block",
              fontStyle: "italic",
              animation: loaded ? "goldShimmer 6s linear infinite" : "none",
            }}
          >
            Nook
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-accent)",
            fontSize: "clamp(14px, 2vw, 19px)",
            color: "rgba(255,255,255,0.45)",
            fontStyle: "italic",
            marginTop: "clamp(18px, 3vw, 28px)",
            fontWeight: 400,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.22,1,0.36,1) 0.5s",
            maxWidth: 400,
          }}
        >
          Taste the Heart of New York
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "clamp(8px, 2vw, 16px)",
            marginTop: "clamp(28px, 5vw, 44px)",
            flexWrap: "wrap",
            justifyContent: "center",
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.22,1,0.36,1) 0.7s",
            width: "100%",
            maxWidth: 600,
            padding: "0 clamp(0px, 2vw, 12px)",
          }}
        >
          <button onClick={() => onNav("Reserve")} className="btn-gold-outline">
            Reserve a Table
          </button>
          <button onClick={() => onNav("Order")} className="btn-gold-filled">
            Order Takeout
          </button>
          <button onClick={() => onNav("Menu")} className="btn-gold-outline">
            View Menu
          </button>
        </div>

        {/* Floating accent images (desktop only — hidden via .hero-float-* at ≤900px) */}
        <div
          className="hero-float-left"
          style={{
            position: "absolute",
            left: "4%",
            bottom: "18%",
            width: 160,
            height: 200,
            overflow: "hidden",
            border: "1px solid rgba(183,143,82,0.2)",
            opacity: loaded ? 0.7 : 0,
            transition: "opacity 1.5s ease 1s",
            animation: "subtleDrift 8s ease-in-out infinite",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div
          className="hero-float-right"
          style={{
            position: "absolute",
            right: "4%",
            top: "22%",
            width: 140,
            height: 180,
            overflow: "hidden",
            border: "1px solid rgba(183,143,82,0.2)",
            opacity: loaded ? 0.7 : 0,
            transition: "opacity 1.5s ease 1.2s",
            animation: "subtleDrift 8s ease-in-out 2s infinite",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "clamp(16px, 4vh, 30px)",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 10,
          opacity: loaded ? 1 : 0,
          transition: "opacity 1s ease 1.2s",
        }}
      >
        <div
          style={{
            width: 20,
            height: 32,
            border: "1px solid rgba(183,143,82,0.3)",
            borderRadius: 10,
            display: "flex",
            justifyContent: "center",
            paddingTop: 6,
          }}
        >
          <div
            style={{
              width: 2,
              height: 8,
              background: "#C9A050",
              borderRadius: 1,
              animation: "scrollBounce 1.5s ease infinite",
            }}
          />
        </div>
      </div>
    </section>
  );
}