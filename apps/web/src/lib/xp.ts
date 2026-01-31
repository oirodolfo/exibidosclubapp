import { prisma } from "@exibidos/db/client";

const XP_PER_LEVEL = 100;

export async function awardXp(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: amount } },
    select: { xp: true },
  });
  const level = Math.floor(user.xp / XP_PER_LEVEL) + 1;
  await prisma.user.update({
    where: { id: userId },
    data: { level },
  });
}
