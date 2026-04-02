'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { Input, Textarea } from '@/components/ui/Input';
import { motion } from 'motion/react';
import { Sparkles, Edit2, Trash2, Plus, Loader2 } from 'lucide-react';

interface AgendaBlock {
  id: string;
  time: string;
  title: string;
  type: string;
  desc?: string;
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

interface AgendaDay {
  day: number;
  label: string;
  blocks: AgendaBlock[];
}

interface AgendaState {
  variant: string;
  days: AgendaDay[];
}

interface AgendaEditorProps {
  gatheringId: string;
  agenda: AgendaState;
  setAgenda: React.Dispatch<React.SetStateAction<AgendaState>>;
  onRegenerate: () => void;
  onSave: () => Promise<void>;
  onDeleteBlock: (dayIndex: number, blockId: string) => Promise<void>;
  onAddBlock: (block: {
    day: number;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => Promise<void>;
  onEditBlock: (block: {
    blockId: string;
    day: number;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    description?: string;
  }) => Promise<void>;
  isLoadingVariants: boolean;
}

const blockTypes = [
  { value: 'WORK_SESSION', label: 'Work Session' },
  { value: 'ICEBREAKER', label: 'Icebreaker' },
  { value: 'MEAL', label: 'Meal' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'FREE_TIME', label: 'Free Time' },
  { value: 'TRAVEL', label: 'Travel' },
];

const TIME_OPTIONS = [
  '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
  '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM',
];

function getTypeColor(type: string) {
  switch (type) {
    case 'icebreaker':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'work_session':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'meal':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'activity':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function AgendaEditor({
  agenda,
  setAgenda,
  onRegenerate,
  onSave,
  onDeleteBlock,
  onAddBlock,
  onEditBlock,
  isLoadingVariants,
}: AgendaEditorProps) {
  const [activeDay, setActiveDay] = useState(agenda.days[0]?.day ?? 1);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: '',
    type: 'WORK_SESSION',
    startTime: '',
    endTime: '',
    description: '',
  });

  const [editingBlock, setEditingBlock] = useState<{ id: string; day: number } | null>(null);
  const [editBlock, setEditBlock] = useState({
    title: '',
    type: 'WORK_SESSION',
    startTime: '',
    endTime: '',
    description: '',
  });
  const [isEditingBlock, setIsEditingBlock] = useState(false);

  const resetAddBlockForm = () => {
    setNewBlock({
      title: '',
      type: 'WORK_SESSION',
      startTime: '',
      endTime: '',
      description: '',
    });
    setShowAddBlock(false);
  };

  const openEditModal = (block: AgendaBlock) => {
    const [startTime, endTime] = block.time.split(' - ');
    setEditingBlock({ id: block.id, day: activeDay });
    setEditBlock({
      title: block.title,
      type: block.type.toUpperCase(),
      startTime: startTime ?? '',
      endTime: endTime ?? '',
      description: block.desc || '',
    });
  };

  const handleEditBlockSubmit = async () => {
    if (isEditingBlock || !editingBlock || !editBlock.title || !editBlock.startTime || !editBlock.endTime) return;
    setIsEditingBlock(true);
    try {
      await onEditBlock({
        blockId: editingBlock.id,
        day: editingBlock.day,
        ...editBlock,
      });
      setEditingBlock(null);
    } finally {
      setIsEditingBlock(false);
    }
  };

  const resetEditForm = () => {
    setEditingBlock(null);
    setEditBlock({
      title: '',
      type: 'WORK_SESSION',
      startTime: '',
      endTime: '',
      description: '',
    });
  };

  const handleAddBlock = async () => {
    if (isAddingBlock || !newBlock.title || !newBlock.startTime || !newBlock.endTime)
      return;
    setIsAddingBlock(true);
    try {
      await onAddBlock({
        day: activeDay,
        title: newBlock.title,
        type: newBlock.type,
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        description: newBlock.description || undefined,
      });
      resetAddBlockForm();
    } finally {
      setIsAddingBlock(false);
    }
  };

  const currentDayIndex = agenda.days.findIndex((d) => d.day === activeDay);
  const currentDayData = agenda.days[currentDayIndex];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-kazan mb-2">Agenda Editor</h2>
          <p className="text-foggy">
            Editing {agenda.variant} agenda
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={onRegenerate}
            disabled={isLoadingVariants}
          >
            {isLoadingVariants ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}{' '}
            Regenerate All
          </Button>
          <Button variant="primary" onClick={onSave}>
            Save Agenda
          </Button>
        </div>
      </div>


      <div className="flex border-b border-light-gray overflow-x-auto">
        {agenda.days.map((d) => (
          <button
            key={d.day}
            className={`px-6 py-4 font-bold text-sm uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
              activeDay === d.day
                ? 'border-kazan text-kazan'
                : 'border-transparent text-foggy hover:text-kazan'
            }`}
            onClick={() => setActiveDay(d.day)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl space-y-4">
        {currentDayData?.blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 group"
            >
              <div className="w-32 pt-4 text-right shrink-0">
                <span className="text-sm font-bold text-foggy">{block.time}</span>
              </div>

              <Card className="flex-1 border border-light-gray shadow-none hover:shadow-resting transition-shadow relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-light-gray group-hover:bg-kazan transition-colors" />
                <CardContent className="p-5 pl-8">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-kazan">
                        {block.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getTypeColor(block.type)}`}
                      >
                        {block.type.replaceAll('_', ' ')}
                      </span>
                      <Sparkles size={14} className="text-babu" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content="Edit block" position="top">
                        <button className="p-1.5 text-foggy hover:text-kazan rounded-md hover:bg-bg-gray" onClick={() => openEditModal(block)}>
                          <Edit2 size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip content="Remove block" position="top">
                        <button
                          className="p-1.5 text-foggy hover:text-rausch rounded-md hover:bg-bg-gray"
                          onClick={() => onDeleteBlock(currentDayIndex, block.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>

                  {block.desc && (
                    <p className="text-foggy text-sm mb-4">{block.desc}</p>
                  )}

                  {block.restaurant && (
                    <div className="mt-4 p-4 bg-bg-gray rounded-btn border border-light-gray flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-md shrink-0 overflow-hidden">
                        <img
                          src={`https://picsum.photos/seed/${block.restaurant.name}/160/160`}
                          alt={block.restaurant.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-kazan">
                            {block.restaurant.name}
                          </h4>
                          <span className="text-sm font-bold">
                            {block.restaurant.rating} ★
                          </span>
                        </div>
                        <p className="text-sm text-foggy mb-2">
                          {block.restaurant.cuisine} &bull;{' '}
                          {block.restaurant.price} &bull;{' '}
                          {block.restaurant.distance}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {block.restaurant.dietary.map((d) => (
                            <span
                              key={d}
                              className="text-xs px-2 py-1 bg-white border border-light-gray rounded-pill text-foggy"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm italic text-kazan border-l-2 border-babu pl-3 py-1 bg-babu/5 rounded-r-md">
                          <Sparkles
                            size={12}
                            className="inline mr-1 text-babu"
                          />
                          {block.restaurant.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {block.activity && (
                    <div className="mt-4 p-4 bg-bg-gray rounded-btn border border-light-gray flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-md shrink-0 overflow-hidden">
                        <img
                          src={`https://picsum.photos/seed/${block.activity.name}/160/160`}
                          alt={block.activity.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-kazan mb-1">
                          {block.activity.name}
                        </h4>
                        <p className="text-sm text-foggy mb-2">
                          {block.activity.venue} &bull; {block.activity.duration}{' '}
                          &bull; {block.activity.capacity}
                        </p>
                        <p className="text-sm italic text-kazan border-l-2 border-babu pl-3 py-1 bg-babu/5 rounded-r-md">
                          <Sparkles
                            size={12}
                            className="inline mr-1 text-babu"
                          />
                          {block.activity.reason}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex justify-center py-2 opacity-0 hover:opacity-100 transition-opacity ml-36">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-pill gap-1"
                onClick={() => setShowAddBlock(true)}
              >
                <Plus size={14} /> Add Block
              </Button>
            </div>
          </React.Fragment>
        ))}

        <div className="ml-36 pt-4">
          <Button
            variant="secondary"
            className="w-full border-dashed gap-2 text-foggy hover:text-kazan"
            onClick={() => setShowAddBlock(true)}
          >
            <Plus size={18} /> Add Block
          </Button>
        </div>
      </div>

      {showAddBlock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-kazan/40 backdrop-blur-sm"
          onClick={resetAddBlockForm}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-card shadow-modal p-8 max-w-lg w-full mx-4 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-xl font-bold text-kazan mb-1">
                Add Agenda Block
              </h3>
              <p className="text-foggy text-sm">Adding to Day {activeDay}</p>
            </div>

            <div className="space-y-5">
              <Input
                label="Title"
                type="text"
                placeholder="e.g., Morning Strategy Session"
                value={newBlock.title}
                onChange={(e) =>
                  setNewBlock((b) => ({ ...b, title: e.target.value }))
                }
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                  Type
                </label>
                <select
                  className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                  value={newBlock.type}
                  onChange={(e) =>
                    setNewBlock((b) => ({ ...b, type: e.target.value }))
                  }
                >
                  {blockTypes.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                    Start Time
                  </label>
                  <select
                    className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                    value={newBlock.startTime}
                    onChange={(e) =>
                      setNewBlock((b) => ({ ...b, startTime: e.target.value }))
                    }
                  >
                    <option value="" disabled>Select time</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                    End Time
                  </label>
                  <select
                    className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                    value={newBlock.endTime}
                    onChange={(e) =>
                      setNewBlock((b) => ({ ...b, endTime: e.target.value }))
                    }
                  >
                    <option value="" disabled>Select time</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Textarea
                label="Description (optional)"
                placeholder="What will happen during this block?"
                value={newBlock.description}
                onChange={(e) =>
                  setNewBlock((b) => ({ ...b, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={resetAddBlockForm}
                disabled={isAddingBlock}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddBlock}
                disabled={
                  isAddingBlock ||
                  !newBlock.title ||
                  !newBlock.startTime ||
                  !newBlock.endTime
                }
              >
                {isAddingBlock ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" /> Add Block
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {editingBlock !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-kazan/40 backdrop-blur-sm"
          onClick={resetEditForm}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-card shadow-modal p-8 max-w-lg w-full mx-4 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-xl font-bold text-kazan mb-1">
                Edit Agenda Block
              </h3>
              <p className="text-foggy text-sm">Editing on Day {editingBlock.day}</p>
            </div>

            <div className="space-y-5">
              <Input
                label="Title"
                type="text"
                placeholder="e.g., Morning Strategy Session"
                value={editBlock.title}
                onChange={(e) =>
                  setEditBlock((b) => ({ ...b, title: e.target.value }))
                }
              />

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                  Type
                </label>
                <select
                  className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                  value={editBlock.type}
                  onChange={(e) =>
                    setEditBlock((b) => ({ ...b, type: e.target.value }))
                  }
                >
                  {blockTypes.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                    Start Time
                  </label>
                  <select
                    className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                    value={editBlock.startTime}
                    onChange={(e) =>
                      setEditBlock((b) => ({ ...b, startTime: e.target.value }))
                    }
                  >
                    <option value="" disabled>Select time</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                    End Time
                  </label>
                  <select
                    className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-base text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
                    value={editBlock.endTime}
                    onChange={(e) =>
                      setEditBlock((b) => ({ ...b, endTime: e.target.value }))
                    }
                  >
                    <option value="" disabled>Select time</option>
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Textarea
                label="Description (optional)"
                placeholder="What will happen during this block?"
                value={editBlock.description}
                onChange={(e) =>
                  setEditBlock((b) => ({ ...b, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={resetEditForm}
                disabled={isEditingBlock}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditBlockSubmit}
                disabled={
                  isEditingBlock ||
                  !editBlock.title ||
                  !editBlock.startTime ||
                  !editBlock.endTime
                }
              >
                {isEditingBlock ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
