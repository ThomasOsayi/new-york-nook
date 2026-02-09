"use client";

import { useState, useEffect, useCallback } from "react";
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

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    if (open) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  /* Close mobile menu on resize to desktop */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const handler = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleNav = useCallback(
    (label: string) => {
      if (label === "Order") {
        router.push("/order");
      } else if (label === "Catering") {
        router.push("/catering");
      } else if (label === "Reserve") {
        router.push("/reserve");
      } else {
        onNav(label);
      }
      setOpen(false);
    },
    [onNav, router]
  );

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: scrolled || open ? "rgba(8,6,3,0.97)" : "transparent",
          backdropFilter: scrolled || open ? "blur(24px) saturate(1.4)" : "none",
          borderBottom: scrolled ? "1px solid rgba(183,143,82,0.12)" : "1px solid transparent",
          transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 clamp(16px, 4vw, 60px)",
          }}
        >
          {/* ── Logo ── */}
          <div
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}
            onClick={() => handleNav("Home")}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "1px solid rgba(183,143,82,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "rotate(45deg)",
                flexShrink: 0,
                transition: "border-color 0.3s",
              }}
            >
              <span
                style={{
                  transform: "rotate(-45deg)",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  color: "#C9A050",
                  fontWeight: 700,
                }}
              >
                N
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(14px, 2.5vw, 18px)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "clamp(1px, 0.3vw, 3px)",
                  display: "block",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                NEW YORK NOOK
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "clamp(7px, 1vw, 8px)",
                  fontWeight: 400,
                  letterSpacing: "clamp(2px, 0.5vw, 4px)",
                  color: "rgba(183,143,82,0.6)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Fine Russian Cuisine
              </span>
            </div>
          </div>

          {/* ── Desktop links ── */}
          <div className="nav-links-desktop" style={{ display: "flex", gap: "clamp(16px, 2.5vw, 32px)", alignItems: "center" }}>
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
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#C9A050";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Hamburger ── */}
          <button
            className="nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 12,
              marginRight: -12,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              width: 44,
              height: 44,
              position: "relative",
              zIndex: 301,
            }}
          >
            <span
              style={{
                width: 22,
                height: 1.5,
                background: "#C9A050",
                display: "block",
                transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                position: "absolute",
                transform: open ? "rotate(45deg)" : "translateY(-4px)",
              }}
            />
            <span
              style={{
                width: 22,
                height: 1.5,
                background: "#C9A050",
                display: "block",
                transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                position: "absolute",
                opacity: open ? 0 : 1,
                transform: open ? "scaleX(0)" : "scaleX(1)",
              }}
            />
            <span
              style={{
                width: open ? 22 : 14,
                height: 1.5,
                background: "#C9A050",
                display: "block",
                transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                position: "absolute",
                transform: open ? "rotate(-45deg)" : "translateY(4px)",
              }}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile overlay (outside nav to avoid stacking issues) ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100dvh",
          background: "#080603",
          zIndex: 199,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          opacity: open ? 1 : 0,
          visibility: open ? "visible" as const : "hidden" as const,
          pointerEvents: open ? "auto" : "none",
          transition: open
            ? "opacity 0.4s cubic-bezier(0.22,1,0.36,1), visibility 0s 0s"
            : "opacity 0.4s cubic-bezier(0.22,1,0.36,1), visibility 0s 0.4s",
          paddingTop: 72,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
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
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 400,
              color: "#fff",
              letterSpacing: 3,
              padding: "14px 0",
              width: "100%",
              textAlign: "center",
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(16px)",
              transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s`,
            }}
          >
            {label}
          </button>
        ))}

        {/* Decorative line in mobile menu */}
        <div
          style={{
            width: 40,
            height: 1,
            background: "rgba(201,160,80,0.3)",
            marginTop: 24,
            opacity: open ? 1 : 0,
            transform: open ? "scaleX(1)" : "scaleX(0)",
            transition: "all 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s",
          }}
        />

        {/* Address in mobile menu */}
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            letterSpacing: 2,
            color: "rgba(255,255,255,0.2)",
            marginTop: 16,
            textTransform: "uppercase",
            opacity: open ? 1 : 0,
            transition: "opacity 0.6s 0.5s",
          }}
        >
          7065 Sunset Blvd, Hollywood
        </p>
      </div>
    </>
  );
}