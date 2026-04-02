# Gatherins - AI-Powered Gathering Planning Tool

An internal tool for Airbnb employees that makes planning team gatherings (offsites, working sessions, team-building events) easy and intentional. It replaces the current fragmented process -- spreadsheets, Slack, email, tribal knowledge -- with a single guided platform.

**Core idea:** Purpose-first gathering planning with an AI copilot. Managers articulate *why* they're gathering before *how*, and AI generates structured recommendations (agendas, restaurant picks, activities) grounded in curated city data.

Built as an interview case study prototype.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Database | SQLite via Prisma ORM + LibSQL adapter |
| AI | Anthropic Claude SDK (multi-specialist orchestration) |
| Auth | NextAuth v5 (credentials provider) |
| Animations | Motion (Framer Motion) |
| Icons | Lucide React |

## Features

- **Gathering Creation** -- 4-step wizard: type, purpose, details, review
- **AI Agenda Builder** -- Multi-specialist pipeline (restaurant curator, activity planner, schedule architect, quality reviewer) with streaming progress and quality gates
- **Invitations & RSVP** -- Guest list management with status tracking
- **Registration** -- Dynamic forms with default + custom questions, dietary/t-shirt/travel data collection
- **Accommodation** -- Browse Airbnb-style listings by city, book for team or individuals
- **Swag Ordering** -- Catalog browsing with cart, size selection, order tracking
- **Equipment & Vendors** -- Smart wizard suggesting items based on gathering type and group size
- **Dashboard** -- Role-based views (Manager, Employee, Admin) with search/filter
- **Budget Tracking** -- Aggregated breakdown across modules

## Prerequisites

- **Node.js** >= 18
- **npm** (comes with Node.js)
- **Anthropic API key** -- Get one at [console.anthropic.com](https://console.anthropic.com/)

## Getting Started

### 1. Clone and install

```bash
git clone git@github.com:Roska341/airbnb-case-study.git
cd airbnb-case-study
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the values:

```env
# Prisma -- SQLite (works out of the box)
DATABASE_URL="file:./dev.db"

# NextAuth -- generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic Claude AI -- required for agenda generation
ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

This creates the SQLite database, generates the Prisma client, and seeds it with demo data:
- **10 users** (1 manager, 1 admin, 8 employees)
- **4 gatherings** in various states (draft, active, completed)
- **Invitations, registrations, agenda blocks, equipment, notifications**

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts

Log in with any of these emails (no password required in prototype mode):

| Email | Role | Description |
|-------|------|-------------|
| `sarah.chen@airbnb.com` | Manager | Has 4 gatherings, sees full planning dashboard |
| `alex.r@airbnb.com` | Employee | Has a pending invitation to Q3 Kickoff |
| `jordan.lee@airbnb.com` | Admin | Full access across all gatherings |

## Project Structure

```
src/
  app/
    (app)/              # Authenticated app routes
      dashboard/        # Main dashboard (role-based)
      gathering/[id]/   # Gathering hub + modules
        agenda/         # AI agenda builder
        accommodation/  # Airbnb listing browser
        invite/         # Guest list management
        register/       # Registration form
        swag/           # Swag ordering
        vendors/        # Equipment management
    (auth)/             # Auth routes (login)
    api/                # API routes
      ai/               # AI endpoints (agenda generation, recommendations)
      airbnb/           # Listing/booking endpoints
      gatherings/       # CRUD + module endpoints
  components/           # Shared UI components
  context/              # React contexts (Auth, Toast)
  data/mock/            # City-specific restaurant/activity/listing data
  lib/
    ai/                 # AI orchestrator, specialists, prompts
    db/                 # Prisma data access layer
  types/                # TypeScript type definitions
prisma/
  schema.prisma         # Database schema
  seed.ts               # Seed script with demo data
```

## How the AI Works

The agenda builder uses a **multi-specialist orchestration** pattern:

1. **Restaurant Curator** + **Activity Planner** run in parallel, filtering curated city data by preferences
2. **Schedule Architect** assembles a time-blocked agenda respecting work/social ratios
3. **Quality Reviewer** scores the agenda on completeness, variety, and dietary compliance
4. If quality fails, a **refinement loop** (up to 2 iterations) fixes specific issues

Three predefined approaches: Deep Work (80/20 work), High-Energy Social (20/80 work), Balanced Mix (60/40).

City data is available for: **Austin, San Francisco, New York, Seattle**.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npx prisma studio` | Visual database browser |
| `npx prisma db seed` | Re-seed the database |

## Notes

- This is a **prototype** built for an interview case study. Auth uses a credentials provider (email-only, no password) for easy demo access.
- AI features require a valid `ANTHROPIC_API_KEY`. Without it, the agenda builder falls back to pre-built mock agendas.
- The database is SQLite (file-based) -- no external database server needed.
