import React from 'react';

const AdminSettingsPage: React.FC = () => {
  // Mock settings
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Systeminställningar</h1>
      <form className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Pris per månad (kr)</label>
          <input type="number" className="w-full p-2 rounded border dark:bg-slate-800 dark:text-white" defaultValue={19} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Testperiod (dagar)</label>
          <input type="number" className="w-full p-2 rounded border dark:bg-slate-800 dark:text-white" defaultValue={30} />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Versionsinfo</label>
          <input type="text" className="w-full p-2 rounded border dark:bg-slate-800 dark:text-white" defaultValue="v1.0.0" />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Serverstatus</label>
          <input type="text" className="w-full p-2 rounded border dark:bg-slate-800 dark:text-white" defaultValue="OK" />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Spara ändringar</button>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
