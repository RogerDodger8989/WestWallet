import React from 'react';

interface EconomySummaryProps {
  income: number;
  expense: number;
  net: number;
  selectedMonths: string[];
  selectedYear: string;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

export const EconomySummary: React.FC<EconomySummaryProps> = ({ income, expense, net, selectedMonths, selectedYear }) => {
  const monthsLabel = selectedMonths.length === 12 ? 'Alla månader' : selectedMonths.map(m => monthNames[parseInt(m, 10) - 1]).join(', ');
  return (
    <div className="flex gap-6 mb-8">
      {/* Utgifter */}
      <div className="flex-1 bg-red-600 rounded-lg p-3 shadow text-white flex flex-col justify-center" style={{minHeight:'90px',maxHeight:'120px'}}>
        <div className="text-lg font-semibold">Utgifter</div>
        <div className="text-3xl font-bold">{expense.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</div>
        <div className="text-xs mt-1">Filtrerad månad: {monthsLabel} {selectedYear}</div>
      </div>
      {/* Inkomster */}
      <div className="flex-1 bg-green-600 rounded-lg p-3 shadow text-white flex flex-col justify-center" style={{minHeight:'90px',maxHeight:'120px'}}>
        <div className="text-lg font-semibold">Inkomster</div>
        <div className="text-3xl font-bold">{income.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</div>
        <div className="text-xs mt-1">Filtrerad månad: {monthsLabel} {selectedYear}</div>
      </div>
      {/* Netto */}
      <div className="flex-1 bg-blue-600 rounded-lg p-3 shadow text-white flex flex-col justify-center" style={{minHeight:'90px',maxHeight:'120px'}}>
        <div className="text-lg font-semibold">Netto</div>
        <div className="text-3xl font-bold">{net.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr</div>
        <div className="text-xs mt-1">Filtrerad månad: {monthsLabel} {selectedYear}</div>
      </div>
    </div>
  );
};

export default EconomySummary;
