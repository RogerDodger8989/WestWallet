import React, { useEffect, useState, useRef } from 'react';
import { getImageSettings } from '../api/imageSettingsApi';
import { updateImageSettings } from '../api/updateImageSettingsApi';

const ImageSettings: React.FC = () => {
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [pendingPath, setPendingPath] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editPath, setEditPath] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getImageSettings()
      .then(data => {
        setSettings(data);
        setEditPath(data.localPath);
        setLoading(false);
      })
      .catch(() => {
        setError('Kunde inte hämta bildinställningar');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Laddar bildinställningar...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!settings) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-96">
      <h3 className="font-semibold mb-2">Bildinställningar</h3>
      <ul className="mb-4">
        <li><strong>Lagring:</strong> {settings.storage}</li>
        <li><strong>Lokal sökväg:</strong> {settings.localPath}</li>
        <li><strong>Komprimering:</strong> {settings.compress ? 'Ja' : 'Nej'}</li>
      </ul>
      <form
        onSubmit={async e => {
          e.preventDefault();
          if (editPath !== settings.localPath) {
            setPendingPath(editPath);
            setShowMoveModal(true);
            return;
          }
          setSaving(true);
          try {
            const updated = await updateImageSettings(editPath);
            setSettings(updated);
            setError('');
          } catch {
            setError('Kunde inte spara ny sökväg');
          }
          setSaving(false);
        }}
        className="mb-2"
      >
        <label className="block mb-2 font-semibold">Ändra sökväg för bilder</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={editPath}
            onChange={e => setEditPath(e.target.value)}
            className="p-2 rounded border w-full"
            disabled={saving}
          />
          <button
            type="button"
            className="px-3 py-1 bg-gray-300 rounded"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >Välj mapp</button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            webkitdirectory="true"
            mozdirectory="true"
            directory="true"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                // Få mappens sökväg från första filen
                const file = e.target.files[0];
                // @ts-ignore
                const folderPath = file.webkitRelativePath?.split('/')[0] || '';
                if (folderPath) setEditPath(folderPath);
              }
            }}
          />
        </div>
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded" disabled={saving}>
          Spara
        </button>
        <button
          type="button"
          className="px-3 py-1 bg-gray-400 text-white rounded ml-2"
          disabled={saving}
          onClick={() => {
            // Återställ till standard
            setEditPath(settings.defaultPath || '');
          }}
        >Återställ till standard</button>
      </form>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-96" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">Flytta bilder?</h3>
            <p>Vill du flytta alla bilder till den nya mappen?<br />Bilderna behåller sina ID-mappar.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowMoveModal(false)}>Avbryt</button>
              <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded" onClick={async () => {
                setShowMoveModal(false);
                setSaving(true);
                try {
                  // Här ska flyttlogik implementeras
                  const updated = await updateImageSettings(pendingPath);
                  setSettings(updated);
                  setEditPath(pendingPath);
                  setError('');
                } catch {
                  setError('Kunde inte spara ny sökväg');
                }
                setSaving(false);
              }}>Flytta och spara</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSettings;
