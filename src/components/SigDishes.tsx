"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { signatureDishes } from "@/data/signatures";

export default function SigDishes() {
  const [active, setActive] = useState(0);
  const [ref, visible] = useInView();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  /* Auto-rotate — resets on manual interaction */
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setActive((p) => (p + 1) % signatureDishes.length),
      5000
    );
  }, []);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const goTo = useCallback(
    (idx: number) => {
      setActive(idx);
      resetTimer();
    },
    [resetTimer]
  );

  const prev = useCallback(
    () => goTo((active - 1 + signatureDishes.length) % signatureDishes.length),
    [active, goTo]
  );
  const next = useCallback(
    () => goTo((active + 1) % signatureDishes.length),
    [active, goTo]
  );

  /* Touch swipe support */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
  };

  const dish = signatureDishes[active];

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{
        padding: "clamp(60px, 10vw, 100px) 0",
        background: "#0C0A07",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 60px)",
        }}
      >
        {/* Section label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: "clamp(28px, 5vw, 48px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-20px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s",
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              background: "#C9A050",
              transformOrigin: "left",
              transform: visible ? "scaleX(1)" : "scaleX(0)",
              transition: "transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(10px, 1.5vw, 11px)",
              letterSpacing: "clamp(3px, 0.8vw, 5px)",
              color: "#C9A050",
              textTransform: "uppercase",
            }}
          >
            Signature Dishes
          </span>
        </div>

        <div
          className="sig-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            minHeight: "clamp(350px, 50vw, 500px)",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image side */}
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#0A0806",
              minHeight: "clamp(250px, 40vw, 500px)",
            }}
          >
            {signatureDishes.map((d, i) => (
              <img
                key={i}
                src={d.img}
                alt={d.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: active === i ? 1 : 0,
                  transform: active === i ? "scale(1)" : "scale(1.06)",
                  transition: "all 1s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            ))}
            {/* Gradients — adapt direction based on stacking */}
            <div
              className="sig-gradient-right"
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right,transparent 60%,#0C0A07 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top,#0C0A07 0%,transparent 30%)",
              }}
            />
            {/* Slide counter */}
            <div
              style={{
                position: "absolute",
                bottom: "clamp(16px, 3vw, 30px)",
                left: "clamp(16px, 3vw, 30px)",
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(32px, 5vw, 48px)",
                  color: "#C9A050",
                  fontWeight: 700,
                }}
              >
                0{active + 1}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                /0{signatureDishes.length}
              </span>
            </div>
          </div>

          {/* Text side */}
          <div
            style={{
              padding: "clamp(28px, 5vw, 60px) clamp(20px, 4vw, 50px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: "linear-gradient(135deg,rgba(20,16,10,0.8),#0C0A07)",
            }}
          >
            <h3
              key={`title-${active}`}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 52px)",
                fontWeight: 400,
                color: "#fff",
                margin: "0 0 clamp(12px, 2vw, 20px)",
                lineHeight: 1.1,
                animation: "fadeSlideIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
              }}
            >
              {dish.name}
            </h3>
            <p
              key={`desc-${active}`}
              style={{
                fontFamily: "var(--font-accent)",
                fontSize: "clamp(14px, 1.5vw, 16px)",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.8,
                fontStyle: "italic",
                marginBottom: "clamp(24px, 4vw, 40px)",
                maxWidth: 400,
                animation: "fadeSlideIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s forwards",
                opacity: 0,
              }}
            >
              {dish.desc}
            </p>

            {/* Indicator dots */}
            <div style={{ display: "flex", gap: "clamp(8px, 1.2vw, 12px)" }}>
              {signatureDishes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`View dish ${i + 1}`}
                  style={{
                    width: active === i ? 32 : 8,
                    height: 8,
                    border: "none",
                    cursor: "pointer",
                    background:
                      active === i ? "#C9A050" : "rgba(255,255,255,0.12)",
                    transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                    borderRadius: 4,
                    padding: 0,
                    /* Min touch target via invisible padding area */
                    minHeight: 24,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: active === i ? 32 : 8,
                      height: 8,
                      background:
                        active === i ? "#C9A050" : "rgba(255,255,255,0.12)",
                      borderRadius: 4,
                      transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Prev/Next */}
            <div style={{ display: "flex", gap: 12, marginTop: "clamp(20px, 3vw, 32px)" }}>
              {[
                { label: "Previous", arrow: "←", fn: prev },
                { label: "Next", arrow: "→", fn: next },
              ].map(({ label, arrow, fn }) => (
                <button
                  key={label}
                  onClick={fn}
                  aria-label={label}
                  style={{
                    width: "clamp(42px, 5vw, 50px)",
                    height: "clamp(42px, 5vw, 50px)",
                    border: "1px solid rgba(183,143,82,0.3)",
                    background: "none",
                    cursor: "pointer",
                    color: "#C9A050",
                    fontSize: "clamp(16px, 2vw, 20px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(183,143,82,0.1)";
                    e.currentTarget.style.borderColor = "rgba(183,143,82,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.borderColor = "rgba(183,143,82,0.3)";
                  }}
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline responsive overrides ── */}
      <style jsx>{`
        @media (max-width: 900px) {
          .sig-gradient-right {
            background: linear-gradient(to bottom, transparent 60%, #0C0A07 100%) !important;
          }
        }
      `}</style>
    </section>
  );
}