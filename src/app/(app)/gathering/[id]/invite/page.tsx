'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, UserPlus, Send, Download, CheckCircle,
  XCircle, Clock, Loader2, Trash2, X, UserMinus,
  ClipboardList, Users, Eye, EyeOff, Plus, Type, ListChecks,
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TabKey = 'guests' | 'registration';

interface Guest {
  id: string;
  guestName: string;
  guestEmail: string;
  status: string;
  employee: { id: string; name: string; email: string; role: string } | null;
  dietary: string;
  tshirt: string;
  city: string;
}

interface GuestStats {
  total: number;
  notInvited: number;
  pending: number;
  accepted: number;
  declined: number;
}

interface RegistrationQuestion {
  id: string;
  label: string;
  type: string;
  options: string | null;
  required: boolean;
  visible: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export default function InvitationsPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('guests');

  // ── Guest list state ──
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats>({ total: 0, notInvited: 0, pending: 0, accepted: 0, declined: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);

  // ── Registration form state ──
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'text' | 'multiple_choice'>('text');
  const [newOptions, setNewOptions] = useState<string[]>(['']);
  const [newRequired, setNewRequired] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // ── Guest fetching ──
  const fetchGuests = useCallback(async () => {
    try {
      const [guestsRes, regRes] = await Promise.all([
        fetch(`/api/gatherings/${id}/guests`),
        fetch(`/api/gatherings/${id}/registrations`),
      ]);

      if (!guestsRes.ok) {
        const errData = await guestsRes.json().catch(() => ({}));
        addToast({ message: errData.error || 'Failed to load guest list', type: 'error' });
        return;
      }

      const guestsData = await guestsRes.json();
      const mapped: Guest[] = (guestsData.guests ?? []).map((g: {
        id: string;
        guestName: string;
        guestEmail: string;
        status: string;
        employee: { id: string; name: string; email: string; role: string } | null;
      }) => ({
        id: g.id,
        guestName: g.guestName,
        guestEmail: g.guestEmail,
        status: g.status.toLowerCase(),
        employee: g.employee,
        dietary: '-',
        tshirt: '-',
        city: '-',
      }));

      // Enrich with registration data
      if (regRes.ok) {
        const regData = await regRes.json();
        const registrations = regData.registrations as Array<{
          userId: string;
          dietaryRestrictions: string | null;
          tshirtSize: string | null;
          travelOriginCity: string | null;
        }>;

        const regByUser: Record<string, typeof registrations[number]> = {};
        for (const reg of registrations) {
          regByUser[reg.userId] = reg;
        }

        for (const guest of mapped) {
          if (guest.employee) {
            const reg = regByUser[guest.employee.id];
            if (reg) {
              guest.dietary = reg.dietaryRestrictions || '-';
              guest.tshirt = reg.tshirtSize || '-';
              guest.city = reg.travelOriginCity || '-';
            }
          }
        }
      }

      setGuests(mapped);
      setStats(guestsData.stats ?? { total: 0, notInvited: 0, pending: 0, accepted: 0, declined: 0 });
    } catch {
      addToast({ message: 'Failed to load guest list', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [id, addToast]);

  // ── Registration questions fetching ──
  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch(`/api/gatherings/${id}/registration-form`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      } else {
        addToast({ message: 'Failed to load form questions', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to load form questions', type: 'error' });
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchGuests();
    fetchQuestions();
  }, [fetchGuests, fetchQuestions]);

  // ── Guest handlers ──
  const handleAddGuest = async () => {
    setAddError('');
    if (!newName.trim()) { setAddError('Name is required'); return; }
    if (!EMAIL_REGEX.test(newEmail.trim())) { setAddError('Enter a valid email address'); return; }

    setIsAdding(true);
    try {
      const res = await fetch(`/api/gatherings/${id}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      });

      if (res.ok) {
        setNewName('');
        setNewEmail('');
        setShowAddModal(false);
        addToast({ message: 'Guest added to list', type: 'success' });
        await fetchGuests();
      } else {
        const data = await res.json();
        setAddError(data.error || 'Failed to add guest');
      }
    } catch {
      setAddError('Failed to add guest');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveGuest = async (guestId: string, name: string) => {
    try {
      const res = await fetch(`/api/gatherings/${id}/guests/${guestId}`, { method: 'DELETE' });
      if (res.ok) {
        addToast({ message: `Removed ${name}`, type: 'info' });
        setSelected((prev) => { const next = new Set(prev); next.delete(guestId); return next; });
        await fetchGuests();
      } else {
        const data = await res.json();
        addToast({ message: data.error || 'Failed to remove guest', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to remove guest', type: 'error' });
    }
  };

  const handleSend = async (sendAll: boolean) => {
    setIsSending(true);
    try {
      const body = sendAll
        ? { sendAll: true }
        : { guestIds: Array.from(selected) };

      const res = await fetch(`/api/gatherings/${id}/guests/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        addToast({ message: `${data.sent} invitation${data.sent !== 1 ? 's' : ''} sent!`, type: 'success' });
        setSelected(new Set());
        await fetchGuests();
      } else {
        const data = await res.json();
        addToast({ message: data.error || 'Failed to send invitations', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to send invitations', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSelect = (guestId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const notInvitedIds = guests.filter((g) => g.status === 'not_invited').map((g) => g.id);
    if (notInvitedIds.every((gid) => selected.has(gid))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notInvitedIds));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_invited': return <Badge variant="outline" className="gap-1"><UserMinus size={12} /> Not Invited</Badge>;
      case 'accepted': return <Badge variant="success" className="gap-1"><CheckCircle size={12} /> Accepted</Badge>;
      case 'declined': return <Badge variant="danger" className="gap-1"><XCircle size={12} /> Declined</Badge>;
      case 'pending': return <Badge variant="default" className="gap-1"><Clock size={12} /> Pending</Badge>;
      default: return null;
    }
  };

  const notInvitedIds = guests.filter((g) => g.status === 'not_invited').map((g) => g.id);
  const allNotInvitedSelected = notInvitedIds.length > 0 && notInvitedIds.every((gid) => selected.has(gid));
  const hasSelection = selected.size > 0;
  const hasNotInvited = stats.notInvited > 0;

  const handleExportCsv = () => {
    const headers = ['Name', 'Email', 'Status', 'Dietary', 'Size', 'Origin'];
    const rows = guests.map((g) => [
      g.guestName, g.guestEmail, g.status,
      g.status === 'accepted' ? g.dietary : '',
      g.status === 'accepted' ? g.tshirt : '',
      g.status === 'accepted' ? g.city : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Registration form handlers ──
  const handleToggleVisibility = async (questionId: string, currentVisible: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, visible: !currentVisible } : q))
    );

    try {
      const res = await fetch(`/api/gatherings/${id}/registration-form`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_visibility', questionId, visible: !currentVisible }),
      });
      if (!res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, visible: currentVisible } : q))
        );
        addToast({ message: 'Failed to update question', type: 'error' });
      }
    } catch {
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, visible: currentVisible } : q))
      );
      addToast({ message: 'Failed to update question', type: 'error' });
    }
  };

  const handleAddQuestion = async () => {
    if (!newLabel.trim()) return;

    const filteredOptions = newOptions.filter((o) => o.trim() !== '');
    if (newType === 'multiple_choice' && filteredOptions.length < 2) {
      addToast({ message: 'Multiple choice needs at least 2 options', type: 'error' });
      return;
    }

    setIsAddingQuestion(true);
    try {
      const res = await fetch(`/api/gatherings/${id}/registration-form`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_question',
          label: newLabel.trim(),
          type: newType,
          options: newType === 'multiple_choice' ? filteredOptions : undefined,
          required: newRequired,
        }),
      });

      if (res.ok) {
        setNewLabel('');
        setNewType('text');
        setNewOptions(['']);
        setNewRequired(false);
        setShowAddForm(false);
        addToast({ message: 'Question added', type: 'success' });
        await fetchQuestions();
      } else {
        const data = await res.json();
        addToast({ message: data.error || 'Failed to add question', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to add question', type: 'error' });
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/gatherings/${id}/registration-form`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_question', questionId }),
      });

      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        addToast({ message: 'Question removed', type: 'success' });
      } else {
        addToast({ message: 'Failed to remove question', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to remove question', type: 'error' });
    }
  };

  const addOption = () => setNewOptions((prev) => [...prev, '']);
  const removeOption = (index: number) => setNewOptions((prev) => prev.filter((_, i) => i !== index));
  const updateOption = (index: number, value: string) =>
    setNewOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={16} />;
      case 'multiple_choice': return <ListChecks size={16} />;
      default: return <Type size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text';
      case 'multiple_choice': return 'Multiple Choice';
      default: return type;
    }
  };

  const parseOptions = (options: string | null): string[] => {
    if (!options) return [];
    try { return JSON.parse(options); } catch { return []; }
  };

  const defaultQuestions = questions.filter((q) => q.isDefault);
  const customQuestions = questions.filter((q) => !q.isDefault);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-foggy" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <Link href={`/gathering/${id}`} className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> Back to Hub
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-kazan mb-2">Invitations & RSVPs</h1>
          <p className="text-foggy text-lg">Manage your guest list, track RSVPs, and customize the registration form.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-light-gray">
        <button
          onClick={() => setActiveTab('guests')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
            activeTab === 'guests'
              ? 'border-kazan text-kazan'
              : 'border-transparent text-foggy hover:text-kazan hover:border-light-gray'
          }`}
        >
          <Users size={16} /> Guest List
          {stats.total > 0 && (
            <span className="ml-1 text-xs bg-bg-gray text-foggy rounded-pill px-2 py-0.5">{stats.total}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('registration')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
            activeTab === 'registration'
              ? 'border-kazan text-kazan'
              : 'border-transparent text-foggy hover:text-kazan hover:border-light-gray'
          }`}
        >
          <ClipboardList size={16} /> Registration Form
        </button>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* Guest List Tab                              */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'guests' && (
        <>
          {/* Stats Cards */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Card className="flex-1 min-w-[120px] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">Not Invited</p>
                <p className="text-2xl font-bold text-foggy">{stats.notInvited}</p>
              </div>
              <UserMinus size={32} className="text-foggy/20" />
            </Card>
            <Card className="flex-1 min-w-[120px] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">Pending</p>
                <p className="text-2xl font-bold text-foggy">{stats.pending}</p>
              </div>
              <Clock size={32} className="text-foggy/20" />
            </Card>
            <Card className="flex-1 min-w-[120px] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">Accepted</p>
                <p className="text-2xl font-bold text-babu">{stats.accepted}</p>
              </div>
              <CheckCircle size={32} className="text-babu/20" />
            </Card>
            <Card className="flex-1 min-w-[120px] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">Declined</p>
                <p className="text-2xl font-bold text-rausch">{stats.declined}</p>
              </div>
              <XCircle size={32} className="text-rausch/20" />
            </Card>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button variant="primary" className="gap-2" onClick={() => setShowAddModal(true)}>
              <UserPlus size={18} /> Add Guest
            </Button>
            {hasNotInvited && (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => handleSend(true)}
                disabled={isSending}
                isLoading={isSending && !hasSelection}
              >
                <Send size={16} /> Send All Not Invited
              </Button>
            )}
            {hasSelection && (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => handleSend(false)}
                disabled={isSending}
                isLoading={isSending && hasSelection}
              >
                <Send size={16} /> Send to Selected ({selected.size})
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="secondary" size="sm" className="gap-2" onClick={handleExportCsv}>
              <Download size={16} /> Export CSV
            </Button>
          </div>

          {/* Guest List Table */}
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-gray/50 text-foggy border-b border-light-gray">
                  <tr>
                    <th className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={allNotInvitedSelected}
                        onChange={toggleSelectAll}
                        disabled={notInvitedIds.length === 0}
                        className="rounded border-light-gray text-kazan focus:ring-kazan"
                      />
                    </th>
                    <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs">Name</th>
                    <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                    <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs">Dietary</th>
                    <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs">Size</th>
                    <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs">Origin</th>
                    <th className="px-4 py-4 font-bold uppercase tracking-wider text-xs w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-gray">
                  {guests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-foggy">
                        No guests yet. Click &quot;Add Guest&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    guests.map((guest) => (
                      <tr key={guest.id} className="hover:bg-bg-gray/50 transition-colors">
                        <td className="px-4 py-4">
                          {guest.status === 'not_invited' && (
                            <input
                              type="checkbox"
                              checked={selected.has(guest.id)}
                              onChange={() => toggleSelect(guest.id)}
                              className="rounded border-light-gray text-kazan focus:ring-kazan"
                            />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-kazan">{guest.guestName}</p>
                          <p className="text-foggy text-xs">{guest.guestEmail}</p>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(guest.status)}</td>
                        <td className="px-4 py-4 text-foggy">{guest.status === 'accepted' ? guest.dietary : '-'}</td>
                        <td className="px-4 py-4 text-foggy">{guest.status === 'accepted' ? guest.tshirt : '-'}</td>
                        <td className="px-4 py-4 text-foggy">{guest.status === 'accepted' ? guest.city : '-'}</td>
                        <td className="px-4 py-4">
                          {guest.status === 'not_invited' && (
                            <button
                              onClick={() => handleRemoveGuest(guest.id, guest.guestName)}
                              className="text-foggy hover:text-rausch transition-colors p-1"
                              title="Remove guest"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* Registration Form Tab                       */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'registration' && (
        <div className="max-w-[800px]">
          {isLoadingQuestions ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-foggy" />
            </div>
          ) : (
            <>
              <p className="text-foggy text-lg mb-8">Customize the questions guests see when registering.</p>

              {/* Default Questions */}
              <div className="mb-10">
                <h2 className="text-sm font-bold text-foggy uppercase tracking-wider mb-4">Default Questions</h2>
                <div className="space-y-3">
                  {defaultQuestions.map((question) => (
                    <Card key={question.id} className={`transition-opacity ${!question.visible ? 'opacity-50' : ''}`}>
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-2 bg-bg-gray rounded-btn text-foggy">
                          {getTypeIcon(question.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-kazan">{question.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-foggy">{getTypeLabel(question.type)}</span>
                            {question.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                            {question.options && (
                              <span className="text-xs text-foggy">
                                {parseOptions(question.options).length} options
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleVisibility(question.id, question.visible)}
                          className={`p-2 rounded-btn transition-colors ${
                            question.visible
                              ? 'text-babu hover:bg-babu/10'
                              : 'text-foggy hover:bg-bg-gray'
                          }`}
                          title={question.visible ? 'Hide question' : 'Show question'}
                        >
                          {question.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Questions */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foggy uppercase tracking-wider">Custom Questions</h2>
                  <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowAddForm(true)}>
                    <Plus size={16} /> Add Question
                  </Button>
                </div>

                {customQuestions.length === 0 && !showAddForm ? (
                  <Card className="bg-bg-gray border-none shadow-none">
                    <CardContent className="p-8 text-center">
                      <p className="text-foggy">No custom questions yet. Add one to collect additional info from guests.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {customQuestions.map((question) => (
                      <Card key={question.id}>
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="p-2 bg-bg-gray rounded-btn text-foggy">
                            {getTypeIcon(question.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-kazan">{question.label}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-foggy">{getTypeLabel(question.type)}</span>
                              {question.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                              {question.options && (
                                <span className="text-xs text-foggy">
                                  {parseOptions(question.options).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleVisibility(question.id, question.visible)}
                            className={`p-2 rounded-btn transition-colors ${
                              question.visible
                                ? 'text-babu hover:bg-babu/10'
                                : 'text-foggy hover:bg-bg-gray'
                            }`}
                            title={question.visible ? 'Hide question' : 'Show question'}
                          >
                            {question.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 rounded-btn text-foggy hover:text-rausch hover:bg-rausch/10 transition-colors"
                            title="Delete question"
                          >
                            <Trash2 size={18} />
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Add Question Form */}
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <Card className="mt-4 border-2 border-kazan/20">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">New Question</CardTitle>
                            <button onClick={() => { setShowAddForm(false); setNewLabel(''); setNewType('text'); setNewOptions(['']); setNewRequired(false); }} className="text-foggy hover:text-kazan">
                              <X size={20} />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <Input
                            label="Question Text"
                            placeholder="e.g., What topics would you like to discuss?"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                          />

                          <div>
                            <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-3 block">Answer Type</label>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setNewType('text')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-colors border ${
                                  newType === 'text' ? 'bg-kazan text-white border-kazan' : 'bg-white text-kazan border-light-gray hover:border-kazan'
                                }`}
                              >
                                <Type size={16} /> Text
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewType('multiple_choice')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium transition-colors border ${
                                  newType === 'multiple_choice' ? 'bg-kazan text-white border-kazan' : 'bg-white text-kazan border-light-gray hover:border-kazan'
                                }`}
                              >
                                <ListChecks size={16} /> Multiple Choice
                              </button>
                            </div>
                          </div>

                          {newType === 'multiple_choice' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                              <label className="text-xs font-bold text-foggy uppercase tracking-wider block">Options</label>
                              {newOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                  <Input
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                  />
                                  {newOptions.length > 1 && (
                                    <button onClick={() => removeOption(i)} className="text-foggy hover:text-rausch p-2">
                                      <X size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={addOption}
                                className="text-sm text-kazan hover:underline font-medium"
                              >
                                + Add option
                              </button>
                            </motion.div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={newRequired}
                                onClick={() => setNewRequired(!newRequired)}
                                className={`w-10 h-6 rounded-pill p-0.5 transition-colors ${newRequired ? 'bg-babu' : 'bg-light-gray'}`}
                              >
                                <div className={`w-5 h-5 bg-white rounded-pill shadow-sm transition-transform ${newRequired ? 'translate-x-4' : 'translate-x-0'}`} />
                              </button>
                              <span className="text-sm font-medium text-kazan">Required</span>
                            </label>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-light-gray">
                            <Button variant="secondary" onClick={() => { setShowAddForm(false); setNewLabel(''); setNewType('text'); setNewOptions(['']); setNewRequired(false); }}>
                              Cancel
                            </Button>
                            <Button variant="primary" onClick={handleAddQuestion} isLoading={isAddingQuestion} disabled={!newLabel.trim()}>
                              Add Question
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Guest Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-kazan/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-card shadow-modal p-8 max-w-md w-full mx-4 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-kazan">Add Guest</h3>
                <button onClick={() => { setShowAddModal(false); setAddError(''); setNewName(''); setNewEmail(''); }} className="text-foggy hover:text-kazan">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  error={addError}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => { setShowAddModal(false); setAddError(''); setNewName(''); setNewEmail(''); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddGuest} isLoading={isAdding} disabled={!newName.trim() || !newEmail.trim()}>
                  Add Guest
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
