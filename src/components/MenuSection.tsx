"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useInView } from "@/hooks/useInView";
import { categories } from "@/data/menu";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { MenuItem } from "@/data/menu";

export default function MenuSection() {
  const [activeKey, setActiveKey] = useState("coldAppetizers");
  const activeCat = categories.find((c) => c.key === activeKey);
  const [sectionRef, visible] = useInView(0.08);
  const tabsRef = useRef<HTMLDivElement>(null);

  /* ── Menu items from Firestore ── */
  const [firestoreMenu, setFirestoreMenu] = useState<Record<string, MenuItem[]>>({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menuItems"), (snapshot) => {
      const grouped: Record<string, MenuItem[]> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const catKey = (data.categoryKey as string) || "coldAppetizers";
        if (!grouped[catKey]) grouped[catKey] = [];
        grouped[catKey].push({
          name: data.name as string,
          desc: (data.desc as string) ?? "",
          price: data.price as number,
          img: (data.img as string) || "",
          tags: (data.tags as MenuItem["tags"]) ?? [],
        });
      });
      setFirestoreMenu(grouped);
    });
    return () => unsub();
  }, []);

  const items = firestoreMenu[activeKey] || [];

  /* Scroll active tab into view on mobile */
  const handleTabClick = useCallback((key: string) => {
    setActiveKey(key);
    setTimeout(() => {
      const container = tabsRef.current;
      if (!container) return;
      const btn = container.querySelector(`[data-key="${key}"]`) as HTMLElement;
      if (btn) {
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 50);
  }, []);

  return (
    <section
      ref={sectionRef as React.Ref<HTMLElement>}
      style={{
        padding: "clamp(60px, 10vw, 120px) 0",
        background: "#080603",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 60px)",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(32px, 6vw, 60px)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(9px, 1.4vw, 11px)",
              letterSpacing: "clamp(3px, 0.8vw, 6px)",
              color: "#C9A050",
              textTransform: "uppercase",
            }}
          >
            Curated Selections
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 5vw, 64px)",
              fontWeight: 400,
              color: "#fff",
              margin: "16px 0 0",
            }}
          >
            The Menu
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
        </div>

        {/* Category tabs — horizontal scroll on mobile */}
        <div
          ref={tabsRef}
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "flex-start",
            marginBottom: "clamp(32px, 6vw, 60px)",
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            padding: "0 0 8px",
            maskImage: "linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 3%, black 97%, transparent 100%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          {categories.map((c) => (
            <button
              key={c.key}
              data-key={c.key}
              onClick={() => handleTabClick(c.key)}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                border: "none",
                width: activeKey === c.key ? "clamp(140px, 16vw, 180px)" : "clamp(90px, 10vw, 110px)",
                minWidth: activeKey === c.key ? 140 : 90,
                height: "clamp(48px, 6vw, 60px)",
                transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
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
                  filter:
                    activeKey === c.key
                      ? "brightness(0.5)"
                      : "brightness(0.2) grayscale(0.6)",
                  transition: "all 0.5s",
                }}
              />
              <span
                style={{
                  position: "relative",
                  zIndex: 2,
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(8px, 1vw, 9px)",
                  letterSpacing: "clamp(1px, 0.3vw, 2px)",
                  textTransform: "uppercase",
                  color: activeKey === c.key ? "#C9A050" : "rgba(255,255,255,0.4)",
                  fontWeight: activeKey === c.key ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </span>
              {activeKey === c.key && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "#C9A050",
                    zIndex: 3,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Two-column layout: sticky image + scrolling items */}
        <div
          className="menu-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: "clamp(24px, 5vw, 60px)",
            alignItems: "start",
          }}
        >
          {/* Sticky image — hidden on mobile via .menu-img-col */}
          <div style={{ position: "sticky", top: 100 }} className="menu-img-col">
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid rgba(183,143,82,0.15)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-20px)",
                transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s",
              }}
            >
              <img
                src={activeCat?.img}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  objectFit: "cover",
                  transition: "all 0.6s",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top,rgba(8,6,3,0.9) 0%,transparent 50%)",
                }}
              />
              <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    color: "#fff",
                    fontWeight: 400,
                    margin: "0 0 8px",
                  }}
                >
                  {activeCat?.label}
                </h3>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {items.length} selections
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div>
            {items.map((item, i) => (
              <div
                key={`${activeKey}-${i}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "clamp(12px, 2vw, 20px)",
                  padding: "clamp(14px, 2.5vw, 22px) 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  animation: `fadeSlideIn 0.4s ease ${i * 0.04}s both`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(16px, 2vw, 19px)",
                      fontWeight: 400,
                      color: "#fff",
                      margin: "0 0 4px",
                    }}
                  >
                    {item.name}
                  </h4>
                  {item.desc && (
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "clamp(11px, 1.3vw, 12px)",
                        color: "rgba(255,255,255,0.3)",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.desc}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(8px, 1.5vw, 16px)",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "clamp(16px, 3vw, 40px)",
                      height: 1,
                      background: "rgba(183,143,82,0.15)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(15px, 2vw, 18px)",
                      color: "#C9A050",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.price ? `$${item.price}` : "MP"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}