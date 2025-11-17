import React, { useRef, useState } from "react";
import Papa from "papaparse";

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ open, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string>("");

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
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // Dela upp i rader
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
      // Hitta första raden med flest fält (troligen header)
      let headerLineIdx = 0;
      let maxFields = 0;
      lines.forEach((line, idx) => {
        const fields = line.split(",");
        if (fields.length > maxFields) {
          maxFields = fields.length;
          headerLineIdx = idx;
        }
      });
      // Skapa en ny text med bara header och data
      const cleanText = lines.slice(headerLineIdx).join("\n");
      Papa.parse(cleanText, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length) {
            setCsvError("Fel vid läsning av CSV: " + result.errors[0].message);
            setCsvRows([]);
          } else {
            setCsvRows(result.data as any[]);
            setCsvError("");
          }
        },
        error: (err) => {
          setCsvError("Fel vid läsning av CSV: " + err.message);
          setCsvRows([]);
        }
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleOverlayClick}>
      <div className="bg-white dark:bg-slate-900 rounded shadow-lg p-8 w-full max-w-5xl relative overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Importera transaktioner från CSV</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="mb-4"
          onChange={handleFileChange}
        />
        {csvError && <div className="text-red-600 mb-2">{csvError}</div>}
        {csvRows.length > 0 && (
          <div className="overflow-auto max-h-96 mb-4">
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  {Object.keys(csvRows[0]).map((col) => (
                    <th key={col} className="border px-2 py-1 bg-gray-100 dark:bg-slate-800">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row, i) => (
                  <tr key={i}>
                    {Object.keys(row).map((col) => (
                      <td key={col} className="border px-2 py-1">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
