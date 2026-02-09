"use client";

import { signOut } from "@/lib/auth";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIsTablet } from "@/hooks/useIsMobile";

/* ── Sidebar nav items ── */
const NAV_ITEMS = [
  { key: "orders",       label: "Orders",       icon: "📋", href: "/dashboard/orders" },
  { key: "catering",     label: "Catering",     icon: "🥂", href: "/dashboard/catering" },
  { key: "reservations", label: "Reservations", icon: "📅", href: "/dashboard/reservations" },
  { key: "inventory",    label: "Inventory",    icon: "📦", href: "/dashboard/inventory" },
  { key: "analytics",    label: "Analytics",    icon: "📊", href: "/dashboard/analytics" },
  { key: "settings",     label: "Settings",     icon: "⚙️", href: "/dashboard/settings" },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isTablet = useIsTablet();

  /* Determine active nav item from pathname */
  const activeKey = NAV_ITEMS.find((n) => pathname.startsWith(n.href))?.key ?? "orders";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "rgb(var(--bg-primary))",
        color: "#fff",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* ───────────────── Sidebar (desktop only) ───────────────── */}
      <aside
        className="dash-sidebar"
        style={{
          width: collapsed ? 72 : 240,
          flexShrink: 0,
          background: "rgba(255,255,255,0.02)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s cubic-bezier(0.22,1,0.36,1)",
          overflow: "hidden",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            padding: collapsed ? "20px 0" : "20px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: collapsed ? "center" : "flex-start",
            minHeight: 72,
            cursor: "pointer",
          }}
          onClick={() => router.push("/")}
        >
          {/* Diamond logo */}
          <div
            style={{
              width: 30,
              height: 30,
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
                fontSize: 14,
                color: "#C9A050",
                fontWeight: 700,
              }}
            >
              N
            </span>
          </div>

          {!collapsed && (
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: 2,
                  display: "block",
                  lineHeight: 1,
                }}
              >
                NEW YORK NOOK
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 9,
                  fontWeight: 400,
                  letterSpacing: 2,
                  color: "rgba(183,143,82,0.5)",
                  textTransform: "uppercase",
                }}
              >
                Kitchen Dashboard
              </span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "12px 0" : "12px 14px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 10,
                  border: "none",
                  background: active ? "rgba(201,160,80,0.1)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                  minHeight: 44,
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#C9A050" : "rgba(255,255,255,0.5)",
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {/* Active indicator */}
                {active && !collapsed && (
                  <div
                    style={{
                      marginLeft: "auto",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#C9A050",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign out + Collapse */}
        <div
          style={{
            padding: "12px 8px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: collapsed ? "12px 0" : "12px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 10,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              width: "100%",
              minHeight: 44,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>↪</span>
            {!collapsed && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                Sign Out
              </span>
            )}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "12px 12px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.35)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: collapsed ? 40 : "100%",
              minHeight: 44,
              transition: "all 0.2s",
            }}
          >
            {collapsed ? "→" : "← Collapse"}
          </button>
        </div>
      </aside>

      {/* ───────────────── Main content ───────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflow: "auto", paddingBottom: isTablet ? 72 : 0 }}>
        {children}
      </main>

      {/* ───────────────── Bottom Tab Bar (mobile/tablet only) ───────────────── */}
      <nav
        className="dash-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background: "rgba(8,6,3,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "none",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                minWidth: 44,
                minHeight: 44,
                padding: "6px 8px",
                transition: "color 0.2s",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#C9A050" : "rgba(255,255,255,0.4)",
                  letterSpacing: 0.3,
                }}
              >
                {item.label}
              </span>
              {active && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "#C9A050",
                    marginTop: 1,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}