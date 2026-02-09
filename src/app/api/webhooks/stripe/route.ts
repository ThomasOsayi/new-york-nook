import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, Timestamp } from "firebase/firestore";

/* ── Generate order number ── */
function generateOrderNumber(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `NYN-${month}${day}-${random}`;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("❌ Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`✅ Webhook received: ${event.type}`);

  /* ═══════════════════════════════════════════
     Handle payment_intent.succeeded (Embedded)
     ═══════════════════════════════════════════ */
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any;

    console.log("✅ Payment successful for Payment Intent:", paymentIntent.id);

    const metadata = paymentIntent.metadata;

    // Parse items and reconstruct full image URLs
    const items = JSON.parse(metadata.items).map((item: any) => ({
      ...item,
      img: item.img.includes('http') 
        ? item.img 
        : `https://images.unsplash.com/photo-${item.img}?w=400&q=80`,
    }));

    // Create order in Firestore
    try {
      const orderData = {
        // Customer info
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        phone: metadata.phone,
        email: metadata.email,

        // Items
        items,

        // Pricing
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

        // Fulfillment
        pickupTime: metadata.pickupTime,
        instructions: metadata.instructions || "",

        // Payment
        paymentIntentId: paymentIntent.id,
        paymentStatus: "paid",

        // Order status
        status: "pending",
        orderNumber: generateOrderNumber(),
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("✅ Order created in Firestore:", docRef.id);

      // Increment promo code usage if applicable
      if (metadata.promoCode) {
        const promoRef = doc(db, "promoCodes", metadata.promoCode);
        await updateDoc(promoRef, {
          usageCount: increment(1),
        });
        console.log("✅ Promo code usage incremented:", metadata.promoCode);
      }
    } catch (error) {
      console.error("❌ Failed to create order in Firestore:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
  }

  /* ═══════════════════════════════════════════
     Handle checkout.session.completed (Hosted)
     Keep this for backward compatibility
     ═══════════════════════════════════════════ */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    console.log("✅ Payment successful for session:", session.id);

    const metadata = session.metadata;

    // Parse items and reconstruct full image URLs
    const items = JSON.parse(metadata.items).map((item: any) => ({
      ...item,
      img: item.img.includes('http') 
        ? item.img 
        : `https://images.unsplash.com/photo-${item.img}?w=400&q=80`,
    }));

    // Create order in Firestore
    try {
      const orderData = {
        // Customer info
        firstName: metadata.firstName,
        lastName: metadata.lastName,
        phone: metadata.phone,
        email: metadata.email,

        // Items
        items,

        // Pricing
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

        // Fulfillment
        pickupTime: metadata.pickupTime,
        instructions: metadata.instructions || "",

        // Payment (for hosted checkout)
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        paymentStatus: "paid",

        // Order status
        status: "pending",
        orderNumber: generateOrderNumber(),
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("✅ Order created in Firestore:", docRef.id);

      // Increment promo code usage if applicable
      if (metadata.promoCode) {
        const promoRef = doc(db, "promoCodes", metadata.promoCode);
        await updateDoc(promoRef, {
          usageCount: increment(1),
        });
        console.log("✅ Promo code usage incremented:", metadata.promoCode);
      }
    } catch (error) {
      console.error("❌ Failed to create order in Firestore:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}