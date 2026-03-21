/**
 * Template context for dynamic Next.js projects.
 *
 * Covers: single-page applications with an API layer and database backend.
 * These projects have authenticated users, persistent data storage, and
 * real-time or on-demand data fetching. Typical examples: dashboards,
 * SaaS tools, internal tools, social apps, project management apps.
 */

export const DYNAMIC_TEMPLATE_CONTEXT = `
## Project Type: Dynamic Next.js Application (API + Database)

This is a dynamic Next.js project with a database, authentication, and API routes.
Apply these patterns throughout.

### Typical File Structure
\`\`\`
├── next.config.ts
├── tailwind.config.ts
├── middleware.ts               # Auth guards, protected route redirects
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Public landing/home page
│   │   ├── globals.css
│   │   ├── (auth)/             # Auth route group (no shared layout needed)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/        # Protected route group
│   │   │   ├── layout.tsx      # Dashboard shell: sidebar + header
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts
│   │       └── [resource]/
│   │           └── route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── [feature]/          # Feature-specific components
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # NextAuth config or auth helpers
│   │   ├── utils.ts            # cn() and helpers
│   │   └── validations.ts      # Shared Zod schemas
│   ├── hooks/                  # Custom React hooks
│   │   └── use-[resource].ts
│   └── types/
│       └── index.ts
\`\`\`

### Key Patterns

#### Authentication with NextAuth.js v5
\`\`\`typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [...],
  session: { strategy: "jwt" },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub! },
    }),
  },
});
\`\`\`

#### Middleware for Protected Routes
\`\`\`typescript
// middleware.ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard");

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
\`\`\`

#### Prisma Client Singleton
\`\`\`typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
\`\`\`

#### API Route Pattern (route.ts)
\`\`\`typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({ name: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await prisma.resource.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
\`\`\`

#### Dashboard Layout with Sidebar
- Use a route group \`(dashboard)\` so the dashboard shell applies only to protected pages
- Sidebar should render navigation links with \`usePathname()\` to highlight active route
- Implement responsive sidebar: off-canvas drawer on mobile, fixed sidebar on desktop
- Include a user avatar + dropdown menu in the header

#### Data Fetching in Server Components
- Fetch data directly in Server Components using \`async/await\` — no useEffect
- Use \`unstable_cache\` or \`React.cache\` for expensive queries
- Add \`export const dynamic = "force-dynamic"\` on pages with user-specific data
- Use \`<Suspense>\` boundaries with skeleton loaders for independent data requirements

#### Client-Side Mutations
- Use SWR or TanStack Query for client-side data fetching and cache invalidation
- Implement optimistic updates for better UX on mutations
- Show toast notifications (sonner or react-hot-toast) on success/error
`.trim();
