"use client";

import { useState, useRef, useEffect } from "react";
import { useInView } from "@/hooks/useInView";

/* ── Constants ── */
const TIME_SLOTS = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
  "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, "8+"] as const;
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Helpers ── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(d: Date) {
  return isSameDay(d, new Date());
}
function isPast(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}
/* Restaurant closed on Mondays */
function isMonday(d: Date) {
  return d.getDay() === 1;
}

/* ── Input style ── */
const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 16,
  fontWeight: 300,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "14px 16px",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.3s, background 0.3s",
  borderRadius: 0,
  WebkitAppearance: "none",
};

/* ══════════════════════════════════════════
   Custom Calendar Component
   ══════════════════════════════════════════ */
function CustomCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  /* Can't go before current month */
  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  /* Limit to 3 months ahead */
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
  const canGoNext = new Date(viewYear, viewMonth + 1, 1) < maxDate;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Month navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          style={{
            width: 32,
            height: 32,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "transparent",
            color: canGoPrev ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
            cursor: canGoPrev ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            fontFamily: "var(--font-body)",
            fontSize: 14,
          }}
        >
          ‹
        </button>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 400,
            color: "#fff",
            letterSpacing: 0.5,
          }}
        >
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
          style={{
            width: 32,
            height: 32,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "transparent",
            color: canGoNext ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
            cursor: canGoNext ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            fontFamily: "var(--font-body)",
            fontSize: 14,
          }}
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginBottom: 6,
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1,
              color: "rgba(255,255,255,0.2)",
              textTransform: "uppercase",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
        }}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }
          const date = new Date(viewYear, viewMonth, day);
          const past = isPast(date);
          const closed = isMonday(date);
          const disabled = past || closed;
          const isSelected = selected && isSameDay(date, selected);
          const isTodayDate = isToday(date);

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => onSelect(date)}
              style={{
                width: "100%",
                aspectRatio: "1",
                border: isSelected
                  ? "1px solid #C9A050"
                  : isTodayDate
                    ? "1px solid rgba(201,160,80,0.3)"
                    : "1px solid transparent",
                background: isSelected
                  ? "rgba(201,160,80,0.15)"
                  : "transparent",
                color: disabled
                  ? "rgba(255,255,255,0.1)"
                  : isSelected
                    ? "#C9A050"
                    : "#fff",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: isSelected ? 600 : 400,
                cursor: disabled ? "default" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                textDecoration: closed && !past ? "line-through" : "none",
              }}
            >
              {day}
              {isTodayDate && !isSelected && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 2,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "#C9A050",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 12,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 9,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              background: "#C9A050",
              display: "inline-block",
            }}
          />
          Today
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 9,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: 0.5,
            textDecoration: "line-through",
          }}
        >
          Mon — Closed
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ReservationSection
   ══════════════════════════════════════════ */
export default function ReservationSection() {
  const [ref, visible] = useInView();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: null as Date | null,
    time: "",
    party: 2 as number | string,
  });
  const [submitted, setSubmitted] = useState(false);

  /* Track which step user is on for mobile */
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeGrid, setShowTimeGrid] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
        setShowTimeGrid(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatDate = (d: Date | null) => {
    if (!d) return "";
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleSubmit = () => setSubmitted(true);

  const isFormValid = form.name && form.phone && form.date && form.time;

  return (
    <section
      ref={ref as React.Ref<HTMLElement>}
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Background */}
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
        {/* ── Left copy ── */}
        <div style={{ textAlign: "center" }}>
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
          <div style={{ display: "inline-flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
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
          {/* Accent image */}
          <div
            className="res-accent-img"
            style={{
              marginTop: 40,
              overflow: "hidden",
              border: "1px solid rgba(183,143,82,0.12)",
              maxWidth: 300,
              marginLeft: "auto",
              marginRight: "auto",
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

        {/* ── Right form ── */}
        <div
          style={{
            background: "rgba(8,6,3,0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(183,143,82,0.12)",
            padding: "clamp(24px, 4vw, 40px)",
          }}
        >
          {submitted ? (
            /* ── Success state ── */
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
                  margin: "0 0 6px",
                }}
              >
                {formatDate(form.date)} at {form.time} · Party of {form.party}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                We look forward to welcoming you, {form.name.split(" ")[0]}.
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 2vw, 16px)" }}>
              {/* Name */}
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />

              {/* Phone */}
              <input
                placeholder="Phone Number"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />

              {/* ── Date picker ── */}
              <div ref={calRef} style={{ position: "relative" }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    marginBottom: 8,
                  }}
                >
                  Date
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCalendar(!showCalendar); setShowTimeGrid(false); }}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: form.date ? "#fff" : "rgba(255,255,255,0.3)",
                    borderColor: showCalendar ? "rgba(183,143,82,0.4)" : "rgba(255,255,255,0.08)",
                    background: showCalendar ? "rgba(201,160,80,0.03)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span>{form.date ? formatDate(form.date) : "Select Date"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>

                {/* Calendar dropdown */}
                {showCalendar && (
                  <div
                    className="res-calendar-dropdown"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "rgba(18,15,10,0.98)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(183,143,82,0.15)",
                      padding: "16px",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                      animation: "resFadeDown 0.25s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    <CustomCalendar
                      selected={form.date}
                      onSelect={(d) => {
                        setForm({ ...form, date: d });
                        setShowCalendar(false);
                        /* Auto-open time picker after date selection */
                        setTimeout(() => setShowTimeGrid(true), 150);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ── Time picker ── */}
              <div ref={timeRef} style={{ position: "relative" }}>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.2)",
                    marginBottom: 8,
                  }}
                >
                  Time
                </div>
                <button
                  type="button"
                  onClick={() => { setShowTimeGrid(!showTimeGrid); setShowCalendar(false); }}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: form.time ? "#fff" : "rgba(255,255,255,0.3)",
                    borderColor: showTimeGrid ? "rgba(183,143,82,0.4)" : "rgba(255,255,255,0.08)",
                    background: showTimeGrid ? "rgba(201,160,80,0.03)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span>{form.time || "Select Time"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </button>

                {/* Time grid dropdown */}
                {showTimeGrid && (
                  <div
                    className="res-time-dropdown"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: "rgba(18,15,10,0.98)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(183,143,82,0.15)",
                      padding: "16px",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                      animation: "resFadeDown 0.25s cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 8,
                      }}
                    >
                      {TIME_SLOTS.map((t) => {
                        const isActive = form.time === t;
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              setForm({ ...form, time: t });
                              setShowTimeGrid(false);
                            }}
                            style={{
                              padding: "11px 8px",
                              border: isActive
                                ? "1px solid #C9A050"
                                : "1px solid rgba(255,255,255,0.06)",
                              background: isActive
                                ? "rgba(201,160,80,0.12)"
                                : "rgba(255,255,255,0.02)",
                              color: isActive ? "#C9A050" : "rgba(255,255,255,0.55)",
                              fontFamily: "var(--font-body)",
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 400,
                              cursor: "pointer",
                              transition: "all 0.2s",
                              textAlign: "center",
                              letterSpacing: 0.3,
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Party size ── */}
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: 2.5,
                    marginBottom: 10,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Party Size
                </p>
                <div
                  className="res-party-grid"
                  style={{
                    display: "flex",
                    gap: "clamp(4px, 0.8vw, 6px)",
                    flexWrap: "wrap",
                  }}
                >
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

              {/* ── Submit ── */}
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="btn-gold-filled"
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "clamp(14px, 2vw, 18px)",
                  opacity: isFormValid ? 1 : 0.4,
                  cursor: isFormValid ? "pointer" : "default",
                  transition: "opacity 0.3s",
                }}
              >
                Confirm Reservation
              </button>

              {/* Summary line */}
              {(form.date || form.time) && (
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.2)",
                    marginTop: 4,
                    transition: "all 0.3s",
                  }}
                >
                  {form.date && formatDate(form.date)}
                  {form.date && form.time && " · "}
                  {form.time}
                  {(form.date || form.time) && ` · Party of ${form.party}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Responsive + Animations ── */}
      <style>{`
        @keyframes resFadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Mobile: stack to single column */
        @media (max-width: 768px) {
          .res-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .res-accent-img {
            display: none !important;
          }
          /* Calendar/time dropdowns: fixed bottom sheet on mobile */
          .res-calendar-dropdown,
          .res-time-dropdown {
            position: fixed !important;
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            border-radius: 20px 20px 0 0 !important;
            padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px)) !important;
            max-height: 70vh !important;
            overflow-y: auto !important;
            animation: resSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) !important;
          }
          .res-party-grid {
            gap: 8px !important;
          }
          .res-party-grid button {
            width: 44px !important;
            height: 44px !important;
            font-size: 16px !important;
          }
        }

        @keyframes resSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Hover states for calendar day buttons (desktop) */
        @media (hover: hover) {
          .res-calendar-dropdown button:not(:disabled):hover {
            background: rgba(201,160,80,0.08) !important;
          }
          .res-time-dropdown button:hover {
            border-color: rgba(201,160,80,0.3) !important;
            background: rgba(201,160,80,0.06) !important;
          }
        }

        /* Touch feedback */
        @media (hover: none) and (pointer: coarse) {
          .res-calendar-dropdown button:active,
          .res-time-dropdown button:active {
            background: rgba(201,160,80,0.15) !important;
          }
        }
      `}</style>
    </section>
  );
}