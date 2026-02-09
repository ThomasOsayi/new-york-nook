"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useScrollY } from "@/hooks/useScrollY";
import Link from "next/link";

/* ─── Data ────────────────────────────────────────────── */

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/#Menu" },
  { label: "Gallery", href: "/#Gallery" },
  { label: "Reserve", href: "/#Reserve" },
  { label: "Order", href: "/order" },
  { label: "Catering", href: "/catering" },
  { label: "Contact", href: "/#Contact" },
];

const services = [
  {
    icon: "◆",
    name: "Private Dining",
    detail: "Exclusive use of our private dining room with personalized menu curation and dedicated service staff.",
    meta: "Up to 40 guests",
  },
  {
    icon: "★",
    name: "Corporate Events",
    detail: "Sophisticated settings for board meetings, client dinners, product launches, and team celebrations.",
    meta: "Meetings & Galas",
  },
  {
    icon: "♥",
    name: "Wedding Catering",
    detail: "Full-service wedding catering with custom menus, tastings, and our signature Russian culinary artistry.",
    meta: "Full Service",
  },
  {
    icon: "✦",
    name: "Custom Menus",
    detail: "Collaborate directly with our Executive Chef to design a bespoke menu that tells your story.",
    meta: "Chef Collaboration",
  },
];

const experienceItems = [
  { name: "Personal Event Coordinator", tag: "Dedicated planning" },
  { name: "Custom Menu Tasting", tag: "Complimentary" },
  { name: "Premium Table Settings", tag: "Fine china & crystal" },
  { name: "Full Bar Service", tag: "Craft cocktails & wine" },
  { name: "Live Entertainment", tag: "Available on request" },
];

const packages = [
  {
    name: "The Zakuski",
    tagline: "Elegant appetizer experience",
    price: "$85",
    unit: "per person",
    note: "Minimum 20 guests",
    featured: false,
    features: [
      "Selection of 6 premium zakuski",
      "Blini station with caviar & crème fraîche",
      "Artisanal bread & butter service",
      "2-hour service window",
      "Professional service staff",
    ],
  },
  {
    name: "The Tsar",
    tagline: "Complete dining experience",
    price: "$165",
    unit: "per person",
    note: "Minimum 15 guests",
    featured: true,
    features: [
      "4-course plated dinner",
      "Chef's signature entrée selection",
      "Premium wine pairing included",
      "Handcrafted dessert course",
      "Dedicated Event Coordinator",
      "Premium table settings & décor",
    ],
  },
  {
    name: "The Grand Feast",
    tagline: "Ultimate celebration package",
    price: "$250",
    unit: "per person",
    note: "Minimum 10 guests",
    featured: false,
    features: [
      "6-course chef's tasting menu",
      "Caviar & champagne welcome",
      "Sommelier-curated wine pairings",
      "Live cooking station",
      "Full bar with craft cocktails",
      "Custom floral arrangements",
      "Complimentary valet parking",
    ],
  },
];

const menuStarters = [
  { name: "Beluga Caviar Blini", desc: "Traditional buckwheat blini, crème fraîche, chive oil" },
  { name: "Beef Stroganoff Tartlets", desc: "Wild mushroom, sour cream, micro herbs" },
  { name: "Smoked Salmon Zakuski", desc: "House-cured salmon, pickled beet, horseradish cream" },
  { name: "Borscht Consommé", desc: "Crystal-clear beetroot broth, crème fraîche, dill" },
];

const menuMains = [
  { name: "Chicken Kiev", desc: "Herb butter, golden breadcrumb, seasonal vegetables" },
  { name: "Pan-Seared Black Sea Bass", desc: "Champagne beurre blanc, caviar, potato mousseline" },
  { name: "Lamb Shashlik", desc: "Heritage lamb, pomegranate glaze, saffron rice" },
  { name: "Wild Mushroom Pelmeni", desc: "Truffle cream, aged parmesan, forest mushrooms" },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=500&q=80",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=500&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80",
];

const faqs = [
  {
    q: "How far in advance should I book my event?",
    a: "We recommend booking at least 4–6 weeks in advance for private dining, and 3–6 months for wedding catering and large events. However, we do our best to accommodate shorter timelines when possible.",
  },
  {
    q: "Can you accommodate dietary restrictions?",
    a: "Absolutely. Our chefs are experienced in crafting exquisite dishes for all dietary needs, including vegetarian, vegan, gluten-free, kosher, and halal requirements. Please inform us during your consultation.",
  },
  {
    q: "Do you provide off-site catering?",
    a: "Yes, we offer full off-site catering throughout the greater Los Angeles area. Our team handles everything from setup to cleanup, ensuring a seamless experience at your chosen venue.",
  },
  {
    q: "Is a tasting session included?",
    a: "A complimentary tasting session for up to 4 guests is included with The Tsar and Grand Feast packages. For The Zakuski package, tastings can be arranged at a nominal fee.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Full refunds are available for cancellations made 30 or more days before the event. Cancellations within 14–30 days receive a 50% refund. We understand plans change and will work with you on rescheduling when possible.",
  },
];

const experienceImages = [
  "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
];

const footerColumns = [
  { title: "Navigate", links: [{ label: "Menu", href: "/#Menu" }, { label: "Gallery", href: "/#Gallery" }, { label: "Reservations", href: "/#Reserve" }, { label: "Order Online", href: "/order" }, { label: "Catering", href: "/catering" }] },
  { title: "Connect", links: [{ label: "Instagram", href: "#" }, { label: "Facebook", href: "#" }, { label: "Yelp", href: "#" }, { label: "Google", href: "#" }] },
  { title: "Info", links: [{ label: "Private Events", href: "#" }, { label: "Gift Cards", href: "#" }, { label: "Press", href: "#" }, { label: "Login", href: "/login" }] },
];

const EVENT_TYPES = ["Private Dining", "Corporate Event", "Wedding Reception", "Cocktail Party", "Holiday Celebration", "Custom Menu Collaboration", "Other"];
const GUEST_RANGES = ["10–20 guests", "21–40 guests", "41–75 guests", "76–100 guests", "100+ guests"];
const BUDGET_RANGES = ["Under $3,000", "$3,000–$5,000", "$5,000–$10,000", "$10,000–$25,000", "$25,000+", "Flexible / Not sure"];

/* ─── Reveal hook (inline, one-shot) ──────────────────── */

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Consultation Modal ──────────────────────────────── */

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
  preselectedPackage?: string;
}

function ConsultationModal({ open, onClose, preselectedPackage }: ConsultationModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    guestCount: "",
    budget: "",
    packageInterest: preselectedPackage || "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when opened with a preselected package
  useEffect(() => {
    if (open && preselectedPackage) {
      setForm((f) => ({ ...f, packageInterest: preselectedPackage }));
    }
  }, [open, preselectedPackage]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    // Validation
    if (!form.firstName.trim() || !form.lastName.trim()) { setErrorMsg("Please enter your full name."); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErrorMsg("Please enter a valid email."); return; }
    if (!form.phone.trim()) { setErrorMsg("Please enter your phone number."); return; }
    if (!form.eventType) { setErrorMsg("Please select an event type."); return; }

    setErrorMsg("");
    setStatus("submitting");

    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit. Please try again.");
      setStatus("error");
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setStatus("idle");
      setErrorMsg("");
      setForm({ firstName: "", lastName: "", email: "", phone: "", eventType: "", eventDate: "", guestCount: "", budget: "", packageInterest: "", message: "" });
    }, 300);
  };

  if (!open) return null;

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(183,143,82,0.15)",
    color: "#fff",
    fontFamily: "var(--font-body)",
    fontSize: 13,
    borderRadius: 0,
    outline: "none",
    transition: "border-color 0.3s",
  };

  const labelBase: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 8,
    display: "block",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        animation: "fadeUp 0.3s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={modalRef}
        style={{
          background: "rgb(var(--bg-secondary))",
          border: "1px solid rgba(183,143,82,0.15)",
          width: "100%",
          maxWidth: 640,
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute", top: 20, right: 20, zIndex: 10,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.4)", fontSize: 20,
            transition: "color 0.3s", lineHeight: 1,
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.4)")}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ padding: "40px 40px 0", borderBottom: "1px solid rgba(183,143,82,0.08)", paddingBottom: 28, marginBottom: 0 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050" }}>◆ &nbsp; Consultation Request</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400, color: "#fff", margin: "12px 0 8px", lineHeight: 1.2 }}>
            Let&apos;s Plan Your <span style={{ fontStyle: "italic", color: "rgb(var(--gold-light))" }}>Event</span>
          </h2>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 14, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.6 }}>
            Fill out the details below and our events team will reach out within 24 hours.
          </p>
        </div>

        {/* SUCCESS STATE */}
        {status === "success" ? (
          <div style={{ padding: "60px 40px", textAlign: "center" as const }}>
            <div style={{ width: 64, height: 64, border: "2px solid #C9A050", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28, color: "#C9A050" }}>✓</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 400, color: "#fff", marginBottom: 12 }}>Request Received</h3>
            <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.4)", fontStyle: "italic", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 32px" }}>
              Thank you for your interest. Our events coordinator will contact you within 24 hours to begin planning your experience.
            </p>
            <button className="btn-gold-outline" onClick={handleClose}>Close</button>
          </div>
        ) : (
          /* FORM */
          <div style={{ padding: "28px 40px 40px" }}>
            {/* Contact info */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 20, paddingBottom: 8, borderBottom: "1px solid rgba(183,143,82,0.06)" }}>Contact Information</h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelBase}>First Name *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    placeholder="First name"
                    style={inputBase}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")}
                  />
                </div>
                <div>
                  <label style={labelBase}>Last Name *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    placeholder="Last name"
                    style={inputBase}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelBase}>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@email.com"
                    style={inputBase}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")}
                  />
                </div>
                <div>
                  <label style={labelBase}>Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(555) 000-0000"
                    style={inputBase}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")}
                  />
                </div>
              </div>
            </div>

            {/* Event details */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 20, paddingBottom: 8, borderBottom: "1px solid rgba(183,143,82,0.06)" }}>Event Details</h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelBase}>Event Type *</label>
                  <select
                    value={form.eventType}
                    onChange={(e) => update("eventType", e.target.value)}
                    style={{ ...inputBase, cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(183,143,82,0.5)'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                  >
                    <option value="" style={{ background: "rgb(var(--bg-elevated))" }}>Select type...</option>
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t} style={{ background: "rgb(var(--bg-elevated))" }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Preferred Date</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => update("eventDate", e.target.value)}
                    style={{ ...inputBase, colorScheme: "dark" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelBase}>Guest Count</label>
                  <select
                    value={form.guestCount}
                    onChange={(e) => update("guestCount", e.target.value)}
                    style={{ ...inputBase, cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(183,143,82,0.5)'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                  >
                    <option value="" style={{ background: "rgb(var(--bg-elevated))" }}>Select range...</option>
                    {GUEST_RANGES.map((g) => (
                      <option key={g} value={g} style={{ background: "rgb(var(--bg-elevated))" }}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelBase}>Budget Range</label>
                  <select
                    value={form.budget}
                    onChange={(e) => update("budget", e.target.value)}
                    style={{ ...inputBase, cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(183,143,82,0.5)'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                  >
                    <option value="" style={{ background: "rgb(var(--bg-elevated))" }}>Select range...</option>
                    {BUDGET_RANGES.map((b) => (
                      <option key={b} value={b} style={{ background: "rgb(var(--bg-elevated))" }}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Package interest (prefilled if clicked from a specific package) */}
              <div>
                <label style={labelBase}>Package of Interest</label>
                <select
                  value={form.packageInterest}
                  onChange={(e) => update("packageInterest", e.target.value)}
                  style={{ ...inputBase, cursor: "pointer", appearance: "none" as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(183,143,82,0.5)'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                >
                  <option value="" style={{ background: "rgb(var(--bg-elevated))" }}>Not sure yet</option>
                  <option value="The Zakuski" style={{ background: "rgb(var(--bg-elevated))" }}>The Zakuski — $85/person</option>
                  <option value="The Tsar" style={{ background: "rgb(var(--bg-elevated))" }}>The Tsar — $165/person</option>
                  <option value="The Grand Feast" style={{ background: "rgb(var(--bg-elevated))" }}>The Grand Feast — $250/person</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 32 }}>
              <label style={labelBase}>Special Requests or Notes</label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Tell us about your vision, dietary needs, preferred style, or anything else..."
                rows={4}
                style={{ ...inputBase, resize: "vertical" as const, minHeight: 100 }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(183,143,82,0.15)")}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(220,60,60,0.1)", border: "1px solid rgba(220,60,60,0.2)", fontFamily: "var(--font-body)", fontSize: 12, color: "#e05555" }}>
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              className="btn-gold-filled"
              onClick={handleSubmit}
              disabled={status === "submitting"}
              style={{
                width: "100%", textAlign: "center" as const,
                opacity: status === "submitting" ? 0.6 : 1,
                cursor: status === "submitting" ? "not-allowed" : "pointer",
              }}
            >
              {status === "submitting" ? "Submitting..." : "Submit Request"}
            </button>

            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" as const, marginTop: 16, lineHeight: 1.6 }}>
              We&apos;ll respond within 24 hours. For immediate assistance, call{" "}
              <a href="tel:+13235550100" style={{ color: "#C9A050", textDecoration: "none" }}>(323) 555-0100</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

function CateringNav() {
  const scrollY = useScrollY();
  const scrolled = scrollY > 60;
  const [open, setOpen] = useState(false);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    if (open) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  /* Close mobile menu on resize to desktop */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const handler = () => { if (mq.matches) setOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          background: scrolled || open ? "rgba(8,6,3,0.97)" : "transparent",
          backdropFilter: scrolled || open ? "blur(24px) saturate(1.4)" : "none",
          borderBottom: scrolled ? "1px solid rgba(183,143,82,0.12)" : "1px solid transparent",
          transition: "all 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, maxWidth: 1440, margin: "0 auto", padding: "0 clamp(16px,4vw,60px)" }}>
          {/* Logo */}
          <Link href="/" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, border: "1px solid rgba(183,143,82,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)", flexShrink: 0 }}>
              <span style={{ transform: "rotate(-45deg)", fontFamily: "var(--font-display)", fontSize: 14, color: "#C9A050", fontWeight: 700 }}>N</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(14px, 2.5vw, 18px)", fontWeight: 700, color: "#fff", letterSpacing: "clamp(1px, 0.3vw, 3px)", display: "block", lineHeight: 1, whiteSpace: "nowrap" }}>NEW YORK NOOK</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "clamp(7px, 1vw, 8px)", fontWeight: 400, letterSpacing: "clamp(2px, 0.5vw, 4px)", color: "rgba(183,143,82,0.6)", textTransform: "uppercase" as const, display: "block" }}>Fine Russian Cuisine</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="nav-links-desktop" style={{ display: "flex", gap: "clamp(16px, 2.5vw, 32px)", alignItems: "center" }}>
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  textDecoration: "none", padding: "6px 0",
                  fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 400,
                  letterSpacing: 2.5, textTransform: "uppercase" as const,
                  color: item.label === "Catering" ? "#C9A050" : "rgba(255,255,255,0.55)",
                  transition: "color 0.3s", whiteSpace: "nowrap",
                  borderBottom: item.label === "Catering" ? "1px solid #C9A050" : "none",
                  paddingBottom: item.label === "Catering" ? 4 : 6,
                }}
                onMouseEnter={(e) => { if (item.label !== "Catering") (e.target as HTMLElement).style.color = "#C9A050"; }}
                onMouseLeave={(e) => { if (item.label !== "Catering") (e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            style={{
              display: "none", background: "none", border: "none", cursor: "pointer",
              padding: 12, marginRight: -12,
              flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 0, width: 44, height: 44, position: "relative", zIndex: 301,
            }}
          >
            <span style={{ width: 22, height: 1.5, background: "#C9A050", display: "block", transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)", position: "absolute", transform: open ? "rotate(45deg)" : "translateY(-4px)" }} />
            <span style={{ width: 22, height: 1.5, background: "#C9A050", display: "block", transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)", position: "absolute", opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "scaleX(1)" }} />
            <span style={{ width: open ? 22 : 14, height: 1.5, background: "#C9A050", display: "block", transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)", position: "absolute", transform: open ? "rotate(-45deg)" : "translateY(4px)" }} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay — outside nav to avoid stacking issues */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100dvh",
          background: "#080603",
          zIndex: 199,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          opacity: open ? 1 : 0,
          visibility: open ? "visible" as const : "hidden" as const,
          pointerEvents: open ? "auto" : "none",
          transition: open
            ? "opacity 0.4s cubic-bezier(0.22,1,0.36,1), visibility 0s 0s"
            : "opacity 0.4s cubic-bezier(0.22,1,0.36,1), visibility 0s 0.4s",
          paddingTop: 72,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {NAV_LINKS.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setOpen(false)}
            style={{
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 400,
              color: item.label === "Catering" ? "#C9A050" : "#fff",
              letterSpacing: 3,
              padding: "14px 0",
              width: "100%",
              textAlign: "center",
              display: "block",
              opacity: open ? 1 : 0,
              transform: open ? "translateY(0)" : "translateY(16px)",
              transition: `opacity 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s`,
            }}
          >
            {item.label}
          </Link>
        ))}

        {/* Decorative line */}
        <div style={{ width: 40, height: 1, background: "rgba(201,160,80,0.3)", marginTop: 24, opacity: open ? 1 : 0, transform: open ? "scaleX(1)" : "scaleX(0)", transition: "all 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s" }} />

        {/* Address */}
        <p style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.2)", marginTop: 16, textTransform: "uppercase" as const, opacity: open ? 1 : 0, transition: "opacity 0.6s 0.5s" }}>
          7065 Sunset Blvd, Hollywood
        </p>
      </div>
    </>
  );
}

/* ─── Main Page ───────────────────────────────────────── */

export default function CateringPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredService, setHoveredService] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPackage, setModalPackage] = useState<string | undefined>(undefined);
  const inquireRef = useRef<HTMLDivElement>(null);

  const openConsultation = (pkg?: string) => {
    setModalPackage(pkg);
    setModalOpen(true);
  };

  /* Reveals */
  const heroR = useReveal();
  const servicesR = useReveal();
  const experienceR = useReveal();
  const packagesR = useReveal();
  const menuR = useReveal();
  const galleryR = useReveal();
  const testimonialR = useReveal();
  const ctaR = useReveal();
  const faqR = useReveal();

  const revealStyle = (v: boolean, delay = 0): React.CSSProperties => ({
    opacity: v ? 1 : 0,
    transform: v ? "translateY(0)" : "translateY(30px)",
    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  });

  return (
    <div style={{ background: "rgb(var(--bg-primary))", minHeight: "100vh" }}>
      <CateringNav />
      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} preselectedPackage={modalPackage} />

      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroR.ref}
        style={{
          position: "relative", height: "100vh", minHeight: 700,
          display: "flex", alignItems: "center", overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(8,6,3,0.3) 0%, rgba(8,6,3,0.6) 50%, rgba(8,6,3,1) 100%)",
        }}>
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,6,3,0.4) 0%, rgba(8,6,3,0.65) 50%, rgb(8,6,3) 100%)" }} />
        </div>

        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)" }} />

        <div style={{ position: "relative", zIndex: 2, padding: "0 6%", maxWidth: 800, ...revealStyle(heroR.visible) }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 6, textTransform: "uppercase" as const, color: "#C9A050", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ width: 40, height: 1, background: "#C9A050", display: "inline-block" }} />
            Events & Private Dining
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,6vw,80px)", fontWeight: 400, lineHeight: 1.1, color: "#fff", margin: "0 0 20px" }}>
            Catering &<br />
            <span style={{ fontStyle: "italic", color: "rgb(var(--gold-light))" }}>Private Events</span>
          </h1>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(15px,1.5vw,19px)", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 520, marginBottom: 36, fontStyle: "italic" }}>
            From intimate gatherings to grand celebrations, our catering brings the New York Nook experience to your event.
          </p>
          <button
            className="btn-gold-outline"
            onClick={() => openConsultation()}
            style={{ display: "inline-flex", alignItems: "center", gap: 12 }}
          >
            Start Planning
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M0 6h14M9 1l5 5-5 5" /></svg>
          </button>
        </div>

        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>Explore</span>
          <div style={{ width: 1, height: 40, background: "linear-gradient(180deg, rgba(201,168,76,0.5), transparent)", animation: "scrollBounce 2s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section ref={servicesR.ref} style={{ padding: "100px 6%", background: "rgb(var(--bg-secondary))", borderTop: "1px solid rgba(183,143,82,0.08)" }}>
        <div style={{ textAlign: "center" as const, maxWidth: 650, margin: "0 auto 64px" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", ...revealStyle(servicesR.visible) }}>◆ &nbsp; Our Services</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", margin: "16px 0 12px", lineHeight: 1.2, ...revealStyle(servicesR.visible, 0.1) }}>
            Tailored to Your <span style={{ fontStyle: "italic", color: "rgb(var(--gold-light))" }}>Vision</span>
          </h2>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.8, ...revealStyle(servicesR.visible, 0.2) }}>
            Whether you&apos;re hosting an intimate dinner or a lavish celebration, we craft every detail to perfection.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, maxWidth: 1300, margin: "0 auto" }} className="catering-services-grid">
          {services.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredService(i)}
              onMouseLeave={() => setHoveredService(null)}
              style={{
                background: hoveredService === i ? "rgb(var(--bg-elevated))" : "rgba(var(--bg-tertiary),0.6)",
                border: `1px solid ${hoveredService === i ? "rgba(183,143,82,0.25)" : "rgba(183,143,82,0.08)"}`,
                padding: "36px 28px", position: "relative", overflow: "hidden",
                transition: "all 0.5s ease",
                ...revealStyle(servicesR.visible, 0.1 + i * 0.1),
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#C9A050", transform: hoveredService === i ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.5s ease" }} />

              <div style={{
                width: 48, height: 48, border: `1px solid ${hoveredService === i ? "#C9A050" : "rgba(183,143,82,0.3)"}`,
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 24, color: "#C9A050", fontSize: 16,
                background: hoveredService === i ? "rgba(201,168,76,0.1)" : "transparent",
                transition: "all 0.4s",
              }}>
                {s.icon}
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 10 }}>{s.name}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, marginBottom: 20 }}>{s.detail}</p>
              <div style={{ paddingTop: 16, borderTop: "1px solid rgba(183,143,82,0.08)", fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" as const, color: "rgba(183,143,82,0.4)" }}>
                {s.meta}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ EXPERIENCE ═══════ */}
      <section ref={experienceR.ref} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: 600 }} className="catering-grid">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4, background: "rgb(var(--bg-tertiary))" }}>
          {experienceImages.map((url, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7) saturate(1.1)", transition: "all 0.6s" }}
                onMouseEnter={(e) => ((e.target as HTMLImageElement).style.filter = "brightness(0.9) saturate(1.3)")}
                onMouseLeave={(e) => ((e.target as HTMLImageElement).style.filter = "brightness(0.7) saturate(1.1)")}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" as const, justifyContent: "center", padding: "60px 6%", background: "rgb(var(--bg-primary))", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: 1, background: "linear-gradient(180deg, transparent, rgba(183,143,82,0.2), transparent)" }} />

          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", marginBottom: 16, ...revealStyle(experienceR.visible) }}>◆ &nbsp; The Experience</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", lineHeight: 1.2, marginBottom: 12, ...revealStyle(experienceR.visible, 0.1) }}>
            Every Detail,<br />Perfected
          </h2>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.8, maxWidth: 450, marginBottom: 36, ...revealStyle(experienceR.visible, 0.2) }}>
            Our dedicated events team ensures a seamless experience from initial consultation to the final toast.
          </p>

          <div style={{ display: "flex", flexDirection: "column" as const, ...revealStyle(experienceR.visible, 0.3) }}>
            {experienceItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 0",
                  borderBottom: "1px solid rgba(183,143,82,0.08)",
                  borderTop: i === 0 ? "1px solid rgba(183,143,82,0.08)" : "none",
                  transition: "padding-left 0.3s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.paddingLeft = "8px")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.paddingLeft = "0px")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 6, height: 6, background: "#C9A050", transform: "rotate(45deg)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(255,255,255,0.75)" }}>{item.name}</span>
                </div>
                <span style={{ fontFamily: "var(--font-accent)", fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PACKAGES ═══════ */}
      <section ref={packagesR.ref} style={{ padding: "100px 6%", background: "rgb(var(--bg-secondary))", borderTop: "1px solid rgba(183,143,82,0.08)" }}>
        <div style={{ textAlign: "center" as const, maxWidth: 650, margin: "0 auto 56px" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", ...revealStyle(packagesR.visible) }}>◆ &nbsp; Catering Packages</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", margin: "16px 0 12px", lineHeight: 1.2, ...revealStyle(packagesR.visible, 0.1) }}>
            Choose Your Experience
          </h2>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.8, ...revealStyle(packagesR.visible, 0.2) }}>
            Each package is fully customizable to meet your specific preferences and dietary requirements.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 1200, margin: "0 auto" }} className="catering-packages-grid">
          {packages.map((pkg, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${pkg.featured ? "rgba(183,143,82,0.35)" : "rgba(183,143,82,0.08)"}`,
                background: pkg.featured ? "linear-gradient(180deg, rgb(var(--bg-elevated)), rgba(var(--bg-tertiary),0.8))" : "rgba(var(--bg-tertiary),0.6)",
                padding: "40px 32px", position: "relative",
                transition: "all 0.5s",
                ...revealStyle(packagesR.visible, 0.1 + i * 0.1),
              }}
            >
              {pkg.featured && (
                <div style={{
                  position: "absolute", top: 0, left: 32, transform: "translateY(-50%)",
                  background: "#C9A050", color: "rgb(var(--bg-primary))",
                  fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: 3, fontWeight: 600,
                  padding: "5px 14px", textTransform: "uppercase" as const,
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "#fff", marginBottom: 6 }}>{pkg.name}</h3>
              <p style={{ fontFamily: "var(--font-accent)", fontSize: 14, fontStyle: "italic", color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>{pkg.tagline}</p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500, color: "#C9A050" }}>{pkg.price}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{pkg.unit}</span>
              </div>
              <p style={{ fontFamily: "var(--font-accent)", fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic", marginBottom: 28 }}>{pkg.note}</p>

              <div style={{ height: 1, background: "rgba(183,143,82,0.08)", marginBottom: 28 }} />

              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 32 }}>
                {pkg.features.map((f, fi) => (
                  <li key={fi} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                    <span style={{ color: "rgba(183,143,82,0.5)", fontSize: 8, marginTop: 4, flexShrink: 0 }}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={pkg.featured ? "btn-gold-filled" : "btn-gold-outline"}
                style={{ width: "100%", textAlign: "center" as const }}
                onClick={() => openConsultation(pkg.name)}
              >
                Inquire Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ SAMPLE MENU ═══════ */}
      <section ref={menuR.ref} style={{ padding: "100px 6%", background: "rgb(var(--bg-primary))", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 30%, rgba(201,168,76,0.03) 0%, transparent 50%)" }} />
        <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 56 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", ...revealStyle(menuR.visible) }}>◆ &nbsp; Sample Menu</span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", margin: "16px 0 12px", lineHeight: 1.2, ...revealStyle(menuR.visible, 0.1) }}>A Taste of What Awaits</h2>
            <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.8, maxWidth: 500, ...revealStyle(menuR.visible, 0.2) }}>
              A curated selection from our catering repertoire. Every menu is fully customizable.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, ...revealStyle(menuR.visible, 0.3) }} className="catering-menu-grid">
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "#C9A050", marginBottom: 28, paddingBottom: 12, borderBottom: "1px solid rgba(183,143,82,0.1)" }}>To Begin</h3>
              {menuStarters.map((item, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(255,255,255,0.75)" }}>{item.name}</span>
                    <span style={{ flex: 1, borderBottom: "1px dotted rgba(183,143,82,0.12)", margin: "0 10px", marginBottom: 3 }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-accent)", fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic", lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "#C9A050", marginBottom: 28, paddingBottom: 12, borderBottom: "1px solid rgba(183,143,82,0.1)" }}>Main Course</h3>
              {menuMains.map((item, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "rgba(255,255,255,0.75)" }}>{item.name}</span>
                    <span style={{ flex: 1, borderBottom: "1px dotted rgba(183,143,82,0.12)", margin: "0 10px", marginBottom: 3 }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-accent)", fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic", lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ GALLERY ═══════ */}
      <section ref={galleryR.ref} style={{ padding: "80px 0", background: "rgb(var(--bg-secondary))", borderTop: "1px solid rgba(183,143,82,0.08)" }}>
        <div style={{ textAlign: "center" as const, maxWidth: 650, margin: "0 auto 48px", padding: "0 6%" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", ...revealStyle(galleryR.visible) }}>◆ &nbsp; Past Events</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", margin: "16px 0", lineHeight: 1.2, ...revealStyle(galleryR.visible, 0.1) }}>Moments We&apos;ve Crafted</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, height: 320, ...revealStyle(galleryR.visible, 0.2) }} className="catering-gallery-strip">
          {galleryImages.map((url, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)", transition: "all 0.6s" }}
                onMouseEnter={(e) => { (e.target as HTMLImageElement).style.filter = "brightness(1)"; (e.target as HTMLImageElement).style.transform = "scale(1.08)"; }}
                onMouseLeave={(e) => { (e.target as HTMLImageElement).style.filter = "brightness(0.75)"; (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ TESTIMONIAL ═══════ */}
      <section ref={testimonialR.ref} style={{ padding: "100px 6%", display: "flex", flexDirection: "column" as const, alignItems: "center", textAlign: "center" as const, background: "rgb(var(--bg-primary))" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 72, color: "rgba(183,143,82,0.15)", lineHeight: 1, marginBottom: -12, ...revealStyle(testimonialR.visible) }}>&ldquo;</div>
        <p style={{ fontFamily: "var(--font-accent)", fontSize: "clamp(17px,2vw,24px)", fontStyle: "italic", color: "rgba(255,255,255,0.65)", lineHeight: 1.8, maxWidth: 700, marginBottom: 28, ...revealStyle(testimonialR.visible, 0.1) }}>
          New York Nook transformed our wedding reception into an unforgettable culinary journey. Every guest was mesmerized by the flavors and the impeccable presentation.
        </p>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" as const, color: "#C9A050", marginBottom: 4, ...revealStyle(testimonialR.visible, 0.2) }}>Alexandra & Michael Petrov</span>
        <span style={{ fontFamily: "var(--font-accent)", fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic", ...revealStyle(testimonialR.visible, 0.3) }}>Wedding Reception — September 2024</span>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section ref={ctaR.ref} style={{ position: "relative", padding: "100px 6%", textAlign: "center" as const, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgb(8,6,3) 0%, rgba(8,6,3,0.75) 30%, rgba(8,6,3,0.75) 70%, rgb(8,6,3) 100%)" }} />
        </div>

        <div ref={inquireRef} style={{ position: "relative", zIndex: 2 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", ...revealStyle(ctaR.visible) }}>◆ &nbsp; Begin Planning</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", margin: "16px 0 12px", lineHeight: 1.2, ...revealStyle(ctaR.visible, 0.1) }}>
            Let&apos;s Create Something<br />
            <span style={{ fontStyle: "italic", color: "rgb(var(--gold-light))" }}>Extraordinary</span>
          </h2>
          <p style={{ fontFamily: "var(--font-accent)", fontSize: 15, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.8, maxWidth: 500, margin: "0 auto 40px", ...revealStyle(ctaR.visible, 0.2) }}>
            Reach out to our events team and we&apos;ll start bringing your vision to life.
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" as const, ...revealStyle(ctaR.visible, 0.3) }}>
            <button className="btn-gold-filled" onClick={() => openConsultation()}>Request a Consultation</button>
            <a href="tel:+13235550100" className="btn-gold-outline" style={{ textDecoration: "none" }}>
              Call (323) 555-0100
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section ref={faqR.ref} style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 48 }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 5, textTransform: "uppercase" as const, color: "#C9A050", ...revealStyle(faqR.visible) }}>◆ &nbsp; Common Questions</span>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 400, color: "#fff", margin: "16px 0", lineHeight: 1.2, ...revealStyle(faqR.visible, 0.1) }}>Frequently Asked</h2>
        </div>

        <div style={revealStyle(faqR.visible, 0.2)}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: "1px solid rgba(183,143,82,0.08)", overflow: "hidden" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.75)",
                  fontFamily: "var(--font-display)", fontSize: 16, textAlign: "left" as const,
                  padding: "20px 0", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgb(var(--gold-light))")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.75)")}
              >
                {faq.q}
                <span style={{ color: "rgba(183,143,82,0.4)", fontSize: 18, transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 16 }}>+</span>
              </button>
              <div style={{ maxHeight: openFaq === i ? 200 : 0, overflow: "hidden", transition: "all 0.4s ease", paddingBottom: openFaq === i ? 20 : 0 }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ background: "#050403", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px clamp(20px,4vw,60px) 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }} className="footer-grid">
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

            {footerColumns.map((col, ci) => (
              <div key={ci}>
                <h4 style={{ fontFamily: "var(--font-body)", fontSize: 10, letterSpacing: 3, color: "#C9A050", textTransform: "uppercase" as const, marginBottom: 20 }}>{col.title}</h4>
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", marginBottom: 12, transition: "color 0.3s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 1 }}>© {new Date().getFullYear()} New York Nook. All rights reserved.</p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>7065 Sunset Blvd, Hollywood, CA 90028</p>
          </div>
        </div>
      </footer>
    </div>
  );
}