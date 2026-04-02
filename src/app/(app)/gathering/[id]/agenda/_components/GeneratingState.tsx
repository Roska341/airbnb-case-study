'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Check } from 'lucide-react';

interface ProgressEvent {
  phase: 'curating' | 'scheduling' | 'reviewing' | 'complete' | 'error';
  step: string;
  data?: Record<string, unknown>;
}

interface GeneratingStateProps {
  approachName: string;
  city: string;
  groupSize: number;
  progress: ProgressEvent | null;
}

const PHASES = [
  { key: 'curating', label: 'Curating restaurants & activities' },
  { key: 'scheduling', label: 'Building schedule' },
  { key: 'reviewing', label: 'Quality review' },
] as const;

type PhaseKey = (typeof PHASES)[number]['key'];

const PHASE_ORDER: Record<PhaseKey | 'complete' | 'error', number> = {
  curating: 0,
  scheduling: 1,
  reviewing: 2,
  complete: 3,
  error: -1,
};

function getPhaseIndex(phase: string): number {
  return PHASE_ORDER[phase as keyof typeof PHASE_ORDER] ?? -1;
}

export function GeneratingState({
  approachName,
  city,
  groupSize,
  progress,
}: GeneratingStateProps) {
  const currentPhaseIndex = progress ? getPhaseIndex(progress.phase) : -1;

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-8 max-w-md w-full"
      >
        <div className="relative">
          <Loader2 size={48} className="animate-spin text-kazan" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 size={48} className="text-kazan" />
          </div>
        </div>

        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-kazan mb-2">
            Generating {approachName} Agenda
          </h3>
          <p className="text-foggy text-sm">
            Finding the best options in {city} for {groupSize} people
          </p>
        </div>

        <div className="w-full space-y-4">
          {PHASES.map((phase, index) => {
            const isComplete = currentPhaseIndex > index;
            const isActive = currentPhaseIndex === index;

            return (
              <motion.div
                key={phase.key}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: isComplete || isActive ? 1 : 0.4 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isComplete
                      ? 'bg-green-100 text-green-600'
                      : isActive
                        ? 'bg-kazan/10 text-kazan'
                        : 'bg-light-gray text-foggy/50'
                  }`}
                >
                  {isComplete ? (
                    <Check size={14} strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      isComplete
                        ? 'text-green-700'
                        : isActive
                          ? 'text-kazan'
                          : 'text-foggy/50'
                    }`}
                  >
                    {phase.label}
                  </p>
                  {isActive && progress && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-foggy mt-0.5"
                    >
                      {progress.step}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
