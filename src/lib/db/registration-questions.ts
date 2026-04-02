import { prisma } from '@/lib/prisma';

const DEFAULT_QUESTIONS = [
  { label: 'Dietary Restrictions', type: 'multiple_choice', options: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut Allergy', 'Dairy-Free', 'Halal', 'Kosher', 'None', 'Other']), required: true, sortOrder: 1 },
  { label: 'T-Shirt Size', type: 'multiple_choice', options: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']), required: true, sortOrder: 2 },
  { label: 'Travel Origin City', type: 'text', options: null, required: true, sortOrder: 3 },
  { label: 'Need Lodging?', type: 'multiple_choice', options: JSON.stringify(['Yes', 'No']), required: true, sortOrder: 4 },
  { label: 'Additional Notes / Accessibility Needs', type: 'text', options: null, required: false, sortOrder: 5 },
];

export async function getRegistrationQuestions(gatheringId: string) {
  const questions = await prisma.registrationQuestion.findMany({
    where: { gatheringId },
    orderBy: { sortOrder: 'asc' },
  });

  // Seed defaults if none exist
  if (questions.length === 0) {
    return seedDefaultQuestions(gatheringId);
  }

  return questions;
}

export async function seedDefaultQuestions(gatheringId: string) {
  const created = await prisma.$transaction(
    DEFAULT_QUESTIONS.map((q) =>
      prisma.registrationQuestion.create({
        data: {
          gatheringId,
          label: q.label,
          type: q.type,
          options: q.options,
          required: q.required,
          visible: true,
          isDefault: true,
          sortOrder: q.sortOrder,
        },
      })
    )
  );
  return created;
}

export async function updateQuestionVisibility(id: string, visible: boolean) {
  return prisma.registrationQuestion.update({
    where: { id },
    data: { visible },
  });
}

export async function addCustomQuestion(data: {
  gatheringId: string;
  label: string;
  type: 'text' | 'multiple_choice';
  options?: string[];
  required: boolean;
}) {
  const maxOrder = await prisma.registrationQuestion.aggregate({
    where: { gatheringId: data.gatheringId },
    _max: { sortOrder: true },
  });

  return prisma.registrationQuestion.create({
    data: {
      gatheringId: data.gatheringId,
      label: data.label,
      type: data.type,
      options: data.options ? JSON.stringify(data.options) : null,
      required: data.required,
      visible: true,
      isDefault: false,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function deleteCustomQuestion(id: string) {
  return prisma.registrationQuestion.delete({
    where: { id },
  });
}

export async function updateRegistrationForm(
  gatheringId: string,
  updates: Array<{ id: string; visible: boolean }>
) {
  return prisma.$transaction(
    updates.map((u) =>
      prisma.registrationQuestion.update({
        where: { id: u.id },
        data: { visible: u.visible },
      })
    )
  );
}
