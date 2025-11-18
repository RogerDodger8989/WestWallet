import React, { useRef } from "react";

interface MonthPickerProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  const realRef = useRef<HTMLInputElement>(null);

  // Sätt aktuell månad som default om value är tomt
  const getDefaultMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const displayValue = value || getDefaultMonth();

  // Formatera till "november 2025"
  const formatMonth = (val: string) => {
    if (!val) return "Välj månad";
    const [year, month] = val.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("sv-SE", { month: "long", year: "numeric" });
  };

  const handleClick = () => {
    if (realRef.current?.showPicker) {
      realRef.current.showPicker();
    } else {
      realRef.current?.focus();
    }
  };

  return (
    <div
      className="relative w-full p-3 border rounded bg-white dark:bg-slate-800 cursor-pointer flex items-center justify-between"
      onClick={handleClick}
      tabIndex={0}
      role="button"
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <span>{formatMonth(displayValue)}</span>
      <span className="ml-2 text-xl" aria-hidden="true">📅</span>
      <input
        ref={realRef}
        type="month"
        value={displayValue}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={-1}
        aria-label="Välj månad"
      />
    </div>
  );
};

export default MonthPicker;
