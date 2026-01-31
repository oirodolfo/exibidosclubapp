import { prisma } from "@exibidos/db/client";

type NotificationType = "feed_like" | "feed_comment" | "category_vote";

export async function createNotification(
  userId: string,
  type: NotificationType,
  entityType: string,
  entityId: string,
  meta: { actorId: string; imageId: string; [k: string]: unknown }
): Promise<void> {
  if (userId === meta.actorId) return;
  await prisma.notification.create({
    data: {
      userId,
      type,
      entityType,
      entityId,
      meta: meta as object,
    },
  });
}
