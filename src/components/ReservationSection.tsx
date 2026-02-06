"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";

const TIME_SLOTS = ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, "8+"] as const;

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  fontWeight: 300,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "16px 20px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.3s",
};

export default function ReservationSection() {
  const [ref, visible] = useInView();
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", party: 2 as number | string });
  const [submitted, setSubmitted] = useState(false);

  /**
   * TODO: Replace with real backend call.
   * Options: OpenTable widget, Resy API, or custom POST to /api/reservations.
   */
  const handleSubmit = () => setSubmitted(true);

  return (
    <section ref={ref as React.Ref<HTMLElement>} style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "url('https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1800&q=80') center/cover", filter: "brightness(0.15)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(8,6,3,0.95) 40%,rgba(8,6,3,0.7) 100%)" }} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "120px clamp(20px,4vw,60px)",
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 80,
          alignItems: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
          transition: "all 1s ease",
        }}
        className="res-grid"
      >
        {/* Left copy */}
        <div>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 6, color: "#C9A050", textTransform: "uppercase" }}>Join Us</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,4vw,52px)", fontWeight: 400, color: "#fff", margin: "16px 0 24px", lineHeight: 1.1 }}>
            Reserve a<br />
            <span style={{ fontStyle: "italic" }}>Table</span>
          </h2>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.4)", fontStyle: "italic", lineHeight: 1.9, marginBottom: 32 }}>
            Secure your spot for an unforgettable evening of Russian fine dining in the heart of Hollywood.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {["Tuesday – Sunday, 5 PM – 11 PM", "Parties of 8+ please call directly", "Smart casual dress code"].map((note, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 16, height: 1, background: "rgba(183,143,82,0.4)" }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{note}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, overflow: "hidden", border: "1px solid rgba(183,143,82,0.12)", maxWidth: 300 }}>
            <img src="https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&q=80" alt="Wine" style={{ width: "100%", height: 180, objectFit: "cover", filter: "brightness(0.7)" }} />
          </div>
        </div>

        {/* Right form */}
        <div style={{ background: "rgba(8,6,3,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(183,143,82,0.12)", padding: 40 }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 60, height: 60, border: "2px solid #C9A050", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <span style={{ color: "#C9A050", fontSize: 28 }}>✓</span>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "#fff", fontWeight: 400, margin: "0 0 12px" }}>Reservation Confirmed</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>We look forward to welcoming you.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
                <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select Time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Party Size</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PARTY_SIZES.map((n) => (
                    <button
                      key={n}
                      onClick={() => setForm({ ...form, party: n })}
                      style={{
                        width: 44,
                        height: 44,
                        fontFamily: "var(--font-display)",
                        fontSize: 16,
                        background: form.party === n ? "rgba(183,143,82,0.15)" : "rgba(255,255,255,0.02)",
                        border: form.party === n ? "1px solid #C9A050" : "1px solid rgba(255,255,255,0.06)",
                        color: form.party === n ? "#C9A050" : "rgba(255,255,255,0.35)",
                        cursor: "pointer",
                        transition: "all 0.3s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSubmit} className="btn-gold-filled" style={{ marginTop: 8, width: "100%", padding: "18px" }}>
                Confirm Reservation
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
