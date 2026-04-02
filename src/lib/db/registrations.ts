import { prisma } from '@/lib/prisma';

export async function getRegistrations(gatheringId: string) {
  return prisma.registration.findMany({
    where: { gatheringId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRegistration(data: {
  gatheringId: string;
  userId: string;
  invitationId?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  travelOriginCity?: string;
  tshirtSize?: string;
  additionalNotes?: string;
  needsLodging?: boolean;
  customResponses?: string;
}) {
  return prisma.registration.create({
    data: {
      gatheringId: data.gatheringId,
      userId: data.userId,
      invitationId: data.invitationId,
      dietaryRestrictions: data.dietaryRestrictions,
      accessibilityNeeds: data.accessibilityNeeds,
      travelOriginCity: data.travelOriginCity,
      tshirtSize: data.tshirtSize,
      additionalNotes: data.additionalNotes,
      needsLodging: data.needsLodging ?? false,
      customResponses: data.customResponses,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getRegistrationStats(gatheringId: string) {
  const registrations = await prisma.registration.findMany({
    where: { gatheringId },
  });

  const total = registrations.length;

  const dietaryBreakdown: Record<string, number> = {};
  const tshirtSizeCounts: Record<string, number> = {};
  const cities: Record<string, number> = {};
  let needsLodgingCount = 0;

  for (const reg of registrations) {
    if (reg.dietaryRestrictions) {
      dietaryBreakdown[reg.dietaryRestrictions] =
        (dietaryBreakdown[reg.dietaryRestrictions] ?? 0) + 1;
    }

    if (reg.tshirtSize) {
      tshirtSizeCounts[reg.tshirtSize] =
        (tshirtSizeCounts[reg.tshirtSize] ?? 0) + 1;
    }

    if (reg.travelOriginCity) {
      cities[reg.travelOriginCity] =
        (cities[reg.travelOriginCity] ?? 0) + 1;
    }

    if (reg.needsLodging) {
      needsLodgingCount++;
    }
  }

  return {
    total,
    dietaryBreakdown,
    tshirtSizeCounts,
    cities,
    needsLodgingCount,
  };
}
