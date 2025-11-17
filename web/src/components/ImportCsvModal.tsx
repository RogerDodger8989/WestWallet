import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { decode } from "iconv-lite-umd";

interface ImportCsvModalProps {
  open: boolean;
  onClose: () => void;
}

const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ open, onClose }) => {
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

        const parsed = Papa.parse(cleanText, {
          header: true,
          skipEmptyLines: true,
        });
        if (parsed.errors.length > 0) {
          setCsvError("Fel vid tolkning av CSV: " + parsed.errors[0].message);
          setCsvData([]);
          setCsvHeaders([]);
        } else {
          setCsvError(null);
          setCsvData(parsed.data as any[]);
          setCsvHeaders(parsed.meta.fields || []);
        }
      } catch (err) {
        setCsvError("Fel vid uppladdning av fil.");
        setCsvData([]);
        setCsvHeaders([]);
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
        {csvError && <div className="text-red-600 mb-2">{csvError}</div>}
        {csvData.length > 0 && (
          <div className="overflow-auto max-h-96 mb-4">
            <table className="w-full text-sm border">
              <thead>
                <tr>
                  {csvHeaders.map((col) => (
                    <th key={col} className="border px-2 py-1 bg-gray-100 dark:bg-slate-800">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, i) => (
                  <tr key={i}>
                    {csvHeaders.map((col) => (
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
