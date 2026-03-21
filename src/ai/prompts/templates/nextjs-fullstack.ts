/**
 * Template context for full-stack Next.js projects.
 *
 * Covers: complete SaaS products with multi-tenancy, subscription billing,
 * admin dashboards, email notifications, file storage, background jobs,
 * and production-grade observability. Typical examples: B2B SaaS, developer
 * tools, marketplace platforms, productivity applications.
 */

export const FULLSTACK_TEMPLATE_CONTEXT = `
## Project Type: Full-Stack Next.js SaaS Application

This is a complete SaaS application with billing, multi-tenancy, and production infrastructure.
Apply these patterns throughout.

### Typical File Structure
\`\`\`
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts               # Auth + subscription tier enforcement
├── prisma/
│   └── schema.prisma           # Users, subscriptions, teams, audit logs
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Marketing landing page
│   │   ├── globals.css
│   │   ├── (marketing)/        # Public-facing pages
│   │   │   ├── pricing/page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/page.tsx
│   │   │   └── docs/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── verify-email/page.tsx
│   │   ├── (app)/              # Authenticated app shell
│   │   │   ├── layout.tsx      # App shell with sidebar, command palette
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   ├── settings/
│   │   │   │   ├── layout.tsx  # Settings tabs layout
│   │   │   │   ├── profile/page.tsx
│   │   │   │   ├── billing/page.tsx
│   │   │   │   └── team/page.tsx
│   │   │   └── [feature]/
│   │   ├── (admin)/            # Internal admin panel
│   │   │   ├── layout.tsx
│   │   │   └── users/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/
│   │       │   ├── stripe/route.ts
│   │       │   └── resend/route.ts
│   │       ├── billing/
│   │       │   ├── create-checkout/route.ts
│   │       │   └── portal/route.ts
│   │       └── [resource]/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   └── UserDropdown.tsx
│   │   ├── billing/
│   │   │   ├── PricingTable.tsx
│   │   │   ├── UpgradeDialog.tsx
│   │   │   └── BillingPortalButton.tsx
│   │   ├── marketing/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   └── TestimonialsSection.tsx
│   │   ├── [feature]/
│   │   └── ui/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── stripe.ts           # Stripe client + helpers
│   │   ├── resend.ts           # Email client + templates
│   │   ├── storage.ts          # S3/R2 upload helpers
│   │   ├── rate-limit.ts       # Upstash Redis rate limiter
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── hooks/
│   ├── actions/                # Server Actions grouped by feature
│   │   ├── auth.ts
│   │   ├── billing.ts
│   │   └── [feature].ts
│   └── types/
│       └── index.ts
\`\`\`

### Key Patterns

#### Prisma Schema (Full SaaS)
\`\`\`prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  image         String?
  emailVerified DateTime?
  role          Role           @default(USER)
  subscription  Subscription?
  teamMembers   TeamMember[]
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  plan                 Plan               @default(FREE)
  status               SubscriptionStatus @default(INACTIVE)
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
}

enum Plan { FREE STARTER PRO ENTERPRISE }
enum SubscriptionStatus { ACTIVE INACTIVE PAST_DUE CANCELED TRIALING }
enum Role { USER ADMIN }
\`\`\`

#### Stripe Integration Pattern
\`\`\`typescript
// src/lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export const PLANS = {
  FREE:    { priceId: null,                         limits: { projects: 3 } },
  STARTER: { priceId: process.env.STRIPE_STARTER_PRICE_ID!, limits: { projects: 10 } },
  PRO:     { priceId: process.env.STRIPE_PRO_PRICE_ID!,     limits: { projects: -1 } },
} as const;
\`\`\`

#### Stripe Webhook Handler
\`\`\`typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: sub.status.toUpperCase() as SubscriptionStatus,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      break;
    }
  }

  return new Response("OK");
}
\`\`\`

#### Middleware with Subscription Enforcement
\`\`\`typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Unauthenticated access to protected routes
  if (!session && pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/login?callbackUrl=" + pathname, req.url));
  }

  // Admin route protection
  if (pathname.startsWith("/admin") && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});
\`\`\`

#### Server Actions Pattern
\`\`\`typescript
// src/actions/billing.ts
"use server";

import { auth } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createCheckoutSession(plan: "STARTER" | "PRO") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const priceId = PLANS[plan].priceId;
  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session.user.email!,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/pricing\`,
    metadata: { userId: session.user.id },
  });

  redirect(checkoutSession.url!);
}
\`\`\`

#### Email with Resend
\`\`\`typescript
// src/lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: "App Name <noreply@yourdomain.com>",
    to,
    subject: "Welcome to App Name!",
    react: WelcomeEmail({ name }),
  });
}
\`\`\`

#### Rate Limiting with Upstash
\`\`\`typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Usage in API route:
// const { success } = await rateLimiter.limit(ip);
// if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
\`\`\`

### Production Checklist
- All secrets in environment variables, never hardcoded
- Rate limiting on all public API routes
- Input validation with Zod on every API route and server action
- Stripe webhook signature verification before processing events
- Row-level security: always filter queries by userId to prevent data leaks
- Admin routes protected by role check in middleware
- Structured logging for errors (not console.log)
- Error boundaries on all major route segments (error.tsx)
- Loading skeletons (loading.tsx) for all data-heavy pages
`.trim();
