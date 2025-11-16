import React from 'react';
import ImageSettings from '../../components/ImageSettings';
import ImageCategorySettings from '../../components/ImageCategorySettings';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  return (
    <>
      <div className="p-8 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Inställningar</h1>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Användarnamn</label>
          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">{user?.name}</div>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">E-post</label>
          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">{user?.email}</div>
        </div>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Tema</label>
          <select value={theme} onChange={e => setTheme(e.target.value as any)} className="p-2 rounded bg-blue-50 dark:bg-blue-900">
            <option value="light">Ljust</option>
            <option value="dark">Mörkt</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>
      <div className="mt-8">
        <ImageSettings />
        <ImageCategorySettings />
      </div>
    </>
  );
};

export default SettingsPage;
