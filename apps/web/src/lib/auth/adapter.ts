import type { Adapter, AdapterUser } from "next-auth/adapters";
import { prisma } from "@exibidos/db/client";

/**
 * Custom Prisma adapter for NextAuth that maps our schema:
 * - Session: token <-> session_token, expiresAt <-> expires
 * - Account: accessToken, refreshToken, expiresAt (camelCase)
 */
export function ExibidosPrismaAdapter(): Adapter {
  return {
    async createUser(user) {
      const u = await prisma.user.create({
        data: {
          email: user.email!,
          emailVerified: user.emailVerified ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
          birthdate: (user as AdapterUser & { birthdate?: Date }).birthdate ?? new Date("2000-01-01"),
          passwordHash: null,
        },
      });
      return { ...u, email: u.email, emailVerified: u.emailVerified };
    },

    async getUser(id) {
      const u = await prisma.user.findUnique({
        where: { id, deletedAt: null },
      });
      if (!u) return null;
      return { ...u, email: u.email, emailVerified: u.emailVerified };
    },

    async getUserByEmail(email) {
      const u = await prisma.user.findFirst({
        where: { email, deletedAt: null },
      });
      if (!u) return null;
      return { ...u, email: u.email, emailVerified: u.emailVerified };
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const a = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      if (!a?.user || a.user.deletedAt) return null;
      const u = a.user;
      return { ...u, email: u.email, emailVerified: u.emailVerified };
    },

    async updateUser(user) {
      const u = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          email: user.email ?? undefined,
          emailVerified: user.emailVerified ?? undefined,
        },
      });
      return { ...u, email: u.email, emailVerified: u.emailVerified };
    },

    async linkAccount(account) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token ?? null,
          refreshToken: account.refresh_token ?? null,
          expiresAt: account.expires_at ?? null,
        },
      });
    },

    async createSession({ sessionToken, userId, expires }) {
      const s = await prisma.session.create({
        data: { token: sessionToken, userId, expiresAt: expires },
      });
      return { sessionToken: s.token, userId: s.userId, expires: s.expiresAt };
    },

    async getSessionAndUser(sessionToken) {
      const s = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });
      if (!s || s.expiresAt < new Date() || s.user.deletedAt) return null;
      return {
        session: { sessionToken: s.token, userId: s.userId, expires: s.expiresAt },
        user: { ...s.user, email: s.user.email, emailVerified: s.user.emailVerified },
      };
    },

    async updateSession({ sessionToken, expires }) {
      const s = await prisma.session.update({
        where: { token: sessionToken },
        data: { expiresAt: expires },
      });
      return { sessionToken: s.token, userId: s.userId, expires: s.expiresAt };
    },

    async deleteSession(sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    },

    async createVerificationToken() { return null; },
    async useVerificationToken() { return null; },
  };
}
