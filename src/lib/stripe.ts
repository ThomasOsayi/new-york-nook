import Stripe from "stripe";
import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js";

/* ── Server-side Stripe (for API routes) ── */
// Only check for secret key when actually creating server instance
let serverStripeInstance: Stripe | null = null;

export function getServerStripe(): Stripe {
  if (typeof window !== "undefined") {
    throw new Error("getServerStripe can only be called on the server");
  }
  
  if (!serverStripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }

    serverStripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover", // Latest stable version
      typescript: true,
    });
  }

  return serverStripeInstance;
}

// Legacy export for backward compatibility with webhook
export const stripe = typeof window === "undefined" && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    })
  : (null as any); // Will only be used on server where it exists

/* ── Client-side Stripe (for checkout page) ── */
let stripePromise: Promise<StripeClient | null>;

export function getStripe(): Promise<StripeClient | null> {
  if (!stripePromise) {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    }
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}