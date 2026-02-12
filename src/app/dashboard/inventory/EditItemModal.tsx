"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { categories } from "@/data/menu";

/* ── Types ── */
export interface MenuItemDoc {
  id: string;
  name: string;
  desc: string;
  price: number;
  img: string;
  categoryKey: string;
  tags: string[];
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface EditItemModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (message: string, color: string) => void;
  item: MenuItemDoc | null; // null = create mode
}

/* ── Tag config ── */
const TAG_OPTIONS: { key: string; label: string; emoji: string; activeClass: string }[] = [
  { key: "popular", label: "Popular", emoji: "⭐", activeClass: "popular" },
  { key: "new", label: "New", emoji: "✦", activeClass: "new" },
  { key: "spicy", label: "Spicy", emoji: "🌶", activeClass: "spicy" },
  { key: "gf", label: "GF", emoji: "", activeClass: "gf" },
  { key: "v", label: "V", emoji: "", activeClass: "v" },
];

const TAG_ACTIVE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  popular: { bg: "rgba(201,160,80,0.12)", color: "#C9A050", border: "rgba(201,160,80,0.3)" },
  new: { bg: "rgba(96,165,250,0.12)", color: "#60A5FA", border: "rgba(96,165,250,0.3)" },
  spicy: { bg: "rgba(239,68,68,0.12)", color: "#EF4444", border: "rgba(239,68,68,0.3)" },
  gf: { bg: "rgba(138,173,138,0.12)", color: "#8aad8a", border: "rgba(138,173,138,0.3)" },
  v: { bg: "rgba(125,184,127,0.12)", color: "#7db87f", border: "rgba(125,184,127,0.3)" },
};

/* ════════════════════════════════════════════
   EditItemModal
   ════════════════════════════════════════════ */
export default function EditItemModal({ open, onClose, onSaved, item }: EditItemModalProps) {
  const isEdit = item !== null;

  /* ── Form state ── */
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [img, setImg] = useState("");
  const [categoryKey, setCategoryKey] = useState("coldAppetizers");
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  /* ── Populate on open ── */
  useEffect(() => {
    if (!open) return;
    if (item) {
      setName(item.name);
      setDesc(item.desc);
      setPrice(String(item.price));
      setImg(item.img);
      setCategoryKey(item.categoryKey);
      setTags(new Set(item.tags));
    } else {
      setName("");
      setDesc("");
      setPrice("");
      setImg("");
      setCategoryKey("coldAppetizers");
      setTags(new Set());
    }
    setShowDeleteConfirm(false);
    setFieldErrors({});
    setSaving(false);
  }, [open, item]);

  /* ── Toggle tag ── */
  const toggleTag = useCallback((tag: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  /* ── Validate ── */
  const validate = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!name.trim()) errors.name = true;
    if (!price || Number(price) <= 0) errors.price = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ── Save (create or update) ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const data = {
      name: name.trim(),
      desc: desc.trim(),
      price: Number(price),
      img: img.trim() || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80`,
      categoryKey,
      tags: Array.from(tags),
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEdit && item) {
        await updateDoc(doc(db, "menuItems", item.id), data);
        onSaved(`✓ "${data.name}" updated`, "#C9A050");
      } else {
        await addDoc(collection(db, "menuItems"), {
          ...data,
          sortOrder: Date.now(),
          createdAt: serverTimestamp(),
        });
        onSaved(`✓ "${data.name}" added to menu`, "#5FBF7A");
      }
      onClose();
    } catch (err) {
      console.error("Menu item save failed:", err);
      onSaved(`✕ Failed to save — check console`, "#EF4444");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!item) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "menuItems", item.id));
      // Also remove from inventory collection
      const invDocId = item.name.replace(/[/\\. ]/g, "_");
      try {
        await deleteDoc(doc(db, "inventory", invDocId));
      } catch {
        // Inventory doc may not exist — that's fine
      }
      onSaved(`🗑 "${item.name}" removed from menu`, "#EF4444");
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      onSaved(`✕ Failed to delete — check console`, "#EF4444");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{isEdit ? "Edit Item" : "Add New Item"}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Image preview + URL */}
          <div style={styles.field}>
            <label style={styles.label}>Photo</label>
            <div style={styles.imgPreview}>
              {img && img.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <>
                  <span style={{ fontSize: 28, opacity: 0.3 }}>📷</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                    Paste image URL below
                  </span>
                </>
              )}
            </div>
            <input
              type="text"
              value={img}
              onChange={(e) => setImg(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              style={{ ...styles.input, fontSize: 12, marginTop: 8 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,160,80,0.3)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
            />
          </div>

          {/* Name + Price row */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ ...styles.field, flex: 2 }}>
              <label style={styles.label}>Item Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: false }));
                }}
                placeholder="e.g. Salmon Tartare"
                style={{
                  ...styles.input,
                  borderColor: fieldErrors.name ? "#EF4444" : "rgba(255,255,255,0.06)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = fieldErrors.name ? "#EF4444" : "rgba(201,160,80,0.3)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.name ? "#EF4444" : "rgba(255,255,255,0.06)")}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Price</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#C9A050",
                    fontWeight: 600,
                    fontSize: 16,
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (fieldErrors.price) setFieldErrors((p) => ({ ...p, price: false }));
                  }}
                  placeholder="0"
                  min="0"
                  step="1"
                  style={{
                    ...styles.input,
                    paddingLeft: 32,
                    fontSize: 16,
                    fontWeight: 600,
                    borderColor: fieldErrors.price ? "#EF4444" : "rgba(255,255,255,0.06)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = fieldErrors.price ? "#EF4444" : "rgba(201,160,80,0.3)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = fieldErrors.price ? "#EF4444" : "rgba(255,255,255,0.06)")}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ingredients or short description..."
              rows={2}
              style={{ ...styles.input, resize: "vertical", minHeight: 64 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,160,80,0.3)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
            />
          </div>

          {/* Category */}
          <div style={styles.field}>
            <label style={styles.label}>Category</label>
            <select
              value={categoryKey}
              onChange={(e) => setCategoryKey(e.target.value)}
              style={styles.select}
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div style={styles.field}>
            <label style={styles.label}>Tags</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TAG_OPTIONS.map((t) => {
                const isActive = tags.has(t.key);
                const activeStyle = TAG_ACTIVE_STYLES[t.key];
                return (
                  <button
                    key={t.key}
                    onClick={() => toggleTag(t.key)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: `1px solid ${isActive ? activeStyle.border : "rgba(255,255,255,0.06)"}`,
                      background: isActive ? activeStyle.bg : "transparent",
                      color: isActive ? activeStyle.color : "rgba(255,255,255,0.25)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {t.emoji ? `${t.emoji} ` : ""}{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete zone (edit only) */}
          {isEdit && (
            <div style={{ marginTop: 8 }}>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={styles.deleteBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                >
                  🗑 Delete This Item
                </button>
              ) : (
                <div style={styles.deleteConfirm}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 12px" }}>
                    Permanently delete{" "}
                    <strong style={{ color: "#fff" }}>{item?.name}</strong>? This
                    cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      style={styles.cancelBtn}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      style={{
                        ...styles.cancelBtn,
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#EF4444",
                      }}
                    >
                      {saving ? "Deleting…" : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
            {isEdit ? "Changes sync to menu instantly" : "New item appears on menu immediately"}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={styles.cancelBtn}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={styles.saveBtn}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
            >
              {saving
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Create Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    background: "#1a1a1e",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    width: "min(560px, 94vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 28px 0",
    marginBottom: 24,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.45)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    transition: "all 0.15s",
    fontFamily: "var(--font-body)",
  },
  body: {
    padding: "0 28px",
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 8,
    fontFamily: "var(--font-body)",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#fff",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    transition: "all 0.15s",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#fff",
    fontFamily: "var(--font-body)",
    fontSize: 14,
    cursor: "pointer",
    outline: "none",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
  },
  imgPreview: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "2px dashed rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 28px 24px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    marginTop: 24,
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.45)",
    transition: "all 0.2s",
  },
  saveBtn: {
    padding: "10px 24px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    background: "linear-gradient(135deg, #C9A050, #D4AF61)",
    border: "none",
    color: "#1a1a1e",
    transition: "all 0.2s",
    boxShadow: "0 2px 12px rgba(201,160,80,0.3)",
  },
  deleteBtn: {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(239,68,68,0.2)",
    background: "rgba(239,68,68,0.06)",
    color: "#EF4444",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    transition: "all 0.2s",
  },
  deleteConfirm: {
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 12,
    padding: "16px 20px",
  },
};