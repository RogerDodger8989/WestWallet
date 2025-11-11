import { useEffect, useState } from 'react';
import api, { importRulesAPI } from '../api/api';

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  categoryId: number;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  reference?: string;
  suggestedCategoryId?: number;
  suggestedSupplierId?: number;
  isDuplicate: boolean;
}

interface ImportPreview {
  transactions: Transaction[];
  summary: {
    total: number;
    duplicates: number;
    matched: number;
  };
}

interface Props {
  preview: ImportPreview;
  categories: Category[];
  suppliers: Supplier[];
  onConfirm: (selectedTransactions: any[]) => void;
  onCancel: () => void;
  importing: boolean;
  onCategoryCreated: () => void;
  onSupplierCreated: () => void;
}

export function BankImportPreview({ 
  preview, 
  categories, 
  suppliers, 
  onConfirm, 
  onCancel, 
  importing,
  onCategoryCreated,
  onSupplierCreated 
}: Props) {
  const [transactions, setTransactions] = useState(
    preview.transactions.map((t, index) => ({
      ...t,
      id: index,
      selected: !t.isDuplicate,
      categoryId: t.suggestedCategoryId || 0,
      supplierId: t.suggestedSupplierId || 0,
      matchedRulePattern: undefined as string | undefined,
    }))
  );
  // Bulk action temporary selections
  const [bulkCategoryId, setBulkCategoryId] = useState<number>(0);
  const [bulkSupplierId, setBulkSupplierId] = useState<number>(0);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplier, setNewSupplier] = useState({ name: '', categoryId: 0 });
  // Row context for inline add (+) so we can auto-select newly created item
  const [categoryRowContext, setCategoryRowContext] = useState<number | null>(null);
  const [supplierRowContext, setSupplierRowContext] = useState<number | null>(null);
  // Import rules state
  const [rules, setRules] = useState<any[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [newRule, setNewRule] = useState<{ pattern: string; categoryId?: number; supplierId?: number }>({ pattern: '' });
  const [ruleModalCreatingCategory, setRuleModalCreatingCategory] = useState(false);
  const [ruleModalCreatingSupplier, setRuleModalCreatingSupplier] = useState(false);
  const [ruleModalNewCategoryName, setRuleModalNewCategoryName] = useState('');
  const [ruleModalNewSupplier, setRuleModalNewSupplier] = useState<{ name: string; categoryId: number | 0 }>({ name: '', categoryId: 0 });
  const [showRulesList, setShowRulesList] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingRuleDraft, setEditingRuleDraft] = useState<{ pattern: string; categoryId?: number; supplierId?: number; active?: boolean } | null>(null);

  useEffect(() => {
    // Load existing rules when preview opens
    importRulesAPI.list().then(setRules).catch(() => {});
  }, []);

  // Apply rules client-side to fill suggestions if missing
  // Re-apply rules whenever rules list changes to improve suggestions in preview
  useEffect(() => {
    if (!rules || rules.length === 0) return;
    setTransactions(prev => prev.map(t => {
      const match = rules.find(r => r.active !== false && String(t.description).toLowerCase().includes(String(r.pattern).toLowerCase()));
      if (!match) return t;
      let categoryId = t.categoryId;
      let supplierId = t.supplierId;
      let applied = false;
      // Apply category if missing and rule has one (or infer via supplier mapping)
      if (!categoryId) {
        if (match.categoryId) {
          categoryId = match.categoryId;
          applied = true;
        } else if (match.supplierId) {
          const sup = suppliers.find(s => s.id === match.supplierId);
          if (sup) {
            categoryId = sup.categoryId;
            applied = true;
          }
        }
      }
      // Apply supplier if missing and rule has supplier
      if (!supplierId && match.supplierId) {
        supplierId = match.supplierId;
        applied = true;
      }
      return applied ? { ...t, categoryId, supplierId, matchedRulePattern: match.pattern } : t;
    }));
  }, [rules, suppliers]);

  const handleToggleSelect = (id: number) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleCategoryChange = (id: number, categoryId: number) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, categoryId, supplierId: 0 } : t))
    );
  };

  const handleSupplierChange = (id: number, supplierId: number) => {
    // If supplier chosen, ensure category matches supplier's category (guards against stale UI state)
    const sup = suppliers.find(s => s.id === supplierId);
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, supplierId, categoryId: sup ? sup.categoryId : t.categoryId } : t))
    );
  };

  // Bulk helpers
  const applyBulkCategory = () => {
    if (!bulkCategoryId) return;
    setTransactions(prev => prev.map(t => (t.selected && !t.isDuplicate) ? { ...t, categoryId: bulkCategoryId, supplierId: 0 } : t));
  };
  const applyBulkSupplier = () => {
    if (!bulkSupplierId) return;
    const sup = suppliers.find(s => s.id === bulkSupplierId);
    setTransactions(prev => prev.map(t => (t.selected && !t.isDuplicate) ? { ...t, supplierId: bulkSupplierId, categoryId: sup ? sup.categoryId : t.categoryId } : t));
  };
  const clearBulkCategory = () => {
    setTransactions(prev => prev.map(t => (t.selected && !t.isDuplicate) ? { ...t, categoryId: 0, supplierId: 0 } : t));
  };
  const clearBulkSupplier = () => {
    setTransactions(prev => prev.map(t => (t.selected && !t.isDuplicate) ? { ...t, supplierId: 0 } : t));
  };
  const bulkReapplyRules = () => {
    if (!rules || rules.length === 0) return;
    setTransactions(prev => prev.map(t => {
      if (!(t.selected && !t.isDuplicate)) return t;
      const match = rules.find(r => r.active !== false && String(t.description).toLowerCase().includes(String(r.pattern).toLowerCase()));
      if (!match) return t;
      let categoryId = t.categoryId;
      let supplierId = t.supplierId;
      let changed = false;
      if (!categoryId) {
        if (match.categoryId) { categoryId = match.categoryId; changed = true; }
        else if (match.supplierId) {
          const msup = suppliers.find(s => s.id === match.supplierId);
          if (msup) { categoryId = msup.categoryId; changed = true; }
        }
      }
      if (!supplierId && match.supplierId) { supplierId = match.supplierId; changed = true; }
      return changed ? { ...t, categoryId: categoryId || 0, supplierId: supplierId || 0, matchedRulePattern: match.pattern } : t;
    }));
  };
  
  const reapplyRuleForRow = (id: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (!t.matchedRulePattern) return t;
      const rule = rules.find(r => r.pattern === t.matchedRulePattern);
      if (!rule) return t;
      // Recalculate suggested values (incl inference)
      let categoryId = t.categoryId;
      let supplierId = t.supplierId;
      if (rule.categoryId) categoryId = rule.categoryId;
      else if (rule.supplierId) {
        const sup = suppliers.find(s => s.id === rule.supplierId);
        if (sup) categoryId = sup.categoryId;
      }
      if (rule.supplierId) supplierId = rule.supplierId;
      return { ...t, categoryId: categoryId || 0, supplierId: supplierId || 0 };
    }));
  };
  
  const handleCreateCategory = async (nameOverride?: string) => {
    const name = (nameOverride ?? newCategoryName).trim();
    if (!name) return;
    try {
      const res = await api.post('/categories', { name });
      const created = res.data;
      onCategoryCreated();
      // If we came from a specific row, assign the new category to that transaction
      if (categoryRowContext !== null && created?.id) {
        setTransactions(prev => prev.map(t => t.id === categoryRowContext ? { ...t, categoryId: created.id, supplierId: 0 } : t));
      }
      // If rule modal is open and we are in inline create there, set rule category
      if (showRuleModal && ruleModalCreatingCategory && created?.id) {
        setNewRule(r => ({ ...r, categoryId: created.id }));
        setRuleModalCreatingCategory(false);
        setRuleModalNewCategoryName('');
      }
      setNewCategoryName('');
      setCategoryRowContext(null);
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };
  
  const handleCreateSupplier = async (supplierOverride?: { name: string; categoryId: number }) => {
    const payload = supplierOverride ?? newSupplier;
    if (!payload.name.trim() || !payload.categoryId) return;
    try {
      const res = await api.post('/suppliers', payload);
      const created = res.data;
      onSupplierCreated();
      if (supplierRowContext !== null && created?.id) {
        setTransactions(prev => prev.map(t => t.id === supplierRowContext ? { ...t, supplierId: created.id, categoryId: created.categoryId } : t));
      }
      if (showRuleModal && ruleModalCreatingSupplier && created?.id) {
        setNewRule(r => ({ ...r, supplierId: created.id, categoryId: r.categoryId || created.categoryId }));
        setRuleModalCreatingSupplier(false);
        setRuleModalNewSupplier({ name: '', categoryId: 0 });
      }
      setSupplierRowContext(null);
      setShowSupplierModal(false);
    } catch (error) {
      console.error('Failed to create supplier:', error);
    }
  };

  const selectedCount = transactions.filter(t => t.selected && !t.isDuplicate).length;

  const quickCreateRuleFromRow = (trans: any) => {
    // heuristic: use description trimmed; if very long trim to 40 chars
    const raw = String(trans.description || '').trim();
    const pattern = raw.length > 40 ? raw.substring(0, 40) : raw;
    setNewRule({ pattern, categoryId: trans.categoryId || undefined, supplierId: trans.supplierId || undefined });
    setShowRuleModal(true);
  };

  const handleCreateRule = async () => {
    if (!newRule.pattern.trim()) return;
    try {
      const created = await importRulesAPI.create(newRule.pattern, newRule.categoryId || undefined, newRule.supplierId || undefined);
      setRules(prev => [...prev, created]);
      setShowRuleModal(false);
      setNewRule({ pattern: '' });
      // Apply the new rule to transactions that match and are not yet set
      setTransactions(prev => prev.map(t => {
        const matches = t.description ? created.pattern && String(t.description).toLowerCase().includes(String(created.pattern).toLowerCase()) : false;
        if (matches) {
          // If rule defines supplier but not category, infer category from supplier list
          let nextCategoryId = created.categoryId ?? t.categoryId;
          if (!nextCategoryId && created.supplierId) {
            const sup = suppliers.find(s => s.id === created.supplierId);
            if (sup) nextCategoryId = sup.categoryId;
          }
          return {
            ...t,
            categoryId: nextCategoryId,
            supplierId: created.supplierId ?? t.supplierId,
            matchedRulePattern: created.pattern,
          };
        }
        return t;
      }));
    } catch (e) {
      console.error('Failed to create rule', e);
    }
  };

  const handleToggleActive = async (rule: any) => {
    try {
      const updated = await importRulesAPI.update(rule.id, { active: !rule.active });
      setRules(prev => prev.map(r => r.id === rule.id ? updated : r));
    } catch (e) { console.error('Failed to toggle rule', e); }
  };

  const handleDeleteRule = async (rule: any) => {
    if (!confirm('Ta bort regel?')) return;
    try {
      await importRulesAPI.remove(rule.id);
      setRules(prev => prev.filter(r => r.id !== rule.id));
    } catch (e) { console.error('Failed to delete rule', e); }
  };

  const startEditRule = (rule: any) => {
    setEditingRuleId(rule.id);
    setEditingRuleDraft({ pattern: rule.pattern, categoryId: rule.categoryId, supplierId: rule.supplierId, active: rule.active });
  };

  const cancelEditRule = () => {
    setEditingRuleId(null);
    setEditingRuleDraft(null);
  };

  const saveEditRule = async () => {
    if (editingRuleId == null || !editingRuleDraft) return;
    try {
      const updated = await importRulesAPI.update(editingRuleId, editingRuleDraft);
      setRules(prev => prev.map(r => r.id === editingRuleId ? updated : r));
      cancelEditRule();
    } catch (e) { console.error('Failed to update rule', e); }
  };

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Totalt</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{preview.summary.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Dubbletter</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{preview.summary.duplicates}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Kommer importeras</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCount}</p>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      <div className="mb-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 space-y-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400">Bulk kategori</label>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value={0}>Välj kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={applyBulkCategory}
                disabled={!bulkCategoryId || selectedCount === 0}
                className="text-xs px-2 py-1 rounded bg-blue-600 text-white disabled:opacity-40"
              >Applicera</button>
              <button
                type="button"
                onClick={clearBulkCategory}
                disabled={selectedCount === 0}
                className="text-xs px-2 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-40"
              >Rensa</button>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400">Bulk leverantör</label>
            <select
              value={bulkSupplierId}
              onChange={(e) => setBulkSupplierId(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            >
              <option value={0}>Välj leverantör</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={applyBulkSupplier}
                disabled={!bulkSupplierId || selectedCount === 0}
                className="text-xs px-2 py-1 rounded bg-purple-600 text-white disabled:opacity-40"
              >Applicera</button>
              <button
                type="button"
                onClick={clearBulkSupplier}
                disabled={selectedCount === 0}
                className="text-xs px-2 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-40"
              >Rensa</button>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400">Regler</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={bulkReapplyRules}
                disabled={selectedCount === 0 || rules.length === 0}
                className="text-xs px-2 py-1 rounded bg-green-600 text-white disabled:opacity-40"
              >Auto-förslag (valda)</button>
            </div>
          </div>
          <div className="flex-1 text-xs text-gray-600 dark:text-gray-400">
            Tips: Bulk ändrar endast valda rader (exkl. dubbletter). Leverantör sätter automatiskt korrekt kategori.
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto mb-6 max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <input
                  type="checkbox"
                  checked={transactions.filter(t => !t.isDuplicate).every(t => t.selected)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTransactions(prev =>
                      prev.map(t => (t.isDuplicate ? t : { ...t, selected: checked }))
                    );
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Datum</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Beskrivning</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Belopp</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <div className="flex items-center gap-2">
                  Kategori
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    title="Skapa ny kategori"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <div className="flex items-center gap-2">
                  Leverantör
                  <button
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    title="Skapa ny leverantör"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(true)}
                    className="ml-2 px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px]"
                    title="Skapa importregel (matcha text → föreslå kategori/leverantör)"
                  >
                    + Regel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRulesList(v => !v)}
                    className="ml-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[11px]"
                    title="Visa/Dölj regler"
                  >
                    Regler
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((trans) => {
              const filteredSuppliers = suppliers.filter(s => s.categoryId === trans.categoryId);
              
              return (
                <tr
                  key={trans.id}
                  className={`${trans.isDuplicate ? 'bg-yellow-50 dark:bg-yellow-900/10 opacity-60' : ''}`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={trans.selected}
                      disabled={trans.isDuplicate}
                      onChange={() => handleToggleSelect(trans.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {trans.date}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                    {trans.description}
                    {trans.isDuplicate && (
                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(Dubblett)</span>
                    )}
                    {trans.matchedRulePattern && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px]" title={`Regel: ${trans.matchedRulePattern} (klick för att återställa)`}>
                        <button type="button" onClick={() => reapplyRuleForRow(trans.id)} className="underline decoration-dotted">
                          Regel: {trans.matchedRulePattern}
                        </button>
                      </span>
                    )}
                  </td>
                  <td className={`px-3 py-4 whitespace-nowrap text-sm font-semibold ${
                    trans.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {trans.amount.toFixed(2)} kr
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <select
                        value={trans.categoryId}
                        onChange={(e) => handleCategoryChange(trans.id, Number(e.target.value))}
                        disabled={trans.isDuplicate}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                      >
                        <option value={0}>Välj kategori</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      {trans.matchedRulePattern && !trans.categoryId && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" title="Regel matchad men kategori saknas – välj eller skapa">
                          Regel matchad
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={trans.isDuplicate}
                        onClick={() => {
                          setCategoryRowContext(trans.id);
                          setShowCategoryModal(true);
                        }}
                        className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 disabled:opacity-40"
                        title="Skapa kategori för denna rad"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <select
                        value={trans.supplierId}
                        onChange={(e) => handleSupplierChange(trans.id, Number(e.target.value))}
                        disabled={trans.isDuplicate || !trans.categoryId}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                      >
                        <option value={0}>Välj leverantör</option>
                        {filteredSuppliers.map(sup => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                      {trans.matchedRulePattern && !trans.supplierId && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300" title="Regel matchad men leverantör saknas – välj eller skapa">
                          Regel matchad
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={trans.isDuplicate || !trans.categoryId}
                        onClick={() => {
                          setSupplierRowContext(trans.id);
                          setNewSupplier({ name: '', categoryId: trans.categoryId });
                          setShowSupplierModal(true);
                        }}
                        className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 disabled:opacity-40"
                        title={trans.categoryId ? 'Skapa leverantör för denna rad' : 'Välj kategori först'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => quickCreateRuleFromRow(trans)}
                        className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                        title="Skapa regel från denna rad"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h12M3 17h8" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={importing}
          className="btn-secondary"
        >
          Avbryt
        </button>
        <button
          type="button"
          onClick={() => onConfirm(transactions)}
          disabled={importing || selectedCount === 0}
          className="btn-primary"
        >
          {importing ? 'Importerar...' : `Importera ${selectedCount} transaktioner`}
        </button>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skapa ny kategori</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Kategorinamn"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleCreateCategory()}
                disabled={!newCategoryName.trim()}
                className="btn-primary"
              >
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skapa ny leverantör</h3>
            <input
              type="text"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
              placeholder="Leverantörnamn"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
            />
            <select
              value={newSupplier.categoryId}
              onChange={(e) => setNewSupplier({ ...newSupplier, categoryId: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            >
              <option value={0}>Välj kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSupplierModal(false);
                  setNewSupplier({ name: '', categoryId: 0 });
                }}
                className="btn-secondary"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleCreateSupplier()}
                disabled={!newSupplier.name.trim() || !newSupplier.categoryId}
                className="btn-primary"
              >
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skapa importregel</h3>
            <label className="text-sm text-gray-600 dark:text-gray-400">Om beskrivning innehåller:</label>
            <input
              type="text"
              value={newRule.pattern}
              onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
              placeholder="t.ex. ICA, Swish, Netflix"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  Kategori (valfritt)
                  {!ruleModalCreatingCategory && (
                    <button
                      type="button"
                      onClick={() => { setRuleModalCreatingCategory(true); setRuleModalNewCategoryName(''); }}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    >+ ny</button>
                  )}
                </label>
                {!ruleModalCreatingCategory ? (
                  <select
                    value={newRule.categoryId || 0}
                    onChange={(e) => setNewRule({ ...newRule, categoryId: Number(e.target.value) || undefined })}
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Ingen</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={ruleModalNewCategoryName}
                      onChange={(e) => setRuleModalNewCategoryName(e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ny kategori"
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end">
                      <button type="button" onClick={() => { setRuleModalCreatingCategory(false); setRuleModalNewCategoryName(''); }} className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">Avbryt</button>
                      <button
                        type="button"
                        disabled={!ruleModalNewCategoryName.trim()}
                        onClick={() => handleCreateCategory(ruleModalNewCategoryName)}
                        className="text-[10px] px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                      >Spara</button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  Leverantör (valfritt)
                  {!ruleModalCreatingSupplier && (
                    <button
                      type="button"
                      onClick={() => { setRuleModalCreatingSupplier(true); setRuleModalNewSupplier({ name: '', categoryId: newRule.categoryId || 0 }); }}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    >+ ny</button>
                  )}
                </label>
                {!ruleModalCreatingSupplier ? (
                  <select
                    value={newRule.supplierId || 0}
                    onChange={(e) => setNewRule({ ...newRule, supplierId: Number(e.target.value) || undefined })}
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Ingen</option>
                    {suppliers
                      .filter(s => !newRule.categoryId || s.categoryId === newRule.categoryId)
                      .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={ruleModalNewSupplier.name}
                      onChange={(e) => setRuleModalNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ny leverantör"
                      autoFocus
                    />
                    <select
                      value={ruleModalNewSupplier.categoryId}
                      onChange={(e) => setRuleModalNewSupplier(prev => ({ ...prev, categoryId: Number(e.target.value) }))}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value={0}>Välj kategori</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-1 justify-end">
                      <button type="button" onClick={() => { setRuleModalCreatingSupplier(false); setRuleModalNewSupplier({ name: '', categoryId: 0 }); }} className="text-[10px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">Avbryt</button>
                      <button
                        type="button"
                        disabled={!ruleModalNewSupplier.name.trim() || !ruleModalNewSupplier.categoryId}
                        onClick={() => handleCreateSupplier({ name: ruleModalNewSupplier.name, categoryId: ruleModalNewSupplier.categoryId })}
                        className="text-[10px] px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                      >Spara</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRuleModal(false)} className="btn-secondary">Avbryt</button>
              <button onClick={handleCreateRule} disabled={!newRule.pattern.trim()} className="btn-primary">Spara regel</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List Drawer */}
      {showRulesList && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-40" onClick={(e) => { if (e.target === e.currentTarget) setShowRulesList(false); }}>
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">Importregler</h4>
              <button onClick={() => setShowRulesList(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {rules.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Inga regler skapade ännu.</p>
              )}
              {rules.map(rule => {
                const isEditing = rule.id === editingRuleId;
                return (
                  <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/40">
                    {!isEditing ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-mono px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{rule.pattern}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(rule)}
                              className={`text-xs px-2 py-1 rounded ${rule.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                            >
                              {rule.active ? 'Aktiv' : 'Inaktiv'}
                            </button>
                            <button
                              onClick={() => startEditRule(rule)}
                              className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            >Redigera</button>
                            <button
                              onClick={() => handleDeleteRule(rule)}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            >Ta bort</button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div>Kategori: {rule.categoryId ? categories.find(c => c.id === rule.categoryId)?.name || rule.categoryId : '—'}</div>
                          <div>Leverantör: {rule.supplierId ? suppliers.find(s => s.id === rule.supplierId)?.name || rule.supplierId : '—'}</div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingRuleDraft?.pattern || ''}
                          onChange={(e) => setEditingRuleDraft(d => d ? { ...d, pattern: e.target.value } : d)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editingRuleDraft?.categoryId || 0}
                            onChange={(e) => setEditingRuleDraft(d => d ? { ...d, categoryId: Number(e.target.value) || undefined } : d)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          >
                            <option value={0}>Ingen kategori</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <select
                            value={editingRuleDraft?.supplierId || 0}
                            onChange={(e) => setEditingRuleDraft(d => d ? { ...d, supplierId: Number(e.target.value) || undefined } : d)}
                            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                          >
                            <option value={0}>Ingen leverantör</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={cancelEditRule} className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">Avbryt</button>
                          <button onClick={saveEditRule} disabled={!editingRuleDraft?.pattern?.trim()} className="text-xs px-2 py-1 rounded bg-green-600 text-white disabled:opacity-50">Spara</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => { setShowRuleModal(true); setShowRulesList(false); }}
                className="btn-primary flex-1"
              >Ny regel</button>
              <button
                onClick={() => setShowRulesList(false)}
                className="btn-secondary"
              >Stäng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
