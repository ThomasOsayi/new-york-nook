"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { signatureDishes } from "@/data/signatures";

export default function SigDishes() {
  const [active, setActive] = useState(0);
  const [ref, visible] = useInView();

  useEffect(() => {
    const timer = setInterval(() => setActive((p) => (p + 1) % signatureDishes.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const dish = signatureDishes[active];

  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ padding: "100px 0", background: "#0C0A07", opacity: visible ? 1 : 0, transition: "opacity 0.8s ease" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,4vw,60px)" }}>
        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div style={{ width: 40, height: 1, background: "#C9A050" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 5, color: "#C9A050", textTransform: "uppercase" }}>Signature Dishes</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: 500 }} className="sig-grid">
          {/* Image side */}
          <div style={{ position: "relative", overflow: "hidden", background: "#0A0806" }}>
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
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,transparent 60%,#0C0A07 100%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,#0C0A07 0%,transparent 30%)" }} />
            <div style={{ position: "absolute", bottom: 30, left: 30, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 48, color: "#C9A050", fontWeight: 700 }}>0{active + 1}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>/0{signatureDishes.length}</span>
            </div>
          </div>

          {/* Text side */}
          <div style={{ padding: "60px 50px", display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(135deg,rgba(20,16,10,0.8),#0C0A07)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 400, color: "#fff", margin: "0 0 20px", lineHeight: 1.1 }}>{dish.name}</h3>
            <p style={{ fontFamily: "var(--font-accent)", fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, fontStyle: "italic", marginBottom: 40, maxWidth: 400 }}>{dish.desc}</p>

            {/* Indicator dots */}
            <div style={{ display: "flex", gap: 12 }}>
              {signatureDishes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    width: active === i ? 32 : 8,
                    height: 8,
                    border: "none",
                    cursor: "pointer",
                    background: active === i ? "#C9A050" : "rgba(255,255,255,0.12)",
                    transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>

            {/* Prev/Next */}
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              {["←", "→"].map((arrow, idx) => (
                <button
                  key={arrow}
                  onClick={() => setActive((p) => idx === 0 ? (p - 1 + signatureDishes.length) % signatureDishes.length : (p + 1) % signatureDishes.length)}
                  style={{
                    width: 50,
                    height: 50,
                    border: "1px solid rgba(183,143,82,0.3)",
                    background: "none",
                    cursor: "pointer",
                    color: "#C9A050",
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(183,143,82,0.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  {arrow}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
