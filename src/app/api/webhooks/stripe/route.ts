import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured", code: "CONFIG_ERROR" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}`, code: "INVALID_SIGNATURE" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as string | undefined;

        if (!userId || !plan) {
          console.warn("[stripe webhook] checkout.session.completed missing userId or plan in metadata", session.id);
          break;
        }

        const generationsLimit = PLAN_LIMITS[plan] ?? 2;

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: plan as "FREE" | "STARTER" | "PRO" | "ENTERPRISE",
            status: "active",
            generationsLimit,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          },
        });

        console.log(`[stripe webhook] Subscription plan updated to ${plan} for user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd = (subscription as any).current_period_end as number | undefined;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          // Try to look up by Stripe customer ID
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          if (!sub) {
            console.warn("[stripe webhook] customer.subscription.updated: no subscription found for customer", subscription.customer);
            break;
          }

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            },
          });
          break;
        }

        await prisma.subscription.update({
          where: { userId },
          data: {
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          },
        });

        console.log(`[stripe webhook] Subscription updated for user ${userId}: status=${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          const sub = await prisma.subscription.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          if (!sub) {
            console.warn("[stripe webhook] customer.subscription.deleted: no subscription found for customer", subscription.customer);
            break;
          }

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              plan: "FREE",
              status: "canceled",
              stripeSubscriptionId: null,
              generationsLimit: PLAN_LIMITS["FREE"],
              currentPeriodEnd: null,
            },
          });
          break;
        }

        await prisma.subscription.update({
          where: { userId },
          data: {
            plan: "FREE",
            status: "canceled",
            stripeSubscriptionId: null,
            generationsLimit: PLAN_LIMITS["FREE"],
            currentPeriodEnd: null,
          },
        });

        console.log(`[stripe webhook] Subscription deleted for user ${userId}, reverted to FREE`);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (error) {
    console.error(`[stripe webhook] Error processing event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Failed to process webhook event", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
