'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  getRecommendedApproach,
  getApproachById,
  type ApproachId,
  type AgendaConfiguration,
} from '@/lib/ai/agenda-config';
import { ApproachSelector } from './_components/ApproachSelector';
import { ConfigurationForm } from './_components/ConfigurationForm';
import { GeneratingState } from './_components/GeneratingState';
import { AgendaEditor } from './_components/AgendaEditor';

// ── Types ────────────────────────────────────────────────────────

interface AgendaBlock {
  id: string;
  time: string;
  title: string;
  type: string;
  desc?: string;
  restaurant?: { name: string; cuisine: string; rating: number; price: string; dietary: string[]; distance: string; reason: string };
  activity?: { name: string; venue: string; duration: string; capacity: string; type: string; reason: string };
}

interface AgendaDay {
  day: number;
  label: string;
  blocks: AgendaBlock[];
}

interface AgendaState {
  variant: string;
  days: AgendaDay[];
}

interface ApiBlock {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  description?: string | null;
  type: string;
  restaurantData?: string | null;
  activityData?: string | null;
}

interface ApiVariant {
  variantName: string;
  variantDescription: string;
  color: string;
  recommended: boolean;
  days: Array<{
    dayNumber: number;
    blocks: Array<{
      startTime: string;
      endTime: string;
      title: string;
      description?: string;
      type: string;
      restaurant?: { name: string; cuisine: string; rating: number; price: string; dietary: string[]; distance: string; reason: string };
      activity?: { name: string; venue: string; duration: string; capacity: string; type: string; reason: string };
    }>;
  }>;
}

interface GatheringInfo {
  type: string;
  location: string;
  groupSize: number;
  dailyStartTime?: string;
  dailyEndTime?: string;
}

type WizardStep = 'approach' | 'configure' | 'generating' | 'editor';

interface ProgressEvent {
  phase: 'curating' | 'scheduling' | 'reviewing' | 'complete' | 'error';
  step: string;
  result?: {
    agenda: ApiVariant;
    quality: {
      passed: boolean;
      overallScore: number;
      scores: Record<string, number>;
      issues: string[];
      summary: string;
    } | null;
    meals: { reasoning: string };
    activities: { reasoning: string };
    refinements: number;
  };
  message?: string;
  data?: Record<string, unknown>;
}

interface QualityInfo {
  overallScore: number;
  scores: Record<string, number>;
  summary: string;
  refinements: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function parseRestaurantData(raw: string | null | undefined) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}

function parseActivityData(raw: string | null | undefined) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}

function apiBlockToUiBlock(b: ApiBlock): AgendaBlock {
  return {
    id: b.id,
    time: `${b.startTime} - ${b.endTime}`,
    title: b.title,
    type: b.type.toLowerCase(),
    desc: b.description ?? undefined,
    restaurant: parseRestaurantData(b.restaurantData),
    activity: parseActivityData(b.activityData),
  };
}

function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  return hours * 60 + minutes;
}

function groupBlocksByDay(blocks: ApiBlock[]): AgendaDay[] {
  const dayMap = new Map<number, AgendaBlock[]>();
  for (const b of blocks) {
    const dayNum = b.day;
    if (!dayMap.has(dayNum)) dayMap.set(dayNum, []);
    dayMap.get(dayNum)!.push(apiBlockToUiBlock(b));
  }
  const sortedDays = Array.from(dayMap.keys()).sort((a, b) => a - b);
  return sortedDays.map(dayNum => ({
    day: dayNum,
    label: `Day ${dayNum}`,
    blocks: dayMap.get(dayNum)!.sort((a, b) => {
      const aStart = parseTimeToMinutes(a.time.split(' - ')[0]);
      const bStart = parseTimeToMinutes(b.time.split(' - ')[0]);
      return aStart - bStart;
    }),
  }));
}

// ── Mock fallback (per approach) ─────────────────────────────────

function getMockAgenda(approachId: ApproachId): ApiVariant {
  const approach = getApproachById(approachId);

  const mocksByApproach: Record<ApproachId, ApiVariant> = {
    deep_work_strategy: {
      variantName: 'Deep Work & Strategy',
      variantDescription: 'Maximize productive collaboration with long focus blocks, punctuated by energizing breaks and a team dinner.',
      color: 'babu',
      recommended: false,
      days: [
        {
          dayNumber: 1,
          blocks: [
            { startTime: '9:00 AM', endTime: '9:30 AM', title: 'Welcome & Icebreaker', type: 'icebreaker', description: 'Quick introductions and a fun warm-up activity to set the tone.' },
            { startTime: '9:30 AM', endTime: '12:00 PM', title: 'Strategy Deep Dive', type: 'work_session', description: 'Collaborative session to align on key priorities and roadmap.' },
            { startTime: '12:00 PM', endTime: '1:00 PM', title: 'Team Lunch', type: 'meal', description: 'Casual lunch to recharge and connect informally.' },
            { startTime: '1:00 PM', endTime: '4:00 PM', title: 'Breakout Working Groups', type: 'work_session', description: 'Smaller groups tackle specific challenges and report back.' },
            { startTime: '6:00 PM', endTime: '8:00 PM', title: 'Team Dinner', type: 'meal', description: 'Group dinner at a local restaurant.' },
          ],
        },
        {
          dayNumber: 2,
          blocks: [
            { startTime: '9:00 AM', endTime: '12:00 PM', title: 'Hackathon Sprint', type: 'work_session', description: 'Rapid prototyping session on top ideas from Day 1.' },
            { startTime: '12:00 PM', endTime: '1:00 PM', title: 'Working Lunch & Demos', type: 'meal', description: 'Present hackathon results over lunch.' },
            { startTime: '1:00 PM', endTime: '3:00 PM', title: 'Action Planning', type: 'work_session', description: 'Define next steps, owners, and timelines.' },
            { startTime: '3:00 PM', endTime: '3:30 PM', title: 'Closing & Retro', type: 'icebreaker', description: 'Reflect on the offsite and share takeaways.' },
          ],
        },
      ],
    },
    high_energy_social: {
      variantName: 'High-Energy Social',
      variantDescription: 'Lead with relationship-building activities before diving into work, creating psychological safety for better collaboration.',
      color: 'rausch',
      recommended: false,
      days: [
        {
          dayNumber: 1,
          blocks: [
            { startTime: '9:00 AM', endTime: '10:00 AM', title: 'Team Building Challenge', type: 'activity', description: 'Fun group challenge to break the ice and build trust.' },
            { startTime: '10:00 AM', endTime: '12:00 PM', title: 'Storytelling Workshop', type: 'icebreaker', description: 'Each team member shares their journey and what motivates them.' },
            { startTime: '12:00 PM', endTime: '1:30 PM', title: 'Group Lunch Outing', type: 'meal', description: 'Explore the city together over a leisurely lunch.' },
            { startTime: '1:30 PM', endTime: '4:00 PM', title: 'Vision Alignment', type: 'work_session', description: 'Now that bonds are formed, align on team vision and goals.' },
            { startTime: '4:30 PM', endTime: '6:30 PM', title: 'Outdoor Activity', type: 'activity', description: 'Group hike, bike ride, or local adventure.' },
          ],
        },
        {
          dayNumber: 2,
          blocks: [
            { startTime: '9:00 AM', endTime: '11:00 AM', title: 'Collaborative Planning', type: 'work_session', description: 'Build on Day 1 connections to plan together effectively.' },
            { startTime: '11:00 AM', endTime: '12:00 PM', title: 'Norms & Agreements', type: 'work_session', description: 'Establish team working norms and communication agreements.' },
            { startTime: '12:00 PM', endTime: '1:00 PM', title: 'Farewell Lunch', type: 'meal', description: 'Wrap up with a celebratory team lunch.' },
            { startTime: '1:00 PM', endTime: '2:00 PM', title: 'Retro & Commitments', type: 'icebreaker', description: 'Share feedback and commit to next steps.' },
          ],
        },
      ],
    },
    balanced_mix: {
      variantName: 'Balanced Mix',
      variantDescription: 'Equal parts focused work, team bonding, and free time — designed to prevent burnout while making real progress.',
      color: 'arches',
      recommended: false,
      days: [
        {
          dayNumber: 1,
          blocks: [
            { startTime: '9:00 AM', endTime: '9:30 AM', title: 'Check-in & Goals', type: 'icebreaker', description: 'Set intentions and share expectations for the offsite.' },
            { startTime: '9:30 AM', endTime: '11:30 AM', title: 'Morning Work Block', type: 'work_session', description: 'Focused strategy session on top priorities.' },
            { startTime: '11:30 AM', endTime: '12:00 PM', title: 'Coffee & Connect', type: 'icebreaker', description: 'Informal networking over coffee.' },
            { startTime: '12:00 PM', endTime: '1:00 PM', title: 'Lunch Break', type: 'meal', description: 'Free time for lunch — explore or eat together.' },
            { startTime: '1:00 PM', endTime: '3:00 PM', title: 'Afternoon Work Block', type: 'work_session', description: 'Continue morning work or tackle new topics.' },
            { startTime: '3:00 PM', endTime: '5:00 PM', title: 'Team Activity', type: 'activity', description: 'Fun group activity — cooking class, trivia, or escape room.' },
            { startTime: '7:00 PM', endTime: '9:00 PM', title: 'Dinner Out', type: 'meal', description: 'Team dinner at a curated restaurant.' },
          ],
        },
        {
          dayNumber: 2,
          blocks: [
            { startTime: '9:00 AM', endTime: '11:00 AM', title: 'Wrap-up Session', type: 'work_session', description: 'Finalize decisions and assign action items.' },
            { startTime: '11:00 AM', endTime: '12:00 PM', title: 'Lightning Talks', type: 'icebreaker', description: 'Quick presentations on topics people are passionate about.' },
            { startTime: '12:00 PM', endTime: '1:00 PM', title: 'Closing Lunch', type: 'meal', description: 'Final team lunch with reflections.' },
          ],
        },
      ],
    },
  };

  return mocksByApproach[approachId] ?? mocksByApproach.balanced_mix;
}

// ── Page Component ───────────────────────────────────────────────

export default function AgendaBuilderPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const { addToast } = useToast();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('approach');
  const [selectedApproach, setSelectedApproach] = useState<ApproachId | null>(null);
  const [isLoadingAgenda, setIsLoadingAgenda] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Gathering info (fetched once)
  const [gatheringInfo, setGatheringInfo] = useState<GatheringInfo | null>(null);

  // Agenda state (for editor)
  const [agenda, setAgenda] = useState<AgendaState>({ variant: '', days: [] });
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [qualityInfo, setQualityInfo] = useState<QualityInfo | null>(null);

  // Fetch gathering info
  useEffect(() => {
    async function fetchGathering() {
      try {
        const res = await fetch(`/api/gatherings/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setGatheringInfo({
          type: data.type,
          location: data.location,
          groupSize: data.groupSize,
          dailyStartTime: data.dailyStartTime ?? undefined,
          dailyEndTime: data.dailyEndTime ?? undefined,
        });
      } catch {
        // Will use defaults
      }
    }
    fetchGathering();
  }, [id]);

  // Fetch existing agenda blocks on mount
  const fetchAgenda = useCallback(async () => {
    if (!id) return;
    setIsLoadingAgenda(true);
    try {
      const res = await fetch(`/api/gatherings/${id}/agenda`);
      if (!res.ok) throw new Error('Failed to fetch agenda');
      const blocks: ApiBlock[] = await res.json();
      if (blocks.length > 0) {
        const days = groupBlocksByDay(blocks);
        setAgenda({ variant: 'Saved Agenda', days });
        setStep('editor');
      }
    } catch {
      addToast({ message: 'Failed to load agenda', type: 'error' });
    } finally {
      setIsLoadingAgenda(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  // ── Handlers ─────────────────────────────────────────────────

  const saveAndSetAgenda = async (variant: ApiVariant) => {
    const blocks = variant.days.flatMap((d) =>
      (d.blocks ?? []).map((b, idx) => ({
        day: d.dayNumber,
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.title,
        description: b.description,
        type: b.type.toUpperCase(),
        aiGenerated: true,
        variant: variant.variantName,
        restaurantData: b.restaurant ? JSON.stringify(b.restaurant) : undefined,
        activityData: b.activity ? JSON.stringify(b.activity) : undefined,
        sortOrder: idx,
      }))
    );

    const saveRes = await fetch(`/api/gatherings/${id}/agenda/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks, replaceExisting: true }),
    });

    if (!saveRes.ok) throw new Error('Failed to save agenda');

    const savedBlocks: ApiBlock[] = await saveRes.json();
    const days = groupBlocksByDay(savedBlocks);
    setAgenda({ variant: variant.variantName, days });
    setStep('editor');
    addToast({ message: `"${variant.variantName}" agenda created!`, type: 'success' });
  };

  const handleGenerate = async (configuration: AgendaConfiguration) => {
    setStep('generating');
    setIsGenerating(true);
    setProgress(null);
    setQualityInfo(null);

    try {
      const res = await fetch('/api/ai/agenda/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatheringId: id, configuration }),
      });

      if (!res.ok || !res.body) {
        const errorText = res.body ? await res.text() : `HTTP ${res.status}`;
        console.error('[AgendaGenerate] API error:', errorText);
        addToast({ message: `AI generation failed (${res.status}) — using sample agenda`, type: 'error' });
        const variant = getMockAgenda(configuration.approachId);
        await saveAndSetAgenda(variant);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const event: ProgressEvent = JSON.parse(line.slice(6));
          setProgress(event);

          if (event.phase === 'error') {
            console.error('[AgendaGenerate] AI error event:', event.message);
            addToast({ message: `AI generation failed: ${event.message ?? 'unknown error'} — using sample agenda`, type: 'error' });
            const variant = getMockAgenda(configuration.approachId);
            await saveAndSetAgenda(variant);
            return;
          }

          if (event.phase === 'complete' && event.result) {
            if (event.result.quality) {
              setQualityInfo({
                overallScore: event.result.quality.overallScore,
                scores: event.result.quality.scores,
                summary: event.result.quality.summary,
                refinements: event.result.refinements,
              });
            }
            await saveAndSetAgenda(event.result.agenda);
            return;
          }
        }
      }
    } catch (err) {
      console.error('[AgendaGenerate] Network/parse error:', err);
      addToast({ message: `AI generation failed — using sample agenda`, type: 'error' });
      const variant = getMockAgenda(configuration.approachId);
      await saveAndSetAgenda(variant);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteBlock = async (dayIndex: number, blockId: string) => {
    const day = agenda.days[dayIndex];
    const block = day.blocks.find(b => b.id === blockId);
    if (!block) return;

    const removedBlock = block;

    // Optimistic update
    setAgenda(prev => ({
      ...prev,
      days: prev.days.map((d, i) =>
        i === dayIndex ? { ...d, blocks: d.blocks.filter(b => b.id !== blockId) } : d
      )
    }));

    try {
      const res = await fetch(`/api/gatherings/${id}/agenda/${blockId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete block');
      addToast({ message: `Removed "${removedBlock.title}" from agenda`, type: 'info' });
    } catch {
      // Revert on failure
      setAgenda(prev => ({
        ...prev,
        days: prev.days.map((d, i) =>
          i === dayIndex ? { ...d, blocks: [...d.blocks, removedBlock].sort((a, b) => a.time.localeCompare(b.time)) } : d
        )
      }));
      addToast({ message: 'Failed to delete block', type: 'error' });
    }
  };

  const handleSaveAgenda = async () => {
    try {
      const blocks = agenda.days.flatMap((d) =>
        d.blocks.map((b, idx) => {
          const [startTime, endTime] = b.time.split(' - ');
          return {
            day: d.day,
            startTime,
            endTime,
            title: b.title,
            description: b.desc,
            type: b.type.toUpperCase(),
            restaurantData: b.restaurant ? JSON.stringify(b.restaurant) : undefined,
            activityData: b.activity ? JSON.stringify(b.activity) : undefined,
            sortOrder: idx,
          };
        })
      );

      const res = await fetch(`/api/gatherings/${id}/agenda/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, replaceExisting: true }),
      });
      if (!res.ok) throw new Error('Failed to save agenda');

      await fetchAgenda();
      addToast({ message: 'Agenda saved successfully!', type: 'success' });
    } catch {
      addToast({ message: 'Failed to save agenda', type: 'error' });
    }
  };

  const handleAddBlock = async (block: {
    day: number;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => {
    const res = await fetch(`/api/gatherings/${id}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(block),
    });
    if (!res.ok) throw new Error('Failed to add block');
    await fetchAgenda();
    addToast({ message: `Added "${block.title}" to agenda`, type: 'success' });
  };

  const handleEditBlock = async (block: {
    blockId: string;
    day: number;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => {
    const res = await fetch(`/api/gatherings/${id}/agenda/${block.blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day: block.day,
        title: block.title,
        type: block.type.toUpperCase(),
        startTime: block.startTime,
        endTime: block.endTime,
        description: block.description,
      }),
    });
    if (!res.ok) throw new Error('Failed to update block');
    await fetchAgenda();
    addToast({ message: `Updated "${block.title}"`, type: 'success' });
  };

  const handleRegenerate = () => {
    setStep('approach');
    setSelectedApproach(null);
  };

  const handleStartBlank = () => {
    setAgenda({ variant: 'Blank', days: [{ day: 1, label: 'Day 1', blocks: [] }] });
    setStep('editor');
  };

  // ── Render ───────────────────────────────────────────────────

  if (isLoadingAgenda) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12">
        <Link href={`/gathering/${id}`} className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8">
          <ArrowLeft size={16} className="mr-2" /> Back to Hub
        </Link>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-foggy" />
        </div>
      </div>
    );
  }

  const recommendedApproach = gatheringInfo
    ? getRecommendedApproach(gatheringInfo.type)
    : 'balanced_mix';

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <Link href={`/gathering/${id}`} className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> Back to Hub
      </Link>

      {/* Step indicator */}
      {step !== 'editor' && step !== 'generating' && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {['approach', 'configure'].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`w-2.5 h-2.5 rounded-pill transition-colors ${
                  s === step
                    ? 'bg-kazan'
                    : i < ['approach', 'configure'].indexOf(step)
                      ? 'bg-kazan/50'
                      : 'bg-light-gray'
                }`}
              />
              {i < 1 && <div className="w-8 h-0.5 bg-light-gray" />}
            </React.Fragment>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {step === 'approach' && (
            <ApproachSelector
              recommendedApproach={recommendedApproach}
              selectedApproach={selectedApproach}
              onSelect={setSelectedApproach}
              onContinue={() => {
                if (selectedApproach) setStep('configure');
              }}
              onStartBlank={handleStartBlank}
            />
          )}

          {step === 'configure' && selectedApproach && (
            <ConfigurationForm
              gatheringId={id}
              gatheringType={gatheringInfo?.type ?? 'CUSTOM'}
              approachId={selectedApproach}
              dailyStartTime={gatheringInfo?.dailyStartTime}
              dailyEndTime={gatheringInfo?.dailyEndTime}
              onGenerate={handleGenerate}
              onBack={() => setStep('approach')}
            />
          )}

          {step === 'generating' && selectedApproach && (
            <GeneratingState
              approachName={getApproachById(selectedApproach).name}
              city={gatheringInfo?.location ?? 'your city'}
              groupSize={gatheringInfo?.groupSize ?? 20}
              progress={progress}
            />
          )}

          {step === 'editor' && (
            <AgendaEditor
              gatheringId={id}
              agenda={agenda}
              setAgenda={setAgenda}
              onRegenerate={handleRegenerate}
              onSave={handleSaveAgenda}
              onDeleteBlock={handleDeleteBlock}
              onAddBlock={handleAddBlock}
              onEditBlock={handleEditBlock}
              isLoadingVariants={isGenerating}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
