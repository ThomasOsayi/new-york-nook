import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { CartItem } from "@/components/order/Cartcontext";

interface PaymentIntentRequestBody {
  items: CartItem[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subtotal: number;
  discount: number;
  tax: number;
  packagingFee: number;
  tip: number;
  total: number;
  pickupTime: string;
  instructions?: string;
  promoCode?: string;
  promoType?: "percent" | "fixed";
  promoValue?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: PaymentIntentRequestBody = await req.json();

    const {
      items,
      firstName,
      lastName,
      email,
      phone,
      subtotal,
      discount,
      tax,
      packagingFee,
      tip,
      total,
      pickupTime,
      instructions,
      promoCode,
      promoType,
      promoValue,
    } = body;

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "Missing customer information" },
        { status: 400 }
      );
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Amount in cents
      currency: "usd",
      receipt_email: email,
      description: `New York Nook - Order (${items.length} item${items.length > 1 ? 's' : ''})`,
      metadata: {
        // Store all order data in metadata for webhook
        firstName,
        lastName,
        phone,
        email,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        tax: tax.toFixed(2),
        packagingFee: packagingFee.toFixed(2),
        tip: tip.toFixed(2),
        total: total.toFixed(2),
        pickupTime,
        instructions: instructions || "",
        promoCode: promoCode || "",
        promoType: promoType || "",
        promoValue: promoValue?.toString() || "",
        // Compress items to fit in 500 char limit
        items: JSON.stringify(
          items.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty,
            categoryKey: item.categoryKey,
            img: item.img.includes('unsplash') 
              ? item.img.split('photo-')[1]?.split('?')[0] || item.img 
              : item.img,
          }))
        ),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("❌ Payment Intent creation failed:", error);
    console.error("❌ Error details:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}