import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import bcrypt from "bcryptjs";
import { prisma } from "@exibidos/db/client";
import { ExibidosPrismaAdapter } from "./adapter";

const AGE_GATE_MIN_YEARS = 18;

export function authOptions(): NextAuthOptions {
  return {
    adapter: ExibidosPrismaAdapter(),
    session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
    pages: {
      signIn: "/auth/login",
      error: "/auth/error",
    },
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
        async authorize(creds) {
          if (!creds?.email || !creds?.password) return null;
          const user = await prisma.user.findFirst({
            where: { email: creds.email, deletedAt: null },
            include: { slugs: true },
          });
          if (!user?.passwordHash) return null;
          const ok = await bcrypt.compare(creds.password, user.passwordHash);
          if (!ok) return null;
          if (user.slugs.length === 0) return null;
          return { id: user.id, email: user.email, name: user.name, image: user.image };
        },
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      }),
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID ?? "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
        version: "2.0",
      }),
    ],
    callbacks: {
      async signIn({ user, account }) {
        if (account?.provider === "credentials") return true;
        const exists = await prisma.user.findFirst({
          where: { id: user.id!, deletedAt: null },
          include: { slugs: true },
        });
        if (exists && exists.slugs.length > 0) return true;
        if (exists && exists.slugs.length === 0) return "/auth/complete-signup";
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
}

export function isAgeAllowed(birthdate: Date): boolean {
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const m = now.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;
  return age >= AGE_GATE_MIN_YEARS;
}

export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$|^[a-z0-9]$/;
