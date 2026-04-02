'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { Calendar, MapPin, Users, CheckCircle, Clock, Home, Gift, Mail, ArrowLeft, DollarSign, Trash2, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

type ModuleKey = 'agenda' | 'accommodation' | 'swag' | 'invitations' | 'equipment';

const budgetColors: Record<string, string> = {
  accommodation: 'bg-rausch',
  food: 'bg-arches',
  activities: 'bg-babu',
  swag: 'bg-purple-500',
  travel: 'bg-kazan',
  equipment: 'bg-emerald-500',
};

// Shape returned by GET /api/gatherings/[id]
interface ApiGathering {
  id: string;
  title: string;
  type: string;
  location: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  status: string;
  purpose?: string;
  teamContext?: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  createdBy: { id: string; name: string; email: string };
  moduleStatuses: { module: string; status: string }[];
  budget_detail: { accommodation: number; food: number; activities: number; swag: number; travel: number } | null;
  _count: { invitations: number; registrations: number };
}

export default function GatheringHubPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const role = user?.defaultRole || 'employee';

  const [gathering, setGathering] = useState<ApiGathering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchGathering() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/gatherings/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch gathering');
        }
        const data: ApiGathering = await res.json();
        setGathering(data);
      } catch {
        addToast({ message: 'Failed to load gathering details', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchGathering();
  }, [id, addToast]);

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gatherings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      addToast({ message: 'Gathering deleted', type: 'success' });
      router.push('/dashboard');
    } catch {
      addToast({ message: 'Failed to delete gathering', type: 'error' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-pill border-4 border-light-gray border-t-rausch animate-spin" />
          <p className="text-foggy text-lg">Loading gathering details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !gathering) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-kazan mb-4">Gathering not found</h2>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  // Convert moduleStatuses array to Record for easy lookup
  const gatheringModules = gathering.moduleStatuses.reduce((acc, ms) => {
    acc[ms.module as ModuleKey] = ms.status;
    return acc;
  }, {} as Record<ModuleKey, string>);

  // Ensure all modules have a status
  const defaultModules: Record<ModuleKey, string> = { agenda: 'pending', accommodation: 'pending', swag: 'pending', invitations: 'pending', equipment: 'pending' };
  const moduleStatusMap = { ...defaultModules, ...gatheringModules };

  const budget = gathering.budget_detail || { accommodation: 0, food: 0, activities: 0, swag: 0, travel: 0 };
  const budgetEntries = Object.entries(budget).filter(([key]) => key !== 'id' && key !== 'gatheringId') as [string, number][];
  const budgetTotal = budgetEntries.reduce((a, [, b]) => a + b, 0);

  // Format dates for display
  const displayDates = (() => {
    try {
      const start = new Date(gathering.startDate);
      const end = new Date(gathering.endDate);
      return `${format(start, 'MMM d')}-${format(end, 'd, yyyy')}`;
    } catch {
      return 'TBD';
    }
  })();

  const displayStatus = gathering.status.toLowerCase();
  const displayType = gathering.type.toLowerCase().replaceAll('_', ' ');

  const isVirtualGathering = gathering.location === 'Virtual';

  const allModules: { id: ModuleKey; title: string; desc: string; icon: typeof Calendar; path: string }[] = [
    { id: 'agenda', title: 'Agenda Builder', desc: 'Create your event agenda with AI assistance', icon: Calendar, path: `/gathering/${id}/agenda` },
    { id: 'accommodation', title: 'Accommodation', desc: 'Browse and book Airbnb stays', icon: Home, path: `/gathering/${id}/accommodation` },
    { id: 'equipment', title: 'Vendors & Equipment', desc: 'AI-powered equipment checklist', icon: Wrench, path: `/gathering/${id}/vendors` },
    { id: 'invitations', title: 'Invitations', desc: 'Manage guests and track RSVPs', icon: Mail, path: `/gathering/${id}/invite` },
  ];

  const modules = allModules.filter(mod => {
    if (mod.id === 'accommodation' && isVirtualGathering) return false;
    return true;
  });

  const getModuleStatusBadge = (status: string) => {
    switch (status) {
      case 'complete': return <Badge variant="active">Complete</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      default: return <Badge variant="default">Pending</Badge>;
    }
  };

  const progressSteps = [
    { label: 'Purpose', status: 'complete' as const },
    { label: 'Agenda', status: moduleStatusMap.agenda },
    ...(!isVirtualGathering ? [{ label: 'Accommodation', status: moduleStatusMap.accommodation }] : []),
    { label: 'Equipment', status: moduleStatusMap.equipment },
    { label: 'Invitations', status: moduleStatusMap.invitations },
  ];

  const completedSteps = progressSteps.filter(s => s.status === 'complete').length;

  const rsvpCount = gathering._count.invitations;

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12 space-y-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/dashboard" className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Badge variant={displayStatus === 'active' ? 'active' : displayStatus === 'completed' ? 'completed' : 'draft'}>
                {gathering.status}
              </Badge>
              <span className="text-sm font-bold text-foggy uppercase tracking-wider">
                {displayType}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-kazan mb-4">{gathering.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-foggy text-lg">
              <div className="flex items-center gap-2"><Calendar size={20} /> {displayDates}{gathering.dailyStartTime && gathering.dailyEndTime ? ` | ${gathering.dailyStartTime} - ${gathering.dailyEndTime}` : ''}</div>
              <div className="flex items-center gap-2"><MapPin size={20} /> {gathering.location}</div>
              <div className="flex items-center gap-2"><Users size={20} /> {gathering.groupSize} attendees</div>
            </div>
          </div>

          {role === 'manager' && (
            <div className="flex gap-3">
              <Link
                href={`/gathering/${id}/edit`}
                className="inline-flex items-center justify-center rounded-btn font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan bg-white text-kazan border border-kazan hover:bg-bg-gray h-12 px-6 text-base"
              >
                Edit Details
              </Link>
              {displayStatus === 'draft' && (
                <Button variant="primary">Publish Gathering</Button>
              )}
            </div>
          )}

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-kazan/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-card shadow-modal p-8 max-w-md mx-4 space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-kazan mb-2">Delete this gathering?</h3>
                  <p className="text-foggy">This will permanently remove &ldquo;{gathering.title}&rdquo; and all associated data. This action cannot be undone.</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button onClick={handleDelete} disabled={isDeleting} className="!bg-rausch hover:!bg-[#E04E53]">
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {role === 'manager' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foggy uppercase tracking-wider">Planning Progress</h3>
              <span className="text-sm text-foggy">{completedSteps}/{progressSteps.length} complete</span>
            </div>
            <div className="flex items-center justify-between bg-white border border-light-gray rounded-pill p-2 px-6 shadow-resting overflow-x-auto">
              {progressSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3 shrink-0">
                  <Tooltip content={`${step.label}: ${step.status.replaceAll('_', ' ')}`} position="top">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-pill ${
                      step.status === 'complete' ? 'bg-babu text-white' :
                      step.status === 'in_progress' ? 'bg-arches/20 text-arches' :
                      'bg-bg-gray text-foggy'
                    }`}>
                      {step.status === 'complete' ? <CheckCircle size={16} /> :
                       step.status === 'in_progress' ? <Clock size={16} /> :
                       <span className="text-sm font-bold">{i + 1}</span>}
                    </div>
                  </Tooltip>
                  <span className={`font-medium ${step.status === 'complete' ? 'text-kazan' : step.status === 'in_progress' ? 'text-arches' : 'text-foggy'}`}>{step.label}</span>
                  {i < progressSteps.length - 1 && <div className="w-8 h-px bg-light-gray mx-4 hidden md:block"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-min">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const status = moduleStatusMap[mod.id];
              return (
                <Card
                  key={mod.id}
                  className="cursor-pointer hover:shadow-elevated transition-all border-2 border-transparent hover:border-light-gray"
                  onClick={() => router.push(mod.path)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2.5 bg-bg-gray rounded-pill text-kazan">
                        <Icon size={20} />
                      </div>
                      {getModuleStatusBadge(status)}
                    </div>
                    <CardTitle className="text-lg">{mod.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-foggy text-sm">{mod.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-6">
            <Card className="bg-bg-gray border-none shadow-none">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foggy">RSVPs</span>
                    <span className="font-bold text-kazan">{rsvpCount} / {gathering.groupSize}</span>
                  </div>
                  <div className="w-full bg-light-gray rounded-pill h-2">
                    <div className="bg-babu h-2 rounded-pill" style={{ width: `${gathering.groupSize > 0 ? Math.min(100, (rsvpCount / gathering.groupSize) * 100) : 0}%` }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-light-gray">
                  <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-3">Dietary Restrictions</p>
                  <p className="text-sm text-kazan italic">No data yet. Send invitations to collect dietary needs.</p>
                </div>

                <div className="pt-4 border-t border-light-gray">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-foggy" />
                    <p className="text-sm font-bold text-foggy uppercase tracking-wider">Estimated Budget</p>
                  </div>
                  {budgetTotal > 0 ? (
                    <div className="space-y-3">
                      {budgetEntries.map(([key, val]) => {
                        if (val === 0) return null;
                        const pct = (val / budgetTotal) * 100;
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-foggy capitalize">{key}</span>
                              <span className="font-medium text-kazan">${val.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-light-gray rounded-pill h-1.5">
                              <div className={`${budgetColors[key] || 'bg-kazan'} h-1.5 rounded-pill`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-3 mt-3 border-t border-light-gray flex justify-between items-center">
                        <span className="font-bold text-kazan">Total</span>
                        <span className="text-2xl font-bold text-kazan">${budgetTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-kazan">$0</p>
                      <p className="text-xs text-foggy mt-1">Based on current selections</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-elevated transition-all border border-light-gray hover:border-kazan/30"
              onClick={() => router.push(`/gathering/${id}/swag`)}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 bg-purple-50 rounded-pill text-purple-600">
                  <Gift size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-kazan text-sm">Swag Shop</p>
                  <p className="text-foggy text-xs">Order branded items for your team</p>
                </div>
                {getModuleStatusBadge(moduleStatusMap.swag)}
              </CardContent>
            </Card>

            {role === 'manager' && displayStatus === 'draft' && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-btn font-semibold text-foggy hover:text-rausch hover:bg-rausch/5 transition-colors h-12 px-6 text-sm"
              >
                <Trash2 size={16} /> Delete Draft
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
