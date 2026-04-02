import 'dotenv/config';
import path from 'node:path';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// The DATABASE_URL "file:./dev.db" is relative to the prisma/ directory for Prisma CLI
// but the actual db file lives at the project root for db push/migrate commands.
// We resolve it to the project root where the actual database file is.
const absoluteDbPath = path.resolve(process.cwd(), 'dev.db');

const adapter = new PrismaLibSql({ url: `file:${absoluteDbPath}` });

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clear all tables in correct order (respecting FK constraints)
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.swagOrder.deleteMany();
  await prisma.accommodation.deleteMany();
  await prisma.registrationQuestion.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.equipmentItem.deleteMany();
  await prisma.agendaBlock.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.moduleStatus.deleteMany();
  await prisma.gathering.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────────
  console.log('Creating users...');

  const sarah = await prisma.user.create({
    data: {
      id: 'user-sarah',
      name: 'Sarah Chen',
      email: 'sarah.chen@airbnb.com',
      role: 'MANAGER',
    },
  });

  const alex = await prisma.user.create({
    data: {
      id: 'user-alex',
      name: 'Alex Rivera',
      email: 'alex.r@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const jordan = await prisma.user.create({
    data: {
      id: 'user-jordan',
      name: 'Jordan Lee',
      email: 'jordan.lee@airbnb.com',
      role: 'ADMIN',
    },
  });

  // Additional users from the invitee list (Gathering 1)
  const marcus = await prisma.user.create({
    data: {
      id: 'user-marcus',
      name: 'Marcus Johnson',
      email: 'marcus.j@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const priya = await prisma.user.create({
    data: {
      id: 'user-priya',
      name: 'Priya Patel',
      email: 'priya.p@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const david = await prisma.user.create({
    data: {
      id: 'user-david',
      name: 'David Kim',
      email: 'david.kim@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const elena = await prisma.user.create({
    data: {
      id: 'user-elena',
      name: 'Elena Rodriguez',
      email: 'elena.r@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const james = await prisma.user.create({
    data: {
      id: 'user-james',
      name: 'James Wright',
      email: 'james.w@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const aisha = await prisma.user.create({
    data: {
      id: 'user-aisha',
      name: 'Aisha Thompson',
      email: 'aisha.t@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  const ryan = await prisma.user.create({
    data: {
      id: 'user-ryan',
      name: "Ryan O'Brien",
      email: 'ryan.ob@airbnb.com',
      role: 'EMPLOYEE',
    },
  });

  console.log(`  Created ${10} users`);

  // ── Gatherings ─────────────────────────────────────────────────────────
  console.log('Creating gatherings...');

  const gathering1 = await prisma.gathering.create({
    data: {
      id: '1',
      title: 'Q2 Engineering Offsite — Building Bridges',
      type: 'TEAM_BONDING',
      location: 'Austin, TX',
      startDate: new Date('2026-05-12'),
      endDate: new Date('2026-05-14'),
      groupSize: 18,
      status: 'ACTIVE',
      dailyStartTime: '8:00 AM',
      dailyEndTime: '9:00 PM',
      createdById: sarah.id,
    },
  });

  const gathering2 = await prisma.gathering.create({
    data: {
      id: '2',
      title: 'Product Strategy Alignment 2026',
      type: 'STRATEGIC_ALIGNMENT',
      location: 'San Francisco, CA',
      startDate: new Date('2026-06-03'),
      endDate: new Date('2026-06-04'),
      groupSize: 25,
      status: 'DRAFT',
      dailyStartTime: '9:00 AM',
      dailyEndTime: '6:00 PM',
      createdById: sarah.id,
    },
  });

  const gathering3 = await prisma.gathering.create({
    data: {
      id: '3',
      title: 'Design Team Celebration',
      type: 'SOCIAL',
      location: 'New York, NY',
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-20'),
      groupSize: 12,
      status: 'COMPLETED',
      dailyStartTime: '6:00 PM',
      dailyEndTime: '11:00 PM',
      createdById: sarah.id,
    },
  });

  const gathering4 = await prisma.gathering.create({
    data: {
      id: '4',
      title: 'Q3 Product Kickoff',
      type: 'STRATEGIC_ALIGNMENT',
      location: 'Seattle, WA',
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-12'),
      groupSize: 30,
      status: 'ACTIVE',
      dailyStartTime: '8:00 AM',
      dailyEndTime: '9:00 PM',
      createdById: sarah.id,
    },
  });

  console.log(`  Created 4 gatherings`);

  // ── Module Statuses ────────────────────────────────────────────────────
  console.log('Creating module statuses...');

  const moduleStatusData = [
    // Gathering 1
    { gatheringId: '1', module: 'agenda', status: 'in_progress' },
    { gatheringId: '1', module: 'accommodation', status: 'pending' },
    { gatheringId: '1', module: 'swag', status: 'pending' },
    { gatheringId: '1', module: 'invitations', status: 'in_progress' },
    { gatheringId: '1', module: 'equipment', status: 'pending' },
    // Gathering 2 — all pending
    { gatheringId: '2', module: 'agenda', status: 'pending' },
    { gatheringId: '2', module: 'accommodation', status: 'pending' },
    { gatheringId: '2', module: 'swag', status: 'pending' },
    { gatheringId: '2', module: 'invitations', status: 'pending' },
    { gatheringId: '2', module: 'equipment', status: 'pending' },
    // Gathering 3 — all complete
    { gatheringId: '3', module: 'agenda', status: 'complete' },
    { gatheringId: '3', module: 'accommodation', status: 'complete' },
    { gatheringId: '3', module: 'swag', status: 'complete' },
    { gatheringId: '3', module: 'invitations', status: 'complete' },
    { gatheringId: '3', module: 'equipment', status: 'complete' },
    // Gathering 4 — all pending
    { gatheringId: '4', module: 'agenda', status: 'pending' },
    { gatheringId: '4', module: 'accommodation', status: 'pending' },
    { gatheringId: '4', module: 'swag', status: 'pending' },
    { gatheringId: '4', module: 'invitations', status: 'pending' },
    { gatheringId: '4', module: 'equipment', status: 'pending' },
  ];

  for (const ms of moduleStatusData) {
    await prisma.moduleStatus.create({ data: ms });
  }

  console.log(`  Created ${moduleStatusData.length} module statuses`);

  // ── Budgets ────────────────────────────────────────────────────────────
  console.log('Creating budgets...');

  await prisma.budget.createMany({
    data: [
      { gatheringId: '1', accommodation: 3400, food: 2700, activities: 1200, swag: 850, travel: 5400 },
      { gatheringId: '2', accommodation: 0, food: 0, activities: 0, swag: 0, travel: 0 },
      { gatheringId: '3', accommodation: 2800, food: 1500, activities: 600, swag: 400, travel: 3000 },
      { gatheringId: '4', accommodation: 0, food: 0, activities: 0, swag: 0, travel: 0 },
    ],
  });

  console.log('  Created 4 budgets');

  // ── Invitations for Gathering 1 ───────────────────────────────────────
  console.log('Creating invitations...');

  const invitationData = [
    { id: 'inv-g1-sarah', gatheringId: '1', employeeId: sarah.id, guestName: 'Sarah Chen', guestEmail: 'sarah.chen@airbnb.com', status: 'ACCEPTED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
    { id: 'inv-g1-marcus', gatheringId: '1', employeeId: marcus.id, guestName: 'Marcus Johnson', guestEmail: 'marcus.j@airbnb.com', status: 'ACCEPTED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
    { id: 'inv-g1-priya', gatheringId: '1', employeeId: priya.id, guestName: 'Priya Patel', guestEmail: 'priya.p@airbnb.com', status: 'PENDING', sentAt: new Date('2026-03-30'), respondedAt: null },
    { id: 'inv-g1-david', gatheringId: '1', employeeId: david.id, guestName: 'David Kim', guestEmail: 'david.kim@airbnb.com', status: 'ACCEPTED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
    { id: 'inv-g1-elena', gatheringId: '1', employeeId: elena.id, guestName: 'Elena Rodriguez', guestEmail: 'elena.r@airbnb.com', status: 'DECLINED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
    { id: 'inv-g1-james', gatheringId: '1', employeeId: james.id, guestName: 'James Wright', guestEmail: 'james.w@airbnb.com', status: 'ACCEPTED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
    { id: 'inv-g1-aisha', gatheringId: '1', employeeId: aisha.id, guestName: 'Aisha Thompson', guestEmail: 'aisha.t@airbnb.com', status: 'ACCEPTED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
    { id: 'inv-g1-ryan', gatheringId: '1', employeeId: ryan.id, guestName: "Ryan O'Brien", guestEmail: 'ryan.ob@airbnb.com', status: 'ACCEPTED', sentAt: new Date('2026-03-30'), respondedAt: new Date('2026-04-01') },
  ];

  for (const inv of invitationData) {
    await prisma.invitation.create({ data: inv });
  }

  // Invitation for Gathering 4 — Alex Rivera invited by Sarah
  await prisma.invitation.create({
    data: {
      id: 'inv-g4-alex',
      gatheringId: '4',
      employeeId: alex.id,
      guestName: 'Alex Rivera',
      guestEmail: 'alex.r@airbnb.com',
      status: 'PENDING',
      sentAt: new Date('2026-04-01'),
    },
  });

  console.log(`  Created ${invitationData.length + 1} invitations`);

  // ── Registrations for accepted invitees (Gathering 1) ──────────────────
  console.log('Creating registrations...');

  const registrationData = [
    { gatheringId: '1', userId: sarah.id, invitationId: 'inv-g1-sarah', dietaryRestrictions: 'Vegetarian', tshirtSize: 'M', travelOriginCity: 'San Francisco, CA' },
    { gatheringId: '1', userId: marcus.id, invitationId: 'inv-g1-marcus', dietaryRestrictions: 'None', tshirtSize: 'L', travelOriginCity: 'Austin, TX' },
    { gatheringId: '1', userId: david.id, invitationId: 'inv-g1-david', dietaryRestrictions: 'None', tshirtSize: 'L', travelOriginCity: 'Seattle, WA' },
    { gatheringId: '1', userId: james.id, invitationId: 'inv-g1-james', dietaryRestrictions: 'Nut Allergy', tshirtSize: 'XL', travelOriginCity: 'Portland, OR' },
    { gatheringId: '1', userId: aisha.id, invitationId: 'inv-g1-aisha', dietaryRestrictions: 'Halal', tshirtSize: 'M', travelOriginCity: 'Chicago, IL' },
    { gatheringId: '1', userId: ryan.id, invitationId: 'inv-g1-ryan', dietaryRestrictions: 'None', tshirtSize: 'L', travelOriginCity: 'Denver, CO' },
  ];

  for (const reg of registrationData) {
    await prisma.registration.create({ data: reg });
  }

  console.log(`  Created ${registrationData.length} registrations`);

  // ── Notifications ──────────────────────────────────────────────────────
  console.log('Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        id: 'notif-1',
        userId: sarah.id,
        message: '3 new RSVPs for Q2 Engineering Offsite',
        type: 'update',
        read: false,
        gatheringId: '1',
        createdAt: new Date('2026-03-31'),
      },
      {
        id: 'notif-2',
        userId: sarah.id,
        message: 'Agenda Builder is ready for review',
        type: 'reminder',
        read: false,
        gatheringId: '1',
        createdAt: new Date('2026-03-30'),
      },
      {
        id: 'notif-3',
        userId: alex.id,
        message: "You've been invited to Q3 Product Kickoff",
        type: 'invitation',
        read: false,
        gatheringId: '4',
        createdAt: new Date('2026-03-29'),
      },
    ],
  });

  console.log('  Created 3 notifications');

  // ── Agenda Blocks for Gathering 1 ──────────────────────────────────────
  console.log('Creating agenda blocks...');

  const agendaBlocks = [
    // Day 1 — Arrive & Connect
    {
      gatheringId: '1',
      day: 1,
      startTime: '2:00 PM',
      endTime: '3:00 PM',
      title: 'Check-in & Welcome',
      type: 'FREE_TIME',
      description: 'Arrive at the venue, settle in, grab a welcome drink',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 0,
    },
    {
      gatheringId: '1',
      day: 1,
      startTime: '3:00 PM',
      endTime: '4:00 PM',
      title: 'The Map of Me',
      type: 'ICEBREAKER',
      description: 'Each person draws a \'map\' of their life journey and shares with a small group.',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 1,
    },
    {
      gatheringId: '1',
      day: 1,
      startTime: '4:00 PM',
      endTime: '5:30 PM',
      title: 'Team Retrospective',
      type: 'WORK_SESSION',
      description: "Facilitated retro covering the last quarter's wins, challenges, and learnings",
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 2,
    },
    {
      gatheringId: '1',
      day: 1,
      startTime: '6:30 PM',
      endTime: '8:30 PM',
      title: 'Welcome Dinner',
      type: 'MEAL',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 3,
      restaurantData: JSON.stringify({
        name: 'Suerte',
        cuisine: 'Mexican',
        rating: 4.7,
        price: '$$$',
        dietary: ['Vegetarian options', 'Gluten-free options'],
        distance: '0.8 mi',
        reason: 'Acclaimed East Austin restaurant with communal tables perfect for team dining.',
      }),
    },
    // Day 2 — Deep Work
    {
      gatheringId: '1',
      day: 2,
      startTime: '8:00 AM',
      endTime: '9:00 AM',
      title: 'Breakfast',
      type: 'MEAL',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 0,
      restaurantData: JSON.stringify({
        name: "Jo's Coffee",
        cuisine: 'Cafe/Breakfast',
        rating: 4.5,
        price: '$',
        dietary: ['Vegan options', 'Gluten-free options'],
        distance: '0.3 mi',
        reason: 'Iconic Austin cafe with great outdoor seating.',
      }),
    },
    {
      gatheringId: '1',
      day: 2,
      startTime: '9:00 AM',
      endTime: '12:00 PM',
      title: 'Strategic Planning',
      type: 'WORK_SESSION',
      description: 'Breakout groups of 5-6 map Q3 priorities and cross-team dependencies.',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 1,
    },
    {
      gatheringId: '1',
      day: 2,
      startTime: '12:00 PM',
      endTime: '1:30 PM',
      title: 'Lunch',
      type: 'MEAL',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 2,
      restaurantData: JSON.stringify({
        name: 'Loro',
        cuisine: 'Asian Smokehouse',
        rating: 4.6,
        price: '$$',
        dietary: ['Vegetarian options'],
        distance: '1.2 mi',
        reason: 'James Beard-nominated fusion spot with large outdoor patio.',
      }),
    },
    {
      gatheringId: '1',
      day: 2,
      startTime: '1:30 PM',
      endTime: '3:30 PM',
      title: 'Hackathon Sprint',
      type: 'WORK_SESSION',
      description: 'Cross-functional teams prototype one bold idea in 2 hours.',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 3,
    },
    {
      gatheringId: '1',
      day: 2,
      startTime: '4:00 PM',
      endTime: '6:00 PM',
      title: 'Lady Bird Lake Kayaking',
      type: 'ACTIVITY',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 4,
      activityData: JSON.stringify({
        name: 'Group Kayaking',
        venue: 'Rowing Dock',
        duration: '2 hours',
        capacity: 'Up to 30',
        type: 'Outdoor/Active',
        reason: 'Iconic Austin experience. Tandem kayaks naturally pair people up for conversation.',
      }),
    },
    {
      gatheringId: '1',
      day: 2,
      startTime: '7:00 PM',
      endTime: '9:00 PM',
      title: 'Team Dinner',
      type: 'MEAL',
      aiGenerated: true,
      variant: 'Balanced Mix',
      sortOrder: 5,
      restaurantData: JSON.stringify({
        name: 'Uchi',
        cuisine: 'Japanese',
        rating: 4.8,
        price: '$$$$',
        dietary: ['Vegetarian options', 'GF options'],
        distance: '1.5 mi',
        reason: 'World-class Japanese restaurant. Omakase-style sharing works perfectly.',
      }),
    },
  ];

  for (const block of agendaBlocks) {
    await prisma.agendaBlock.create({ data: block });
  }

  console.log(`  Created ${agendaBlocks.length} agenda blocks`);

  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
