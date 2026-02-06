import Link from "next/link";

const footerColumns = [
  { title: "Navigate", links: ["Menu", "Gallery", "Reservations", "Order Online", "Catering"] },
  { title: "Connect", links: ["Instagram", "Facebook", "Yelp", "Google"] },
  { title: "Info", links: ["Private Events", "Gift Cards", "Press", "Login"] },
];

export default function Footer() {
  return (
    <footer style={{ background: "#050403", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px clamp(20px,4vw,60px) 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, border: "1px solid rgba(183,143,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
                <span style={{ transform: "rotate(-45deg)", fontFamily: "var(--font-display)", fontSize: 13, color: "#C9A050", fontWeight: 700 }}>N</span>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>NEW YORK NOOK</span>
            </div>
            <p style={{ fontFamily: "var(--font-accent)", fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic", lineHeight: 1.7, maxWidth: 280 }}>
              Fine Russian cuisine in the heart of Hollywood. A culinary journey through tradition and innovation.
            </p>
          </div>

          {/* Link columns */}
          {footerColumns.map((col, i) => (
            <div key={i}>
              <h4 style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 3, color: "#C9A050", textTransform: "uppercase", marginBottom: 20 }}>{col.title}</h4>
              {col.links.map((link) => {
                /* Login gets a real route; everything else stays as placeholder */
                const isLogin = link === "Login";

                return isLogin ? (
                  <Link
                    key={link}
                    href="/login"
                    style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginBottom: 12, transition: "color 0.3s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
                  >
                    {link}
                  </Link>
                ) : (
                  <a
                    key={link}
                    href="#"
                    style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginBottom: 12, transition: "color 0.3s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
                  >
                    {link}
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 1 }}>© {new Date().getFullYear()} New York Nook. All rights reserved.</p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>7065 Sunset Blvd, Hollywood, CA 90028</p>
        </div>
      </div>
    </footer>
  );
}