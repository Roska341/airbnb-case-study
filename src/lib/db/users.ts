import { prisma } from '@/lib/prisma';

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function upsertUser(data: {
  email: string;
  name: string;
  role: string;
  oktaId?: string;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: data.role,
      oktaId: data.oktaId,
    },
    create: {
      email: data.email,
      name: data.name,
      role: data.role,
      oktaId: data.oktaId,
    },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
}
