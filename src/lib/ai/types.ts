/**
 * AI Service Types
 *
 * TypeScript interfaces for the Anthropic Claude AI integration.
 * Used across the gathering wizard (recommendations), agenda builder
 * (variant generation), and per-block AI suggest feature.
 */

export interface GatheringContext {
  type: string;            // TEAM_BONDING, STRATEGIC_ALIGNMENT, etc.
  purpose?: string;
  teamContext?: string;
  groupSize: number;       // expected/planned group size (set by organizer)
  duration: number;        // days
  location: string;
  dietarySummary?: string; // "3 vegetarian, 2 gluten-free" (anonymized) — only present if registrants exist
  venueAddress?: string;   // base venue (hotel/event space) where most sessions happen
  registrantCount?: number; // how many people have registered so far (0 = pre-registration planning)
}

export interface Recommendation {
  format: string;           // e.g., "2-day offsite with mixed work and social"
  rationale: string;        // why this format fits their purpose
  outcomes: string[];       // expected outcomes
  riskFlags: string[];      // things to watch out for
  suggestedDuration: string;
}

export interface AgendaVariant {
  variantName: string;      // "High-Energy Social", "Deep Work & Strategy", "Balanced Mix"
  variantDescription: string;
  color: string;            // "rausch", "babu", "arches"
  recommended: boolean;
  days: AgendaDay[];
}

export interface AgendaDay {
  dayNumber: number;
  blocks: AgendaBlockSuggestion[];
}

export interface AgendaBlockSuggestion {
  startTime: string;        // "9:00 AM"
  endTime: string;          // "10:00 AM"
  title: string;
  description?: string;
  type: string;             // "icebreaker", "work_session", "meal", "activity", "free_time", "travel"
  restaurant?: {
    name: string;
    cuisine: string;
    rating: number;
    price: string;
    dietary: string[];
    distance: string;
    reason: string;
  };
  activity?: {
    name: string;
    venue: string;
    duration: string;
    capacity: string;
    type: string;
    reason: string;
  };
}

export interface AgendaGenerationRequest {
  gatheringId: string;
  configuration: import('./agenda-config').AgendaConfiguration;
}

export interface BlockContext {
  gatheringType: string;
  purpose?: string;
  location: string;
  groupSize: number;
  timeSlot: string;         // "12:00 PM - 1:30 PM"
  blockType: string;        // desired type: "meal", "activity", etc.
  existingBlocks?: string;  // summary of other blocks for context
}

// ── Orchestrator Types ──────────────────────────────────────────

export interface CuratedMealPick {
  restaurant: {
    name: string;
    cuisine: string;
    rating: number;
    price: string;
    dietary: string[];
    distance: string;
  };
  mealSlot: string;
  reason: string;
  dietaryCoverage: string[];
}

export interface CuratedMeals {
  picks: CuratedMealPick[];
  reasoning: string;
  dietaryGaps: string[];
}

export interface CuratedActivityPick {
  activity: {
    name: string;
    venue: string;
    duration: string;
    capacity: string;
    type: string;
  };
  suggestedTimeOfDay: 'morning' | 'afternoon' | 'evening';
  energyLevel: 'high' | 'medium' | 'low';
  reason: string;
}

export interface CuratedActivities {
  picks: CuratedActivityPick[];
  reasoning: string;
  energyBalance: { high: number; medium: number; low: number };
}

export interface ReviewScores {
  dietaryCoverage: number;
  scheduleValidity: number;
  approachRatio: number;
  variety: number;
  inclusivity: number;
  logistics: number;
}

export interface ReviewResult {
  passed: boolean;
  overallScore: number;
  scores: ReviewScores;
  issues: string[];
  summary: string;
}

export interface OrchestratedResult {
  agenda: AgendaVariant;
  quality: ReviewResult | null;
  meals: CuratedMeals;
  activities: CuratedActivities;
  refinements: number;
}

export type ProgressEvent =
  | { phase: 'curating'; step: string; data?: Record<string, unknown> }
  | { phase: 'scheduling'; step: string }
  | { phase: 'reviewing'; step: string }
  | { phase: 'complete'; step: string; result: OrchestratedResult }
  | { phase: 'error'; step: string; message: string };
