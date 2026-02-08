"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import PromoCreateModal from "./PromoCreateModal";

/* ═══════════════════════════════════════════════════════════
   NEW YORK NOOK — Settings Dashboard
   /dashboard/settings

   Three sub-tabs:
     1. Restaurant Hours  — open/close per day + online ordering toggle
     2. Pickup Slots      — configurable pickup windows + global limits
     3. Promo Codes       — CRUD promo codes with usage tracking

   All data persists in Firestore:
     • settings/hours       → DaySchedule[] + onlineOrdering bool
     • settings/pickup      → PickupSlot[] + global limits
     • promoCodes (coll)    → individual promo code docs
   ═══════════════════════════════════════════════════════════ */

/* ── Types ────────────────────────────────────────────── */

type DaySchedule = {
  day: string;
  shortDay: string;
  open: boolean;
  openTime: string;
  closeTime: string;
};

type HoursData = {
  days: DaySchedule[];
  onlineOrdering: boolean;
};

type PickupSlot = {
  id: string;
  label: string;
  minMinutes: number;
  maxMinutes: number;
  enabled: boolean;
  maxOrders: number;
};

type PickupData = {
  slots: PickupSlot[];
  defaultLeadTime: number;
  maxConcurrentOrders: number;
};

type PromoCode = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  usageCount: number;
  usageLimit: number | null;
  active: boolean;
  expiresAt: string | null;
  createdAt: unknown;
};

/* ── Defaults ─────────────────────────────────────────── */

const DEFAULT_HOURS: HoursData = {
  onlineOrdering: true,
  days: [
    { day: "Monday", shortDay: "Mon", open: true, openTime: "11:00", closeTime: "22:00" },
    { day: "Tuesday", shortDay: "Tue", open: true, openTime: "11:00", closeTime: "22:00" },
    { day: "Wednesday", shortDay: "Wed", open: true, openTime: "11:00", closeTime: "22:00" },
    { day: "Thursday", shortDay: "Thu", open: true, openTime: "11:00", closeTime: "23:00" },
    { day: "Friday", shortDay: "Fri", open: true, openTime: "11:00", closeTime: "00:00" },
    { day: "Saturday", shortDay: "Sat", open: true, openTime: "10:00", closeTime: "00:00" },
    { day: "Sunday", shortDay: "Sun", open: true, openTime: "10:00", closeTime: "21:00" },
  ],
};

const DEFAULT_PICKUP: PickupData = {
  defaultLeadTime: 25,
  maxConcurrentOrders: 20,
  slots: [
    { id: "s1", label: "ASAP", minMinutes: 25, maxMinutes: 35, enabled: true, maxOrders: 8 },
    { id: "s2", label: "30–45 min", minMinutes: 30, maxMinutes: 45, enabled: true, maxOrders: 10 },
    { id: "s3", label: "45–60 min", minMinutes: 45, maxMinutes: 60, enabled: true, maxOrders: 12 },
    { id: "s4", label: "1–2 hours", minMinutes: 60, maxMinutes: 120, enabled: false, maxOrders: 15 },
  ],
};

/* ── Helpers ───────────────────────────────────────────── */

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/* ── Reusable tiny components ─────────────────────────── */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        background: checked
          ? "rgba(201,160,80,0.5)"
          : "rgba(255,255,255,0.1)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: checked ? "#C9A050" : "rgba(255,255,255,0.35)",
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          transition: "left 0.2s, background 0.2s",
        }}
      />
    </button>
  );
}

function TimeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        background: "rgb(var(--bg-primary))",
        border: `1px solid ${focused ? "rgba(201,160,80,0.5)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 6,
        padding: "7px 10px",
        color: "#fff",
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        outline: "none",
        width: 160,
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
    />
  );
}

function NumInput({
  value,
  onChange,
  min = 0,
  max,
  suffix,
  width = 64,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  width?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "rgb(var(--bg-primary))",
          border: `1px solid ${focused ? "rgba(201,160,80,0.5)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 6,
          padding: "7px 10px",
          color: "#fff",
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          outline: "none",
          width,
          textAlign: "center",
          transition: "border-color 0.2s",
        }}
      />
      {suffix && (
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function SaveButton({
  saving,
  saved,
  onClick,
  label = "Save Changes",
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        padding: "10px 28px",
        borderRadius: 8,
        border: "none",
        background: saved
          ? "#4ADE80"
          : saving
          ? "rgba(255,255,255,0.08)"
          : "linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-dark)))",
        color: saved ? "#000" : saving ? "rgba(255,255,255,0.3)" : "rgb(var(--bg-primary))",
        fontWeight: 600,
        fontSize: 13,
        fontFamily: "var(--font-body)",
        cursor: saving ? "wait" : "pointer",
        transition: "all 0.25s",
        minWidth: 140,
      }}
    >
      {saving ? "Saving…" : saved ? "✓ Saved" : label}
    </button>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "rgba(201,160,80,0.15)",
        border: "1px solid rgba(201,160,80,0.3)",
        borderRadius: 10,
        padding: "12px 20px",
        color: "#C9A050",
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        zIndex: 1000,
        animation: "fadeUp 0.3s ease-out",
        backdropFilter: "blur(12px)",
      }}
    >
      {message}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — RESTAURANT HOURS
   ═══════════════════════════════════════════════════════════ */

function HoursTab() {
  const [data, setData] = useState<HoursData>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  /* Load from Firestore */
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "hours"));
        if (snap.exists()) {
          setData(snap.data() as HoursData);
        }
      } catch (e) {
        console.error("Failed to load hours:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateDay = (i: number, patch: Partial<DaySchedule>) => {
    setData((prev) => ({
      ...prev,
      days: prev.days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "hours"), data);
      setSaved(true);
      setToast("Restaurant hours saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
      setToast("Failed to save — try again");
    } finally {
      setSaving(false);
    }
  };

  const toggleOnlineOrdering = async (v: boolean) => {
    setData((prev) => ({ ...prev, onlineOrdering: v }));
    // Save immediately since this is a critical toggle
    try {
      await setDoc(doc(db, "settings", "hours"), { ...data, onlineOrdering: v });
      setToast(v ? "Online ordering enabled" : "Online ordering disabled");
    } catch (e) {
      console.error("Toggle failed:", e);
      setData((prev) => ({ ...prev, onlineOrdering: !v }));
    }
  };

  const openDays = data.days.filter((d) => d.open).length;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
        Loading hours…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Online Ordering Master Toggle ── */}
      <div
        style={{
          background: data.onlineOrdering
            ? "rgba(74,222,128,0.08)"
            : "rgba(248,113,113,0.08)",
          border: `1px solid ${
            data.onlineOrdering
              ? "rgba(74,222,128,0.18)"
              : "rgba(248,113,113,0.18)"
          }`,
          borderRadius: 12,
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              fontFamily: "var(--font-body)",
            }}
          >
            Online Ordering
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
            {data.onlineOrdering
              ? "Customers can place orders on the website"
              : "Ordering is currently disabled for customers"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              color: data.onlineOrdering ? "#4ADE80" : "#F87171",
            }}
          >
            {data.onlineOrdering ? "LIVE" : "OFF"}
          </span>
          <Toggle checked={data.onlineOrdering} onChange={toggleOnlineOrdering} />
        </div>
      </div>

      {/* ── Week Overview Pills ── */}
      <div style={{ display: "flex", gap: 6 }}>
        {data.days.map((d, i) => (
          <div
            key={d.day}
            onClick={() => {
              updateDay(i, { open: !d.open });
            }}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0 10px",
              borderRadius: 8,
              cursor: "pointer",
              background: d.open
                ? "rgba(201,160,80,0.1)"
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                d.open ? "rgba(201,160,80,0.22)" : "rgba(255,255,255,0.06)"
              }`,
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: d.open ? "#C9A050" : "rgba(255,255,255,0.25)",
                letterSpacing: 0.5,
              }}
            >
              {d.shortDay}
            </div>
            <div
              style={{
                fontSize: 9,
                color: d.open ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
                marginTop: 3,
              }}
            >
              {d.open ? formatTime(d.openTime) : "Closed"}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.25)",
          textAlign: "right",
        }}
      >
        {openDays}/7 days open
      </div>

      {/* ── Daily Schedule Rows ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {data.days.map((d, i) => (
          <div
            key={d.day}
            style={{
              display: "grid",
              gridTemplateColumns: "170px 70px 1fr",
              alignItems: "center",
              gap: 16,
              padding: "14px 16px",
              background:
                i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              borderRadius: 8,
              opacity: d.open ? 1 : 0.4,
              transition: "opacity 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Toggle
                checked={d.open}
                onChange={(v) => updateDay(i, { open: v })}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                }}
              >
                {d.day}
              </span>
            </div>

            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: d.open ? "#4ADE80" : "#F87171",
              }}
            >
              {d.open ? "OPEN" : "CLOSED"}
            </span>

            {d.open ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                <TimeInput
                  value={d.openTime}
                  onChange={(v) => updateDay(i, { openTime: v })}
                />
                <span
                  style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}
                >
                  to
                </span>
                <TimeInput
                  value={d.closeTime}
                  onChange={(v) => updateDay(i, { closeTime: v })}
                />
              </div>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.2)",
                  fontStyle: "italic",
                }}
              >
                No service
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Save ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 8,
        }}
      >
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={handleSave}
          label="Save Hours"
        />
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — PICKUP SLOTS
   ═══════════════════════════════════════════════════════════ */

function PickupTab() {
  const [data, setData] = useState<PickupData>(DEFAULT_PICKUP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "pickup"));
        if (snap.exists()) {
          setData(snap.data() as PickupData);
        }
      } catch (e) {
        console.error("Failed to load pickup settings:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSlot = (id: string, patch: Partial<PickupSlot>) => {
    setData((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
    setSaved(false);
  };

  const addSlot = () => {
    const newSlot: PickupSlot = {
      id: `s${Date.now()}`,
      label: "Custom",
      minMinutes: 30,
      maxMinutes: 60,
      enabled: true,
      maxOrders: 10,
    };
    setData((prev) => ({ ...prev, slots: [...prev.slots, newSlot] }));
    setSaved(false);
  };

  const removeSlot = (id: string) => {
    setData((prev) => ({
      ...prev,
      slots: prev.slots.filter((s) => s.id !== id),
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "pickup"), data);
      setSaved(true);
      setToast("Pickup settings saved");
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Save failed:", e);
      setToast("Failed to save — try again");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
        Loading pickup settings…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Global Settings Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Default Lead Time
          </div>
          <NumInput
            value={data.defaultLeadTime}
            onChange={(v) => {
              setData((prev) => ({ ...prev, defaultLeadTime: v }));
              setSaved(false);
            }}
            min={5}
            max={120}
            suffix="min"
            width={60}
          />
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Minimum prep time before earliest pickup
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Max Concurrent Orders
          </div>
          <NumInput
            value={data.maxConcurrentOrders}
            onChange={(v) => {
              setData((prev) => ({ ...prev, maxConcurrentOrders: v }));
              setSaved(false);
            }}
            min={1}
            max={99}
            suffix="orders"
            width={60}
          />
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Pause new orders when this limit is reached
          </div>
        </div>
      </div>

      {/* ── Pickup Windows ── */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.5,
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
        }}
      >
        Pickup Windows
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.slots.map((slot) => (
          <div
            key={slot.id}
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 220px 120px 40px",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              background: "rgba(255,255,255,0.025)",
              border: `1px solid ${
                slot.enabled
                  ? "rgba(201,160,80,0.2)"
                  : "rgba(255,255,255,0.06)"
              }`,
              borderRadius: 10,
              opacity: slot.enabled ? 1 : 0.45,
              transition: "all 0.2s",
            }}
          >
            <Toggle
              checked={slot.enabled}
              onChange={(v) => updateSlot(slot.id, { enabled: v })}
            />

            <div>
              <input
                value={slot.label}
                onChange={(e) => updateSlot(slot.id, { label: e.target.value })}
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  padding: 0,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 2,
                }}
              >
                {slot.minMinutes}–{slot.maxMinutes} minutes
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <NumInput
                value={slot.minMinutes}
                onChange={(v) => updateSlot(slot.id, { minMinutes: v })}
                min={5}
                suffix="–"
                width={52}
              />
              <NumInput
                value={slot.maxMinutes}
                onChange={(v) => updateSlot(slot.id, { maxMinutes: v })}
                min={slot.minMinutes}
                suffix="min"
                width={52}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 4,
                }}
              >
                Max orders
              </div>
              <NumInput
                value={slot.maxOrders}
                onChange={(v) => updateSlot(slot.id, { maxOrders: v })}
                min={1}
                max={50}
                width={52}
              />
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeSlot(slot.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                color: "rgba(255,255,255,0.15)",
                padding: 4,
                borderRadius: 4,
                transition: "color 0.15s",
                lineHeight: 1,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#F87171")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.15)")
              }
              title="Remove slot"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add Slot */}
      <button
        onClick={addSlot}
        style={{
          padding: 14,
          borderRadius: 10,
          border: "1px dashed rgba(255,255,255,0.08)",
          background: "transparent",
          color: "rgba(255,255,255,0.25)",
          fontSize: 13,
          fontFamily: "var(--font-body)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(201,160,80,0.35)";
          e.currentTarget.style.color = "#C9A050";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.25)";
        }}
      >
        + Add Pickup Window
      </button>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <SaveButton
          saving={saving}
          saved={saved}
          onClick={handleSave}
          label="Save Pickup Settings"
        />
      </div>

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — PROMO CODES
   ═══════════════════════════════════════════════════════════ */

function PromoTab() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  /* Real-time listener */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "promoCodes"),
      (snap) => {
        const items: PromoCode[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PromoCode[];
        items.sort((a, b) => {
          if (a.active !== b.active) return a.active ? -1 : 1;
          return a.code.localeCompare(b.code);
        });
        setPromos(items);
        setLoading(false);
      },
      (err) => {
        console.error("Promo listener error:", err);
        setError(
          "Could not load promo codes. Check Firestore rules for the 'promoCodes' collection."
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const togglePromo = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "promoCodes", id), { active: !current });
      setToast(!current ? "Promo code activated" : "Promo code deactivated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Toggle failed:", msg);
      setToast("Failed to toggle — check Firestore rules");
    }
  };

  const deletePromo = async (id: string, code: string) => {
    try {
      await deleteDoc(doc(db, "promoCodes", id));
      setToast(`Deleted ${code}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Delete failed:", msg);
      setToast("Failed to delete — check Firestore rules");
    }
  };

  const activeCount = promos.filter((p) => p.active).length;
  const existingCodes = promos.map((p) => p.code);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        Loading promo codes…
      </div>
    );
  }

  /* Firestore permission error state */
  if (error) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          background: "rgba(248,113,113,0.06)",
          borderRadius: 12,
          border: "1px solid rgba(248,113,113,0.15)",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#F87171",
            marginBottom: 8,
          }}
        >
          Firestore Permission Error
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          {error}
          <br />
          <br />
          Add this to your Firestore rules:
        </div>
        <div
          style={{
            marginTop: 12,
            background: "rgb(var(--bg-primary))",
            borderRadius: 8,
            padding: "12px 16px",
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: "#C9A050",
            textAlign: "left",
            maxWidth: 420,
            margin: "12px auto 0",
            lineHeight: 1.6,
            whiteSpace: "pre",
          }}
        >
          {`match /promoCodes/{id} {\n  allow read, write: if true;\n}`}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          {activeCount} active · {promos.length - activeCount} inactive
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background:
              "linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-dark)))",
            color: "rgb(var(--bg-primary))",
            fontWeight: 600,
            fontSize: 12,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow =
              "0 4px 20px rgba(201,160,80,0.25)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "none")
          }
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> New
          Promo Code
        </button>
      </div>

      {/* ── Create Modal (separate component) ── */}
      <PromoCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(code) => setToast(`✓ Created ${code}`)}
        existingCodes={existingCodes}
      />

      {/* ── Promo List ── */}
      {promos.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 4,
            }}
          >
            No promo codes yet
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Create your first promo code to offer discounts
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {promos.map((p) => {
            const expired =
              p.expiresAt && new Date(p.expiresAt) < new Date();
            const exhausted =
              p.usageLimit !== null && p.usageCount >= p.usageLimit;
            const usagePercent = p.usageLimit
              ? Math.round((p.usageCount / p.usageLimit) * 100)
              : null;

            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 160px 100px 80px",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${
                    p.active
                      ? "rgba(201,160,80,0.2)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                  borderRadius: 10,
                  opacity: p.active ? 1 : 0.45,
                  transition: "all 0.2s",
                }}
              >
                <Toggle
                  checked={p.active}
                  onChange={() => togglePromo(p.id, p.active)}
                />

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 15,
                        fontWeight: 700,
                        color: p.active
                          ? "#C9A050"
                          : "rgba(255,255,255,0.3)",
                        letterSpacing: 2,
                      }}
                    >
                      {p.code}
                    </span>

                    {/* Type badge */}
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: `1px solid ${
                          p.type === "percent"
                            ? "rgba(201,160,80,0.25)"
                            : "rgba(74,222,128,0.25)"
                        }`,
                        color:
                          p.type === "percent"
                            ? "#C9A050"
                            : "#4ADE80",
                        fontWeight: 500,
                      }}
                    >
                      {p.type === "percent"
                        ? `${p.value}% off`
                        : `$${p.value} off`}
                    </span>

                    {expired && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(248,113,113,0.25)",
                          color: "#F87171",
                          fontWeight: 500,
                        }}
                      >
                        Expired
                      </span>
                    )}
                    {exhausted && !expired && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid rgba(248,113,113,0.25)",
                          color: "#F87171",
                          fontWeight: 500,
                        }}
                      >
                        Exhausted
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      marginTop: 4,
                    }}
                  >
                    {p.minOrder > 0
                      ? `Min order $${p.minOrder}`
                      : "No minimum"}
                    {p.expiresAt &&
                      ` · Expires ${new Date(
                        p.expiresAt
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                  </div>
                </div>

                {/* Usage bar */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: 5,
                    }}
                  >
                    {p.usageCount}
                    {p.usageLimit ? ` / ${p.usageLimit}` : ""} used
                  </div>
                  {usagePercent !== null && (
                    <div
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(usagePercent, 100)}%`,
                          background:
                            usagePercent > 80
                              ? "#F87171"
                              : "#C9A050",
                          borderRadius: 2,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Estimated discount given */}
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'DM Mono', monospace",
                      color: "#fff",
                    }}
                  >
                    $
                    {Math.round(
                      p.usageCount *
                        (p.type === "percent"
                          ? p.value * 0.6
                          : p.value)
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    discounted
                  </div>
                </div>

                {/* Delete */}
                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => deletePromo(p.id, p.code)}
                    style={{
                      background: "none",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6,
                      padding: "5px 12px",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(248,113,113,0.35)";
                      e.currentTarget.style.color = "#F87171";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color =
                        "rgba(255,255,255,0.25)";
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════════════════════ */

const TABS = [
  { key: "hours", label: "Restaurant Hours", icon: "🕐" },
  { key: "pickup", label: "Pickup Slots", icon: "📦" },
  { key: "promos", label: "Promo Codes", icon: "🏷️" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("hours");

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top Header ── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 28px",
          height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(20px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          Settings
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#4ADE80",
              animation: "softPulse 2s infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              fontWeight: 500,
            }}
          >
            Live
          </span>
          <span
            style={{
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              color: "rgba(255,255,255,0.25)",
              marginLeft: 8,
            }}
          >
            {timeStr}
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <div
        style={{
          flex: 1,
          padding: "28px 32px 40px",
          width: "100%",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "inline-flex",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: 4,
            gap: 2,
            marginBottom: 28,
          }}
        >
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 7,
                  border: "none",
                  background: active
                    ? "rgba(201,160,80,0.12)"
                    : "transparent",
                  color: active ? "#C9A050" : "rgba(255,255,255,0.35)",
                  fontWeight: active ? 600 : 400,
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        {activeTab === "hours" && <HoursTab />}
        {activeTab === "pickup" && <PickupTab />}
        {activeTab === "promos" && <PromoTab />}
      </div>
    </div>
  );
}