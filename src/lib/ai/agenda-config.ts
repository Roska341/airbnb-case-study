/**
 * Agenda Configuration
 *
 * Static approach definitions, configuration types, and gathering-type
 * defaults for the redesigned agenda builder wizard.
 *
 * The 3 approaches are pre-defined options (not AI-generated).
 * Users select one, then configure preferences that feed into
 * a single AI call for tailored agenda generation.
 */

// ── Approach Types ───────────────────────────────────────────────

export type ApproachId = 'high_energy_social' | 'deep_work_strategy' | 'balanced_mix';

export interface ApproachDefinition {
  id: ApproachId;
  name: string;
  tagline: string;
  description: string;
  color: 'rausch' | 'babu' | 'arches';
  icon: string;
  highlights: string[];
  workSocialRatio: string;
  aiInstruction: string;
}

// ── Configuration Types ──────────────────────────────────────────

export type CuisinePreference =
  | 'local_specialty'
  | 'international'
  | 'american'
  | 'asian'
  | 'italian'
  | 'mexican'
  | 'no_preference';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type DiningStyle = 'group_friendly' | 'casual' | 'fine_dining';

export type ActivityType = 'outdoor' | 'indoor' | 'cultural' | 'creative' | 'wellness';

export type EnergyLevel = 'low' | 'medium' | 'high';

export interface AgendaConfiguration {
  approachId: ApproachId;

  food: {
    cuisinePreferences: CuisinePreference[];
    priceRange: PriceRange[];
    diningStyle: DiningStyle[];
  };

  activities: {
    typePreferences: ActivityType[];
    energyLevel: EnergyLevel;
  };

  proximity: {
    prioritizeNearHotel: boolean;
    accommodationAddress?: string;
  };

  schedule: {
    startTimePreference: string;
    endTimePreference: string;
    includeBreakfast: boolean;
  };
}

// ── Gathering Types ──────────────────────────────────────────────

export type GatheringType =
  | 'TEAM_BONDING'
  | 'STRATEGIC_ALIGNMENT'
  | 'PROBLEM_SOLVING'
  | 'SOCIAL'
  | 'TEAM_OFFSITE'
  | 'COMPANY_OFFSITE'
  | 'CUSTOM';

// ── Static Approach Definitions ──────────────────────────────────

export const APPROACHES: ApproachDefinition[] = [
  {
    id: 'high_energy_social',
    name: 'High-Energy Social',
    tagline: 'Build relationships first',
    description:
      'Lead with team bonding and social activities to build trust and psychological safety before diving into any work.',
    color: 'rausch',
    icon: 'Zap',
    highlights: [
      'Team bonding activities',
      'Casual group dining',
      'Outdoor adventures',
      'Icebreakers & social games',
    ],
    workSocialRatio: '20/80',
    aiInstruction:
      'Focus heavily on team bonding, icebreakers, outdoor activities, and casual group meals. Minimize formal work sessions to at most 2 hours per day. Choose high-energy activities and lively restaurants with communal seating.',
  },
  {
    id: 'deep_work_strategy',
    name: 'Deep Work & Strategy',
    tagline: 'Maximize focused collaboration',
    description:
      'Structured around extended focus blocks, strategic discussions, and quiet dinners that keep the momentum going.',
    color: 'babu',
    icon: 'Brain',
    highlights: [
      'Extended work sessions',
      'Structured breaks',
      'Quiet dining venues',
      'Minimal distractions',
    ],
    workSocialRatio: '80/20',
    aiInstruction:
      'Maximize focused work sessions (3-4 hour blocks), structured breaks, and quiet dinners suitable for continuing conversations. Include at most 1-2 social activities total. Choose calm restaurants.',
  },
  {
    id: 'balanced_mix',
    name: 'Balanced Mix',
    tagline: 'The proven 60/40 formula',
    description:
      'Alternate strategic sessions with team activities using the research-backed ratio that prevents burnout and builds connection.',
    color: 'arches',
    icon: 'Scale',
    highlights: [
      'Strategic sessions + team activities',
      'Variety of dining experiences',
      'Research-backed structure',
      'Prevents burnout',
    ],
    workSocialRatio: '60/40',
    aiInstruction:
      'Create the optimal 60% work / 40% social ratio backed by McKinsey research. Alternate strategic sessions with team activities. Include a variety of restaurant types and mix high and low energy activities.',
  },
];

// ── Gathering-Type Defaults ──────────────────────────────────────

interface GatheringTypeDefaults {
  recommendedApproach: ApproachId;
  food: {
    cuisinePreferences: CuisinePreference[];
    priceRange: PriceRange[];
    diningStyle: DiningStyle[];
  };
  activities: {
    typePreferences: ActivityType[];
    energyLevel: EnergyLevel;
  };
  schedule: {
    startTimePreference: string;
    endTimePreference: string;
    includeBreakfast: boolean;
  };
}

const GATHERING_TYPE_DEFAULTS: Record<GatheringType, GatheringTypeDefaults> = {
  TEAM_BONDING: {
    recommendedApproach: 'high_energy_social',
    food: {
      cuisinePreferences: ['local_specialty'],
      priceRange: ['$$', '$$$'],
      diningStyle: ['group_friendly', 'casual'],
    },
    activities: {
      typePreferences: ['outdoor', 'creative'],
      energyLevel: 'high',
    },
    schedule: {
      startTimePreference: '9:00 AM',
      endTimePreference: '9:00 PM',
      includeBreakfast: true,
    },
  },
  STRATEGIC_ALIGNMENT: {
    recommendedApproach: 'deep_work_strategy',
    food: {
      cuisinePreferences: ['no_preference'],
      priceRange: ['$$$', '$$$$'],
      diningStyle: ['group_friendly', 'fine_dining'],
    },
    activities: {
      typePreferences: ['indoor'],
      energyLevel: 'low',
    },
    schedule: {
      startTimePreference: '8:00 AM',
      endTimePreference: '6:00 PM',
      includeBreakfast: true,
    },
  },
  PROBLEM_SOLVING: {
    recommendedApproach: 'balanced_mix',
    food: {
      cuisinePreferences: ['no_preference'],
      priceRange: ['$$', '$$$'],
      diningStyle: ['casual', 'group_friendly'],
    },
    activities: {
      typePreferences: ['indoor', 'creative'],
      energyLevel: 'medium',
    },
    schedule: {
      startTimePreference: '9:00 AM',
      endTimePreference: '8:00 PM',
      includeBreakfast: true,
    },
  },
  SOCIAL: {
    recommendedApproach: 'high_energy_social',
    food: {
      cuisinePreferences: ['local_specialty'],
      priceRange: ['$', '$$', '$$$'],
      diningStyle: ['casual'],
    },
    activities: {
      typePreferences: ['outdoor', 'cultural', 'creative'],
      energyLevel: 'high',
    },
    schedule: {
      startTimePreference: '10:00 AM',
      endTimePreference: '10:00 PM',
      includeBreakfast: false,
    },
  },
  TEAM_OFFSITE: {
    recommendedApproach: 'balanced_mix',
    food: {
      cuisinePreferences: ['local_specialty'],
      priceRange: ['$$', '$$$'],
      diningStyle: ['group_friendly', 'casual'],
    },
    activities: {
      typePreferences: ['outdoor', 'indoor', 'creative'],
      energyLevel: 'medium',
    },
    schedule: {
      startTimePreference: '9:00 AM',
      endTimePreference: '9:00 PM',
      includeBreakfast: true,
    },
  },
  COMPANY_OFFSITE: {
    recommendedApproach: 'balanced_mix',
    food: {
      cuisinePreferences: ['no_preference'],
      priceRange: ['$$$', '$$$$'],
      diningStyle: ['group_friendly', 'fine_dining'],
    },
    activities: {
      typePreferences: ['outdoor', 'indoor', 'cultural', 'creative'],
      energyLevel: 'medium',
    },
    schedule: {
      startTimePreference: '8:30 AM',
      endTimePreference: '9:00 PM',
      includeBreakfast: true,
    },
  },
  CUSTOM: {
    recommendedApproach: 'balanced_mix',
    food: {
      cuisinePreferences: ['no_preference'],
      priceRange: ['$$', '$$$'],
      diningStyle: [],
    },
    activities: {
      typePreferences: ['outdoor', 'indoor', 'cultural', 'creative', 'wellness'],
      energyLevel: 'medium',
    },
    schedule: {
      startTimePreference: '9:00 AM',
      endTimePreference: '9:00 PM',
      includeBreakfast: true,
    },
  },
};

// ── Helper: Build Default Configuration ──────────────────────────

/**
 * Merge gathering-type defaults with the selected approach to produce
 * a complete AgendaConfiguration with sensible defaults.
 */
export function getDefaultConfiguration(
  gatheringType: string,
  approachId: ApproachId,
): AgendaConfiguration {
  const typeKey = (gatheringType as GatheringType) in GATHERING_TYPE_DEFAULTS
    ? (gatheringType as GatheringType)
    : 'CUSTOM';

  const defaults = GATHERING_TYPE_DEFAULTS[typeKey];

  return {
    approachId,
    food: { ...defaults.food },
    activities: { ...defaults.activities },
    proximity: {
      prioritizeNearHotel: false,
    },
    schedule: { ...defaults.schedule },
  };
}

/**
 * Get the recommended approach for a gathering type.
 */
export function getRecommendedApproach(gatheringType: string): ApproachId {
  const typeKey = (gatheringType as GatheringType) in GATHERING_TYPE_DEFAULTS
    ? (gatheringType as GatheringType)
    : 'CUSTOM';

  return GATHERING_TYPE_DEFAULTS[typeKey].recommendedApproach;
}

/**
 * Look up an approach definition by ID.
 */
export function getApproachById(id: ApproachId): ApproachDefinition {
  return APPROACHES.find((a) => a.id === id)!;
}

// ── Display Labels ───────────────────────────────────────────────

export const CUISINE_LABELS: Record<CuisinePreference, string> = {
  local_specialty: 'Local Specialty',
  international: 'International',
  american: 'American',
  asian: 'Asian',
  italian: 'Italian',
  mexican: 'Mexican',
  no_preference: 'No Preference',
};

export const DINING_STYLE_LABELS: Record<DiningStyle, string> = {
  group_friendly: 'Group-Friendly',
  casual: 'Casual',
  fine_dining: 'Fine Dining',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  outdoor: 'Outdoor',
  indoor: 'Indoor',
  cultural: 'Cultural',
  creative: 'Creative',
  wellness: 'Wellness',
};

export const ENERGY_LEVEL_LABELS: Record<EnergyLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
