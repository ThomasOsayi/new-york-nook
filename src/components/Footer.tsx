"use client";

import Link from "next/link";
import { useInView } from "@/hooks/useInView";

const footerColumns = [
  { title: "Navigate", links: ["Menu", "Gallery", "Reservations", "Order Online", "Catering"] },
  { title: "Connect", links: ["Instagram", "Facebook", "Yelp", "Google"] },
  { title: "Info", links: ["Private Events", "Gift Cards", "Press", "Login"] },
];

export default function Footer() {
  const [ref, visible] = useInView(0.1);

  return (
    <footer
      ref={ref as React.Ref<HTMLElement>}
      style={{
        background: "#050403",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "60px clamp(16px, 4vw, 60px) 40px",
        }}
      >
        {/* ── Main grid ── */}
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: "1px solid rgba(183,143,82,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: "rotate(45deg)",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    transform: "rotate(-45deg)",
                    fontFamily: "var(--font-display)",
                    fontSize: 13,
                    color: "#C9A050",
                    fontWeight: 700,
                  }}
                >
                  N
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: 2,
                }}
              >
                NEW YORK NOOK
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-accent)",
                fontSize: 13,
                color: "rgba(255,255,255,0.3)",
                fontStyle: "italic",
                lineHeight: 1.7,
                maxWidth: 280,
              }}
            >
              Fine Russian cuisine in the heart of Hollywood. A culinary journey through tradition
              and innovation.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col, colIdx) => (
            <div
              key={colIdx}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${0.1 + colIdx * 0.08}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${0.1 + colIdx * 0.08}s`,
              }}
            >
              <h4
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 10,
                  letterSpacing: 3,
                  color: "#C9A050",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              >
                {col.title}
              </h4>
              {col.links.map((link) => {
                const isLogin = link === "Login";
                const linkStyle: React.CSSProperties = {
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  textDecoration: "none",
                  marginBottom: 12,
                  transition: "color 0.3s",
                  padding: "4px 0", /* larger touch target */
                };

                return isLogin ? (
                  <Link
                    key={link}
                    href="/login"
                    style={linkStyle}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A050")}
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")
                    }
                  >
                    {link}
                  </Link>
                ) : (
                  <a
                    key={link}
                    href="#"
                    style={linkStyle}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9A050")}
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)")
                    }
                  >
                    {link}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "rgba(255,255,255,0.15)",
              letterSpacing: 1,
            }}
          >
            © {new Date().getFullYear()} New York Nook. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 10,
              color: "rgba(255,255,255,0.15)",
            }}
          >
            7065 Sunset Blvd, Hollywood, CA 90028
          </p>
        </div>
      </div>
    </footer>
  );
}