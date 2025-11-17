import React, { useRef, useState, useEffect } from "react";
import { useRuleStore } from "../store/useRuleStore";
import { useCategoryStore } from "../store/useCategoryStore";
import { useSupplierStore } from "../store/useSupplierStore";
import { useEconomyStore } from "../store/useEconomyStore";
import Papa from "papaparse";
import { decode } from "iconv-lite-umd";
import { addEconomyItem } from "../api/economyApi";

interface Rule {
  id: number;
  contains: string;
  category: string;
  supplier: string;
}

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ open, onClose }) => {
      const [showOnlySelected, setShowOnlySelected] = useState(false);
    const { rules, addRule, deleteRule, fetchAll } = useRuleStore();
    useEffect(() => {
      if (open) {
        fetchAll();
      }
    }, [open, fetchAll]);
  // Zustand stores
  const { categories, addCategory, fetchCategories } = useCategoryStore();
  const { suppliers, addSupplier, fetchSuppliers } = useSupplierStore();
  const { items: existingItems, fetchItems } = useEconomyStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [newCategory, setNewCategory] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchSuppliers();
      // Ladda regler från localStorage om de finns
      const saved = localStorage.getItem("importRules");
    }
  }, [open, fetchCategories, fetchSuppliers]);
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories]);
  useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplier) {
      setSelectedSupplier(suppliers[0].id);
    }
  }, [suppliers]);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    await addCategory(newCategory.trim());
    await fetchCategories();
    setTimeout(() => {
      const found = categories.find(c => c.name === newCategory.trim());
      if (found) setSelectedCategory(found.id);
    }, 100);
    setNewCategory("");
  };
  const handleCreateSupplier = async () => {
    if (!newSupplier.trim() || !selectedCategory) return;
    setIsCreatingSupplier(true);
    await addSupplier(newSupplier.trim(), selectedCategory);
    await fetchSuppliers();
    setTimeout(() => {
      const found = suppliers.find(s => s.name === newSupplier.trim() && s.categoryId === selectedCategory);
      if (found) setSelectedSupplier(found.id);
    }, 100);
    setNewSupplier("");
    setIsCreatingSupplier(false);
  };

  // Fältmappning
  const internalFields = [
    { key: "date", label: "Datum" },
    { key: "amount", label: "Belopp" },
    { key: "description", label: "Beskrivning" },
    { key: "reference", label: "Referens" },
    { key: "account", label: "Kontonummer" },
    { key: "currency", label: "Valuta" },
  ];
  const [fieldMapping, setFieldMapping] = useState<{ [csvCol: string]: string }>({});
  const handleMappingChange = (csvCol: string, internalKey: string) => {
    setFieldMapping((prev) => ({ ...prev, [csvCol]: internalKey }));
  };

  // CSV
  const [headerLineIdx, setHeaderLineIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  // Markering av rader
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const handleSelectRow = (idx: number) => {
    setSelectedRows((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };
  const handleSelectAll = () => {
    if (csvData.length === selectedRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(csvData.map((_, i) => i));
    }
  };

  // Regler
  const [newRuleContains, setNewRuleContains] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("");
  const [newRuleSupplier, setNewRuleSupplier] = useState("");
  const [editRuleId, setEditRuleId] = useState<string | null>(null);

  const handleAddRule = () => {
    if (!newRuleContains.trim() || !newRuleCategory.trim() || !newRuleSupplier.trim()) return;
    const newRule = {
      id: Date.now(),
      contains: newRuleContains.trim(),
      category: newRuleCategory.trim(),
      supplier: newRuleSupplier.trim()
    };
    addRule(newRule);
    setNewRuleContains("");
    setNewRuleCategory("");
    setNewRuleSupplier("");
    setTimeout(() => {
      localStorage.setItem("importRules", JSON.stringify([...rules, newRule]));
    }, 100);
  };
  const handleDeleteRule = (id: string) => {
    deleteRule(id);
    if (editRuleId === id) setEditRuleId(null);
  };
  const handleEditRule = (id: string) => {
      const rule = rules.find(r => r._id === id);
    if (rule) {
      setNewRuleContains(rule.contains);
      setNewRuleCategory(rule.category);
      setNewRuleSupplier(rule.supplier || "");
      setEditRuleId(id);
    }
  };
  const handleSaveEditRule = () => {
    if (editRuleId === null) return;
    setEditRuleId(null);
    setNewRuleContains("");
    setTimeout(() => {
      // Spara nuvarande rules till localStorage
      localStorage.setItem("importRules", JSON.stringify(rules));
    }, 100);
  };
  // Applicera regler på rad
  const getCategoryForRow = (row: any) => {
    const descCol = Object.keys(fieldMapping).find(k => fieldMapping[k] === "description");
    const desc = descCol ? row[descCol] || "" : "";
    for (const rule of rules) {
      if (desc.toLowerCase().includes(rule.contains.toLowerCase())) {
        return rule.category;
      }
    }
    return "";
  };
  const getSupplierForRow = (row: any) => {
    const descCol = Object.keys(fieldMapping).find(k => fieldMapping[k] === "description");
    const desc = descCol ? row[descCol] || "" : "";
    for (const rule of rules) {
      if (desc.toLowerCase().includes(rule.contains.toLowerCase())) {
        return rule.supplier;
      }
    }
    return "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Läs som ArrayBuffer och konvertera från Windows-1252 (ANSI)
        const buffer = event.target?.result as ArrayBuffer;
        const text = decode(new Uint8Array(buffer), "windows-1252");
        const lines = text.split(/\r\n|\n/);
        let headerIdx = 0;
        let maxFields = 0;
        lines.forEach((line, idx) => {
          const fields = line.split(",");
          if (fields.length > maxFields) {
            maxFields = fields.length;
            headerIdx = idx;
          }
        });
        setHeaderLineIdx(headerIdx + 1);
        const cleanText = lines.slice(headerIdx).join("\n");
        const parsed = Papa.parse(cleanText, {
          header: true,
          skipEmptyLines: true,
        });
        if (parsed.errors.length > 0) {
          setCsvError("Fel vid tolkning av CSV: " + parsed.errors[0].message);
          setCsvData([]);
          setCsvHeaders([]);
          setFieldMapping({});
        } else {
          setCsvError(null);
          setCsvData(parsed.data as any[]);
          setCsvHeaders((parsed.meta.fields || []) as string[]);
          // Automatisk fältmappning
          const autoMap: { [csvCol: string]: string } = {};
          (parsed.meta.fields || []).forEach((col: string) => {
            if (col.toLowerCase().includes("transaktionsdag")) autoMap[col] = "date";
            else if (col.toLowerCase().includes("beskrivning")) autoMap[col] = "description";
            else if (col.toLowerCase().includes("belopp")) autoMap[col] = "amount";
          });
          setFieldMapping(autoMap);
        }
      } catch (err) {
        setCsvError("Fel vid uppladdning av fil.");
        setCsvData([]);
        setCsvHeaders([]);
        setFieldMapping({});
        setHeaderLineIdx(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const [importing, setImporting] = useState(false);
  const [importToast, setImportToast] = useState<string | null>(null);

  // Dubblettkontroll: returnerar true om posten redan finns
  const isDuplicate = (item: any, existing: any[]) => {
    return existing.some(e =>
      e.amount === item.amount &&
      e.year === item.year &&
      e.month === item.month &&
      e.name?.trim().toLowerCase() === item.name?.trim().toLowerCase() &&
      e.category === item.category &&
      e.supplier === item.supplier
    );
  };

  const handleImportSelected = async () => {
    if (selectedRows.length === 0) return;
    setImporting(true);
    await fetchItems(); // Hämta senaste poster
    try {
      const items = selectedRows.map(idx => {
        const row = csvData[idx];
        return {
          name: row[fieldMapping.description] || row["Beskrivning"] || "",
          amount: Number(row[fieldMapping.amount] || row["Belopp"] || 0),
          type: "expense",
          category: selectedCategory,
          supplier: selectedSupplier,
          note: row[fieldMapping.reference] || row["Referens"] || "",
          year: new Date(row[fieldMapping.date] || row["Datum"] || "").getFullYear() || new Date().getFullYear(),
          month: new Date(row[fieldMapping.date] || row["Datum"] || "").getMonth() + 1 || new Date().getMonth() + 1,
        };
      });
      let imported = 0;
      let skipped = 0;
      for (const item of items) {
        if (isDuplicate(item, existingItems)) {
          skipped++;
          continue;
        }
        try {
          await addEconomyItem(item);
          imported++;
        } catch (err: any) {
          setImportToast("Import misslyckades: " + (err?.response?.data?.message || err.message));
          setImporting(false);
          return;
        }
      }
      setImportToast(`Import klar! ${imported} importerade, ${skipped} dubletter hoppades över.`);
      setSelectedRows([]);
      setCsvData([]);
      setCsvHeaders([]);
      setFieldMapping({});
    } catch (err: any) {
      setImportToast("Import misslyckades: " + (err?.response?.data?.message || err.message));
    }
    setImporting(false);
  };

  if (!open) return null;

  // Stäng modal om man klickar på overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Rätta regel-UI: knappen aktiv om fält är ifyllda
  const canAddRule = newRuleContains.trim() && selectedCategory && selectedSupplier;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-5xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Importera transaktioner från CSV</h2>
          <label className="inline-block mb-4">
            <span className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 cursor-pointer inline-block">Välj fil</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        {headerLineIdx && csvHeaders.length > 0 && (
          <div className="text-xs text-gray-600 mb-2">
            Header-rad identifierad: Rad {headerLineIdx} – {csvHeaders.join(", ")}
          </div>
        )}
        {csvError && <div className="text-red-600 mb-2">{csvError}</div>}
        {csvData.length > 0 && (
          <div>
            {/* Regler UI */}
            <div className="mb-4 p-2 border rounded bg-blue-50">
              <div className="font-semibold mb-2 text-sm">Regler för beskrivningsmatchning:</div>
              <div className="flex flex-col gap-2 mb-2">
                {rules.map(rule => (
                  <div key={rule._id} className="flex items-center gap-2 text-xs">
                    <span>Om beskrivning innehåller</span>
                    <span className="px-2 py-1 bg-white border rounded">{rule.contains}</span>
                    <span>→ kategori</span>
                    <span className="px-2 py-1 bg-white border rounded">{rule.category}</span>
                    <span>Leverantör:</span>
                    <span className="px-2 py-1 bg-white border rounded">{rule.supplier}</span>
                    <button className="text-blue-600 underline" onClick={() => handleEditRule(rule._id!)}>Redigera</button>
                    <button className="text-red-600 underline" onClick={() => handleDeleteRule(rule._id!)}>Ta bort</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Om beskrivning innehåller</span>
                <input
                  type="text"
                  className="border rounded px-2 py-1"
                  value={newRuleContains}
                  onChange={e => setNewRuleContains(e.target.value)}
                  placeholder="t.ex. Swish"
                />
                <span>→ kategori</span>
                <div className="flex items-center gap-1">
                  <select
                    className="border rounded px-2 py-1"
                    value={newRuleCategory}
                    onChange={e => setNewRuleCategory(e.target.value)}
                  >
                    <option value="">Välj kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-24"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Ny kategori"
                  />
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={handleCreateCategory}
                    disabled={!newCategory.trim()}
                  >+
                  </button>
                </div>
                <span>Leverantör:</span>
                <div className="flex items-center gap-1">
                  <select
                    className="border rounded px-2 py-1"
                    value={newRuleSupplier}
                    onChange={e => setNewRuleSupplier(e.target.value)}
                    disabled={!newRuleCategory}
                  >
                    <option value="">Välj leverantör</option>
                    {suppliers.filter(sup => sup.categoryId === newRuleCategory).map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-24"
                    value={newSupplier}
                    onChange={e => setNewSupplier(e.target.value)}
                    placeholder="Ny leverantör"
                  />
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={handleCreateSupplier}
                    disabled={!newSupplier.trim() || !newRuleCategory}
                  >+
                  </button>
                </div>
                {editRuleId === null ? (
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={handleAddRule}
                    disabled={!newRuleContains.trim() || !newRuleCategory || !newRuleSupplier}
                  >
                    Lägg till regel
                  </button>
                ) : (
                  <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={handleSaveEditRule}>Spara ändring</button>
                )}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={showOnlySelected} onChange={e => setShowOnlySelected(e.target.checked)} />
                Visa endast valda rader
              </label>
            </div>
            <div className="mb-4 p-2 bg-gray-50 rounded border">
              <div className="font-semibold mb-2 text-xs">Fältmappning (välj hur varje kolumn ska sparas):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {csvHeaders.map((col) => (
                  <div key={col} className="flex items-center gap-2 text-xs relative">
                    <span className="w-32 truncate">{col}</span>
                    <select
                      className="border rounded px-2 py-1"
                      value={fieldMapping[col] || ""}
                      onChange={e => handleMappingChange(col, e.target.value)}
                    >
                      <option value="">Ignorera</option>
                      {internalFields.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                    {/* Varningstriangel vid krock */}
                    {(() => {
                      const val = fieldMapping[col];
                      if (!val) return null;
                      const mappedCols = Object.entries(fieldMapping).filter(([c, v]) => v === val);
                      if (mappedCols.length > 1) {
                        return (
                          <span title="Fältkrock! Flera kolumner har samma mappning." className="ml-1 text-yellow-600">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{display:'inline'}}>
                              <polygon points="10,2 18,18 2,18" />
                              <text x="10" y="15" textAnchor="middle" fontSize="10" fill="black">!</text>
                            </svg>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-auto max-h-96 mb-4">
              <table className="w-full text-sm border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1 bg-gray-100 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === csvData.length && csvData.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    {(showOnlySelected
                      ? csvHeaders.filter(col => fieldMapping[col])
                      : csvHeaders
                    ).map((col) => (
                      <th key={col} className="border px-2 py-1 bg-gray-100 dark:bg-slate-800">{col}</th>
                    ))}
                    <th className="border px-2 py-1 bg-gray-100">Kategori (regel)</th>
                    <th className="border px-2 py-1 bg-gray-100">Leverantör (regel)</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.length === 0 ? (
                    <tr>
                      <td colSpan={csvHeaders.length + 3} className="border px-2 py-4 text-center text-gray-500">
                        Ingen data
                      </td>
                    </tr>
                  ) : csvData.map((row, i) => {
                    // ...existing code...
                    const ruleCategory = getCategoryForRow(row);
                    const ruleSupplier = getSupplierForRow(row);
                    const previewItem = {
                      name: row[fieldMapping.description] || row["Beskrivning"] || "",
                      amount: Number(row[fieldMapping.amount] || row["Belopp"] || 0),
                      type: "expense",
                      category: ruleCategory || selectedCategory,
                      supplier: ruleSupplier || selectedSupplier,
                      note: row[fieldMapping.reference] || row["Referens"] || "",
                      year: new Date(row[fieldMapping.date] || row["Datum"] || "").getFullYear() || new Date().getFullYear(),
                      month: new Date(row[fieldMapping.date] || row["Datum"] || "").getMonth() + 1 || new Date().getMonth() + 1,
                    };
                    // ...existing code...
                    const descCol = Object.keys(fieldMapping).find(k => fieldMapping[k] === "description");
                    const desc = descCol ? row[descCol] || "" : "";
                    const matchedRule = rules.find(rule => desc.toLowerCase().includes(rule.contains.toLowerCase()));
                    const matchesRule = !!matchedRule;
                    const duplicate = isDuplicate(previewItem, existingItems) && !matchesRule;
                    // Filtrera kolumner om toggeln är aktiv
                    const visibleCols = showOnlySelected ? csvHeaders.filter(col => fieldMapping[col]) : csvHeaders;
                    return (
                      <tr key={i} className={
                        duplicate ? "bg-gray-200" : matchesRule ? "bg-blue-50" : ""
                      }>
                        <td className="border px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(i)}
                            onChange={() => handleSelectRow(i)}
                            disabled={duplicate}
                          />
                        </td>
                        {visibleCols.map((col) => (
                          <td key={col} className="border px-2 py-1">{row[col]}</td>
                        ))}
                        <td className="border px-2 py-1 font-semibold text-blue-700">{ruleCategory}</td>
                        <td className="border px-2 py-1 font-semibold text-blue-700">{ruleSupplier}</td>
                        <td className="border px-2 py-1 text-xs">
                          {matchedRule && (
                            <span className="inline-flex items-center gap-1 text-blue-700">
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="inline mr-1"><circle cx="10" cy="10" r="8" /></svg>
                              Regel: <span className="font-mono bg-blue-100 px-1 rounded">{matchedRule.contains}</span>
                              <span className="ml-1">→</span>
                              <span className="font-semibold">{matchedRule.category}</span>
                              <span className="ml-1">/</span>
                              <span className="font-semibold">{matchedRule.supplier}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-gray-600">
                {selectedRows.length} av {csvData.length} poster valda för import
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
                onClick={handleImportSelected}
                disabled={
                  Object.values(fieldMapping).filter(Boolean).length < 3 ||
                  selectedRows.length === 0 ||
                  (() => {
                    // Krock: om något internfält är valt för flera kolumner
                    const used = Object.values(fieldMapping).filter(Boolean);
                    return used.length !== new Set(used).size;
                  })()
                }
              >
                {importing ? "Importerar..." : "Importera markerade fält"}
              </button>
            </div>
            {importToast && (
              <div className="mb-4 p-2 rounded bg-green-50 text-green-700 text-sm">
                {importToast}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            onClick={onClose}
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCsvModal;
