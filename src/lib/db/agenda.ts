import { prisma } from '@/lib/prisma';

export async function getAgendaBlocks(gatheringId: string) {
  return prisma.agendaBlock.findMany({
    where: { gatheringId },
    orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }],
  });
}

export async function createAgendaBlock(data: {
  gatheringId: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  type: string;
  aiGenerated?: boolean;
  variant?: string;
  restaurantData?: string;
  activityData?: string;
  sortOrder?: number;
}) {
  return prisma.agendaBlock.create({
    data: {
      gatheringId: data.gatheringId,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      title: data.title,
      description: data.description,
      type: data.type,
      aiGenerated: data.aiGenerated ?? false,
      variant: data.variant,
      restaurantData: data.restaurantData,
      activityData: data.activityData,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateAgendaBlock(
  id: string,
  data: Partial<{
    day: number;
    startTime: string;
    endTime: string;
    title: string;
    description: string;
    type: string;
    aiGenerated: boolean;
    variant: string;
    restaurantData: string;
    activityData: string;
    sortOrder: number;
  }>
) {
  return prisma.agendaBlock.update({
    where: { id },
    data,
  });
}

export async function deleteAgendaBlock(id: string) {
  return prisma.agendaBlock.delete({
    where: { id },
  });
}

export async function bulkCreateAgendaBlocks(
  blocks: Array<{
    gatheringId: string;
    day: number;
    startTime: string;
    endTime: string;
    title: string;
    description?: string;
    type: string;
    aiGenerated?: boolean;
    variant?: string;
    restaurantData?: string;
    activityData?: string;
    sortOrder?: number;
  }>
) {
  return prisma.$transaction(
    blocks.map((block) =>
      prisma.agendaBlock.create({
        data: {
          gatheringId: block.gatheringId,
          day: block.day,
          startTime: block.startTime,
          endTime: block.endTime,
          title: block.title,
          description: block.description,
          type: block.type,
          aiGenerated: block.aiGenerated ?? false,
          variant: block.variant,
          restaurantData: block.restaurantData,
          activityData: block.activityData,
          sortOrder: block.sortOrder ?? 0,
        },
      })
    )
  );
}

export async function deleteAllAgendaBlocks(gatheringId: string) {
  return prisma.agendaBlock.deleteMany({
    where: { gatheringId },
  });
}
