import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { CartItem } from "@/components/order/Cartcontext";

interface CheckoutRequestBody {
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
    const body: CheckoutRequestBody = await req.json();

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

    // Create a SINGLE line item for the entire order
    // This avoids the negative amount issue with discounts
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "New York Nook - Order",
            description: `${items.length} item${items.length > 1 ? 's' : ''} • Pickup: ${pickupTime}`,
          },
          unit_amount: Math.round(total * 100), // Total amount in cents
        },
        quantity: 1,
      },
    ];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/order/checkout`,
      customer_email: email,
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
        // Strip descriptions and shorten URLs to fit Stripe's 500 char metadata limit
        items: JSON.stringify(
          items.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty,
            categoryKey: item.categoryKey,
            // Store just the image ID instead of full URL
            img: item.img.includes('unsplash')
              ? item.img.split('photo-')[1]?.split('?')[0] || item.img
              : item.img,
          }))
        ),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("❌ Stripe checkout session creation failed:", error);
    console.error("❌ Error details:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}