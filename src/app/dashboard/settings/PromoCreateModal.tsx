"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useIsMobile, useIsTablet } from "@/hooks/useIsMobile";

/* ═══════════════════════════════════════════════════════════
   PROMO CREATE MODAL — Stepped Wizard (3 steps)
   
   Step 1: Code name + discount type
   Step 2: Discount amount (quick-pick chips + custom)
   Step 3: Limits & expiry (quick-pick presets + summary)
   
   Props:
     open       — whether the modal is visible
     onClose    — called when user cancels or completes
     onCreated  — called with the new code string after success
     existingCodes — array of existing code strings for dupe check
   ═══════════════════════════════════════════════════════════ */

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (code: string) => void;
  existingCodes: string[];
};

/* ── Quick-pick presets ── */

const QUICK_PERCENTS = [5, 10, 15, 20, 25, 50];
const QUICK_DOLLARS = [5, 10, 15, 20, 25, 50];

const QUICK_EXPIRY = [
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
];

/* ── Helpers ── */

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(str: string) {
  if (!str) return "";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Shared styles ── */

const labelSty: React.CSSProperties = {
  fontSize: 10,
  color: "rgba(255,255,255,0.3)",
  fontWeight: 600,
  letterSpacing: 1.5,
  display: "block",
  marginBottom: 7,
  textTransform: "uppercase",
};

const inputSty: React.CSSProperties = {
  width: "100%",
  background: "rgb(var(--bg-primary))",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#fff",
  fontFamily: "'DM Mono', monospace",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
};

/* ═══════════════════════════════════════════════════════════ */

export default function PromoCreateModal({
  open,
  onClose,
  onCreated,
  existingCodes,
}: Props) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  /* ── State ── */
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number | null>(null);
  const [minOrder, setMinOrder] = useState(0);
  const [limit, setLimit] = useState("");
  const [expiryChoice, setExpiryChoice] = useState(""); // "" = never, "custom", or a date string
  const [customExpiry, setCustomExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const expiryDate =
    expiryChoice === "custom" ? customExpiry : expiryChoice;

  /* ── Validation ── */
  const canStep1 = code.trim().length >= 3;
  const canStep2 = value !== null && value > 0;
  const dupeError =
    code.trim().length >= 3 &&
    existingCodes.includes(code.toUpperCase().replace(/[^A-Z0-9]/g, ""));

  /* ── Reset on close ── */
  const handleClose = () => {
    setStep(1);
    setCode("");
    setType("percent");
    setValue(null);
    setMinOrder(0);
    setLimit("");
    setExpiryChoice("");
    setCustomExpiry("");
    setError("");
    onClose();
  };

  /* ── Create promo in Firestore ── */
  const handleCreate = async () => {
    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanCode || !value) return;

    if (existingCodes.includes(cleanCode)) {
      setError(`Code "${cleanCode}" already exists`);
      return;
    }

    setCreating(true);
    setError("");

    try {
      await addDoc(collection(db, "promoCodes"), {
        code: cleanCode,
        type,
        value,
        minOrder,
        usageCount: 0,
        usageLimit: limit ? Number(limit) : null,
        active: true,
        expiresAt: expiryDate && expiryDate !== "custom" ? expiryDate : null,
        createdAt: serverTimestamp(),
      });
      onCreated(cleanCode);
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Create promo failed:", msg);
      if (msg.includes("permission") || msg.includes("PERMISSION_DENIED")) {
        setError(
          "Permission denied. Add Firestore rules for the 'promoCodes' collection."
        );
      } else {
        setError(`Failed: ${msg}`);
      }
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(180deg, #1a1714 0%, #121010 100%)",
          border: "1px solid rgba(201,160,80,0.15)",
          borderRadius: 18,
          width: "100%",
          maxWidth: isTablet ? "calc(100vw - 32px)" : 500,
          color: "#fff",
          fontFamily: "var(--font-body)",
          animation: "fadeUp 0.25s cubic-bezier(0.22,1,0.36,1)",
          overflow: "hidden",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,160,80,0.06)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "22px 28px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                New Promo Code
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.25)",
                  marginTop: 3,
                }}
              >
                Step {step} of 3 —{" "}
                {step === 1
                  ? "Code & Type"
                  : step === 2
                  ? "Discount Amount"
                  : "Limits & Expiry"}
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                minWidth: 44,
                minHeight: 44,
                color: "rgba(255,255,255,0.4)",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }}
            >
              ×
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background:
                    s <= step ? "#C9A050" : "rgba(255,255,255,0.06)",
                  transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div
          style={{
            padding: isTablet ? "20px 20px 20px" : "24px 28px 28px",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          {/* ─────────────────────────────────────────────
              STEP 1 — Code Name & Discount Type
              ───────────────────────────────────────────── */}
          {step === 1 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {/* Code input */}
              <div>
                <label style={labelSty}>Promo Code</label>
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                    );
                    setError("");
                  }}
                  placeholder="e.g. SUMMER20"
                  autoFocus
                  maxLength={16}
                  style={{
                    width: "100%",
                    background: "rgb(var(--bg-primary))",
                    border: `1px solid ${
                      dupeError
                        ? "rgba(248,113,113,0.4)"
                        : code.length >= 3
                        ? "rgba(201,160,80,0.3)"
                        : "rgba(255,255,255,0.1)"
                    }`,
                    borderRadius: 10,
                    padding: "13px 16px",
                    color: "#C9A050",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 4,
                    outline: "none",
                    textTransform: "uppercase",
                    boxSizing: "border-box" as const,
                    transition: "border-color 0.2s",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: dupeError
                        ? "#F87171"
                        : "rgba(255,255,255,0.2)",
                    }}
                  >
                    {dupeError
                      ? "This code already exists"
                      : "Uppercase letters & numbers only"}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color:
                        code.length >= 3
                          ? "#C9A050"
                          : "rgba(255,255,255,0.2)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {code.length}/16
                  </span>
                </div>
              </div>

              {/* Discount type */}
              <div>
                <label style={labelSty}>Discount Type</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {(["percent", "fixed"] as const).map((t) => {
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setType(t);
                          setValue(null);
                        }}
                        style={{
                          padding: "16px 0",
                          borderRadius: 10,
                          border: `1.5px solid ${
                            active
                              ? "rgba(201,160,80,0.35)"
                              : "rgba(255,255,255,0.08)"
                          }`,
                          background: active
                            ? "rgba(201,160,80,0.1)"
                            : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                          minHeight: 44,
                        }}
                      >
                        <span style={{ fontSize: 22 }}>
                          {t === "percent" ? "%" : "$"}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: active
                              ? "#C9A050"
                              : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {t === "percent"
                            ? "Percentage Off"
                            : "Fixed Amount Off"}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.2)",
                          }}
                        >
                          {t === "percent"
                            ? "e.g. 15% off entire order"
                            : "e.g. $10 off entire order"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────
              STEP 2 — Discount Amount
              ───────────────────────────────────────────── */}
          {step === 2 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {/* Big display */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Discount Amount
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    fontFamily: "'DM Mono', monospace",
                    color: value ? "#C9A050" : "rgba(255,255,255,0.15)",
                    marginTop: 8,
                    transition: "color 0.2s",
                  }}
                >
                  {type === "fixed" ? "$" : ""}
                  {value ?? "—"}
                  {type === "percent" ? "%" : ""}
                </div>
              </div>

              {/* Quick-pick chips */}
              <div>
                <label style={labelSty}>Quick Select</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {(type === "percent"
                    ? QUICK_PERCENTS
                    : QUICK_DOLLARS
                  ).map((v) => {
                    const active = value === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setValue(v)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: `1px solid ${
                            active
                              ? "#C9A050"
                              : "rgba(255,255,255,0.08)"
                          }`,
                          background: active
                            ? "rgba(201,160,80,0.12)"
                            : "transparent",
                          color: active
                            ? "#C9A050"
                            : "rgba(255,255,255,0.4)",
                          fontFamily: "'DM Mono', monospace",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          minHeight: 44,
                        }}
                      >
                        {type === "fixed" ? "$" : ""}
                        {v}
                        {type === "percent" ? "%" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom amount input */}
              <div>
                <label style={labelSty}>Or enter custom amount</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {type === "fixed" && (
                    <span
                      style={{
                        color: "#C9A050",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      $
                    </span>
                  )}
                  <input
                    type="number"
                    value={value ?? ""}
                    onChange={(e) =>
                      setValue(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="0"
                    min={1}
                    max={type === "percent" ? 100 : 999}
                    style={{
                      ...inputSty,
                      fontSize: 16,
                      fontWeight: 600,
                      padding: "11px 14px",
                    }}
                  />
                  {type === "percent" && (
                    <span
                      style={{
                        color: "#C9A050",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      %
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────
              STEP 3 — Limits & Expiry
              ───────────────────────────────────────────── */}
          {step === 3 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {/* Min order */}
              <div>
                <label style={labelSty}>Minimum Order Amount</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      fontSize: 14,
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) =>
                      setMinOrder(Number(e.target.value))
                    }
                    min={0}
                    style={{ ...inputSty, width: 100 }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    Set to $0 for no minimum
                  </span>
                </div>
              </div>

              {/* Usage limit */}
              <div>
                <label style={labelSty}>Usage Limit</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="∞"
                    min={1}
                    style={{ ...inputSty, width: 100 }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    Leave blank for unlimited uses
                  </span>
                </div>
              </div>

              {/* Expiry quick-picks */}
              <div>
                <label style={labelSty}>Expiration</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {/* Never button */}
                  <ChipButton
                    active={!expiryChoice}
                    onClick={() => {
                      setExpiryChoice("");
                      setCustomExpiry("");
                    }}
                  >
                    Never
                  </ChipButton>

                  {QUICK_EXPIRY.map((opt) => {
                    const dateVal = addDays(opt.days);
                    const active = expiryChoice === dateVal;
                    return (
                      <ChipButton
                        key={opt.label}
                        active={active}
                        onClick={() => setExpiryChoice(dateVal)}
                      >
                        <span>{opt.label}</span>
                        {active && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 9,
                              color: "rgba(255,255,255,0.3)",
                              marginTop: 1,
                            }}
                          >
                            {formatDate(dateVal)}
                          </span>
                        )}
                      </ChipButton>
                    );
                  })}

                  {/* Custom date button */}
                  <ChipButton
                    active={expiryChoice === "custom"}
                    onClick={() => setExpiryChoice("custom")}
                  >
                    Custom
                  </ChipButton>
                </div>

                {expiryChoice === "custom" && (
                  <input
                    type="date"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    style={{
                      ...inputSty,
                      marginTop: 10,
                      width: "100%",
                    }}
                  />
                )}
              </div>

              {/* Summary card */}
              <div
                style={{
                  background: "rgba(201,160,80,0.06)",
                  border: "1px solid rgba(201,160,80,0.15)",
                  borderRadius: 10,
                  padding: "14px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.2)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Summary
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#C9A050",
                        letterSpacing: 3,
                      }}
                    >
                      {code}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                        marginLeft: 12,
                      }}
                    >
                      {type === "percent"
                        ? `${value}% off`
                        : `$${value} off`}
                    </span>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.25)",
                      lineHeight: 1.6,
                    }}
                  >
                    {minOrder > 0 ? `Min $${minOrder}` : "No minimum"}
                    <br />
                    {limit ? `${limit} uses` : "Unlimited"}
                    <br />
                    {expiryDate && expiryDate !== "custom"
                      ? `Until ${formatDate(expiryDate)}`
                      : "No expiry"}
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.2)",
                    color: "#F87171",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div
            style={{
              display: "flex",
              flexDirection: isTablet ? "column-reverse" : "row",
              gap: 10,
              marginTop: 24,
            }}
          >
            {/* Left button: Cancel on step 1, Back on steps 2-3 */}
            <button
              onClick={step === 1 ? handleClose : () => setStep(step - 1)}
              style={{
                flex: 1,
                padding: "13px 0",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "rgba(255,255,255,0.4)",
                fontWeight: 500,
                fontSize: 13,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                transition: "all 0.15s",
                width: isTablet ? "100%" : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }}
            >
              {step === 1 ? "Cancel" : "← Back"}
            </button>

            {/* Right button: Continue or Create */}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  step === 1
                    ? !canStep1 || dupeError
                    : !canStep2
                }
                style={{
                  flex: 2,
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  background:
                    (step === 1 ? canStep1 && !dupeError : canStep2)
                      ? "linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-dark)))"
                      : "rgba(255,255,255,0.04)",
                  color:
                    (step === 1 ? canStep1 && !dupeError : canStep2)
                      ? "rgb(var(--bg-primary))"
                      : "rgba(255,255,255,0.2)",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  cursor:
                    (step === 1 ? canStep1 && !dupeError : canStep2)
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.2s",
                  letterSpacing: 0.3,
                  width: isTablet ? "100%" : undefined,
                }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 2,
                  padding: "13px 0",
                  borderRadius: 10,
                  border: "none",
                  background: creating
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-dark)))",
                  color: creating
                    ? "rgba(255,255,255,0.3)"
                    : "rgb(var(--bg-primary))",
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  cursor: creating ? "wait" : "pointer",
                  transition: "all 0.2s",
                  letterSpacing: 0.3,
                  width: isTablet ? "100%" : undefined,
                }}
              >
                {creating ? "Creating…" : `Create ${code}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chip button sub-component ── */

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 7,
        border: `1px solid ${
          active ? "#C9A050" : "rgba(255,255,255,0.08)"
        }`,
        background: active
          ? "rgba(201,160,80,0.1)"
          : "transparent",
        color: active ? "#C9A050" : "rgba(255,255,255,0.35)",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "var(--font-body)",
        minHeight: 44,
      }}
    >
      {children}
    </button>
  );
}