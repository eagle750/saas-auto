import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GITHUB_CLIENT_ID
      ? [GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET!, allowDangerousEmailAccountLinking: true })]
      : []),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET!, allowDangerousEmailAccountLinking: true })]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", newUser: "/dashboard", error: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      // Always allow credentials sign-in (handled by authorize)
      if (account?.provider === "credentials") return true;
      // Allow OAuth sign-in if we have a valid user
      if (!user?.email) return false;
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        const sub = await prisma.subscription.findUnique({ where: { userId: token.id as string } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).plan = sub?.plan ?? "FREE";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).generationsUsed = sub?.generationsUsed ?? 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).generationsLimit = sub?.generationsLimit ?? 2;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            stripeCustomerId: `pending_${user.id}`,
            plan: "FREE",
            generationsLimit: 2,
            generationsUsed: 0,
          },
        });
      }
    },
  },
});
