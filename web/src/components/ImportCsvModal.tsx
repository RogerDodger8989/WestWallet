import React, { useRef, useState, useEffect } from "react";
import Papa from "papaparse";
import { categoryApi } from "../api/categoryApi";
import { supplierApi } from "../api/supplierApi";
import { decode } from "iconv-lite-umd";

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
  // Backend-data
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);

  useEffect(() => {
    if (open) {
      categoryApi.getCategories().then((data) => setCategories(data.map((c: any) => c.name)));
      supplierApi.getSuppliers().then((data) => setSuppliers(data.map((s: any) => s.name)));
    }
  }, [open]);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    setIsCreatingCategory(true);
    await categoryApi.createCategory(newCategory.trim());
    const updated = await categoryApi.getCategories();
    setCategories(updated.map((c: any) => c.name));
    setNewCategory("");
    setIsCreatingCategory(false);
  };
  const handleCreateSupplier = async () => {
    if (!newSupplier.trim()) return;
    setIsCreatingSupplier(true);
    await supplierApi.createSupplier(newSupplier.trim(), "");
    const updated = await supplierApi.getSuppliers();
    setSuppliers(updated.map((s: any) => s.name));
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
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRuleContains, setNewRuleContains] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("");
  const [newRuleSupplier, setNewRuleSupplier] = useState("");
  const [editRuleId, setEditRuleId] = useState<number | null>(null);

  const handleAddRule = () => {
    if (!newRuleContains.trim() || !newRuleCategory.trim() || !newRuleSupplier.trim()) return;
    setRules(prev => [...prev, {
      id: Date.now(),
      contains: newRuleContains.trim(),
      category: newRuleCategory.trim(),
      supplier: newRuleSupplier.trim()
    }]);
    setNewRuleContains("");
    setNewRuleCategory("");
    setNewRuleSupplier("");
  };
  const handleDeleteRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
    if (editRuleId === id) setEditRuleId(null);
  };
  const handleEditRule = (id: number) => {
    const rule = rules.find(r => r.id === id);
    if (rule) {
      setNewRuleContains(rule.contains);
      setNewRuleCategory(rule.category);
      setNewRuleSupplier(rule.supplier || "");
      setEditRuleId(id);
    }
  };
  const handleSaveEditRule = () => {
    if (editRuleId === null) return;
    setRules(prev => prev.map(r => r.id === editRuleId ? {
      ...r,
      contains: newRuleContains.trim(),
      category: newRuleCategory.trim(),
      supplier: newRuleSupplier.trim()
    } : r));
    setEditRuleId(null);
    setNewRuleContains("");
    setNewRuleCategory("");
    setNewRuleSupplier("");
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

  // CSV-filuppladdning
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // Läs som ArrayBuffer och konvertera från Windows-1252 (ANSI)
        const buffer = event.target?.result as ArrayBuffer;
        const uint8 = new Uint8Array(buffer);
        const text = decode(uint8, "windows-1252");
        // Hitta första raden med flest fält (troligen header)
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
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

  if (!open) return null;

  // Stäng modal om man klickar på overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
                  <div key={rule.id} className="flex items-center gap-2 text-xs">
                    <span>Om beskrivning innehåller</span>
                    <span className="px-2 py-1 bg-white border rounded">{rule.contains}</span>
                    <span>→ kategori</span>
                    <span className="px-2 py-1 bg-white border rounded">{rule.category}</span>
                    <span>Leverantör:</span>
                    <span className="px-2 py-1 bg-white border rounded">{rule.supplier}</span>
                    <button className="text-blue-600 underline" onClick={() => handleEditRule(rule.id)}>Redigera</button>
                    <button className="text-red-600 underline" onClick={() => handleDeleteRule(rule.id)}>Ta bort</button>
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
                      <option key={cat} value={cat}>{cat}</option>
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
                    disabled={isCreatingCategory || !newCategory.trim()}
                  >+
                  </button>
                </div>
                <span>Leverantör:</span>
                <div className="flex items-center gap-1">
                  <select
                    className="border rounded px-2 py-1"
                    value={newRuleSupplier}
                    onChange={e => setNewRuleSupplier(e.target.value)}
                  >
                    <option value="">Välj leverantör</option>
                    {suppliers.map(sup => (
                      <option key={sup} value={sup}>{sup}</option>
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
                    disabled={isCreatingSupplier || !newSupplier.trim()}
                  >+
                  </button>
                </div>
                {editRuleId === null ? (
                  <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={handleAddRule}>Lägg till regel</button>
                ) : (
                  <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={handleSaveEditRule}>Spara ändring</button>
                )}
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
                    {csvHeaders.map((col) => (
                      <th key={col} className="border px-2 py-1 bg-gray-100 dark:bg-slate-800">{col}</th>
                    ))}
                    <th className="border px-2 py-1 bg-gray-100">Kategori (regel)</th>
                    <th className="border px-2 py-1 bg-gray-100">Leverantör (regel)</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(i)}
                          onChange={() => handleSelectRow(i)}
                        />
                      </td>
                      {csvHeaders.map((col) => (
                        <td key={col} className="border px-2 py-1">{row[col]}</td>
                      ))}
                      <td className="border px-2 py-1 font-semibold text-blue-700">{getCategoryForRow(row)}</td>
                      <td className="border px-2 py-1 font-semibold text-blue-700">{getSupplierForRow(row)}</td>
                    </tr>
                  ))}
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
                onClick={() => {/* importlogik här */}}
                disabled={Object.values(fieldMapping).filter(Boolean).length < 3 || selectedRows.length === 0}
              >
                Importera markerade fält
              </button>
            </div>
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
