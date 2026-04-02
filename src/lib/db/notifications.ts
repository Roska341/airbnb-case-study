import { prisma } from '@/lib/prisma';

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    include: {
      gathering: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createNotification(data: {
  userId: string;
  message: string;
  type: string;
  gatheringId?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      message: data.message,
      type: data.type,
      gatheringId: data.gatheringId,
    },
  });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
