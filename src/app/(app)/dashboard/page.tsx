'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { Plus, Calendar, MapPin, Users, Sparkles, Search, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

// Shape returned by GET /api/gatherings
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
  createdBy: { id: string; name: string; email: string };
  moduleStatuses: { module: string; status: string }[];
  budget_detail: { accommodation: number; food: number; activities: number; swag: number; travel: number } | null;
  _count: { invitations: number; registrations: number };
  // Included for employee role queries
  invitations?: { id: string; status: string; gatheringId: string; gathering: { createdBy: { name: string } } }[];
}

// Display-friendly shape used by rendering code
interface DisplayGathering {
  id: string;
  title: string;
  type: string;
  dates: string;
  location: string;
  groupSize: number;
  status: string;
}

// Invitation shape for employee view
interface DisplayInvitation {
  id: string;
  gatheringId: string;
  invitedBy: string;
  status: string;
}

// City skyline/downtown photos from Unsplash
const CITY_IMAGES: Record<string, string> = {
  'austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?q=80&w=1200&auto=format&fit=crop',
  'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1200&auto=format&fit=crop',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop',
  'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?q=80&w=1200&auto=format&fit=crop',
};

function getCityImage(location: string): string {
  const loc = location.toLowerCase();
  for (const [city, url] of Object.entries(CITY_IMAGES)) {
    if (loc.includes(city)) return url;
  }
  return `https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=1200&auto=format&fit=crop`;
}

function formatDates(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${format(start, 'MMM d')}-${format(end, 'd, yyyy')}`;
}

function toDisplayGathering(g: ApiGathering): DisplayGathering {
  return {
    id: g.id,
    title: g.title,
    type: g.type.toLowerCase(),
    dates: formatDates(g.startDate, g.endDate),
    location: g.location,
    groupSize: g.groupSize,
    status: g.status.toLowerCase(),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const role = user?.defaultRole || 'employee';

  const [gatherings, setGatherings] = useState<DisplayGathering[]>([]);
  const [invitations, setInvitations] = useState<DisplayInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchGatherings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/gatherings');
      if (!res.ok) {
        throw new Error('Failed to fetch gatherings');
      }
      const data: ApiGathering[] = await res.json();

      setGatherings(data.map(toDisplayGathering));

      // For employees, extract invitation data from the response
      if (role === 'employee') {
        const invs: DisplayInvitation[] = [];
        for (const g of data) {
          if (g.invitations && g.invitations.length > 0) {
            for (const inv of g.invitations) {
              invs.push({
                id: inv.id,
                gatheringId: inv.gatheringId,
                invitedBy: inv.gathering.createdBy.name,
                status: inv.status.toLowerCase(),
              });
            }
          }
        }
        setInvitations(invs);
      }
    } catch {
      addToast({ message: 'Failed to load gatherings', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [role, addToast]);

  useEffect(() => {
    fetchGatherings();
  }, [fetchGatherings]);

  const filteredGatherings = useMemo(() => {
    return gatherings.filter(g => {
      const matchesSearch = !searchQuery ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [gatherings, searchQuery, statusFilter]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="active">Active</Badge>;
      case 'completed': return <Badge variant="completed">Completed</Badge>;
      case 'draft': return <Badge variant="draft">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDaysUntil = (dateStr: string): string => {
    const match = dateStr.match(/(\w+)\s+(\d+)/);
    if (!match) return '';
    try {
      const year = dateStr.match(/\d{4}/)?.[0] || '2026';
      const target = new Date(`${match[1]} ${match[2]}, ${year}`);
      const now = new Date();
      const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) return 'Past';
      if (days === 0) return 'Today';
      if (days === 1) return 'Tomorrow';
      return `In ${days} days`;
    } catch { return ''; }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  };

  const respondToInvitation = async (invitationId: string, gatheringId: string, response: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/gatherings/${gatheringId}/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: response.toUpperCase() }),
      });
      if (!res.ok) {
        throw new Error('Failed to respond to invitation');
      }
      // Update local state
      setInvitations(prev =>
        prev.map(inv => inv.id === invitationId ? { ...inv, status: response } : inv)
      );
    } catch {
      addToast({ message: 'Failed to respond to invitation', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-pill border-4 border-light-gray border-t-rausch animate-spin" />
          <p className="text-foggy text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderManagerView = () => (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-hero bg-kazan text-white p-8 md:p-10 flex flex-col justify-center min-h-[200px]"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover opacity-40"
            loading="lazy"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-kazan/90 to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge variant="glass" className="mb-6">
            <Sparkles size={14} className="mr-1" /> Manager Dashboard
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Where to next, {firstName}?
          </h1>
          <p className="text-base text-white/80 mb-6 max-w-lg">
            Design unforgettable team experiences. Plan offsites, align on strategy, and bring your people together.
          </p>
          <Tooltip content="Start planning a new team gathering" position="right">
            <Button
              size="lg"
              onClick={() => router.push('/gathering/new')}
              className="bg-rausch hover:bg-rausch/90 text-white border-none text-lg px-8 py-6 rounded-pill shadow-elevated gap-2 transition-transform hover:scale-105"
            >
              <Plus size={24} />
              Create New Gathering
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-kazan">Your Gatherings</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foggy" />
            <input
              type="text"
              placeholder="Search gatherings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-light-gray rounded-btn bg-white text-sm text-kazan placeholder:text-foggy focus:outline-none focus:ring-2 focus:ring-kazan"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-light-gray rounded-btn px-4 py-2 text-sm bg-white font-medium text-kazan focus:outline-none focus:ring-2 focus:ring-kazan"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGatherings.length === 0 ? (
          <div className="col-span-full text-center py-12 text-foggy">
            <p className="text-lg">No gatherings match your search.</p>
          </div>
        ) : (
          filteredGatherings.map((g) => {
            const daysUntil = isClient ? getDaysUntil(g.dates) : '';
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer"
                onClick={() => router.push(`/gathering/${g.id}`)}
              >
                <div className="relative aspect-[4/3] rounded-card overflow-hidden mb-4 bg-bg-gray">
                  <img
                    src={getCityImage(g.location)}
                    alt={g.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={handleImageError}
                  />
                  <div className="absolute top-4 left-4">
                    {getStatusBadge(g.status)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-kazan text-lg leading-tight group-hover:text-rausch transition-colors line-clamp-1">{g.title}</h3>
                    {daysUntil && (
                      <span className="text-xs font-medium text-babu shrink-0 ml-2">{daysUntil}</span>
                    )}
                  </div>
                  <p className="text-foggy">{g.location}</p>
                  <p className="text-foggy">{g.dates}</p>
                  <p className="text-kazan font-medium mt-1"><span className="font-bold">{g.groupSize}</span> attendees</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderEmployeeView = () => {
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

    return (
      <div className="space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-hero bg-babu text-white p-10 md:p-16 flex flex-col justify-center min-h-[360px]"
        >
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
              alt=""
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              loading="lazy"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-babu/90 to-transparent" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <Badge variant="glass" className="mb-6">
              <Sparkles size={14} className="mr-1" /> Team Member
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Ready for your next adventure, {firstName}?
            </h1>
            <p className="text-xl text-white/90 max-w-lg">
              {pendingInvitations.length > 0
                ? `You have ${pendingInvitations.length} new invitation${pendingInvitations.length > 1 ? 's' : ''} waiting. Pack your bags!`
                : "No pending invitations right now. Check back soon!"}
            </p>
          </div>
        </motion.div>

        {pendingInvitations.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-kazan mb-6">Your Invitations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingInvitations.map(inv => {
                const gathering = gatherings.find(g => g.id === inv.gatheringId);
                if (!gathering) return null;
                return (
                  <motion.div key={inv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="overflow-hidden border-none shadow-elevated hover:shadow-modal transition-shadow group">
                      <div className="flex flex-col sm:flex-row h-full">
                        <div className="sm:w-2/5 relative h-48 sm:h-auto">
                          <img src={getCityImage(gathering.location)} className="w-full h-full object-cover" alt={gathering.title} loading="lazy" onError={handleImageError} />
                          <div className="absolute top-4 left-4">
                            <Badge variant="danger-solid">Action Required</Badge>
                          </div>
                        </div>
                        <div className="sm:w-3/5 p-6 flex flex-col justify-between">
                          <div>
                            <p className="text-sm font-bold text-foggy uppercase tracking-wider mb-1">Invited by {inv.invitedBy}</p>
                            <h3 className="text-2xl font-bold text-kazan mb-3 group-hover:text-rausch transition-colors">{gathering.title}</h3>
                            <div className="space-y-2 mb-6">
                              <div className="flex items-center text-foggy gap-2"><Calendar size={18} /><span>{gathering.dates}</span></div>
                              <div className="flex items-center text-foggy gap-2"><MapPin size={18} /><span>{gathering.location}</span></div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              variant="primary"
                              className="flex-1 bg-kazan hover:bg-kazan/90"
                              onClick={() => {
                                respondToInvitation(inv.id, gathering.id, 'accepted');
                                addToast({ message: `Accepted invitation to ${gathering.title}!`, type: 'success' });
                                router.push(`/gathering/${gathering.id}/register`);
                              }}
                            >Accept</Button>
                            <Button
                              variant="secondary"
                              className="px-4"
                              onClick={() => {
                                respondToInvitation(inv.id, gathering.id, 'declined');
                                addToast({
                                  message: `Declined invitation to ${gathering.title}`,
                                  type: 'info',
                                });
                              }}
                            >Decline</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-3xl font-bold text-kazan mb-8">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {gatherings.filter(g => g.status === 'active').map((g) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer"
                onClick={() => router.push(`/gathering/${g.id}/register`)}
              >
                <div className="relative aspect-[4/3] rounded-card overflow-hidden mb-4 bg-bg-gray">
                  <img src={getCityImage(g.location)} alt={g.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={handleImageError} />
                  <div className="absolute top-4 left-4">
                    <Badge variant="active" className="gap-1"><CheckCircle size={14} /> Registered</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-kazan text-lg leading-tight group-hover:text-babu transition-colors line-clamp-1">{g.title}</h3>
                  <p className="text-foggy">{g.location}</p>
                  <p className="text-foggy">{g.dates}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderAdminView = () => (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-hero bg-hof text-white p-10 md:p-16 flex flex-col justify-center min-h-[300px]"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-hof to-hof/80 z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge variant="glass" className="mb-6">
            <Sparkles size={14} className="mr-1" /> System Admin
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-4">Platform Overview</h1>
          <p className="text-xl text-white/80 max-w-lg">
            Monitor gathering activity, manage permissions, and oversee organizational spend.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Gatherings", value: "24", trend: "+12% YoY" },
          { label: "Active Users", value: "1,204", trend: "+5% MoM" },
          { label: "Total Spend", value: "$1.2M", trend: "On budget" },
          { label: "Avg. Satisfaction", value: "4.8/5", trend: "Top tier" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6 rounded-card border border-light-gray bg-white hover:shadow-elevated transition-shadow"
          >
            <p className="text-foggy text-sm font-medium mb-2">{stat.label}</p>
            <h3 className="text-3xl font-bold text-kazan mb-1">{stat.value}</h3>
            <span className="text-sm text-babu font-medium">{stat.trend}</span>
          </motion.div>
        ))}
      </div>

      <Card className="overflow-hidden border-none shadow-elevated">
        <div className="p-6 border-b border-light-gray flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <h3 className="text-xl font-bold text-kazan">All Gatherings</h3>
          <div className="flex gap-3 w-full sm:w-auto">
            <select className="flex-1 sm:flex-none border border-light-gray rounded-pill px-4 py-2 text-sm bg-white font-medium text-kazan focus:outline-none focus:border-kazan focus:ring-1 focus:ring-kazan">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Draft</option>
            </select>
            <select className="flex-1 sm:flex-none border border-light-gray rounded-pill px-4 py-2 text-sm bg-white font-medium text-kazan focus:outline-none focus:border-kazan focus:ring-1 focus:ring-kazan">
              <option>All Locations</option>
              <option>Austin, TX</option>
              <option>San Francisco, CA</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-gray text-foggy border-b border-light-gray">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Title</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Dates</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Location</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Attendees</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-gray bg-white">
              {gatherings.map((g) => (
                <tr key={g.id} className="hover:bg-bg-gray/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-kazan group-hover:text-rausch transition-colors">{g.title}</td>
                  <td className="px-6 py-5 text-foggy">{g.dates}</td>
                  <td className="px-6 py-5 text-foggy">{g.location}</td>
                  <td className="px-6 py-5 text-foggy">{g.groupSize}</td>
                  <td className="px-6 py-5">{getStatusBadge(g.status)}</td>
                  <td className="px-6 py-5">
                    <Button variant="text" size="sm" className="font-bold" onClick={() => router.push(`/gathering/${g.id}`)}>View Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {role === 'manager' && renderManagerView()}
        {role === 'employee' && renderEmployeeView()}
        {role === 'admin' && renderAdminView()}
      </motion.div>
    </div>
  );
}
