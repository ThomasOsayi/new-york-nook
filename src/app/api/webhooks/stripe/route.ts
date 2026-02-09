import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import type Stripe from "stripe";

/* ── Generate order number (same as order.ts) ── */
function generateOrderNumber(): string {
  const now = new Date();
  const datePart = `${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NYN-${datePart}-${randomPart}`;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("❌ No Stripe signature found");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("✅ Payment successful for session:", session.id);

    try {
      // Extract order data from metadata
      const metadata = session.metadata!;
      const items = JSON.parse(metadata.items);

      const orderNumber = generateOrderNumber();

      // Create order in Firestore
      const orderRef = await addDoc(collection(db, "orders"), {
        // Customer
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        phone: metadata.phone,
        email: metadata.email,

        // Items & totals
        items,
        subtotal: parseFloat(metadata.subtotal),
        discount: parseFloat(metadata.discount),
        tax: parseFloat(metadata.tax),
        packagingFee: parseFloat(metadata.packagingFee),
        tip: parseFloat(metadata.tip),
        total: parseFloat(metadata.total),

        // Promo
        ...(metadata.promoCode && {
          promoCode: metadata.promoCode,
          promoType: metadata.promoType as "percent" | "fixed",
          promoValue: parseFloat(metadata.promoValue),
        }),

        // Pickup
        pickupTime: metadata.pickupTime,
        instructions: metadata.instructions || undefined,

        // Payment
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        paymentStatus: "paid",

        // Meta
        status: "pending",
        createdAt: serverTimestamp(),
        orderNumber,
      });

      console.log("✅ Order created in Firestore:", orderRef.id, orderNumber);

      // Update promo code usage count (if promo was used)
      if (metadata.promoCode) {
        try {
          const promoQuery = await getDoc(
            doc(db, "promoCodes", metadata.promoCode)
          );
          
          if (promoQuery.exists()) {
            await updateDoc(doc(db, "promoCodes", metadata.promoCode), {
              usageCount: increment(1),
            });
            console.log("✅ Promo code usage incremented:", metadata.promoCode);
          }
        } catch (promoErr) {
          console.error("⚠️ Failed to update promo usage:", promoErr);
          // Don't fail the webhook if promo update fails
        }
      }

      return NextResponse.json({ received: true, orderId: orderRef.id });
    } catch (err) {
      console.error("❌ Failed to create order:", err);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
  }

  // Return 200 for other event types
  return NextResponse.json({ received: true });
}