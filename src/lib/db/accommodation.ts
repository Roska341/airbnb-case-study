import { prisma } from '@/lib/prisma';

export async function getAccommodations(gatheringId: string) {
  return prisma.accommodation.findMany({
    where: { gatheringId },
    include: {
      bookedBy: {
        select: { id: true, name: true, email: true },
      },
      bookedFor: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAccommodation(data: {
  gatheringId: string;
  airbnbListingId?: string;
  title: string;
  address?: string;
  pricePerNight: number;
  imageUrl?: string;
  checkIn: Date;
  checkOut: Date;
  bookedById: string;
  bookedForId?: string;
  passkeyConfirmation?: string;
  bookingType?: string;
}) {
  return prisma.accommodation.create({
    data: {
      gatheringId: data.gatheringId,
      airbnbListingId: data.airbnbListingId,
      title: data.title,
      address: data.address,
      pricePerNight: data.pricePerNight,
      imageUrl: data.imageUrl,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      bookedById: data.bookedById,
      bookedForId: data.bookedForId,
      passkeyConfirmation: data.passkeyConfirmation,
      bookingType: data.bookingType ?? 'INDIVIDUAL',
    },
    include: {
      bookedBy: {
        select: { id: true, name: true, email: true },
      },
      bookedFor: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function deleteAccommodation(id: string) {
  return prisma.accommodation.delete({
    where: { id },
  });
}
