/**
 * Auth configuration: NextAuth with credentials + OAuth (Google, Twitter).
 * Session: JWT (required for credentials); 30d max. OAuth users without slug → /auth/complete-signup.
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import bcrypt from "bcryptjs";
import { prisma } from "@exibidos/db/client";
import { ExibidosPrismaAdapter } from "./adapter";
import { log } from "@/lib/logger";

const AGE_GATE_MIN_YEARS = 18;

const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
const hasTwitter = Boolean(process.env.TWITTER_CLIENT_ID?.trim() && process.env.TWITTER_CLIENT_SECRET?.trim());

export const authOptions: NextAuthOptions = {
    adapter: ExibidosPrismaAdapter(),
    secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    pages: {
      signIn: "/auth/login",
      error: "/auth/error",
    },
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
        async authorize(creds) {
          if (!creds?.email || !creds?.password) {
            log.auth.debug("authorize: missing email or password");

            return null;
          }
          const user = await prisma.user.findFirst({
            where: { email: creds.email, deletedAt: null },
            include: { slugs: true },
          });

          if (!user?.passwordHash) {
            log.auth.debug("authorize: user not found or no password", { email: creds.email });

            return null;
          }
          const ok = await bcrypt.compare(creds.password, user.passwordHash);

          if (!ok) {
            log.auth.warn("authorize: invalid password", { email: creds.email });

            return null;
          }

          if (user.slugs.length === 0) {
            log.auth.debug("authorize: user has no slug", { userId: user.id });

            return null;
          }
          log.auth.info("authorize: success", { userId: user.id, email: creds.email });

          return { id: user.id, email: user.email, name: user.name, image: user.image };
        },
      }),
      ...(hasGoogle
        ? [
            GoogleProvider({
              clientId: process.env.GOOGLE_CLIENT_ID!,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            }),
          ]
        : []),
      ...(hasTwitter
        ? [
            TwitterProvider({
              clientId: process.env.TWITTER_CLIENT_ID!,
              clientSecret: process.env.TWITTER_CLIENT_SECRET!,
              version: "2.0",
            }),
          ]
        : []),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.email = user.email ?? undefined;
          token.name = user.name ?? undefined;
          token.picture = user.image ?? undefined;
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.sub!;
          if (token.id) session.user.id = token.id as string;
          session.user.email = token.email ?? null;
          session.user.name = token.name ?? null;
          session.user.image = token.picture ?? null;
        }

        return session;
      },
      async signIn({ user, account }) {
        if (account?.provider === "credentials") return true;
        log.auth.debug("signIn: OAuth", { provider: account?.provider, userId: user.id });
        const exists = await prisma.user.findFirst({
          where: { id: user.id!, deletedAt: null },
          include: { slugs: true },
        });

        if (exists && exists.slugs.length > 0) {
          log.auth.info("signIn: existing user", { userId: user.id });

          return true;
        }

        if (exists && exists.slugs.length === 0) {
          log.auth.info("signIn: redirect to complete-signup", { userId: user.id });

          return "/auth/complete-signup";
        }

        return true;
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith("/")) return `${baseUrl}${url}`;

        if (new URL(url).origin === baseUrl) return url;

        return baseUrl;
      },
    },
    events: {
      async createUser({ user }) {
        if (!user.id) return;
        const u = await prisma.user.findUnique({ where: { id: user.id }, include: { slugs: true } });

        if (u?.slugs.length) return;
        const sentinel = new Date("2000-01-01");

        if (u?.birthdate.getTime() !== sentinel.getTime()) return;
        // OAuth-created user with placeholder birthdate; Profile/Slug created in /auth/complete-signup
      },
    },
  };

export function isAgeAllowed(birthdate: Date): boolean {
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const m = now.getMonth() - birthdate.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;

  return age >= AGE_GATE_MIN_YEARS;
}

/** 1–30 chars, lowercase alphanumeric and hyphen, not starting/ending with hyphen */
export const SLUG_REGEX = /^[a-z0-9]$|^[a-z0-9][a-z0-9-]{0,27}[a-z0-9]$/;
