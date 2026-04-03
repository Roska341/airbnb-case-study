'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MapPin,
  TreePine,
  Building2,
  Landmark,
  Palette,
  Heart,
} from 'lucide-react';
import {
  getDefaultConfiguration,
  getApproachById,
  CUISINE_LABELS,
  DINING_STYLE_LABELS,
  ACTIVITY_TYPE_LABELS,
  ENERGY_LEVEL_LABELS,
  type ApproachId,
  type AgendaConfiguration,
  type CuisinePreference,
  type PriceRange,
  type DiningStyle,
  type ActivityType,
  type EnergyLevel,
} from '@/lib/ai/agenda-config';

interface ConfigurationFormProps {
  gatheringId: string;
  gatheringType: string;
  approachId: ApproachId;
  dailyStartTime?: string;
  dailyEndTime?: string;
  onGenerate: (config: AgendaConfiguration) => void;
  onBack: () => void;
}

const CUISINE_OPTIONS: CuisinePreference[] = [
  'local_specialty',
  'international',
  'american',
  'asian',
  'italian',
  'mexican',
  'no_preference',
];

const PRICE_OPTIONS: PriceRange[] = ['$', '$$', '$$$', '$$$$'];

const DINING_STYLE_OPTIONS: DiningStyle[] = [
  'group_friendly',
  'casual',
  'fine_dining',
];

const ACTIVITY_TYPE_OPTIONS: { id: ActivityType; icon: React.ReactNode }[] = [
  { id: 'outdoor', icon: <TreePine size={16} /> },
  { id: 'indoor', icon: <Building2 size={16} /> },
  { id: 'cultural', icon: <Landmark size={16} /> },
  { id: 'creative', icon: <Palette size={16} /> },
  { id: 'wellness', icon: <Heart size={16} /> },
];

const ENERGY_OPTIONS: EnergyLevel[] = ['low', 'medium', 'high'];

const TIME_OPTIONS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
];

function PillToggle({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-sm font-medium border transition-all ${
        selected
          ? 'bg-kazan text-white border-kazan'
          : 'bg-white text-foggy border-light-gray hover:border-kazan hover:text-kazan'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function ConfigurationForm({
  gatheringId,
  gatheringType,
  approachId,
  dailyStartTime,
  dailyEndTime,
  onGenerate,
  onBack,
}: ConfigurationFormProps) {
  const approach = getApproachById(approachId);
  const [config, setConfig] = useState<AgendaConfiguration>(() => {
    const defaults = getDefaultConfiguration(gatheringType, approachId);
    // Override schedule times with the gathering's stored daily times if available
    if (dailyStartTime || dailyEndTime) {
      return {
        ...defaults,
        schedule: {
          ...defaults.schedule,
          ...(dailyStartTime ? { startTimePreference: dailyStartTime } : {}),
          ...(dailyEndTime ? { endTimePreference: dailyEndTime } : {}),
        },
      };
    }
    return defaults;
  });
  const [showLogistics, setShowLogistics] = useState(false);
  const [accommodation, setAccommodation] = useState<{
    title: string;
    address: string | null;
  } | null>(null);

  // Fetch accommodation to check if proximity toggle should appear
  useEffect(() => {
    async function fetchAccommodation() {
      try {
        const res = await fetch(`/api/gatherings/${gatheringId}/accommodation`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.accommodations?.length > 0) {
          setAccommodation({
            title: data.accommodations[0].title,
            address: data.accommodations[0].address,
          });
        }
      } catch {
        // Silently ignore — proximity toggle won't show
      }
    }
    fetchAccommodation();
  }, [gatheringId]);

  const toggleCuisine = (c: CuisinePreference) => {
    setConfig((prev) => {
      const current = prev.food.cuisinePreferences;
      // If selecting "no_preference", clear others
      if (c === 'no_preference') {
        return { ...prev, food: { ...prev.food, cuisinePreferences: ['no_preference'] } };
      }
      // If selecting a specific cuisine, remove "no_preference"
      const withoutNoPref = current.filter((x) => x !== 'no_preference');
      const next = withoutNoPref.includes(c)
        ? withoutNoPref.filter((x) => x !== c)
        : [...withoutNoPref, c];
      return { ...prev, food: { ...prev.food, cuisinePreferences: next.length > 0 ? next : ['no_preference'] } };
    });
  };

  const togglePrice = (p: PriceRange) => {
    setConfig((prev) => {
      const current = prev.food.priceRange;
      const next = current.includes(p)
        ? current.filter((x) => x !== p)
        : [...current, p];
      return { ...prev, food: { ...prev.food, priceRange: next.length > 0 ? next : current } };
    });
  };

  const toggleDiningStyle = (d: DiningStyle) => {
    setConfig((prev) => {
      const current = prev.food.diningStyle;
      const next = current.includes(d)
        ? current.filter((x) => x !== d)
        : [...current, d];
      return { ...prev, food: { ...prev.food, diningStyle: next } };
    });
  };

  const toggleActivityType = (t: ActivityType) => {
    setConfig((prev) => {
      const current = prev.activities.typePreferences;
      const next = current.includes(t)
        ? current.filter((x) => x !== t)
        : [...current, t];
      return { ...prev, activities: { ...prev.activities, typePreferences: next.length > 0 ? next : current } };
    });
  };

  const setEnergyLevel = (e: EnergyLevel) => {
    setConfig((prev) => ({
      ...prev,
      activities: { ...prev.activities, energyLevel: e },
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-pill text-sm font-medium mb-4 ${
            approach.color === 'rausch'
              ? 'bg-rausch/10 text-rausch'
              : approach.color === 'babu'
                ? 'bg-babu/10 text-babu'
                : 'bg-arches/10 text-arches'
          }`}
        >
          {approach.name}
        </div>
        <h2 className="text-3xl font-bold text-kazan mb-2">
          Customize Your Agenda
        </h2>
        <p className="text-foggy text-lg">
          Fine-tune preferences to guide the AI. Smart defaults are pre-selected for your gathering type.
        </p>
      </div>

      {/* Section A: Dining Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-lg font-bold text-kazan">Dining Preferences</h3>

            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                Cuisine
              </label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((c) => (
                  <PillToggle
                    key={c}
                    label={CUISINE_LABELS[c]}
                    selected={config.food.cuisinePreferences.includes(c)}
                    onClick={() => toggleCuisine(c)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                Price Range
              </label>
              <div className="flex gap-2">
                {PRICE_OPTIONS.map((p) => (
                  <PillToggle
                    key={p}
                    label={p}
                    selected={config.food.priceRange.includes(p)}
                    onClick={() => togglePrice(p)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                Dining Style
              </label>
              <div className="flex flex-wrap gap-2">
                {DINING_STYLE_OPTIONS.map((d) => (
                  <PillToggle
                    key={d}
                    label={DINING_STYLE_LABELS[d]}
                    selected={config.food.diningStyle.includes(d)}
                    onClick={() => toggleDiningStyle(d)}
                  />
                ))}
              </div>
            </div>

            {/* Venue/Hotel Meals */}
            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-3">
                Meals at Venue / Hotel
              </label>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 bg-bg-gray rounded-btn border border-light-gray ${!config.schedule.includeBreakfast ? 'opacity-50' : ''}`}>
                  <div>
                    <p className="font-bold text-kazan text-sm">Breakfast at venue</p>
                    <p className="text-foggy text-xs">
                      {config.schedule.includeBreakfast
                        ? 'All breakfasts will be at the hotel or venue — no external restaurant needed'
                        : 'Enable "Include breakfast" in Logistics to use this option'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!config.schedule.includeBreakfast}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        food: { ...prev.food, venueBreakfast: !prev.food.venueBreakfast },
                      }))
                    }
                    className={`relative w-11 h-6 rounded-pill transition-colors shrink-0 ${
                      config.food.venueBreakfast && config.schedule.includeBreakfast ? 'bg-kazan' : 'bg-light-gray'
                    } ${!config.schedule.includeBreakfast ? 'cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-pill shadow transition-transform ${
                        config.food.venueBreakfast && config.schedule.includeBreakfast ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-bg-gray rounded-btn border border-light-gray">
                  <div>
                    <p className="font-bold text-kazan text-sm">Dinner at venue</p>
                    <p className="text-foggy text-xs">All dinners will be at the hotel or venue — no external restaurant needed</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        food: { ...prev.food, venueDinner: !prev.food.venueDinner },
                      }))
                    }
                    className={`relative w-11 h-6 rounded-pill transition-colors shrink-0 ${
                      config.food.venueDinner ? 'bg-kazan' : 'bg-light-gray'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-pill shadow transition-transform ${
                        config.food.venueDinner ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section B: Activity Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-lg font-bold text-kazan">Activity Preferences</h3>

            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                Activity Types
              </label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPE_OPTIONS.map(({ id, icon }) => (
                  <PillToggle
                    key={id}
                    label={ACTIVITY_TYPE_LABELS[id]}
                    selected={config.activities.typePreferences.includes(id)}
                    onClick={() => toggleActivityType(id)}
                    icon={icon}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                Energy Level
              </label>
              <div className="flex gap-2">
                {ENERGY_OPTIONS.map((e) => (
                  <PillToggle
                    key={e}
                    label={ENERGY_LEVEL_LABELS[e]}
                    selected={config.activities.energyLevel === e}
                    onClick={() => setEnergyLevel(e)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Section C: Logistics (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-6">
            <button
              type="button"
              className="flex items-center justify-between w-full text-left"
              onClick={() => setShowLogistics(!showLogistics)}
            >
              <h3 className="text-lg font-bold text-kazan">Logistics</h3>
              {showLogistics ? (
                <ChevronUp size={20} className="text-foggy" />
              ) : (
                <ChevronDown size={20} className="text-foggy" />
              )}
            </button>

            {showLogistics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-5 space-y-5"
              >
                {/* Proximity toggle - only if accommodation is booked */}
                {accommodation && (
                  <div className="flex items-start gap-3 p-4 bg-bg-gray rounded-btn border border-light-gray">
                    <MapPin size={20} className="text-kazan shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-kazan text-sm">
                            Prioritize venues near accommodation
                          </p>
                          <p className="text-foggy text-xs mt-0.5">
                            {accommodation.title}
                            {accommodation.address && ` — ${accommodation.address}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              proximity: {
                                ...prev.proximity,
                                prioritizeNearHotel: !prev.proximity.prioritizeNearHotel,
                              },
                            }))
                          }
                          className={`relative w-11 h-6 rounded-pill transition-colors ${
                            config.proximity.prioritizeNearHotel
                              ? 'bg-kazan'
                              : 'bg-light-gray'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-pill shadow transition-transform ${
                              config.proximity.prioritizeNearHotel
                                ? 'translate-x-5'
                                : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                      Start Time
                    </label>
                    <select
                      value={config.schedule.startTimePreference}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            startTimePreference: e.target.value,
                          },
                        }))
                      }
                      className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-sm text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foggy uppercase tracking-wider block mb-2">
                      End Time
                    </label>
                    <select
                      value={config.schedule.endTimePreference}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            endTimePreference: e.target.value,
                          },
                        }))
                      }
                      className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-sm text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Include breakfast toggle */}
                <div className="flex items-center justify-between">
                  <p className="font-bold text-kazan text-sm">Include breakfast</p>
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        schedule: {
                          ...prev.schedule,
                          includeBreakfast: !prev.schedule.includeBreakfast,
                        },
                        // Reset venue breakfast when breakfast is disabled
                        food: {
                          ...prev.food,
                          venueBreakfast: prev.schedule.includeBreakfast ? false : prev.food.venueBreakfast,
                        },
                      }))
                    }
                    className={`relative w-11 h-6 rounded-pill transition-colors ${
                      config.schedule.includeBreakfast ? 'bg-kazan' : 'bg-light-gray'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-pill shadow transition-transform ${
                        config.schedule.includeBreakfast
                          ? 'translate-x-5'
                          : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" className="gap-2" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </Button>
        <Button
          variant="primary"
          className="gap-2 px-8 py-3"
          onClick={() => onGenerate(config)}
        >
          <Sparkles size={16} /> Generate Agenda
        </Button>
      </div>
    </div>
  );
}
