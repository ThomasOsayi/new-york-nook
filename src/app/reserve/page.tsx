"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

/* ═══════════════════════════════════════════════════════
   /reserve — Interactive Floor Plan Reservation Page
   4-step flow: Date/Time → Table → Details → Confirmation
   Tables, time slots, and rules loaded from Firestore
   settings/reservations — fully dynamic.
   ═══════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────────────── */

interface TablePos {
  id: string;
  label: string;
  seats: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ResTimeSlot {
  time: string;
  label: string;
  enabled: boolean;
}

interface ReservationSettings {
  tables: { id: string; label: string; seats: number; active?: boolean }[];
  timeSlots: ResTimeSlot[];
  maxPartySize: number;
  advanceBookingDays: number;
  acceptingReservations: boolean;
  autoConfirm: boolean;
  closedDays: string[];
  slotDurationMinutes: number;
  bufferMinutes: number;
}

/* ── Dynamic Floor Plan ───────────────────────────────── 
   Computes SVG positions from settings.tables array.
   Bar across top wall, auto-grid tables below.
   SVG height + dining area scale with table count.
   ──────────────────────────────────────────────────────── */

const TABLE_SIZE = 64;
const TABLE_PAD = 20;
const COLS = 4;
const DINING_X = 16;
const DINING_Y = 85;
const SVG_W = 520;

function computeFloorPlan(tables: { id: string; label: string; seats: number }[]) {
  const count = tables.length;
  if (count === 0) return { positions: [] as TablePos[], svgH: 200, diningH: 80 };

  const cols = Math.min(count, COLS);
  const rows = Math.ceil(count / cols);

  const diningH = 40 + rows * (TABLE_SIZE + TABLE_PAD) + 20;
  const svgH = DINING_Y + diningH + 16;
  const diningW = SVG_W - 32;
  const startY = DINING_Y + 40;

  const positions: TablePos[] = tables.map((t, i) => {
    const row = Math.floor(i / cols);
    const itemsInRow = row < rows - 1 ? cols : count - row * cols;
    const rowTotalW = itemsInRow * TABLE_SIZE + (itemsInRow - 1) * TABLE_PAD;
    const rowStartX = DINING_X + (diningW - rowTotalW) / 2;
    const colInRow = i - row * cols;

    return {
      id: t.id,
      label: t.label,
      seats: t.seats,
      x: rowStartX + colInRow * (TABLE_SIZE + TABLE_PAD),
      y: startY + row * (TABLE_SIZE + TABLE_PAD),
      w: TABLE_SIZE,
      h: TABLE_SIZE,
    };
  });

  return { positions, svgH, diningH };
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ── Helpers ────────────────────────────────────────────── */

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function friendlyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_OF_WEEK[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${d}, ${y}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ── Default settings (fallback if Firestore empty) ──── */

const DEFAULT_SETTINGS: ReservationSettings = {
  tables: [
    { id: "T1", label: "T1", seats: 2, active: true },
    { id: "T2", label: "T2", seats: 2, active: true },
    { id: "T3", label: "T3", seats: 4, active: true },
    { id: "T4", label: "T4", seats: 4, active: true },
    { id: "T5", label: "T5", seats: 4, active: true },
    { id: "T6", label: "T6", seats: 6, active: true },
    { id: "T7", label: "T7", seats: 6, active: true },
    { id: "T8", label: "T8", seats: 8, active: true },
    { id: "T9", label: "T9", seats: 2, active: true },
    { id: "T10", label: "T10", seats: 4, active: true },
    { id: "PDR", label: "PDR", seats: 12, active: true },
  ],
  timeSlots: [
    { time: "17:00", label: "5:00 PM", enabled: true },
    { time: "17:30", label: "5:30 PM", enabled: true },
    { time: "18:00", label: "6:00 PM", enabled: true },
    { time: "18:30", label: "6:30 PM", enabled: true },
    { time: "19:00", label: "7:00 PM", enabled: true },
    { time: "19:30", label: "7:30 PM", enabled: true },
    { time: "20:00", label: "8:00 PM", enabled: true },
    { time: "20:30", label: "8:30 PM", enabled: true },
    { time: "21:00", label: "9:00 PM", enabled: true },
    { time: "21:30", label: "9:30 PM", enabled: false },
  ],
  maxPartySize: 8,
  advanceBookingDays: 90,
  acceptingReservations: true,
  autoConfirm: true,
  closedDays: ["Monday"],
  slotDurationMinutes: 90,
  bufferMinutes: 15,
};

/* ═══════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════ */

export default function ReservePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<ReservationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Step 1
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);

  // Step 2
  const [selectedTable, setSelectedTable] = useState("");
  const [hoveredTable, setHoveredTable] = useState("");
  const [bookedTables, setBookedTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Step 3
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNotes, setGuestNotes] = useState("");

  // Step 4
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);

  /* ── Derived data ───────────────────────────────── */
  const activeTables = useMemo(
    () => settings.tables.filter((t) => t.active !== false),
    [settings.tables]
  );

  const enabledTimeSlots = useMemo(
    () => settings.timeSlots.filter((s) => s.enabled),
    [settings.timeSlots]
  );

  const floorPlan = useMemo(
    () => computeFloorPlan(activeTables),
    [activeTables]
  );

  const selectedTableInfo = useMemo(
    () => activeTables.find((t) => t.id === selectedTable),
    [activeTables, selectedTable]
  );

  /* ── Load settings from Firestore ───────────────── */
  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, "settings", "reservations"));
        if (snap.exists()) {
          const d = snap.data();
          setSettings({ ...DEFAULT_SETTINGS, ...d } as ReservationSettings);
        }
      } catch (e) {
        console.error("Failed to load reservation settings:", e);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  /* ── Load booked tables for date/time ──────────── */
  const loadBookedTables = useCallback(async (date: string, time: string) => {
    setLoadingTables(true);
    try {
      const q = query(
        collection(db, "reservations"),
        where("date", "==", date),
        where("time", "==", time),
        where("status", "in", ["confirmed", "pending", "seated"])
      );
      const snap = await getDocs(q);
      const taken: string[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.table) taken.push(data.table);
      });
      setBookedTables(taken);
    } catch (e) {
      console.error("Failed to load booked tables:", e);
      setBookedTables([]);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  /* ── Calendar ───────────────────────────────────── */
  const today = new Date();
  const todayStr = formatDate(today);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + settings.advanceBookingDays);

  const isDateDisabled = (day: number): boolean => {
    const d = new Date(calYear, calMonth, day);
    const dateStr = formatDate(d);
    if (dateStr < todayStr) return true;
    if (d > maxDate) return true;
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
    if (settings.closedDays.includes(dayName)) return true;
    return false;
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const canGoPrev = calYear > today.getFullYear() || (calYear === today.getFullYear() && calMonth > today.getMonth());

  /* ── Table status helpers ───────────────────────── */
  const getTableStatus = (t: TablePos): "available" | "booked" | "selected" | "too-small" => {
    if (t.id === selectedTable) return "selected";
    if (bookedTables.includes(t.id)) return "booked";
    if (t.seats < partySize) return "too-small";
    return "available";
  };

  const getTableFill = (t: TablePos): string => {
    const s = getTableStatus(t);
    if (s === "selected") return "rgba(201,168,76,0.4)";
    if (s === "booked") return "rgba(220,60,60,0.25)";
    if (s === "too-small") return "rgba(255,255,255,0.02)";
    if (hoveredTable === t.id) return "rgba(201,168,76,0.2)";
    return "rgba(255,255,255,0.06)";
  };

  const getTableStroke = (t: TablePos): string => {
    const s = getTableStatus(t);
    if (s === "selected") return "#C9A050";
    if (s === "booked") return "rgba(220,60,60,0.5)";
    if (s === "too-small") return "rgba(183,143,82,0.08)";
    if (hoveredTable === t.id) return "rgba(201,168,76,0.6)";
    return "rgba(183,143,82,0.2)";
  };

  const getTableTextColor = (t: TablePos): string => {
    const s = getTableStatus(t);
    if (s === "selected") return "#C9A050";
    if (s === "booked") return "rgba(220,60,60,0.6)";
    if (s === "too-small") return "rgba(255,255,255,0.15)";
    return "rgba(255,255,255,0.5)";
  };

  const isTableClickable = (t: TablePos): boolean => {
    const s = getTableStatus(t);
    return s === "available" || s === "selected";
  };

  /* ── Navigation ─────────────────────────────────── */
  const goToStep = (s: number) => {
    setStep(s);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDateTimeNext = () => {
    if (!selectedDate || !selectedTime) return;
    loadBookedTables(selectedDate, selectedTime);
    goToStep(2);
  };

  const handleTableNext = () => {
    if (!selectedTable) return;
    goToStep(3);
  };

  const handleDetailsNext = () => {
    if (!guestName.trim() || !guestPhone.trim()) return;
    goToStep(4);
  };

  /* ── Submit ─────────────────────────────────────── */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const tableInfo = activeTables.find((t) => t.id === selectedTable);
      const docRef = await addDoc(collection(db, "reservations"), {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        date: selectedDate,
        time: selectedTime,
        party: partySize,
        table: selectedTable,
        tableSeats: tableInfo?.seats || null,
        notes: guestNotes.trim() || null,
        status: settings.autoConfirm ? "confirmed" : "pending",
        createdAt: Timestamp.now(),
      });
      setConfirmationId(docRef.id.slice(0, 8).toUpperCase());
      setConfirmed(true);
    } catch (e) {
      console.error("Failed to submit reservation:", e);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Styles ─────────────────────────────────────── */
  const S = {
    label: {
      fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 3,
      textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)",
      marginBottom: 10, display: "block",
    },
    input: {
      width: "100%", padding: "14px 16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(183,143,82,0.15)",
      color: "#fff", fontFamily: "var(--font-body)", fontSize: 14,
      outline: "none", transition: "border-color 0.3s",
    },
    sectionTitle: {
      fontFamily: "var(--font-display)", fontSize: "clamp(20px, 3vw, 26px)",
      fontWeight: 400 as const, color: "#fff", marginBottom: 6,
    },
    sectionSub: {
      fontFamily: "var(--font-accent)", fontSize: 14,
      color: "rgba(255,255,255,0.3)", fontStyle: "italic" as const,
      marginBottom: 28,
    },
  };

  /* ── Loading / Paused ───────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "rgb(var(--bg-primary))", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(183,143,82,0.3)", borderTopColor: "#C9A050", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Loading...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
      </div>
    );
  }

  if (!settings.acceptingReservations) {
    return (
      <div style={{ minHeight: "100vh", background: "rgb(var(--bg-primary))", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 500 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "#fff", marginBottom: 16 }}>Reservations Paused</h1>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 16, color: "rgba(255,255,255,0.4)", fontStyle: "italic", lineHeight: 1.8, marginBottom: 32 }}>
            We are not currently accepting online reservations. Please call us at (323) 555-0100.
          </p>
          <button className="btn-gold-outline" onClick={() => router.push("/")}>Return Home</button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */

  return (
    <div style={{ minHeight: "100vh", background: "rgb(var(--bg-primary))" }}>
      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,6,3,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(183,143,82,0.1)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-body)", fontSize: 12, letterSpacing: 1, transition: "color 0.3s" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3L5 8l5 5" /></svg>
            Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, border: "1px solid rgba(183,143,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
              <span style={{ transform: "rotate(-45deg)", fontFamily: "var(--font-display)", fontSize: 11, color: "#C9A050", fontWeight: 700 }}>N</span>
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>RESERVE</span>
          </div>

          <div style={{ width: 60 }} />
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", maxWidth: 600, margin: "0 auto", padding: "0 20px 12px" }}>
          {["Date & Time", "Table", "Details", "Confirm"].map((label, i) => {
            const stepNum = i + 1;
            const active = step >= stepNum;
            const current = step === stepNum;
            return (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  {i > 0 && <div style={{ flex: 1, height: 1, background: active ? "rgba(183,143,82,0.4)" : "rgba(255,255,255,0.06)", transition: "background 0.4s" }} />}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: active ? (current ? "#C9A050" : "rgba(183,143,82,0.3)") : "rgba(255,255,255,0.05)",
                    border: `1px solid ${active ? "#C9A050" : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600,
                    color: active ? (current ? "rgb(var(--bg-primary))" : "#C9A050") : "rgba(255,255,255,0.2)",
                    transition: "all 0.4s", flexShrink: 0,
                  }}>
                    {step > stepNum ? "✓" : stepNum}
                  </div>
                  {i < 3 && <div style={{ flex: 1, height: 1, background: step > stepNum ? "rgba(183,143,82,0.4)" : "rgba(255,255,255,0.06)", transition: "background 0.4s" }} />}
                </div>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: current ? "#C9A050" : active ? "rgba(183,143,82,0.5)" : "rgba(255,255,255,0.15)",
                  transition: "color 0.3s",
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div ref={contentRef} style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,40px) 80px" }}>

        {/* ═══════ STEP 1: DATE & TIME ═══════ */}
        {step === 1 && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, color: "#C9A050", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Step 1</span>
              <h1 style={S.sectionTitle}>Choose Your Date &amp; Time</h1>
              <p style={S.sectionSub}>Select your preferred evening and party size</p>
            </div>

            {/* Party size */}
            <div style={{ marginBottom: 32 }}>
              <label style={S.label}>Party Size</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Array.from({ length: settings.maxPartySize }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => { setPartySize(n); setSelectedTable(""); }}
                    style={{
                      width: 44, height: 44,
                      background: partySize === n ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${partySize === n ? "#C9A050" : "rgba(183,143,82,0.12)"}`,
                      color: partySize === n ? "#C9A050" : "rgba(255,255,255,0.4)",
                      fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500,
                      cursor: "pointer", transition: "all 0.3s",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div style={{ marginBottom: 32 }}>
              <label style={S.label}>Select Date</label>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(183,143,82,0.1)", padding: "clamp(16px,3vw,28px)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <button onClick={prevMonth} disabled={!canGoPrev} style={{ background: "none", border: "none", cursor: canGoPrev ? "pointer" : "default", color: canGoPrev ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)", fontSize: 18, padding: "4px 8px", transition: "color 0.3s" }}>‹</button>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "#fff", fontWeight: 400 }}>{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 18, padding: "4px 8px", transition: "color 0.3s" }}>›</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                  {DAYS_OF_WEEK.map((d) => (
                    <div key={d} style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", padding: "8px 0" }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: getDaysInMonth(calYear, calMonth) }, (_, i) => i + 1).map((day) => {
                    const dateStr = formatDate(new Date(calYear, calMonth, day));
                    const disabled = isDateDisabled(day);
                    const selected = selectedDate === dateStr;
                    const isToday = dateStr === todayStr;
                    return (
                      <button key={day} onClick={() => { if (!disabled) { setSelectedDate(dateStr); setSelectedTime(""); setSelectedTable(""); } }} disabled={disabled}
                        style={{
                          aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                          background: selected ? "rgba(201,168,76,0.2)" : "transparent",
                          border: selected ? "1px solid #C9A050" : isToday ? "1px solid rgba(183,143,82,0.2)" : "1px solid transparent",
                          color: disabled ? "rgba(255,255,255,0.1)" : selected ? "#C9A050" : "rgba(255,255,255,0.6)",
                          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selected ? 600 : 400,
                          cursor: disabled ? "default" : "pointer", transition: "all 0.2s", opacity: disabled ? 0.4 : 1,
                        }}
                      >{day}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div style={{ marginBottom: 40, animation: "fadeUp 0.4s ease" }}>
                <label style={S.label}>Select Time — {friendlyDate(selectedDate)}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                  {enabledTimeSlots.map((slot) => (
                    <button key={slot.time} onClick={() => { setSelectedTime(slot.label); setSelectedTable(""); }}
                      style={{
                        padding: "14px 12px",
                        background: selectedTime === slot.label ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedTime === slot.label ? "#C9A050" : "rgba(183,143,82,0.12)"}`,
                        color: selectedTime === slot.label ? "#C9A050" : "rgba(255,255,255,0.45)",
                        fontFamily: "var(--font-body)", fontSize: 13, fontWeight: selectedTime === slot.label ? 600 : 400,
                        cursor: "pointer", transition: "all 0.3s", textAlign: "center",
                      }}
                    >{slot.label}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-gold-filled" onClick={handleDateTimeNext} disabled={!selectedDate || !selectedTime}
                style={{ padding: "16px 48px", fontSize: 12, letterSpacing: 3, opacity: selectedDate && selectedTime ? 1 : 0.3, cursor: selectedDate && selectedTime ? "pointer" : "default" }}
              >Choose Table →</button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 2: TABLE SELECTION ═══════ */}
        {step === 2 && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, color: "#C9A050", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Step 2</span>
              <h1 style={S.sectionTitle}>Choose Your Table</h1>
              <p style={S.sectionSub}>{friendlyDate(selectedDate)} at {selectedTime} · Party of {partySize}</p>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
              {[
                { label: "Available", color: "rgba(255,255,255,0.06)", border: "rgba(183,143,82,0.2)" },
                { label: "Selected", color: "rgba(201,168,76,0.4)", border: "#C9A050" },
                { label: "Booked", color: "rgba(220,60,60,0.25)", border: "rgba(220,60,60,0.5)" },
                { label: "Too Small", color: "rgba(255,255,255,0.02)", border: "rgba(183,143,82,0.08)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 16, height: 16, background: item.color, border: `1px solid ${item.border}` }} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Floor plan */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(183,143,82,0.1)", padding: "clamp(12px,2vw,24px)", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              {loadingTables && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(8,6,3,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid rgba(183,143,82,0.3)", borderTopColor: "#C9A050", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                </div>
              )}

              <div style={{ width: "100%", overflowX: "auto" }}>
                <svg viewBox={`0 0 ${SVG_W} ${floorPlan.svgH}`} style={{ width: "100%", maxWidth: SVG_W, margin: "0 auto", display: "block", minWidth: 320 }}>
                  {/* Restaurant outline */}
                  <rect x="8" y="8" width={SVG_W - 16} height={floorPlan.svgH - 16} rx="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

                  {/* Door */}
                  <line x1="12" y1="8" x2="55" y2="8" stroke="rgba(183,143,82,0.5)" strokeWidth="3" strokeDasharray="6,4" />
                  <text x="34" y="26" textAnchor="middle" fill="rgba(183,143,82,0.4)" fontSize="9" fontFamily="var(--font-body)" letterSpacing="2">DOOR</text>

                  {/* Bar */}
                  <rect x="75" y="16" width={SVG_W - 100} height="55" rx="6" fill="rgba(183,143,82,0.05)" stroke="rgba(183,143,82,0.12)" strokeWidth="1" />
                  <text x={(75 + SVG_W - 100) / 2 + 38} y="49" textAnchor="middle" fill="rgba(183,143,82,0.25)" fontSize="10" fontFamily="var(--font-body)" letterSpacing="5">BAR</text>

                  {/* Dining area */}
                  <rect x="16" y="85" width={SVG_W - 32} height={floorPlan.diningH} rx="4" fill="rgba(183,143,82,0.025)" stroke="rgba(183,143,82,0.04)" strokeWidth="1" />
                  <text x={SVG_W / 2} y="104" textAnchor="middle" fill="rgba(183,143,82,0.12)" fontSize="9" fontFamily="var(--font-body)" letterSpacing="4">DINING ROOM</text>

                  {/* Tables — dynamic from Firestore */}
                  {floorPlan.positions.map((t) => {
                    const clickable = isTableClickable(t);
                    const status = getTableStatus(t);
                    const cx = t.x + t.w / 2;
                    const cy = t.y + t.h / 2;

                    return (
                      <g key={t.id}
                        onClick={() => { if (clickable) setSelectedTable(selectedTable === t.id ? "" : t.id); }}
                        onMouseEnter={() => clickable && setHoveredTable(t.id)}
                        onMouseLeave={() => setHoveredTable("")}
                        style={{ cursor: clickable ? "pointer" : "default" }}
                        opacity={status === "too-small" ? 0.4 : 1}
                      >
                        <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={4}
                          fill={getTableFill(t)} stroke={getTableStroke(t)}
                          strokeWidth={status === "selected" ? 2 : 1}
                        />
                        <text x={cx} y={cy - 2} textAnchor="middle" fill={getTableTextColor(t)} fontSize="12" fontFamily="var(--font-display)" fontWeight="600">{t.label}</text>
                        <text x={cx} y={cy + 12} textAnchor="middle" fill={status === "too-small" ? "rgba(255,255,255,0.1)" : "rgba(183,143,82,0.3)"} fontSize="8" fontFamily="var(--font-body)" letterSpacing="0.5">{t.seats} seats</text>
                        {status === "booked" && (
                          <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(220,60,60,0.5)" fontSize="28" fontWeight="300">×</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Selected table info */}
            {selectedTable && selectedTableInfo && (
              <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(183,143,82,0.2)", padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeUp 0.3s ease" }}>
                <div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#C9A050" }}>Table {selectedTable}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 12 }}>{selectedTableInfo.seats} seats · Selected</span>
                </div>
                <button onClick={() => setSelectedTable("")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16 }}>✕</button>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-gold-outline" onClick={() => goToStep(1)} style={{ padding: "14px 32px", fontSize: 12, letterSpacing: 2 }}>← Back</button>
              <button className="btn-gold-filled" onClick={handleTableNext} disabled={!selectedTable}
                style={{ padding: "16px 48px", fontSize: 12, letterSpacing: 3, opacity: selectedTable ? 1 : 0.3, cursor: selectedTable ? "pointer" : "default" }}
              >Continue →</button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 3: GUEST DETAILS ═══════ */}
        {step === 3 && (
          <div style={{ maxWidth: 520, margin: "0 auto", animation: "fadeUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, color: "#C9A050", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Step 3</span>
              <h1 style={S.sectionTitle}>Guest Details</h1>
              <p style={S.sectionSub}>Almost there — just a few details to confirm your booking</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(183,143,82,0.1)", padding: "20px 24px", marginBottom: 32 }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 3, color: "rgba(183,143,82,0.5)", textTransform: "uppercase", marginBottom: 12 }}>Booking Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {[
                  { label: "Date", value: friendlyDate(selectedDate) },
                  { label: "Time", value: selectedTime },
                  { label: "Party", value: `${partySize} guest${partySize > 1 ? "s" : ""}` },
                  { label: "Table", value: `Table ${selectedTable}${selectedTableInfo ? ` (${selectedTableInfo.seats} seats)` : ""}` },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Full Name *</label>
              <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" style={S.input}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")} onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Phone Number *</label>
              <input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="(555) 000-0000" style={S.input}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")} onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")} />
            </div>

            <div style={{ marginBottom: 36 }}>
              <label style={S.label}>Special Requests (optional)</label>
              <textarea value={guestNotes} onChange={(e) => setGuestNotes(e.target.value)} placeholder="Allergies, celebrations, seating preferences..." rows={3}
                style={{ ...S.input, resize: "vertical" as const, minHeight: 80 }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")} onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-gold-outline" onClick={() => goToStep(2)} style={{ padding: "14px 32px", fontSize: 12, letterSpacing: 2 }}>← Back</button>
              <button className="btn-gold-filled" onClick={handleDetailsNext} disabled={!guestName.trim() || !guestPhone.trim()}
                style={{ padding: "16px 48px", fontSize: 12, letterSpacing: 3, opacity: guestName.trim() && guestPhone.trim() ? 1 : 0.3, cursor: guestName.trim() && guestPhone.trim() ? "pointer" : "default" }}
              >Review →</button>
            </div>
          </div>
        )}

        {/* ═══════ STEP 4: REVIEW & CONFIRM ═══════ */}
        {step === 4 && !confirmed && (
          <div style={{ maxWidth: 520, margin: "0 auto", animation: "fadeUp 0.5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, color: "#C9A050", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Step 4</span>
              <h1 style={S.sectionTitle}>Review &amp; Confirm</h1>
              <p style={S.sectionSub}>Please verify your details before confirming</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(183,143,82,0.15)", padding: "28px 28px", marginBottom: 32 }}>
              {[
                { label: "Guest", value: guestName },
                { label: "Phone", value: guestPhone },
                { label: "Date", value: friendlyDate(selectedDate) },
                { label: "Time", value: selectedTime },
                { label: "Party Size", value: `${partySize} guest${partySize > 1 ? "s" : ""}` },
                { label: "Table", value: `Table ${selectedTable}${selectedTableInfo ? ` (${selectedTableInfo.seats} seats)` : ""}` },
                ...(guestNotes.trim() ? [{ label: "Notes", value: guestNotes }] : []),
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderBottom: i < 5 + (guestNotes.trim() ? 1 : 0) ? "1px solid rgba(183,143,82,0.06)" : "none" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase", flexShrink: 0, minWidth: 80 }}>{item.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "right" }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-gold-outline" onClick={() => goToStep(3)} style={{ padding: "14px 32px", fontSize: 12, letterSpacing: 2 }}>← Edit</button>
              <button className="btn-gold-filled" onClick={handleSubmit} disabled={submitting}
                style={{ padding: "16px 48px", fontSize: 12, letterSpacing: 3, opacity: submitting ? 0.5 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
              >{submitting ? "Confirming..." : "Confirm Reservation"}</button>
            </div>
          </div>
        )}

        {/* ═══════ SUCCESS ═══════ */}
        {confirmed && (
          <div style={{ textAlign: "center", maxWidth: 500, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
            <div style={{ width: 72, height: 72, border: "2px solid #C9A050", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32, color: "#C9A050" }}>✓</div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: "#fff", marginBottom: 8 }}>
              Reservation {settings.autoConfirm ? "Confirmed" : "Received"}
            </h1>
            <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.8, marginBottom: 32 }}>
              {settings.autoConfirm ? "Your table is reserved. We look forward to welcoming you." : "We'll confirm your reservation shortly. You'll receive a confirmation call."}
            </p>

            <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(183,143,82,0.15)", padding: "24px 28px", marginBottom: 36, textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 3, color: "#C9A050", textTransform: "uppercase", marginBottom: 16 }}>Confirmation #{confirmationId}</div>
              {[
                { label: "Guest", value: guestName },
                { label: "Date", value: friendlyDate(selectedDate) },
                { label: "Time", value: selectedTime },
                { label: "Party", value: `${partySize} guest${partySize > 1 ? "s" : ""}` },
                { label: "Table", value: `Table ${selectedTable}${selectedTableInfo ? ` (${selectedTableInfo.seats} seats)` : ""}` },
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(183,143,82,0.06)" : "none" }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: 1 }}>{item.label}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn-gold-filled" onClick={() => router.push("/")} style={{ padding: "14px 40px", fontSize: 12, letterSpacing: 2 }}>Return Home</button>
              <button className="btn-gold-outline" onClick={() => { setStep(1); setSelectedDate(""); setSelectedTime(""); setSelectedTable(""); setGuestName(""); setGuestPhone(""); setGuestNotes(""); setConfirmed(false); setConfirmationId(""); }}
                style={{ padding: "14px 40px", fontSize: 12, letterSpacing: 2 }}
              >New Reservation</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}