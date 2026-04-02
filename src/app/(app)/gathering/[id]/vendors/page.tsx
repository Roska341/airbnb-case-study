'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Wrench,
  Monitor,
  Armchair,
  Package,
  Star,
  DollarSign,
  Circle,
  Clock,
  CheckCircle,
  Pencil,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────

interface CatalogItem {
  name: string;
  category: string;
  description: string;
  typicalQuantity: { small: number; medium: number; large: number };
  gatheringTypes: string[];
  formatRelevance: string[];
  estimatedCost: number;
}

interface EquipmentItem {
  id: string;
  category: string;
  name: string;
  quantity: number;
  unitCost: number;
  priority: string;
  status: string;
  vendorNotes: string | null;
}

interface GatheringInfo {
  type: string;
  location: string;
  groupSize: number;
  title: string;
}

type ViewState = 'loading' | 'wizard' | 'checklist';

// ── Category Config ──────────────────────────────────────────────

const CATEGORIES = [
  { id: 'av_tech', label: 'AV & Tech', icon: Monitor },
  { id: 'furniture', label: 'Furniture & Setup', icon: Armchair },
  { id: 'supplies', label: 'Supplies & Materials', icon: Package },
  { id: 'specialty', label: 'Specialty', icon: Star },
];

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; label: string; next: string }> = {
  needed: { icon: Circle, color: 'text-foggy', label: 'Needed', next: 'ordered' },
  ordered: { icon: Clock, color: 'text-arches', label: 'Ordered', next: 'confirmed' },
  confirmed: { icon: CheckCircle, color: 'text-babu', label: 'Confirmed', next: 'needed' },
};

// ── Wizard Selection ─────────────────────────────────────────────

interface WizardSelection {
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  selected: boolean;
  description: string;
}

function getSizeKey(groupSize: number): 'small' | 'medium' | 'large' {
  if (groupSize <= 15) return 'small';
  if (groupSize <= 30) return 'medium';
  return 'large';
}

/**
 * Build wizard items — only show essentials (items relevant to this gathering type).
 * Other items can be added via the "Add Item" flow.
 */
function buildWizardSelections(
  catalog: CatalogItem[],
  gatheringType: string,
  groupSize: number,
): WizardSelection[] {
  const sizeKey = getSizeKey(groupSize);

  // Only include items relevant to this gathering type
  const relevant = catalog.filter(
    (item) => item.gatheringTypes.includes(gatheringType) && item.typicalQuantity[sizeKey] > 0,
  );

  // Pick the top essentials per category (max 4 per category for a clean look)
  const perCategory = new Map<string, CatalogItem[]>();
  for (const item of relevant) {
    const list = perCategory.get(item.category) ?? [];
    list.push(item);
    perCategory.set(item.category, list);
  }

  const selections: WizardSelection[] = [];
  for (const [, items] of perCategory) {
    const capped = items.slice(0, 4);
    for (const item of capped) {
      selections.push({
        name: item.name,
        category: item.category,
        quantity: item.typicalQuantity[sizeKey],
        unitCost: item.estimatedCost,
        selected: true,
        description: item.description,
      });
    }
  }

  return selections;
}

/**
 * Get catalog items NOT already in the wizard selections, for the "Add More" flow.
 */
function getAvailableCatalogItems(
  catalog: CatalogItem[],
  selections: WizardSelection[],
): CatalogItem[] {
  const selectedNames = new Set(selections.map((s) => s.name));
  return catalog.filter((item) => !selectedNames.has(item.name));
}

// ── Item Detail Modal ────────────────────────────────────────────

interface ItemModalProps {
  mode: 'add' | 'edit';
  item: {
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    vendorNotes?: string;
  };
  onSave: (data: { name: string; category: string; quantity: number; unitCost: number; vendorNotes?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function ItemModal({ mode, item, onSave, onDelete, onClose }: ItemModalProps) {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unitCost: item.unitCost,
    vendorNotes: item.vendorNotes ?? '',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kazan/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-card shadow-modal p-8 max-w-lg w-full mx-4 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-kazan">
            {mode === 'add' ? 'Add Item' : 'Edit Item'}
          </h3>
          <button onClick={onClose} className="p-1 text-foggy hover:text-kazan">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <Input
            label="Item Name"
            type="text"
            placeholder="e.g., Wireless Microphone"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-foggy uppercase tracking-wider">
              Category
            </label>
            <select
              className="flex h-12 w-full rounded-btn border border-light-gray bg-white px-4 py-3 text-sm text-kazan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kazan"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-foggy uppercase tracking-wider">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  className="p-2 border border-light-gray rounded-btn hover:bg-bg-gray"
                  onClick={() =>
                    setForm((f) => ({ ...f, quantity: Math.max(1, f.quantity - 1) }))
                  }
                >
                  <Minus size={16} />
                </button>
                <span className="text-lg font-bold text-kazan w-12 text-center">
                  {form.quantity}
                </span>
                <button
                  className="p-2 border border-light-gray rounded-btn hover:bg-bg-gray"
                  onClick={() => setForm((f) => ({ ...f, quantity: f.quantity + 1 }))}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <Input
              label="Unit Price ($)"
              type="number"
              placeholder="0"
              value={form.unitCost.toString()}
              onChange={(e) =>
                setForm((f) => ({ ...f, unitCost: parseFloat(e.target.value) || 0 }))
              }
            />
          </div>

          {form.unitCost > 0 && form.quantity > 0 && (
            <div className="p-3 bg-bg-gray rounded-btn flex items-center justify-between">
              <span className="text-sm text-foggy">
                {form.quantity} x ${form.unitCost.toLocaleString()}
              </span>
              <span className="font-bold text-kazan">
                ${(form.quantity * form.unitCost).toLocaleString()}
              </span>
            </div>
          )}

          <Textarea
            label="Vendor Notes (optional)"
            placeholder="Vendor name, contact, delivery details..."
            value={form.vendorNotes}
            onChange={(e) => setForm((f) => ({ ...f, vendorNotes: e.target.value }))}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            {mode === 'edit' && onDelete && (
              <button
                onClick={onDelete}
                className="text-sm text-foggy hover:text-rausch transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(form)} disabled={!form.name}>
              {mode === 'add' ? 'Add Item' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add From Catalog Modal ───────────────────────────────────────

interface AddFromCatalogProps {
  catalog: CatalogItem[];
  groupSize: number;
  onAdd: (item: WizardSelection) => void;
  onClose: () => void;
}

function AddFromCatalogModal({ catalog, groupSize, onAdd, onClose }: AddFromCatalogProps) {
  const [search, setSearch] = useState('');
  const sizeKey = getSizeKey(groupSize);

  const filtered = catalog.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: filtered.filter((i) => i.category === cat.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-kazan/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-card shadow-modal p-6 max-w-xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-kazan">Add Equipment</h3>
          <button onClick={onClose} className="p-1 text-foggy hover:text-kazan">
            <X size={20} />
          </button>
        </div>

        <Input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-y-auto mt-4 -mx-2 px-2 flex-1">
          {grouped.map((group) => (
            <div key={group.id} className="mb-4">
              <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.name}
                    className="w-full text-left p-3 rounded-btn hover:bg-bg-gray transition-colors flex items-center gap-3"
                    onClick={() => {
                      onAdd({
                        name: item.name,
                        category: item.category,
                        quantity: item.typicalQuantity[sizeKey] || 1,
                        unitCost: item.estimatedCost,
                        selected: true,
                        description: item.description,
                      });
                      onClose();
                    }}
                  >
                    <Plus size={16} className="text-babu shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-kazan">{item.name}</p>
                      <p className="text-xs text-foggy truncate">{item.description}</p>
                    </div>
                    <span className="text-xs text-foggy shrink-0">${item.estimatedCost}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {grouped.length === 0 && (
            <p className="text-center text-foggy py-8">No matching items</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Page Component ───────────────────────────────────────────────

export default function VendorsPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const { addToast } = useToast();

  const [view, setView] = useState<ViewState>('loading');
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [gathering, setGathering] = useState<GatheringInfo | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // Wizard state
  const [wizardSelections, setWizardSelections] = useState<WizardSelection[]>([]);
  const [expandedWizardCats, setExpandedWizardCats] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.id)),
  );
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Checklist state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.id)),
  );
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch data on mount
  const fetchData = useCallback(async () => {
    try {
      const [gatheringRes, equipmentRes] = await Promise.all([
        fetch(`/api/gatherings/${id}`),
        fetch(`/api/gatherings/${id}/equipment`),
      ]);

      if (gatheringRes.ok) {
        const g = await gatheringRes.json();
        setGathering({ type: g.type, location: g.location, groupSize: g.groupSize, title: g.title });
      }

      if (equipmentRes.ok) {
        const data: EquipmentItem[] = await equipmentRes.json();
        setItems(data);
        if (data.length > 0) {
          setView('checklist');
          return;
        }
      }

      try {
        const catalogModule = await import('@/data/mock/equipment-catalog.json');
        setCatalog(catalogModule.default);
      } catch {
        setCatalog([]);
      }

      setView('wizard');
    } catch {
      addToast({ message: 'Failed to load equipment data', type: 'error' });
      setView('wizard');
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (catalog.length > 0 && gathering && view === 'wizard') {
      setWizardSelections(
        buildWizardSelections(catalog, gathering.type, gathering.groupSize),
      );
    }
  }, [catalog, gathering, view]);

  // ── Wizard Handlers ──────────────────────────────────────────

  const toggleWizardItem = (name: string) => {
    setWizardSelections((prev) =>
      prev.map((s) => (s.name === name ? { ...s, selected: !s.selected } : s)),
    );
  };

  const removeWizardItem = (name: string) => {
    setWizardSelections((prev) => prev.filter((s) => s.name !== name));
  };

  const addWizardItem = (item: WizardSelection) => {
    setWizardSelections((prev) => [...prev, item]);
  };

  const wizardTotal = useMemo(
    () =>
      wizardSelections
        .filter((s) => s.selected)
        .reduce((sum, s) => sum + s.quantity * s.unitCost, 0),
    [wizardSelections],
  );

  const wizardSelectedCount = wizardSelections.filter((s) => s.selected).length;

  const availableCatalogItems = useMemo(
    () => getAvailableCatalogItems(catalog, wizardSelections),
    [catalog, wizardSelections],
  );

  const handleSaveWizard = async () => {
    const selected = wizardSelections.filter((s) => s.selected);
    if (selected.length === 0) {
      addToast({ message: 'Select at least one item', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/gatherings/${id}/equipment/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selected.map((s, idx) => ({
            category: s.category,
            name: s.name,
            quantity: s.quantity,
            unitCost: s.unitCost,
            priority: 'essential',
            sortOrder: idx,
          })),
          replaceExisting: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      const saved: EquipmentItem[] = await res.json();
      setItems(saved);
      setView('checklist');
      addToast({ message: `${saved.length} items saved!`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to save equipment list', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Checklist Handlers ───────────────────────────────────────

  const handleStatusCycle = async (item: EquipmentItem) => {
    const nextStatus = STATUS_CONFIG[item.status]?.next ?? 'needed';
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)),
    );
    try {
      await fetch(`/api/gatherings/${id}/equipment/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i)),
      );
    }
  };

  const handleEditSave = async (data: {
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    vendorNotes?: string;
  }) => {
    if (!editingItem) return;
    try {
      await fetch(`/api/gatherings/${id}/equipment/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, ...data, vendorNotes: data.vendorNotes ?? null }
            : i,
        ),
      );
      setEditingItem(null);
      addToast({ message: 'Item updated', type: 'success' });
    } catch {
      addToast({ message: 'Failed to update item', type: 'error' });
    }
  };

  const handleEditDelete = async () => {
    if (!editingItem) return;
    setItems((prev) => prev.filter((i) => i.id !== editingItem.id));
    try {
      await fetch(`/api/gatherings/${id}/equipment/${editingItem.id}`, {
        method: 'DELETE',
      });
      addToast({ message: `Removed "${editingItem.name}"`, type: 'info' });
    } catch {
      await fetchData();
      addToast({ message: 'Failed to remove item', type: 'error' });
    }
    setEditingItem(null);
  };

  const handleAddNew = async (data: {
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    vendorNotes?: string;
  }) => {
    try {
      const res = await fetch(`/api/gatherings/${id}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, priority: 'recommended' }),
      });
      if (!res.ok) throw new Error('Failed');
      const created: EquipmentItem = await res.json();
      setItems((prev) => [...prev, created]);
      setShowAddModal(false);
      addToast({ message: `Added "${created.name}"`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to add item', type: 'error' });
    }
  };

  const handleResetToWizard = async () => {
    try {
      const catalogModule = await import('@/data/mock/equipment-catalog.json');
      setCatalog(catalogModule.default);
    } catch {
      setCatalog([]);
    }
    setView('wizard');
  };

  const checklistTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
    [items],
  );

  // ── Render ───────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12">
        <Link
          href={`/gathering/${id}`}
          className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Hub
        </Link>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-foggy" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <Link
        href={`/gathering/${id}`}
        className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Hub
      </Link>

      <AnimatePresence mode="wait">
        {/* ── WIZARD VIEW ── */}
        {view === 'wizard' && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-3xl font-bold text-kazan mb-3">
                Vendors & Equipment
              </h2>
              <p className="text-foggy text-lg">
                Essentials for your{' '}
                <span className="font-medium text-kazan">
                  {gathering?.type.toLowerCase().replaceAll('_', ' ')}
                </span>{' '}
                gathering. Uncheck what you don't need, or add more items.
              </p>
            </div>

            {/* Category sections */}
            {CATEGORIES.map((cat) => {
              const catItems = wizardSelections.filter((s) => s.category === cat.id);
              if (catItems.length === 0) return null;
              const isExpanded = expandedWizardCats.has(cat.id);
              const CatIcon = cat.icon;

              return (
                <Card key={cat.id}>
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => {
                      setExpandedWizardCats((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.id)) next.delete(cat.id);
                        else next.add(cat.id);
                        return next;
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CatIcon size={20} className="text-kazan" />
                      <h3 className="font-bold text-kazan">{cat.label}</h3>
                      <Badge variant="outline">{catItems.length}</Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-foggy" />
                    ) : (
                      <ChevronDown size={18} className="text-foggy" />
                    )}
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="space-y-2">
                        {catItems.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center gap-3 py-2 px-2 rounded-btn hover:bg-bg-gray/50 transition-colors"
                          >
                            <button
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                item.selected
                                  ? 'bg-kazan border-kazan text-white'
                                  : 'border-light-gray hover:border-kazan'
                              }`}
                              onClick={() => toggleWizardItem(item.name)}
                            >
                              {item.selected && <Check size={12} />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${item.selected ? 'text-kazan' : 'text-foggy line-through'}`}
                              >
                                {item.name}
                              </p>
                            </div>

                            {item.selected && (
                              <span className="text-xs text-foggy shrink-0">
                                x{item.quantity}
                              </span>
                            )}

                            <button
                              className="shrink-0 p-1 text-foggy hover:text-rausch transition-colors"
                              onClick={() => removeWizardItem(item.name)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Add more items */}
            <Button
              variant="secondary"
              className="w-full border-dashed gap-2 text-foggy hover:text-kazan"
              onClick={() => setShowCatalogPicker(true)}
            >
              <Plus size={18} /> Add More Equipment
            </Button>

            {/* Sticky footer */}
            <div className="sticky bottom-0 bg-white border-t border-light-gray p-4 -mx-6 px-6 flex items-center justify-between shadow-elevated rounded-t-card">
              <div>
                <p className="text-sm text-foggy">
                  {wizardSelectedCount} items selected
                </p>
                <p className="text-2xl font-bold text-kazan">
                  ${wizardTotal.toLocaleString()}
                  <span className="text-sm font-normal text-foggy ml-1">
                    estimated
                  </span>
                </p>
              </div>
              <Button
                variant="primary"
                className="px-8 py-3"
                onClick={handleSaveWizard}
                disabled={isSaving || wizardSelectedCount === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  'Save Equipment List'
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── CHECKLIST VIEW ── */}
        {view === 'checklist' && (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-kazan mb-2">
                  Vendors & Equipment
                </h2>
                <p className="text-foggy">
                  {items.length} items &bull; Total:{' '}
                  <span className="font-bold text-kazan">
                    ${checklistTotal.toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={handleResetToWizard}
                >
                  <Wrench size={16} /> Edit Selection
                </Button>
                <Button
                  variant="primary"
                  className="gap-2"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={16} /> Add Item
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="flex flex-wrap gap-4 p-4 bg-bg-gray rounded-btn">
              <div className="flex items-center gap-2 text-sm">
                <Circle size={12} className="text-foggy" />
                <span className="text-foggy">
                  {items.filter((i) => i.status === 'needed').length} needed
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={12} className="text-arches" />
                <span className="text-foggy">
                  {items.filter((i) => i.status === 'ordered').length} ordered
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={12} className="text-babu" />
                <span className="text-foggy">
                  {items.filter((i) => i.status === 'confirmed').length} confirmed
                </span>
              </div>
              <div className="flex-1" />
              <div className="text-sm font-bold text-kazan">
                ${checklistTotal.toLocaleString()}
              </div>
            </div>

            {/* Category Accordions */}
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.id);
              if (catItems.length === 0) return null;
              const isExpanded = expandedCategories.has(cat.id);
              const catTotal = catItems.reduce(
                (s, i) => s + i.quantity * i.unitCost,
                0,
              );
              const CatIcon = cat.icon;

              return (
                <Card key={cat.id}>
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => {
                      setExpandedCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.id)) next.delete(cat.id);
                        else next.add(cat.id);
                        return next;
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <CatIcon size={20} className="text-kazan" />
                      <h3 className="font-bold text-kazan">{cat.label}</h3>
                      <Badge variant="outline">{catItems.length}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      {catTotal > 0 && (
                        <span className="text-sm font-medium text-foggy">
                          ${catTotal.toLocaleString()}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-foggy" />
                      ) : (
                        <ChevronDown size={18} className="text-foggy" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-5">
                      <div className="space-y-1">
                        {catItems.map((item) => {
                          const statusCfg =
                            STATUS_CONFIG[item.status] ?? STATUS_CONFIG.needed;
                          const StatusIcon = statusCfg.icon;
                          const lineTotal = item.quantity * item.unitCost;

                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 py-2.5 px-2 rounded-btn hover:bg-bg-gray/50 transition-colors cursor-pointer group"
                              onClick={() => setEditingItem(item)}
                            >
                              {/* Status cycle (stop propagation so click doesn't open modal) */}
                              <button
                                className={`shrink-0 ${statusCfg.color} hover:opacity-70 transition-opacity`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusCycle(item);
                                }}
                                title={`${statusCfg.label} — click to cycle`}
                              >
                                <StatusIcon size={18} />
                              </button>

                              <span className="font-medium text-kazan flex-1 min-w-0 truncate text-sm">
                                {item.name}
                              </span>

                              <span className="text-xs text-foggy shrink-0">
                                x{item.quantity}
                              </span>

                              {lineTotal > 0 && (
                                <span className="text-sm font-medium text-kazan shrink-0 w-16 text-right">
                                  ${lineTotal.toLocaleString()}
                                </span>
                              )}

                              <Pencil
                                size={14}
                                className="text-foggy opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}

      {showCatalogPicker && (
        <AddFromCatalogModal
          catalog={availableCatalogItems}
          groupSize={gathering?.groupSize ?? 20}
          onAdd={addWizardItem}
          onClose={() => setShowCatalogPicker(false)}
        />
      )}

      {editingItem && (
        <ItemModal
          mode="edit"
          item={{
            name: editingItem.name,
            category: editingItem.category,
            quantity: editingItem.quantity,
            unitCost: editingItem.unitCost,
            vendorNotes: editingItem.vendorNotes ?? '',
          }}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showAddModal && (
        <ItemModal
          mode="add"
          item={{ name: '', category: 'av_tech', quantity: 1, unitCost: 0 }}
          onSave={handleAddNew}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
