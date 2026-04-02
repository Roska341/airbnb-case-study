import { prisma } from '@/lib/prisma';

export async function getSwagOrders(gatheringId: string) {
  return prisma.swagOrder.findMany({
    where: { gatheringId },
    include: {
      orderedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createSwagOrder(data: {
  gatheringId: string;
  orderedById: string;
  items: string;
  totalCost: number;
  status?: string;
}) {
  return prisma.swagOrder.create({
    data: {
      gatheringId: data.gatheringId,
      orderedById: data.orderedById,
      items: data.items,
      totalCost: data.totalCost,
      status: data.status ?? 'PENDING',
    },
    include: {
      orderedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function updateSwagOrderStatus(id: string, status: string) {
  return prisma.swagOrder.update({
    where: { id },
    data: { status },
  });
}
