"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";

const TIME_SLOTS = [
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, "8+"] as const;

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 16, /* 16px prevents iOS zoom on focus */
  fontWeight: 300,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "14px 16px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.3s",
  borderRadius: 0, /* prevents iOS default rounding */
  WebkitAppearance: "none",
};

export default function ReservationSection() {
  const [ref, visible] = useInView();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    party: 2 as number | string,
  });
  const [submitted, setSubmitted] = useState(false);

  /**
   * TODO: Replace with real backend call.
   * Options: OpenTable widget, Resy API, or custom POST to /api/reservations.
   */
  const handleSubmit = () => setSubmitted(true);

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "url('https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1800&q=80') center/cover",
          filter: "brightness(0.15)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right,rgba(8,6,3,0.95) 40%,rgba(8,6,3,0.7) 100%)",
        }}
      />

      <div
        className="res-grid"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "clamp(60px, 10vw, 120px) clamp(16px, 4vw, 60px)",
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(32px, 6vw, 80px)",
          alignItems: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Left copy */}
        <div>
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(9px, 1.4vw, 11px)",
              letterSpacing: "clamp(3px, 0.8vw, 6px)",
              color: "#C9A050",
              textTransform: "uppercase",
            }}
          >
            Join Us
          </span>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 400,
              color: "#fff",
              margin: "16px 0 clamp(16px, 3vw, 24px)",
              lineHeight: 1.1,
            }}
          >
            Reserve a<br />
            <span style={{ fontStyle: "italic" }}>Table</span>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-accent)",
              fontSize: "clamp(13px, 1.5vw, 15px)",
              color: "rgba(255,255,255,0.4)",
              fontStyle: "italic",
              lineHeight: 1.9,
              marginBottom: "clamp(20px, 3vw, 32px)",
            }}
          >
            Secure your spot for an unforgettable evening of Russian fine dining
            in the heart of Hollywood.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Tuesday – Sunday, 5 PM – 11 PM",
              "Parties of 8+ please call directly",
              "Smart casual dress code",
            ].map((note, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-12px)",
                  transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.08}s`,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 1,
                    background: "rgba(183,143,82,0.4)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(11px, 1.3vw, 12px)",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {note}
                </span>
              </div>
            ))}
          </div>
          {/* Accent image — hidden on mobile via globals.css or stacking */}
          <div
            className="res-accent-img"
            style={{
              marginTop: 40,
              overflow: "hidden",
              border: "1px solid rgba(183,143,82,0.12)",
              maxWidth: 300,
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&q=80"
              alt="Wine"
              loading="lazy"
              style={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                filter: "brightness(0.7)",
              }}
            />
          </div>
        </div>

        {/* Right form */}
        <div
          style={{
            background: "rgba(8,6,3,0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(183,143,82,0.12)",
            padding: "clamp(24px, 4vw, 40px)",
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "clamp(24px, 4vw, 40px) 0" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  border: "2px solid #C9A050",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  animation: "scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
                }}
              >
                <span style={{ color: "#C9A050", fontSize: 28 }}>✓</span>
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(22px, 3vw, 28px)",
                  color: "#fff",
                  fontWeight: 400,
                  margin: "0 0 12px",
                }}
              >
                Reservation Confirmed
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                We look forward to welcoming you.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 2vw, 16px)" }}>
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(183,143,82,0.4)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
              <input
                placeholder="Phone Number"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(183,143,82,0.4)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.08)")
                }
              />
              <div
                className="res-date-time"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "clamp(10px, 2vw, 16px)",
                }}
              >
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
                <select
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select Time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: 2,
                    marginBottom: 10,
                    textTransform: "uppercase",
                  }}
                >
                  Party Size
                </p>
                <div style={{ display: "flex", gap: "clamp(4px, 0.8vw, 6px)", flexWrap: "wrap" }}>
                  {PARTY_SIZES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm({ ...form, party: n })}
                      style={{
                        width: "clamp(38px, 5vw, 44px)",
                        height: "clamp(38px, 5vw, 44px)",
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(14px, 1.6vw, 16px)",
                        background:
                          form.party === n
                            ? "rgba(183,143,82,0.15)"
                            : "rgba(255,255,255,0.02)",
                        border:
                          form.party === n
                            ? "1px solid #C9A050"
                            : "1px solid rgba(255,255,255,0.06)",
                        color:
                          form.party === n
                            ? "#C9A050"
                            : "rgba(255,255,255,0.35)",
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="btn-gold-filled"
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "clamp(14px, 2vw, 18px)",
                }}
              >
                Confirm Reservation
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}