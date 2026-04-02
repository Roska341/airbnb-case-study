'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface GatheringDetail {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
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

// Map default question labels to their form field keys
const DEFAULT_FIELD_MAP: Record<string, string> = {
  'Dietary Restrictions': 'dietaryRestrictions',
  'T-Shirt Size': 'tshirtSize',
  'Travel Origin City': 'travelOriginCity',
  'Need Lodging?': 'needsLodging',
  'Additional Notes / Accessibility Needs': 'additionalNotes',
};

export default function RegistrationPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [gathering, setGathering] = useState<GatheringDetail | null>(null);
  const [questions, setQuestions] = useState<RegistrationQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<Record<string, string | boolean | string[]>>({
    dietaryRestrictions: [],
    otherDietary: '',
    tshirtSize: '',
    travelOriginCity: '',
    needsLodging: false,
    additionalNotes: '',
  });

  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [gatheringRes, formRes] = await Promise.all([
          fetch(`/api/gatherings/${id}`),
          fetch(`/api/gatherings/${id}/registration-form`),
        ]);

        if (gatheringRes.ok) {
          setGathering(await gatheringRes.json());
        } else {
          addToast({ message: 'Failed to load gathering details', type: 'error' });
        }

        if (formRes.ok) {
          const formData = await formRes.json();
          setQuestions(formData.questions.filter((q: RegistrationQuestion) => q.visible));
        }
      } catch {
        addToast({ message: 'Failed to load registration form', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, addToast]);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut Allergy', 'Dairy-Free', 'Halal', 'Kosher', 'None', 'Other'];
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const toggleDietary = (option: string) => {
    if (option === 'None') {
      setFormData((prev) => ({ ...prev, dietaryRestrictions: ['None'], otherDietary: '' }));
      return;
    }
    setFormData((prev) => {
      const current = prev.dietaryRestrictions as string[];
      const newDietary = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current.filter((o) => o !== 'None'), option];
      return { ...prev, dietaryRestrictions: newDietary };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dietary = formData.dietaryRestrictions as string[];
      const dietaryValue = dietary.includes('Other') && formData.otherDietary
        ? [...dietary.filter((d) => d !== 'Other'), formData.otherDietary as string].join(', ')
        : dietary.join(', ');

      const res = await fetch(`/api/gatherings/${id}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietaryRestrictions: dietaryValue,
          tshirtSize: formData.tshirtSize,
          travelOriginCity: formData.travelOriginCity,
          needsLodging: formData.needsLodging,
          additionalNotes: formData.additionalNotes,
          customResponses: Object.keys(customResponses).length > 0 ? JSON.stringify(customResponses) : undefined,
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        addToast({ message: data.error || 'Failed to submit registration', type: 'error' });
      }
    } catch {
      addToast({ message: 'Failed to submit registration', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch {
      return '';
    }
  };

  const parseOptions = (options: string | null): string[] => {
    if (!options) return [];
    try { return JSON.parse(options); } catch { return []; }
  };

  // Check if form is valid
  const isFormValid = () => {
    for (const q of questions) {
      if (!q.required) continue;
      const fieldKey = DEFAULT_FIELD_MAP[q.label];
      if (fieldKey) {
        // Default question validation
        if (fieldKey === 'dietaryRestrictions') {
          if ((formData.dietaryRestrictions as string[]).length === 0) return false;
        } else if (fieldKey === 'tshirtSize') {
          if (!formData.tshirtSize) return false;
        } else if (fieldKey === 'travelOriginCity') {
          if (!formData.travelOriginCity) return false;
        }
      } else if (!q.isDefault) {
        // Custom question validation
        if (!customResponses[q.id]?.trim()) return false;
      }
    }
    return true;
  };

  const renderDefaultQuestion = (question: RegistrationQuestion) => {
    const fieldKey = DEFAULT_FIELD_MAP[question.label];
    if (!fieldKey) return null;

    switch (fieldKey) {
      case 'dietaryRestrictions':
        return (
          <div key={question.id} className="pt-6 border-t border-light-gray">
            <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-4 block">
              {question.label} {question.required && <span className="text-rausch">*</span>}
            </label>
            <div className="flex flex-wrap gap-3 mb-4">
              {dietaryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleDietary(option)}
                  aria-pressed={(formData.dietaryRestrictions as string[]).includes(option)}
                  className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors border ${
                    (formData.dietaryRestrictions as string[]).includes(option)
                      ? 'bg-kazan text-white border-kazan'
                      : 'bg-white text-kazan border-light-gray hover:border-kazan'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {(formData.dietaryRestrictions as string[]).includes('Other') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Input
                  placeholder="Please specify..."
                  value={formData.otherDietary as string}
                  onChange={(e) => setFormData({ ...formData, otherDietary: e.target.value })}
                />
              </motion.div>
            )}
          </div>
        );

      case 'tshirtSize':
        return (
          <div key={question.id} className="pt-6 border-t border-light-gray">
            <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-4 block">
              {question.label} {question.required && <span className="text-rausch">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFormData({ ...formData, tshirtSize: size })}
                  aria-pressed={formData.tshirtSize === size}
                  className={`w-12 h-12 rounded-btn font-bold transition-colors border ${
                    formData.tshirtSize === size
                      ? 'bg-kazan text-white border-kazan'
                      : 'bg-white text-kazan border-light-gray hover:border-kazan'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        );

      case 'travelOriginCity':
        return (
          <div key={question.id} className="pt-6 border-t border-light-gray">
            <Input
              label={question.label}
              placeholder="e.g., Seattle, WA"
              value={formData.travelOriginCity as string}
              onChange={(e) => setFormData({ ...formData, travelOriginCity: e.target.value })}
              required={question.required}
            />
          </div>
        );

      case 'needsLodging':
        return (
          <div key={question.id} className="pt-6 border-t border-light-gray">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-base font-bold text-kazan block">{question.label}</label>
                <p className="text-sm text-foggy">Will you need accommodation during the event?</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.needsLodging as boolean}
                aria-label={question.label}
                onClick={() => setFormData({ ...formData, needsLodging: !formData.needsLodging })}
                className={`w-14 h-8 rounded-pill p-1 transition-colors ${formData.needsLodging ? 'bg-babu' : 'bg-light-gray'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-pill shadow-sm transition-transform ${formData.needsLodging ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            <AnimatePresence>
              {formData.needsLodging && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-babu/10 border border-babu/20 rounded-btn mt-4">
                    <p className="text-sm text-kazan font-medium">You'll be able to browse and book accommodation after registering.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 'additionalNotes':
        return (
          <div key={question.id} className="pt-6 border-t border-light-gray">
            <Textarea
              label={question.label}
              placeholder="Anything else we should know to make your experience great?"
              value={formData.additionalNotes as string}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderCustomQuestion = (question: RegistrationQuestion) => {
    const options = parseOptions(question.options);

    if (question.type === 'multiple_choice' && options.length > 0) {
      return (
        <div key={question.id} className="pt-6 border-t border-light-gray">
          <label className="text-xs font-bold text-foggy uppercase tracking-wider mb-4 block">
            {question.label} {question.required && <span className="text-rausch">*</span>}
          </label>
          <div className="flex flex-wrap gap-3">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCustomResponses((prev) => ({ ...prev, [question.id]: option }))}
                aria-pressed={customResponses[question.id] === option}
                className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors border ${
                  customResponses[question.id] === option
                    ? 'bg-kazan text-white border-kazan'
                    : 'bg-white text-kazan border-light-gray hover:border-kazan'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={question.id} className="pt-6 border-t border-light-gray">
        <Input
          label={question.label}
          placeholder="Your answer..."
          value={customResponses[question.id] || ''}
          onChange={(e) => setCustomResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
          required={question.required}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-foggy" />
      </div>
    );
  }

  if (!gathering) return <div className="p-12 text-center">Gathering not found</div>;

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-gray p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 bg-babu/10 text-babu rounded-pill flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-bold text-kazan mb-4">You're registered!</h2>
          <p className="text-foggy text-lg max-w-md mb-8 mx-auto">Thanks for confirming your details. We've sent a calendar invite to your email.</p>
          <Button onClick={() => router.push('/dashboard')}>View Event Details</Button>
        </motion.div>
      </div>
    );
  }

  const defaultQuestions = questions.filter((q) => q.isDefault);
  const customQuestions = questions.filter((q) => !q.isDefault);

  return (
    <div className="min-h-screen bg-bg-gray py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-kazan mb-4 tracking-tight">Complete Registration</h1>
          <p className="text-foggy text-lg">Please provide your details for the upcoming gathering.</p>
        </div>

        <Card className="overflow-hidden shadow-elevated border-none">
          <div className="bg-kazan p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">{gathering.title}</h2>
            <div className="flex flex-wrap gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2"><Calendar size={18} /> {formatDateRange(gathering.startDate, gathering.endDate)}</div>
              <div className="flex items-center gap-2"><MapPin size={18} /> {gathering.location}</div>
            </div>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Full Name" value={user?.name ?? 'Guest'} disabled />
                <Input label="Email Address" value={user?.email ?? ''} disabled />
              </div>

              {/* Render visible default questions */}
              {defaultQuestions.map((q) => renderDefaultQuestion(q))}

              {/* Render visible custom questions */}
              {customQuestions.map((q) => renderCustomQuestion(q))}

              <div className="pt-8">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isSubmitting}
                  disabled={!isFormValid()}
                >
                  Submit Registration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
