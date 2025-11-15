import React from 'react';

const EconomyPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Ekonomihantering</h1>
      {/* Här kommer formulär, tabell, bildhantering, filter och export */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded shadow mb-8">
        <h2 className="font-semibold mb-4">Lägg till ny post</h2>
        {/* Formulär för att skapa/uppdatera post */}
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded shadow">
        <h2 className="font-semibold mb-4">Transaktioner</h2>
        {/* Tabell med poster, filter, bildhantering, export */}
      </div>
    </div>
  );
};

export default EconomyPage;
