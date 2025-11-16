import React, { useEffect, useState } from 'react';
import { getImageCategories, updateImageCategory } from '../api/imageCategoriesApi';

const ImageCategorySettings: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editPaths, setEditPaths] = useState<{ [key: string]: string }>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    getImageCategories()
      .then(data => {
        setCategories(data);
        setEditPaths(Object.fromEntries(data.map((cat: any) => [cat.key, cat.localPath])));
        setLoading(false);
      })
      .catch(() => {
        setError('Kunde inte hämta bildkategorier');
        setLoading(false);
      });
  }, []);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await updateImageCategory(key, editPaths[key]);
      setError('');
    } catch {
      setError('Kunde inte spara sökväg');
    }
    setSavingKey(null);
  };

  if (loading) return <div>Laddar bildkategorier...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const icons: Record<string, string> = {
    economy: '💰',
    contracts: '📄',
    car: '🚗',
    inventory: '📦',
    warranty: '🛡️',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-96 mt-8">
      <h3 className="font-semibold mb-2">Bildmappar per meny</h3>
      <ul>
        {categories.map(cat => (
          <li key={cat.key} className="mb-4">
            <div className="font-semibold mb-1 flex items-center gap-2">
              <span className="text-2xl">{icons[cat.key] || '📁'}</span>
              {cat.name}
            </div>
            <input
              type="text"
              value={editPaths[cat.key] || ''}
              onChange={e => setEditPaths(p => ({ ...p, [cat.key]: e.target.value }))}
              className="p-2 rounded border w-full mb-2"
              disabled={savingKey === cat.key}
            />
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded"
              disabled={savingKey === cat.key}
              onClick={() => handleSave(cat.key)}
            >Spara</button>
          </li>
        ))}
      </ul>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
};

export default ImageCategorySettings;
