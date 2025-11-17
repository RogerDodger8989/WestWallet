import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { decode } from "iconv-lite-umd";

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ open, onClose }) => {
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

        const handleImport = () => {
          // Extrahera mappade fält från markerade rader
          const mapped = selectedRows.map(idx => {
            const row = csvData[idx];
            return {
              month: row[Object.keys(fieldMapping).find(k => fieldMapping[k] === "date") || ""] || "",
              name: row[Object.keys(fieldMapping).find(k => fieldMapping[k] === "description") || ""] || "",
              amount: row[Object.keys(fieldMapping).find(k => fieldMapping[k] === "amount") || ""] || "",
            };
          });
          // Här kan du skicka mapped till backend eller vidare i appen
          alert(`Importerar ${mapped.length} transaktioner!`);
          onClose();
        };
      // För fältmappning
      const internalFields = [
        { key: "date", label: "Datum" },
        { key: "amount", label: "Belopp" },
        { key: "description", label: "Beskrivning" },
        { key: "reference", label: "Referens" },
        { key: "account", label: "Kontonummer" },
        { key: "currency", label: "Valuta" },
        // Lägg till fler vid behov
      ];
      const [fieldMapping, setFieldMapping] = useState<{ [csvCol: string]: string }>({});

      const handleMappingChange = (csvCol: string, internalKey: string) => {
        setFieldMapping((prev) => ({ ...prev, [csvCol]: internalKey }));
      };
    const [headerLineIdx, setHeaderLineIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  if (!open) return null;

  // Stäng modal om man klickar på overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        setHeaderLineIdx(headerIdx + 1); // Visa 1-baserad radnummer
        // Skapa en ny text med bara header och data
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
          setCsvHeaders(parsed.meta.fields || []);
          // Automatisk fältmappning
          const autoMap: { [csvCol: string]: string } = {};
          (parsed.meta.fields || []).forEach(col => {
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="mb-4"
          onChange={handleFileChange}
        />
          {headerLineIdx && csvHeaders.length > 0 && (
            <div className="text-xs text-gray-600 mb-2">
              Header-rad identifierad: Rad {headerLineIdx} – {csvHeaders.join(", ")}
            </div>
          )}
        {csvError && <div className="text-red-600 mb-2">{csvError}</div>}
        {csvData.length > 0 && (
          <div>
            <div className="mb-4 p-2 border rounded bg-gray-50">
              {/* Fältmappning UI */}
              <div className="font-semibold mb-2 text-sm">Mappa CSV-kolumner till interna fält:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {csvHeaders.map((col) => (
                  <div key={col} className="flex items-center gap-2 text-xs">
                    <span className="w-40 truncate" title={col}>{col}</span>
                    <select
                      className="border rounded px-2 py-1"
                      value={fieldMapping[col] || ""}
                      onChange={e => handleMappingChange(col, e.target.value)}
                    >
                      <option value="">Ingen mappning</option>
                      {internalFields.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
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
                    {csvHeaders.map((col) => (
                      <th key={col} className="border px-2 py-1 bg-gray-100 dark:bg-slate-800">{col}</th>
                    ))}
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
                onClick={handleImport}
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
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            onClick={() => fileInputRef.current?.click()}
          >
            Välj fil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportCsvModal;
