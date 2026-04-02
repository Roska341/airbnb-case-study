import { prisma } from '@/lib/prisma';

export async function getInvitations(gatheringId: string) {
  return prisma.invitation.findMany({
    where: { gatheringId },
    include: {
      employee: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addGuest(data: {
  gatheringId: string;
  guestName: string;
  guestEmail: string;
}) {
  return prisma.invitation.create({
    data: {
      gatheringId: data.gatheringId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      status: 'NOT_INVITED',
    },
  });
}

export async function removeGuest(id: string) {
  return prisma.invitation.delete({
    where: { id },
  });
}

export async function sendInvitations(ids: string[]) {
  return prisma.$transaction(
    ids.map((id) =>
      prisma.invitation.update({
        where: { id },
        data: {
          status: 'PENDING',
          sentAt: new Date(),
        },
      })
    )
  );
}

export async function sendAllNotInvited(gatheringId: string) {
  const notInvited = await prisma.invitation.findMany({
    where: { gatheringId, status: 'NOT_INVITED' },
    select: { id: true },
  });
  if (notInvited.length === 0) return [];
  return sendInvitations(notInvited.map((i) => i.id));
}

export async function respondToInvitation(
  id: string,
  status: 'ACCEPTED' | 'DECLINED'
) {
  return prisma.invitation.update({
    where: { id },
    data: {
      status,
      respondedAt: new Date(),
    },
  });
}

export async function getInvitationsByUser(userId: string) {
  return prisma.invitation.findMany({
    where: { employeeId: userId },
    include: {
      gathering: {
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { sentAt: 'desc' },
  });
}

export async function linkGuestToUser(guestEmail: string, gatheringId: string, userId: string) {
  return prisma.invitation.updateMany({
    where: { gatheringId, guestEmail, employeeId: null },
    data: { employeeId: userId },
  });
}
