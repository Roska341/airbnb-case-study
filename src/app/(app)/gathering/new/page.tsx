'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Heart, Target, Lightbulb, PartyPopper, Plus, ArrowLeft, MapPinned, Monitor, Users, Compass, Building2, Search, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const MAX_GROUP_SIZE = 500;
const MAX_TEXT_LENGTH = 1000;

type EventFormat = 'in_person' | 'hybrid' | 'virtual';
type VirtualProvider = 'zoom' | 'teams' | 'google_meet' | 'other';

const eventFormats: { id: EventFormat; title: string; desc: string; icon: typeof MapPinned }[] = [
  { id: 'in_person', title: 'In Person', desc: 'Meet face to face', icon: MapPinned },
  { id: 'hybrid', title: 'Hybrid', desc: 'In-person & remote', icon: Users },
  { id: 'virtual', title: 'Virtual', desc: 'Fully remote event', icon: Monitor },
];

const gatheringTypes = [
  { id: 'strategic_alignment', title: 'Strategic Alignment', desc: 'Set goals and OKRs', icon: Target },
  { id: 'problem_solving', title: 'Complex Problem-Solving', desc: 'Hackathons & sprints', icon: Lightbulb },
  { id: 'social', title: 'Social Event', desc: 'Celebrate milestones', icon: PartyPopper },
  { id: 'team_offsite', title: 'Team Offsite', desc: 'Multi-day team retreat', icon: Compass },
  { id: 'company_offsite', title: 'Company Offsite', desc: 'Organization-wide gathering', icon: Building2 },
  { id: 'custom', title: 'Custom', desc: 'Build from scratch', icon: Plus },
];

// ── Supported Cities (cities with restaurant/activity data) ──────
const SUPPORTED_CITIES = [
  { id: 'austin', label: 'Austin, TX', region: 'Texas, United States' },
  { id: 'sf', label: 'San Francisco, CA', region: 'California, United States' },
  { id: 'nyc', label: 'New York City, NY', region: 'New York, United States' },
  { id: 'seattle', label: 'Seattle, WA', region: 'Washington, United States' },
];

function LocationPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? SUPPORTED_CITIES.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.region.toLowerCase().includes(query.toLowerCase()),
      )
    : SUPPORTED_CITIES;

  const handleSelect = (city: typeof SUPPORTED_CITIES[number]) => {
    onChange(city.label);
    setQuery(city.label);
    setIsOpen(false);
    setFocusIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && focusIndex >= 0 && filtered[focusIndex]) {
      e.preventDefault();
      handleSelect(filtered[focusIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync external value
  React.useEffect(() => {
    if (value && !query) setQuery(value);
  }, [value]);

  return (
    <div className="relative">
      <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-1.5 block">
        Location / City
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foggy/50" />
        <input
          ref={inputRef}
          type="text"
          className="flex h-12 w-full rounded-btn border border-light-gray bg-white pl-10 pr-4 py-3 text-base text-kazan placeholder:text-foggy/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
          placeholder="Search for a city..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(''); // clear selection until they pick
            setIsOpen(true);
            setFocusIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-light-gray rounded-card shadow-elevated overflow-hidden"
        >
          {filtered.map((city, i) => (
            <button
              key={city.id}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                i === focusIndex ? 'bg-rausch/5' : 'hover:bg-bg-gray',
                value === city.label && 'bg-rausch/5',
              )}
              onClick={() => handleSelect(city)}
              onMouseEnter={() => setFocusIndex(i)}
            >
              <MapPin size={16} className="text-rausch shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-kazan text-sm">{city.label}</p>
                <p className="text-xs text-foggy truncate">{city.region}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && filtered.length === 0 && query.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-light-gray rounded-card shadow-elevated p-4 text-center">
          <p className="text-foggy text-sm">No supported cities match &quot;{query}&quot;</p>
          <p className="text-foggy/50 text-xs mt-1">Available: Austin, San Francisco, New York City, Seattle</p>
        </div>
      )}
    </div>
  );
}

const contextLabels: Record<string, string> = {
  new: 'New team',
  cross_functional: 'Cross-functional',
  post_reorg: 'Post-reorg',
  established: 'Established team',
  other: 'Other',
};

export default function CreateGatheringPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    purpose: '',
    context: '',
    groupSize: 10,
    startDate: null as Date | null,
    endDate: null as Date | null,
    startHour: '9:00 AM',
    endHour: '5:00 PM',
    location: '',
    eventFormat: '' as '' | EventFormat,
    virtualProvider: '' as '' | VirtualProvider,
    hotelsRequired: null as boolean | null,
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const typeTitle = formData.type.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

      const isVirtual = formData.eventFormat === 'virtual';
      const locationDisplay = isVirtual ? 'Virtual' : (formData.location || 'TBD');

      const res = await fetch('/api/gatherings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: isVirtual ? typeTitle : (formData.location ? `${typeTitle} in ${formData.location}` : typeTitle),
          type: formData.type.toUpperCase().replace(/ /g, '_'),
          purpose: formData.purpose,
          teamContext: formData.context,
          location: locationDisplay,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          groupSize: formData.groupSize,
          status: 'DRAFT',
          dailyStartTime: formData.startHour || undefined,
          dailyEndTime: formData.endHour || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create gathering');
      }

      const gathering = await res.json();
      addToast({ message: 'Gathering created successfully!', type: 'success' });
      router.push(`/gathering/${gathering.id}`);
    } catch {
      addToast({ message: 'Failed to create gathering. Please try again.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-kazan mb-4">What's the occasion?</h2>
        <p className="text-foggy text-lg">Select the primary focus for your gathering to help us tailor the experience.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gatheringTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = formData.type === type.id;
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'border-rausch bg-rausch/5 shadow-elevated' : 'border-transparent hover:border-light-gray hover:shadow-elevated'}`}
              onClick={() => setFormData({ ...formData, type: type.id })}
            >
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-pill ${isSelected ? 'bg-rausch text-white' : 'bg-bg-gray text-hof'}`}>
                  <Icon size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-kazan text-xl mb-2">{type.title}</h3>
                  <p className="text-foggy">{type.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="flex justify-end mt-12">
        <Button size="lg" onClick={handleNext} disabled={!formData.type}>Next</Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-kazan mb-4">Tell us more</h2>
        <p className="text-foggy text-lg">The more context you provide, the better our AI can suggest agendas and activities.</p>
      </div>

      <div className="space-y-6">
        <Textarea
          label="What's the purpose of this gathering?"
          placeholder="e.g., Our two sub-teams just merged and need to build trust before the Q3 release..."
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value.slice(0, MAX_TEXT_LENGTH) })}
          rows={4}
        />
        <p className="text-xs text-foggy text-right">{formData.purpose.length}/{MAX_TEXT_LENGTH}</p>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-bold text-foggy uppercase tracking-wider">Team Context</label>
          <select
            className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
          >
            <option value="">Select context...</option>
            <option value="new">New team</option>
            <option value="cross_functional">Cross-functional</option>
            <option value="post_reorg">Post-reorg</option>
            <option value="established">Established team</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between mt-12">
        <Button variant="secondary" size="lg" onClick={handleBack} className="gap-2"><ArrowLeft size={18}/> Back</Button>
        <Button size="lg" onClick={handleNext} disabled={!formData.purpose || !formData.context}>Next</Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const isVirtual = formData.eventFormat === 'virtual';
    const isHybridOrVirtual = formData.eventFormat === 'hybrid' || formData.eventFormat === 'virtual';
    const isInPerson = formData.eventFormat === 'in_person';
    const needsLocation = isInPerson || formData.eventFormat === 'hybrid';

    const isStep3Complete =
      !!formData.eventFormat &&
      !!formData.startDate && !!formData.endDate &&
      (!needsLocation || !!formData.location) &&
      (!isHybridOrVirtual || !!formData.virtualProvider) &&
      (!isInPerson || formData.hotelsRequired !== null);

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-kazan mb-4">The basics</h2>
          <p className="text-foggy text-lg">Let&apos;s get the logistics sorted out.</p>
        </div>

        <div className="space-y-8">
          {/* Event Format */}
          <div>
            <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-3 block">Event Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {eventFormats.map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = formData.eventFormat === fmt.id;
                return (
                  <Card
                    key={fmt.id}
                    className={cn(
                      'cursor-pointer transition-all duration-200 border-2',
                      isSelected
                        ? 'border-rausch bg-rausch/5 shadow-elevated'
                        : 'border-transparent hover:border-light-gray hover:shadow-elevated'
                    )}
                    onClick={() => setFormData(f => ({
                      ...f,
                      eventFormat: fmt.id,
                      virtualProvider: (fmt.id === 'hybrid' || fmt.id === 'virtual') ? f.virtualProvider : '',
                      hotelsRequired: fmt.id === 'in_person' ? f.hotelsRequired : null,
                      location: fmt.id === 'virtual' ? '' : f.location,
                    }))}
                  >
                    <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                      <div className={cn('p-3 rounded-pill', isSelected ? 'bg-rausch text-white' : 'bg-bg-gray text-hof')}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-kazan text-base mb-1">{fmt.title}</h3>
                        <p className="text-foggy text-sm">{fmt.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Virtual Provider (hybrid/virtual only) */}
          {isHybridOrVirtual && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-bold text-foggy uppercase tracking-wider">Virtual Meeting Provider</label>
              <select
                className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                value={formData.virtualProvider}
                onChange={(e) => setFormData({ ...formData, virtualProvider: e.target.value as '' | VirtualProvider })}
              >
                <option value="">Select provider...</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="google_meet">Google Meet</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Group Size */}
          <div className="flex items-center justify-between p-6 border border-light-gray rounded-card bg-white">
            <div>
              <h3 className="font-bold text-kazan text-lg">Group Size</h3>
              <p className="text-foggy">Number of attendees (max {MAX_GROUP_SIZE})</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                className="w-10 h-10 rounded-pill border border-light-gray flex items-center justify-center text-foggy hover:border-kazan hover:text-kazan transition-colors"
                onClick={() => setFormData(f => ({ ...f, groupSize: Math.max(1, f.groupSize - 1) }))}
              >-</button>
              <input
                type="number"
                min={1}
                max={MAX_GROUP_SIZE}
                value={formData.groupSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) setFormData(f => ({ ...f, groupSize: Math.min(MAX_GROUP_SIZE, Math.max(1, val)) }))
                }}
                className="text-xl font-bold w-20 text-center border border-light-gray rounded-btn py-1 focus:outline-none focus:ring-2 focus:ring-kazan focus:border-transparent"
              />
              <button
                className="w-10 h-10 rounded-pill border border-light-gray flex items-center justify-center text-foggy hover:border-kazan hover:text-kazan transition-colors"
                onClick={() => setFormData(f => ({ ...f, groupSize: Math.min(MAX_GROUP_SIZE, f.groupSize + 1) }))}
              >+</button>
            </div>
          </div>

          {/* Event Dates */}
          <div>
            <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-1.5 block">Event Dates</label>
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onChange={(start, end) => setFormData({ ...formData, startDate: start, endDate: end })}
            />
          </div>

          {/* Start / End Hour */}
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Start Hour"
              type="text"
              placeholder="e.g., 9:00 AM"
              value={formData.startHour}
              onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
            />
            <Input
              label="End Hour"
              type="text"
              placeholder="e.g., 5:00 PM"
              value={formData.endHour}
              onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
            />
          </div>

          {/* Location (in_person / hybrid only) */}
          {needsLocation && (
            <LocationPicker
              value={formData.location}
              onChange={(v) => setFormData({ ...formData, location: v })}
            />
          )}

          {/* Hotels Required (in_person only) */}
          {isInPerson && (
            <div className="flex items-center justify-between p-6 border border-light-gray rounded-card bg-white">
              <div>
                <h3 className="font-bold text-kazan text-lg">Hotel Accommodation</h3>
                <p className="text-foggy">Will attendees need hotel stays?</p>
              </div>
              <div className="flex gap-3">
                {([{ label: 'Yes', value: true }, { label: 'No', value: false }] as const).map(opt => (
                  <button
                    key={opt.label}
                    className={cn(
                      'px-6 py-2 rounded-pill font-semibold transition-all',
                      formData.hotelsRequired === opt.value
                        ? 'bg-rausch text-white shadow-elevated'
                        : 'border border-light-gray text-foggy hover:border-kazan hover:text-kazan'
                    )}
                    onClick={() => setFormData(f => ({ ...f, hotelsRequired: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-12">
          <Button variant="secondary" size="lg" onClick={handleBack} className="gap-2"><ArrowLeft size={18}/> Back</Button>
          <Button size="lg" onClick={handleNext} disabled={!isStep3Complete}>Next</Button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-kazan mb-4">Review & Create</h2>
        <p className="text-foggy text-lg">Ready to start planning? You can change these details later.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-bg-gray p-6 border-b border-light-gray">
          <h3 className="text-2xl font-bold text-kazan">{formData.type.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
          <p className="text-foggy mt-1">
            {formData.eventFormat === 'virtual' ? 'Virtual' : formData.location}
            {' '}&bull;{' '}
            {formData.eventFormat?.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {' '}&bull;{' '}
            {formData.startDate && formData.endDate ? `${format(formData.startDate, 'MMM d')} - ${format(formData.endDate, 'MMM d, yyyy')}` : 'TBD'}
          </p>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Group Size</p>
              <p className="text-lg text-kazan font-medium">{formData.groupSize} people</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Event Format</p>
              <p className="text-lg text-kazan font-medium">{formData.eventFormat?.replaceAll('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            {formData.startHour && formData.endHour && (
              <div>
                <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Daily Hours</p>
                <p className="text-lg text-kazan font-medium">{formData.startHour} – {formData.endHour}</p>
              </div>
            )}
            {(formData.eventFormat === 'hybrid' || formData.eventFormat === 'virtual') && formData.virtualProvider && (
              <div>
                <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Virtual Provider</p>
                <p className="text-lg text-kazan font-medium">
                  {formData.virtualProvider === 'google_meet' ? 'Google Meet'
                    : formData.virtualProvider === 'teams' ? 'Microsoft Teams'
                    : formData.virtualProvider.charAt(0).toUpperCase() + formData.virtualProvider.slice(1)}
                </p>
              </div>
            )}
            {formData.eventFormat === 'in_person' && formData.hotelsRequired !== null && (
              <div>
                <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Hotel Accommodation</p>
                <p className="text-lg text-kazan font-medium">{formData.hotelsRequired ? 'Yes, required' : 'Not needed'}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Purpose</p>
              <p className="text-base text-kazan">{formData.purpose}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-12">
        <Button variant="secondary" size="lg" onClick={handleBack} className="gap-2"><ArrowLeft size={18}/> Back</Button>
        <Button size="lg" onClick={handleCreate} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Gathering'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-gray pb-20">
      <div className="bg-white border-b border-light-gray sticky top-20 z-40">
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="text" onClick={() => router.push('/dashboard')} className="text-foggy hover:text-kazan">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-bold text-kazan">Create New Gathering</span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-pill transition-colors duration-300 ${i <= step ? 'bg-rausch' : 'bg-light-gray'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1120px] mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
