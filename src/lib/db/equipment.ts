import { prisma } from '@/lib/prisma';

export async function getEquipmentItems(gatheringId: string) {
  return prisma.equipmentItem.findMany({
    where: { gatheringId },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });
}

export async function createEquipmentItem(data: {
  gatheringId: string;
  category: string;
  name: string;
  quantity?: number;
  unitCost?: number;
  priority?: string;
  status?: string;
  vendorNotes?: string;
  sortOrder?: number;
}) {
  return prisma.equipmentItem.create({
    data: {
      gatheringId: data.gatheringId,
      category: data.category,
      name: data.name,
      quantity: data.quantity ?? 1,
      unitCost: data.unitCost ?? 0,
      priority: data.priority ?? 'essential',
      status: data.status ?? 'needed',
      vendorNotes: data.vendorNotes,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateEquipmentItem(
  id: string,
  data: Partial<{
    quantity: number;
    unitCost: number;
    status: string;
    vendorNotes: string;
    priority: string;
    name: string;
    category: string;
  }>
) {
  return prisma.equipmentItem.update({
    where: { id },
    data,
  });
}

export async function deleteEquipmentItem(id: string) {
  return prisma.equipmentItem.delete({
    where: { id },
  });
}

export async function deleteAllEquipmentItems(gatheringId: string) {
  return prisma.equipmentItem.deleteMany({
    where: { gatheringId },
  });
}

export async function bulkCreateEquipmentItems(
  items: Array<{
    gatheringId: string;
    category: string;
    name: string;
    quantity?: number;
    unitCost?: number;
    priority?: string;
    status?: string;
    sortOrder?: number;
  }>
) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.equipmentItem.create({
        data: {
          gatheringId: item.gatheringId,
          category: item.category,
          name: item.name,
          quantity: item.quantity ?? 1,
          unitCost: item.unitCost ?? 0,
          priority: item.priority ?? 'essential',
          status: item.status ?? 'needed',
          sortOrder: item.sortOrder ?? 0,
        },
      })
    )
  );
}
