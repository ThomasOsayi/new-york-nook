"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScrollY } from "@/hooks/useScrollY";

const NAV_LINKS = ["Home", "Menu", "Gallery", "Reserve", "Order", "Catering", "Contact"] as const;

interface NavbarProps {
  onNav: (section: string) => void;
}

export default function Navbar({ onNav }: NavbarProps) {
  const router = useRouter();
  const scrollY = useScrollY();
  const scrolled = scrollY > 60;
  const [open, setOpen] = useState(false);

  const handleNav = (label: string) => {
    if (label === "Order") {
      router.push("/order");
      setOpen(false);
    } else {
      onNav(label);
      setOpen(false);
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: scrolled ? "rgba(8,6,3,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
        borderBottom: scrolled ? "1px solid rgba(183,143,82,0.12)" : "none",
        transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 80,
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 clamp(20px,4vw,60px)",
        }}
      >
        {/* ── Logo ── */}
        <div
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}
          onClick={() => onNav("Home")}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: "1px solid rgba(183,143,82,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(45deg)",
            }}
          >
            <span
              style={{
                transform: "rotate(-45deg)",
                fontFamily: "var(--font-display)",
                fontSize: 16,
                color: "#C9A050",
                fontWeight: 700,
              }}
            >
              N
            </span>
          </div>
          <div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 3,
                display: "block",
                lineHeight: 1,
              }}
            >
              NEW YORK NOOK
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 8,
                fontWeight: 400,
                letterSpacing: 4,
                color: "rgba(183,143,82,0.6)",
                textTransform: "uppercase",
              }}
            >
              Fine Russian Cuisine
            </span>
          </div>
        </div>

        {/* ── Desktop links ── */}
        <div className="nav-links-desktop" style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {NAV_LINKS.map((label) => (
            <button
              key={label}
              onClick={() => handleNav(label)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Hamburger ── */}
        <button
          className="nav-hamburger"
          onClick={() => setOpen(!open)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            flexDirection: "column",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 22,
              height: 1.5,
              background: "#C9A050",
              display: "block",
              transition: "all 0.3s",
              transform: open ? "rotate(45deg) translate(2px,2px)" : "",
            }}
          />
          <span
            style={{
              width: 22,
              height: 1.5,
              background: "#C9A050",
              display: "block",
              transition: "all 0.3s",
              opacity: open ? 0 : 1,
            }}
          />
          <span
            style={{
              width: open ? 22 : 15,
              height: 1.5,
              background: "#C9A050",
              display: "block",
              transition: "all 0.3s",
              transform: open ? "rotate(-45deg) translate(4px,-4px)" : "",
            }}
          />
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            top: 80,
            background: "rgba(8,6,3,0.98)",
            backdropFilter: "blur(40px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            zIndex: 300,
          }}
        >
          {NAV_LINKS.map((label, i) => (
            <button
              key={label}
              onClick={() => handleNav(label)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 400,
                color: "#fff",
                letterSpacing: 3,
                animation: `fadeUp 0.5s ease ${i * 0.06}s forwards`,
                opacity: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
