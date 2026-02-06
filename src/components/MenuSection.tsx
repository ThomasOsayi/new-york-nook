"use client";

import { useState } from "react";
import { menuData, categories } from "@/data/menu";

export default function MenuSection() {
  const [activeKey, setActiveKey] = useState("coldAppetizers");
  const items = menuData[activeKey] || [];
  const activeCat = categories.find((c) => c.key === activeKey);

  return (
    <section style={{ padding: "120px 0", background: "#080603", position: "relative" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 clamp(20px,4vw,60px)", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 6, color: "#C9A050", textTransform: "uppercase" }}>Curated Selections</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,5vw,64px)", fontWeight: 400, color: "#fff", margin: "16px 0 0" }}>The Menu</h2>
          <div style={{ width: 60, height: 2, background: "linear-gradient(90deg,transparent,#C9A050,transparent)", margin: "24px auto 0" }} />
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 60, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveKey(c.key)}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                border: "none",
                width: activeKey === c.key ? 180 : 110,
                height: 60,
                transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={c.img}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: activeKey === c.key ? "brightness(0.5)" : "brightness(0.2) grayscale(0.6)",
                  transition: "all 0.5s",
                }}
              />
              <span
                style={{
                  position: "relative",
                  zIndex: 2,
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: activeKey === c.key ? "#C9A050" : "rgba(255,255,255,0.4)",
                  fontWeight: activeKey === c.key ? 600 : 400,
                }}
              >
                {c.label}
              </span>
              {activeKey === c.key && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#C9A050", zIndex: 3 }} />}
            </button>
          ))}
        </div>

        {/* Two-column layout: sticky image + scrolling items */}
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 60, alignItems: "start" }} className="menu-layout">
          <div style={{ position: "sticky", top: 100 }} className="menu-img-col">
            <div style={{ position: "relative", overflow: "hidden", border: "1px solid rgba(183,143,82,0.15)" }}>
              <img src={activeCat?.img} alt="" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", transition: "all 0.6s" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(8,6,3,0.9) 0%,transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "#fff", fontWeight: 400, margin: "0 0 8px" }}>{activeCat?.label}</h3>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{items.length} selections</span>
              </div>
            </div>
          </div>

          <div>
            {items.map((item, i) => (
              <div
                key={`${activeKey}-${i}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 20,
                  padding: "22px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  animation: `fadeSlideIn 0.4s ease ${i * 0.04}s both`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 400, color: "#fff", margin: "0 0 4px" }}>{item.name}</h4>
                  {item.desc && <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.6 }}>{item.desc}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <div style={{ width: 40, height: 1, background: "rgba(183,143,82,0.15)" }} />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#C9A050" }}>{item.price ? `$${item.price}` : "MP"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
