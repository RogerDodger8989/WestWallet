
import React, { useState, useEffect } from "react";
import { useCategoryStore } from "../store/useCategoryStore";
import { useSupplierStore } from "../store/useSupplierStore";
import Papa from "papaparse";
import { decode } from "iconv-lite-umd";
import { addEconomyItem } from "../api/economyApi";
import { useEconomyStore } from "../store/useEconomyStore";

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
}

const internalFields = [
  { key: "description", label: "Beskrivning" },
  { key: "amount", label: "Belopp" },
  { key: "date", label: "Datum" },
  { key: "reference", label: "Referens" },
];

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ open, onClose }) => {
    // Regelhantering
    const [rules, setRules] = useState<{ contains: string; category: string; supplier?: string }[]>([]);
    // Load rules from localStorage on mount
    useEffect(() => {
      const stored = localStorage.getItem("importRules");
      if (stored) {
        try {
          setRules(JSON.parse(stored));
        } catch {}
      }
    }, []);
    // Save rules to localStorage whenever they change
    useEffect(() => {
      localStorage.setItem("importRules", JSON.stringify(rules));
    }, [rules]);
    const [newRuleContains, setNewRuleContains] = useState("");
    const [newRuleCategory, setNewRuleCategory] = useState("");
    const [newRuleSupplier, setNewRuleSupplier] = useState("");
    const [editRuleId, setEditRuleId] = useState<number | null>(null);

    const handleAddRule = () => {
      if (!newRuleContains.trim() || !newRuleCategory) return;
      setRules(prev => [
        ...prev,
        { contains: newRuleContains.trim(), category: newRuleCategory, supplier: newRuleSupplier }
      ]);
      setNewRuleContains("");
      setNewRuleCategory("");
      setNewRuleSupplier("");
    };
    const handleEditRule = (idx: number) => {
      setEditRuleId(idx);
      setNewRuleContains(rules[idx].contains);
      setNewRuleCategory(rules[idx].category);
      setNewRuleSupplier(rules[idx].supplier || "");
    };
    const handleSaveEditRule = () => {
      if (editRuleId === null) return;
      setRules(prev => prev.map((r, i) =>
        i === editRuleId ? { contains: newRuleContains.trim(), category: newRuleCategory, supplier: newRuleSupplier } : r
      ));
      setEditRuleId(null);
      setNewRuleContains("");
      setNewRuleCategory("");
      setNewRuleSupplier("");
    };
    const handleDeleteRule = (idx: number) => {
      setRules(prev => prev.filter((_, i) => i !== idx));
      if (editRuleId === idx) setEditRuleId(null);
    };
  // State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvError, setCsvError] = useState<string>("");
  const [fieldMapping, setFieldMapping] = useState<{ [col: string]: string }>({});
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [importToast, setImportToast] = useState<string>("");
  const [importResults, setImportResults] = useState<Array<{row: number; success: boolean; error?: string}>>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");

  // Category store
  const categories = useCategoryStore(state => state.categories);
  const loadingCat = useCategoryStore(state => state.loading);
  const selectedCategory = useCategoryStore(state => state.selectedCategory);
  const setSelectedCategory = (id: string) => useCategoryStore.setState({ selectedCategory: id });
  const fetchCategories = useCategoryStore(state => state.fetchCategories);
  const addCategory = useCategoryStore(state => state.addCategory);
  // Supplier store
  const suppliers = useSupplierStore(state => state.suppliers);
  const loadingSup = useSupplierStore(state => state.loading);
  const selectedSupplier = useSupplierStore(state => state.selectedSupplier);
  const setSelectedSupplier = (id: string) => useSupplierStore.setState({ selectedSupplier: id });
  const fetchSuppliers = useSupplierStore(state => state.fetchSuppliers);
  const addSupplier = useSupplierStore(state => state.addSupplier);

  // No demo data: keep CSV empty until user uploads a file
  // Economy store helper
  const addItemToStore = useEconomyStore(state => state.addItem);
  const fetchEconomyItems = useEconomyStore(state => state.fetchItems);

  // Automatisk fältmappning vid rubrikimport
  useEffect(() => {
    if (csvHeaders.length > 0) {
      setFieldMapping(prev => {
        const autoMap: { [col: string]: string } = { ...prev };
        csvHeaders.forEach(h => {
          if (h.toLowerCase().includes("transaktionsdag")) autoMap[h] = "date";
          if (h.toLowerCase().includes("beskrivning")) autoMap[h] = "description";
          if (h.toLowerCase().includes("belopp")) autoMap[h] = "amount";
        });
        return autoMap;
      });
    }
  }, [csvHeaders]);

  // Handlers
  const handleMappingChange = (col: string, value: string) => {
    setFieldMapping((prev) => ({ ...prev, [col]: value }));
  };
  const handleSelectRow = (i: number) => {
    setSelectedRows((prev) =>
      prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
    );
  };
  const handleSelectAll = () => {
    if (selectedRows.length === csvData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(csvData.map((_, i) => i));
    }
  };
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await addCategory(newCategoryName.trim());
    if (res) {
      setNewCategoryName("");
      await fetchCategories();
    }
  };
  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim() || !selectedCategory) return;
    await addSupplier(newSupplierName.trim(), selectedCategory);
    setNewSupplierName("");
    await fetchSuppliers();
  };

  // Regelmatchning
  const getMatchedRule = (row: any) => {
    const descCol = Object.keys(fieldMapping).find(k => fieldMapping[k] === "description");
    const desc = descCol ? row[descCol] || "" : "";
    return rules.find(rule => desc.toLowerCase().includes(rule.contains.toLowerCase()));
  };

  // Dubblettkontroll
  const existingItems: { amount: number; date: string; description: string }[] = [];
  const isDuplicate = (row: Record<string, any>) => {
    const desc = fieldMapping["description"] ? row[fieldMapping["description"]] : row["Beskrivning"] || "";
    const amount = fieldMapping["amount"] ? Number(row[fieldMapping["amount"]]) : Number(row["Belopp"] || 0);
    const date = fieldMapping["date"] ? row[fieldMapping["date"]] : row["Datum"] || "";
    return existingItems.some(item =>
      item.amount === amount &&
      item.date === date &&
      item.description === desc
    );
  };

  // Importera markerade poster (just nu loggas bara datan)
  const handleImport = () => {
    setImporting(true);
    // Prepare items to import
    const itemsToImport = selectedRows.map(i => {
      const row = csvData[i];
      // Find rule for row
      const matchedRule = getMatchedRule(row);
      return {
        name: row[fieldMapping.description] || row["Beskrivning"] || "",
        amount: Number(row[fieldMapping.amount] || row["Belopp"] || 0),
        type: "expense",
        category: matchedRule?.category || selectedCategory,
        supplier: matchedRule?.supplier || selectedSupplier,
        note: row[fieldMapping.reference] || row["Referens"] || "",
        year: new Date(row[fieldMapping.date] || row["Datum"] || "").getFullYear() || new Date().getFullYear(),
        month: new Date(row[fieldMapping.date] || row["Datum"] || "").getMonth() + 1 || new Date().getMonth() + 1,
      };
    });
    // Import via store so UI updates
    // Import each row and collect results
    Promise.all(itemsToImport.map((item, idx) =>
      addItemToStore(item)
        .then(() => ({ row: selectedRows[idx], success: true }))
        .catch(e => ({ row: selectedRows[idx], success: false, error: e?.message || 'Okänt fel' }))
    )).then(async results => {
      try { await fetchEconomyItems(); } catch {}
      setImportResults(results);
      setImportToast(`Import färdig! ${results.filter(r=>r.success).length} av ${results.length} rader importerade.`);
      setImporting(false);
      setSelectedRows([]);
      setTimeout(() => {
        setImportToast("");
        setImportResults([]);
        onClose();
      }, 3000);
    });
  };

  // Hantera filuppladdning och parsing
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      let text = evt.target?.result as string;
      try {
        text = decode(new Uint8Array(evt.target?.result as ArrayBuffer), "windows-1252");
      } catch {
        // fallback: vanlig text
      }
      const lines = text.split(/\r?\n/);
      if (lines.length > 1) {
        text = lines.slice(1).join("\n");
      }
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
        complete: (results) => {
          if (results.errors.length) {
            setCsvError("Fel vid import/parsing av CSV! " + results.errors.map(e => e.message).join(", "));
            setCsvData([]);
            setCsvHeaders([]);
          } else {
            setCsvError("");
            setCsvData(results.data as any[]);
            setCsvHeaders(results.meta.fields || []);
          }
        },
      });
    };
    reader.readAsArrayBuffer(file);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl relative flex flex-col" style={{maxHeight: '90vh'}}>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Stäng"
        >
          &times;
        </button>
        <div className="overflow-y-auto flex-1">
          {/* CSV-import */}
          <div className="mb-4">
            <label className="block mb-2 font-semibold">Importera CSV-fil:</label>
            <input type="file" accept=".csv" onChange={handleCsvUpload} />
            {csvError && <div className="text-red-600 mt-2">{csvError}</div>}
          </div>
          {/* Fältmappning med krockvarning */}
          {csvHeaders.length > 0 && (
            <>
              <div className="mb-4 p-2 bg-gray-50 rounded border">
                <div className="font-semibold mb-2 text-xs">Fältmappning (välj hur varje kolumn ska sparas):</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {csvHeaders.map((col) => {
                    const val = fieldMapping[col];
                    const mappedCols = Object.entries(fieldMapping).filter(([c, v]) => v === val);
                    const hasCollision = val && mappedCols.length > 1;
                    return (
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
                        {hasCollision && (
                          <span title="Fältkrock! Flera kolumner har samma mappning." className="ml-1 text-yellow-600">
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{display:'inline'}}>
                              <polygon points="10,2 18,18 2,18" />
                              <text x="10" y="15" textAnchor="middle" fontSize="10" fill="black">!</text>
                            </svg>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Regler - visas under fältmappning */}
              <div className="mb-4 p-2 bg-gray-50 rounded border">
                <div className="font-semibold mb-2 text-xs">Regler (automatisk kategorisering):</div>
                <div className="mb-2">
                  {rules.length === 0 && <div className="text-xs text-gray-500">Inga regler tillagda.</div>}
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1 text-xs">
                      <span className="font-mono bg-blue-100 px-1 rounded">{rule.contains}</span>
                      <span className="ml-1">→</span>
                      <span className="font-semibold">{rule.category}</span>
                      {rule.supplier && <span className="ml-1">/</span>}
                      {rule.supplier && <span className="font-semibold">{rule.supplier}</span>}
                      <button className="px-1 py-0 bg-yellow-200 rounded text-xs" onClick={() => handleEditRule(idx)}>Ändra</button>
                      <button className="px-1 py-0 bg-red-200 rounded text-xs" onClick={() => handleDeleteRule(idx)}>Ta bort</button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col md:flex-row gap-2 items-center">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 text-xs"
                    value={newRuleContains}
                    onChange={e => setNewRuleContains(e.target.value)}
                    placeholder="Om beskrivning innehåller..."
                  />
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    value={newRuleCategory}
                    onChange={e => setNewRuleCategory(e.target.value)}
                  >
                    <option value="">Välj kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    value={newRuleSupplier}
                    onChange={e => setNewRuleSupplier(e.target.value)}
                    disabled={!newRuleCategory}
                  >
                    <option value="">Välj leverantör</option>
                    {suppliers.filter(sup => sup.categoryId === newRuleCategory).map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                  {editRuleId === null ? (
                    <button
                      className="px-2 py-1 bg-blue-600 text-white rounded"
                      onClick={handleAddRule}
                      disabled={!newRuleContains.trim() || !newRuleCategory}
                    >Lägg till regel</button>
                  ) : (
                    <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={handleSaveEditRule}>Spara ändring</button>
                  )}
                </div>
              </div>
              {/* Kategori- och leverantörsval med inline creation - moved here */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <select
                    className="border rounded px-2 py-1"
                    value={selectedCategory || ""}
                    onChange={e => setSelectedCategory(e.target.value)}
                    disabled={loadingCat}
                  >
                    <option value="">Välj kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-24"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Ny kategori"
                  />
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                  >+
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    className="border rounded px-2 py-1"
                    value={selectedSupplier || ""}
                    onChange={e => setSelectedSupplier(e.target.value)}
                    disabled={loadingSup || !selectedCategory}
                  >
                    <option value="">Välj leverantör</option>
                    {suppliers.filter(sup => sup.categoryId === selectedCategory).map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-24"
                    value={newSupplierName}
                    onChange={e => setNewSupplierName(e.target.value)}
                    placeholder="Ny leverantör"
                  />
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={handleCreateSupplier}
                    disabled={!newSupplierName.trim() || !selectedCategory}
                  >+
                  </button>
                </div>
              </div>
            </>
          )}
          {/* Preview-tabell med checkboxar, dubblettkontroll och regelmatchning */}
          {csvData.length > 0 && (
            <>
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
                      {/* Only show columns that are mapped to an internal field */}
                      {csvHeaders.filter(col => fieldMapping[col]).map((col) => (
                        <th key={col} className="border px-2 py-1 bg-gray-100">{col}</th>
                      ))}
                      <th className="border px-2 py-1 bg-gray-100">Status</th>
                      <th className="border px-2 py-1 bg-gray-100">Regel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((row, i) => {
                      const duplicate = isDuplicate(row);
                      const matchedRule = getMatchedRule(row);
                      return (
                        <tr key={i} className={duplicate ? "bg-gray-200" : matchedRule ? "bg-blue-50" : ""}>
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(i)}
                              onChange={() => handleSelectRow(i)}
                              disabled={duplicate}
                            />
                          </td>
                          {/* Only show columns that are mapped to an internal field */}
                          {csvHeaders.filter(col => fieldMapping[col]).map((col) => (
                            <td key={col} className="border px-2 py-1">{row[col]}</td>
                          ))}
                          <td className="border px-2 py-1 text-xs">
                            {duplicate ? <span className="text-red-600">Dubblett</span> : <span className="text-green-600">OK</span>}
                          </td>
                          <td className="border px-2 py-1 text-xs">
                            {matchedRule ? (
                              <span className="inline-flex items-center gap-1 text-blue-700">
                                Regel: <span className="font-mono bg-blue-100 px-1 rounded">{matchedRule.contains}</span>
                                <span className="ml-1">→</span>
                                <span className="font-semibold">{matchedRule.category}</span>
                              </span>
                            ) : null}
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
                  className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
                  onClick={handleImport}
                  disabled={
                    selectedRows.length === 0 ||
                    csvData.some(isDuplicate) || importing ||
                    (() => {
                      const used = Object.values(fieldMapping).filter(Boolean);
                      return used.length !== new Set(used).size;
                    })()
                  }
                >
                  {importing ? "Importerar..." : "Importera markerade rader"}
                </button>
              </div>
              {importToast && (
                <div className="mb-4 p-2 rounded bg-green-50 text-green-700 text-sm">
                  {importToast}
                  {importResults.length > 0 && (
                    <div className="mt-2 text-xs">
                      <div className="font-semibold mb-1">Importresultat:</div>
                      <ul>
                        {importResults.map((res, idx) => (
                          <li key={idx} className={res.success ? "text-green-700" : "text-red-600"}>
                            Rad {res.row + 1}: {res.success ? "OK" : `Fel: ${res.error}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {/* Kategori- och leverantörsval flyttad under fältmappning */}
        </div>
      </div>
    </div>
  );
};

export default ImportCsvModal;
