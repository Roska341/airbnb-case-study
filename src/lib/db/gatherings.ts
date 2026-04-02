import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

export async function getGatherings(options?: {
  userId?: string;
  role?: string;
}) {
  const where: Prisma.GatheringWhereInput = {};

  if (options?.role === 'MANAGER' && options.userId) {
    where.createdById = options.userId;
  } else if (options?.role === 'EMPLOYEE' && options.userId) {
    where.invitations = {
      some: { employeeId: options.userId },
    };
  }
  // ADMIN sees all — no filter

  return prisma.gathering.findMany({
    where,
    include: {
      createdBy: true,
      moduleStatuses: true,
      budget_detail: true,
      invitations: options?.role === 'EMPLOYEE' && options.userId
        ? {
            where: { employeeId: options.userId },
            select: {
              id: true,
              status: true,
              gatheringId: true,
              gathering: {
                select: {
                  createdBy: { select: { name: true } },
                },
              },
            },
          }
        : false,
      _count: {
        select: {
          invitations: true,
          registrations: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGatheringById(id: string) {
  return prisma.gathering.findUnique({
    where: { id },
    include: {
      createdBy: true,
      moduleStatuses: true,
      budget_detail: true,
      _count: {
        select: {
          invitations: true,
          registrations: true,
        },
      },
    },
  });
}

export async function createGathering(data: {
  title: string;
  purpose?: string;
  type: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  groupSize: number;
  budget?: number;
  status?: string;
  teamContext?: string;
  duration?: number;
  dailyStartTime?: string;
  dailyEndTime?: string;
  createdById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const gathering = await tx.gathering.create({
      data: {
        title: data.title,
        purpose: data.purpose,
        type: data.type,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        groupSize: data.groupSize,
        budget: data.budget,
        status: data.status ?? 'DRAFT',
        teamContext: data.teamContext,
        duration: data.duration,
        dailyStartTime: data.dailyStartTime,
        dailyEndTime: data.dailyEndTime,
        createdById: data.createdById,
      },
    });

    await tx.moduleStatus.createMany({
      data: ['agenda', 'accommodation', 'swag', 'invitations', 'equipment'].map(
        (module) => ({
          gatheringId: gathering.id,
          module,
          status: 'pending',
        })
      ),
    });

    await tx.budget.create({
      data: {
        gatheringId: gathering.id,
      },
    });

    return tx.gathering.findUnique({
      where: { id: gathering.id },
      include: {
        createdBy: true,
        moduleStatuses: true,
        budget_detail: true,
        _count: {
          select: {
            invitations: true,
            registrations: true,
          },
        },
      },
    });
  });
}

export async function updateGathering(
  id: string,
  data: Prisma.GatheringUpdateInput
) {
  return prisma.gathering.update({
    where: { id },
    data,
    include: {
      createdBy: true,
      moduleStatuses: true,
      budget_detail: true,
      _count: {
        select: {
          invitations: true,
          registrations: true,
        },
      },
    },
  });
}

export async function deleteGathering(id: string) {
  return prisma.gathering.delete({
    where: { id },
  });
}

export async function updateModuleStatus(
  gatheringId: string,
  module: string,
  status: string
) {
  return prisma.moduleStatus.update({
    where: {
      gatheringId_module: { gatheringId, module },
    },
    data: { status },
  });
}

export async function updateBudget(
  gatheringId: string,
  data: Partial<{
    accommodation: number;
    food: number;
    activities: number;
    swag: number;
    travel: number;
  }>
) {
  return prisma.budget.update({
    where: { gatheringId },
    data,
  });
}
