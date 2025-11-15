import React from 'react';

const AdminMailPage: React.FC = () => {
  // Mock mail form
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Mailutskick</h1>
      <form className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Ämne</label>
          <input type="text" className="w-full p-2 rounded border dark:bg-slate-800 dark:text-white" />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Meddelande</label>
          <textarea className="w-full p-2 rounded border dark:bg-slate-800 dark:text-white" rows={5} />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Skicka mail</button>
      </form>
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Mailhistorik (mock)</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>2025-11-01: "Provperiod slut" skickat till 12 användare</li>
          <li>2025-10-15: "Välkommen till WestWallet" skickat till 5 användare</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminMailPage;
