"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/unauthorized") {
        setError("This account is not authorized to access the dashboard.");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "rgb(var(--bg-primary))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
        padding: 20,
      }}
    >
      {/* Subtle radial glow behind the card */}
      <div
        style={{
          position: "fixed",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,160,80,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "1px solid rgba(183,143,82,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: "rotate(45deg)",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                transform: "rotate(-45deg)",
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "#C9A050",
                fontWeight: 700,
              }}
            >
              N
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: 3,
              marginBottom: 6,
            }}
          >
            NEW YORK NOOK
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Staff Portal
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "36px 32px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            Sign In
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              marginBottom: 28,
            }}
          >
            Enter your credentials to access the kitchen dashboard.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="staff@newyorknook.com"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,160,80,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 14,
                  fontFamily: "var(--font-body)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,160,80,0.3)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.15)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#EF4444",
                  marginBottom: 18,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px 20px",
                background: loading
                  ? "rgba(201,160,80,0.3)"
                  : "linear-gradient(135deg, rgb(var(--gold)), rgb(var(--gold-dark)))",
                border: "1px solid rgb(var(--gold))",
                borderRadius: 10,
                color: "rgb(var(--bg-primary))",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "var(--font-body)",
                cursor: loading ? "not-allowed" : "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                transition: "all 0.3s",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a
            href="/"
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "color 0.3s",
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#C9A050")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.25)")}
          >
            ← Back to New York Nook
          </a>
        </div>
      </div>
    </div>
  );
}