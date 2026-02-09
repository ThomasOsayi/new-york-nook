import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  type Timestamp,
} from "firebase/firestore";

/* ── Order item shape (matches CartItem) ── */
export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  img: string;
  categoryKey: string;
}

/* ── Full order document ── */
export interface OrderData {
  /* Customer */
  firstName: string;
  lastName: string;
  phone: string;
  email: string;

  /* Items & totals */
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  packagingFee: number;
  tip: number;
  total: number;

  /* Promo */
  promoCode?: string;
  promoType?: "percent" | "fixed";
  promoValue?: number;

  /* Pickup */
  pickupTime: string; // e.g. "ASAP (25–35 min)" or "6:30 PM"

  /* Special instructions */
  instructions?: string;

  /* Payment (NEW) */
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentStatus?: "paid" | "pending" | "failed";

  /* Meta */
  status: "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "cancelled";
  createdAt: Timestamp;
  orderNumber: string;
}

/* ── Get order by Firestore doc ID ── */
export async function getOrder(orderId: string): Promise<OrderData | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return snap.data() as OrderData;
}

/* ── Get order by Stripe session ID (NEW) ── */
export async function getOrderBySessionId(sessionId: string): Promise<OrderData | null> {
  try {
    // Note: This requires a Firestore index on stripeSessionId
    // Firebase will prompt you to create it when first used
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    
    const q = query(
      collection(db, "orders"),
      where("stripeSessionId", "==", sessionId)
    );
    
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    return snap.docs[0].data() as OrderData;
  } catch (err) {
    console.error("Failed to get order by session ID:", err);
    return null;
  }
}
