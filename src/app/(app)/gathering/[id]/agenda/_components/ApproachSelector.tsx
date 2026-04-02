'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { Zap, Brain, Scale } from 'lucide-react';
import {
  APPROACHES,
  type ApproachId,
} from '@/lib/ai/agenda-config';

interface ApproachSelectorProps {
  recommendedApproach: ApproachId;
  selectedApproach: ApproachId | null;
  onSelect: (id: ApproachId) => void;
  onContinue: () => void;
  onStartBlank: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap size={24} />,
  Brain: <Brain size={24} />,
  Scale: <Scale size={24} />,
};

export function ApproachSelector({
  recommendedApproach,
  selectedApproach,
  onSelect,
  onContinue,
  onStartBlank,
}: ApproachSelectorProps) {
  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-kazan mb-4">Choose Your Approach</h2>
        <p className="text-foggy text-lg">
          Select the style that best fits your gathering goals. You'll configure details in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {APPROACHES.map((approach, index) => {
          const isSelected = selectedApproach === approach.id;
          const isRecommended = approach.id === recommendedApproach;

          return (
            <motion.div
              key={approach.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all border-2 h-full ${
                  isSelected
                    ? 'border-kazan shadow-elevated'
                    : 'border-transparent hover:border-light-gray'
                }`}
                onClick={() => onSelect(approach.id)}
              >
                <CardHeader className="relative">
                  {isRecommended && (
                    <Badge
                      variant="warning"
                      className="absolute -top-3 -right-3 shadow-sm"
                    >
                      RECOMMENDED
                    </Badge>
                  )}
                  <div
                    className={`w-12 h-12 rounded-pill mb-4 flex items-center justify-center ${
                      approach.color === 'rausch'
                        ? 'bg-rausch/10 text-rausch'
                        : approach.color === 'babu'
                          ? 'bg-babu/10 text-babu'
                          : 'bg-arches/10 text-arches'
                    }`}
                  >
                    {ICON_MAP[approach.icon]}
                  </div>
                  <CardTitle className="text-2xl">{approach.name}</CardTitle>
                  <p className="text-foggy mt-1 text-sm font-medium">
                    {approach.tagline}
                  </p>
                  <p className="text-foggy mt-2 text-sm">{approach.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-4 pt-4 border-t border-light-gray">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foggy uppercase tracking-wider">
                        Highlights
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {approach.workSocialRatio} work/social
                      </Badge>
                    </div>
                    <ul className="space-y-2">
                      {approach.highlights.map((highlight, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-kazan"
                        >
                          <div
                            className={`mt-1.5 w-1.5 h-1.5 rounded-pill shrink-0 ${
                              approach.color === 'rausch'
                                ? 'bg-rausch'
                                : approach.color === 'babu'
                                  ? 'bg-babu'
                                  : 'bg-arches'
                            }`}
                          />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 mt-8">
        <Button
          variant="primary"
          className="px-8 py-3"
          onClick={onContinue}
          disabled={!selectedApproach}
        >
          Continue
        </Button>
        <Button variant="text" onClick={onStartBlank}>
          Start from Blank
        </Button>
      </div>
    </div>
  );
}
