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

    // Build line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.img],
          description: item.desc || undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.qty,
    }));

    // Add tax as a line item
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tax (9.5%)",
            images: [],
            description: undefined,
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    // Add packaging fee
    if (packagingFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Packaging Fee",
            images: [],
            description: undefined,
          },
          unit_amount: Math.round(packagingFee * 100),
        },
        quantity: 1,
      });
    }

    // Add tip
    if (tip > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tip",
            images: [],
            description: undefined,
          },
          unit_amount: Math.round(tip * 100),
        },
        quantity: 1,
      });
    }

    // Add discount as negative line item (if applicable)
    if (discount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Discount${promoCode ? ` (${promoCode})` : ""}`,
            images: [],
            description: undefined,
          },
          unit_amount: -Math.round(discount * 100), // Negative amount
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/order/checkout`,
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
        // Store items as JSON string (Stripe metadata is limited to strings)
        items: JSON.stringify(items),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}