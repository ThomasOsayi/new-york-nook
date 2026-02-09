"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getOrderBySessionId, getOrderByPaymentIntent, type OrderData } from "@/lib/order";

export default function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sessionId = searchParams.get("session_id");
  const paymentIntentId = searchParams.get("payment_intent");
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      // Determine which ID to use
      const id = paymentIntentId || sessionId;
      const isPaymentIntent = !!paymentIntentId;

      if (!id) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        let fetchedOrder;
        
        if (isPaymentIntent) {
          // Embedded payment flow
          fetchedOrder = await getOrderByPaymentIntent(id);
        } else {
          // Hosted checkout flow
          fetchedOrder = await getOrderBySessionId(id);
        }

        if (fetchedOrder) {
          setOrder(fetchedOrder);
          setLoading(false);
        } else {
          // Retry once after 2 seconds (webhook delay)
          if (retryCount === 0) {
            setTimeout(() => {
              setRetryCount(1);
            }, 2000);
          } else {
            setError("Order not found. The payment may still be processing. Please refresh in a moment.");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Failed to load order details");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId, paymentIntentId, retryCount]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "rgb(var(--bg-primary))",
        flexDirection: "column",
        gap: 20,
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: "3px solid rgba(201,160,80,0.2)",
          borderTopColor: "#C9A050",
          borderRadius: "50%",
          animation: "confirmationSpin 0.8s linear infinite",
        }} />
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: 0.5,
        }}>
          {retryCount > 0 ? "Still confirming your payment..." : "Confirming your payment..."}
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !order) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgb(var(--bg-primary))",
        padding: "40px 20px",
      }}>
        <div style={{
          maxWidth: 500,
          textAlign: "center",
          padding: 48,
          background: "rgb(var(--bg-secondary))",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 16,
        }}>
          <div style={{
            width: 64,
            height: 64,
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: "rgba(168,84,84,0.08)",
            border: "1px solid rgba(168,84,84,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e07070" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 500,
            color: "#fff",
            marginBottom: 12,
          }}>
            Order Not Found
          </h1>
          
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            marginBottom: 32,
          }}>
            {error || "We couldn't find your order. If you just completed payment, please wait a moment and refresh the page."}
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-gold-outline"
              style={{
                padding: "14px 24px",
                fontSize: 12,
                letterSpacing: 1.5,
              }}
            >
              Refresh Page
            </button>
            <Link
              href="/"
              className="btn-gold-filled"
              style={{
                padding: "14px 24px",
                fontSize: 12,
                letterSpacing: 1.5,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  return (
    <div style={{
      minHeight: "100vh",
      background: "rgb(var(--bg-primary))",
      padding: "clamp(40px, 8vw, 80px) clamp(20px, 4vw, 40px)",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Success header */}
        <div style={{
          textAlign: "center",
          marginBottom: 48,
          animation: "confirmationFadeUp 0.6s ease both",
        }}>
          <div style={{
            width: 80,
            height: 80,
            margin: "0 auto 24px",
            borderRadius: "50%",
            background: "rgba(106,158,108,0.08)",
            border: "1px solid rgba(106,158,108,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(106,158,108,0.9)" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 500,
            color: "#fff",
            marginBottom: 12,
          }}>
            Order Confirmed!
          </h1>

          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 16,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 24,
          }}>
            Your order has been received and paid
          </p>

          {/* Order number + status badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 32px",
            background: "rgb(var(--bg-secondary))",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 4,
              }}>
                Order Number
              </div>
              <div style={{
                fontFamily: "var(--font-accent)",
                fontSize: 24,
                fontWeight: 700,
                color: "#C9A050",
              }}>
                {order.orderNumber}
              </div>
            </div>

            <div style={{
              width: 1,
              height: 40,
              background: "rgba(255,255,255,0.06)",
            }} />

            <div style={{
              padding: "8px 16px",
              background: "rgba(106,158,108,0.08)",
              border: "1px solid rgba(106,158,108,0.15)",
              borderRadius: 8,
              fontFamily: "var(--font-body)",
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(106,158,108,0.9)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "rgba(106,158,108,0.9)",
              }} />
              Paid
            </div>
          </div>
        </div>

        {/* Order details card */}
        <div style={{
          background: "rgb(var(--bg-secondary))",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 32,
          animation: "confirmationFadeUp 0.6s ease both 0.1s",
        }}>
          {/* Pickup info */}
          <div style={{
            padding: "24px 32px",
            background: "rgba(201,160,80,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 12,
            }}>
              Pickup Details
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "12px 20px",
              fontFamily: "var(--font-body)",
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Time:</div>
              <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{order.pickupTime}</div>
              
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Location:</div>
              <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>7065 Sunset Blvd, Hollywood, CA</div>
              
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Customer:</div>
              <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>
                {order.firstName} {order.lastName}
              </div>
              
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Phone:</div>
              <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{order.phone}</div>
            </div>
          </div>

          {/* Items list */}
          <div style={{ padding: "24px 32px" }}>
            <div style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: 16,
            }}>
              Your Order
            </div>

            {order.items.map((item: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 16,
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: idx < order.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  position: "relative",
                }}>
                  <Image
                    src={item.img}
                    alt={item.name}
                    width={56}
                    height={56}
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "#fff",
                    marginBottom: 4,
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.3)",
                  }}>
                    Qty: {item.qty}
                  </div>
                </div>

                <div style={{
                  fontFamily: "var(--font-accent)",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#C9A050",
                }}>
                  ${(item.price * item.qty).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{
            padding: "24px 32px",
            background: "linear-gradient(180deg, transparent, rgba(201,160,80,0.015))",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              <span>Subtotal</span>
              <span style={{ color: "#fff", fontWeight: 500 }}>${order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "#4ADE80" }}>
                <span>Discount {order.promoCode && `(${order.promoCode})`}</span>
                <span style={{ fontWeight: 500 }}>−${order.discount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              <span>Tax</span>
              <span style={{ color: "#fff", fontWeight: 500 }}>${order.tax.toFixed(2)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              <span>Packaging</span>
              <span style={{ color: "#fff", fontWeight: 500 }}>${order.packagingFee.toFixed(2)}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontFamily: "var(--font-body)", fontSize: 14, color: "#E8D5A3" }}>
              <span>Tip</span>
              <span style={{ fontWeight: 500 }}>${order.tip.toFixed(2)}</span>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 600, color: "#fff" }}>
                Total
              </span>
              <span style={{ fontFamily: "var(--font-accent)", fontSize: 32, fontWeight: 700, color: "#C9A050" }}>
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
          animation: "confirmationFadeUp 0.6s ease both 0.2s",
        }}>
          <Link
            href="/"
            className="btn-gold-outline"
            style={{
              padding: "16px 32px",
              fontSize: 12,
              letterSpacing: 2,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Back to Home
          </Link>
          <Link
            href="/order"
            className="btn-gold-filled"
            style={{
              padding: "16px 32px",
              fontSize: 12,
              letterSpacing: 2,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Order Again
          </Link>
        </div>

        {/* Help text */}
        <p style={{
          textAlign: "center",
          marginTop: 32,
          fontFamily: "var(--font-body)",
          fontSize: 12,
          color: "rgba(255,255,255,0.2)",
          lineHeight: 1.6,
        }}>
          A confirmation email has been sent to <strong style={{ color: "rgba(255,255,255,0.4)" }}>{order.email}</strong>
          <br />
          Questions? Call us at <span style={{ color: "#C9A050" }}>(323) 000-0000</span>
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes confirmationFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confirmationSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}