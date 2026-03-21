import Stripe from "stripe";

function createStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    return new Proxy({} as Stripe, {
      get(_, prop) {
        if (typeof prop === "symbol" || prop === "then") return undefined;
        throw new Error(`STRIPE_SECRET_KEY is not set. Cannot access stripe.${String(prop)}`);
      },
    });
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
}

export const stripe = createStripeClient();

export const PLAN_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID ?? "",
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
};

export const PLAN_LIMITS: Record<string, number> = {
  FREE: 2,
  STARTER: 10,
  PRO: 50,
  ENTERPRISE: Infinity,
};

/**
 * Get or create a Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  // Search for existing customer
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  return customer.id;
}
