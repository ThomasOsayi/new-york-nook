import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
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
  tax: number;
  packagingFee: number;
  tip: number;
  total: number;

  /* Pickup */
  pickupTime: string; // e.g. "ASAP (25–35 min)" or "6:30 PM"

  /* Special instructions */
  instructions?: string;
  promoCode?: string;

  /* Meta */
  status: "pending" | "confirmed" | "preparing" | "ready" | "picked_up" | "cancelled";
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  orderNumber: string;
}

/* ── Generate readable order number ── */
function generateOrderNumber(): string {
  const now = new Date();
  const datePart = `${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NYN-${datePart}-${randomPart}`;
}

/* ── Create a new order ── */
export async function createOrder(
  data: Omit<OrderData, "status" | "createdAt" | "orderNumber">
): Promise<{ id: string; orderNumber: string }> {
  const orderNumber = generateOrderNumber();

  const docRef = await addDoc(collection(db, "orders"), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    orderNumber,
  });

  return { id: docRef.id, orderNumber };
}

/* ── Get order by Firestore doc ID ── */
export async function getOrder(orderId: string): Promise<OrderData | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return snap.data() as OrderData;
}