import Stripe from "stripe";
import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js";

/* ── Server-side Stripe (for API routes) ── */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover", // Latest stable version
  typescript: true,
});

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