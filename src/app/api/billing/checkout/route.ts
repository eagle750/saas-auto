import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLAN_PRICE_IDS, getOrCreateStripeCustomer } from "@/lib/stripe";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const { plan } = parsed.data;

  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `No price configured for plan: ${plan}`, code: "INVALID_PLAN" },
      { status: 400 }
    );
  }

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email
    );

    // Persist the Stripe customer ID on the subscription record if not already set
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { stripeCustomerId: customerId },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?checkout=cancelled`,
      metadata: {
        userId: session.user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[POST /api/billing/checkout]", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
