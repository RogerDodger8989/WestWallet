import React, { useState, useEffect } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import Toast from '../../components/Toast';
import { useEconomyStore } from '../../store/useEconomyStore';

const EconomyPage: React.FC = () => {
  // State för modaler och val
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedCategory, _setSelectedCategory] = useState(() => localStorage.getItem('selectedCategory') || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [selectedSupplier, _setSelectedSupplier] = useState(() => localStorage.getItem('selectedSupplier') || '');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [month, setMonth] = useState('');
  const [note, setNote] = useState('');

  // Custom setters to persist selection
  const setSelectedCategory = (id: string) => {
    _setSelectedCategory(id);
    localStorage.setItem('selectedCategory', id);
  };
  const setSelectedSupplier = (id: string) => {
    _setSelectedSupplier(id);
    localStorage.setItem('selectedSupplier', id);
  };
  const { categories, addCategory, error, loading, fetchCategories } = useCategoryStore();
  const { suppliers, addSupplier, fetchSuppliers } = useSupplierStore();
  const { items, addItem, fetchItems } = useEconomyStore();

  // Visa alla leverantörer, men dropdown är disabled tills kategori är vald
  const allSuppliers = suppliers;

  // Hämta kategorier och leverantörer vid sidladdning
  React.useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Hämta poster vid sidladdning
  useEffect(() => {
    fetchItems();
  }, []);

  // Auto-select supplier when suppliers change
  React.useEffect(() => {
    if (suppliers.length > 0) {
      if (!selectedSupplier || !suppliers.find(sup => sup.id === selectedSupplier)) {
        setSelectedSupplier(suppliers[0].id);
        console.log('Auto-set selectedSupplier to', suppliers[0].id);
      }
    } else {
      setSelectedSupplier('');
    }
  }, [suppliers]);


  // Toast state
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
    }
  }, [error]);

  // Filtrera leverantörer baserat på vald kategori
  // (Redundant declaration removed, only one filteredSuppliers remains at the top)

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      await addCategory(newCategoryName.trim());
      fetchSuppliers();
      setSelectedSupplier('');
      setToast({ message: 'Kategori skapad!', type: 'success' });
      setShowCategoryModal(false);
      setNewCategoryName('');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupplierName.trim()) {
      await addSupplier(newSupplierName.trim());
      setToast({ message: 'Leverantör skapad!', type: 'success' });
      setShowSupplierModal(false);
      setNewSupplierName('');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    // Hämta år och månad som number
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    await addItem({
      name,
      amount: Number(amount),
      type: type as 'income' | 'expense',
      category: selectedCategory,
      supplier: selectedSupplier,
      note,
      year,
      month,
    });
    setToast({ message: 'Post sparad!', type: 'success' });
    setName('');
    setAmount('');
    setNote('');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Ekonomihantering</h1>
      {/* Formulär med kategori/leverantör-dropdowns och plus-knapp */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="bg-white dark:bg-slate-900 p-6 rounded shadow mb-8">
        <h2 className="font-semibold mb-4">Lägg till ny post</h2>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={async e => {
          e.preventDefault();
          if (!name || !amount || !type || !month || !selectedCategory || !selectedSupplier) {
            setToast({ message: 'Fyll i alla fält!', type: 'error' });
            return;
          }
          // month är YYYY-MM, dela upp till year och month (number)
          const [yearStr, monthStr] = month.split('-');
          const year = parseInt(yearStr, 10);
          const monthNum = parseInt(monthStr, 10);
          await addItem({
            name,
            amount: parseFloat(amount),
            type: type as 'income' | 'expense',
            year,
            month: monthNum,
            category: selectedCategory,
            supplier: selectedSupplier,
            note,
          });
          setToast({ message: 'Post sparad!', type: 'success' });
          setName('');
          setAmount('');
          setType('income');
          setMonth('');
          setNote('');
        }}>
          <input type="text" placeholder="Namn" className="p-2 rounded border dark:bg-slate-800 dark:text-white" required value={name} onChange={e => setName(e.target.value)} />
          <input type="number" step="0.01" placeholder="Belopp (kr)" className="p-2 rounded border dark:bg-slate-800 dark:text-white" required value={amount} onChange={e => setAmount(e.target.value)} />
          <select className="p-2 rounded border dark:bg-slate-800 dark:text-white" required value={type} onChange={e => setType(e.target.value)}>
            <option value="income">Inkomst</option>
            <option value="expense">Utgift</option>
          </select>
          <input type="month" className="p-2 rounded border dark:bg-slate-800 dark:text-white" required value={month} onChange={e => setMonth(e.target.value)} />
          <div className="flex items-center gap-2">
            <select
              className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full"
              required
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                fetchSuppliers();
                // selectedSupplier sätts automatiskt via useEffect
              }}
            >
              <option value="">Välj kategori</option>
              {categories.map(cat => (
                <option key={cat.id || cat.name} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button type="button" className="px-2 py-1 bg-gray-300 rounded" onClick={() => setShowCategoryModal(true)}>+</button>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full"
              required
              disabled={!selectedCategory}
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
            >
              <option value="">Välj leverantör</option>
              {suppliers.map(sup => (
                <option key={sup.id || sup.name} value={sup.id}>{sup.name}</option>
              ))}
            </select>
            <button type="button" className="px-2 py-1 bg-gray-300 rounded" onClick={() => setShowSupplierModal(true)} disabled={!selectedCategory}>+</button>
          </div>
          <textarea placeholder="Notering" className="p-2 rounded border dark:bg-slate-800 dark:text-white md:col-span-2" value={note} onChange={e => setNote(e.target.value)} />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 md:col-span-2">Lägg till</button>
        </form>
        {/* Modal för ny kategori */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form className="bg-white dark:bg-slate-900 p-6 rounded shadow w-80" onSubmit={handleAddCategory}>
              <h3 className="font-semibold mb-2">Ny kategori</h3>
              <input
                type="text"
                placeholder="Kategorinamn"
                className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-4"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                required
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory(e);
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowCategoryModal(false)}>Avbryt</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Spara</button>
              </div>
            </form>
          </div>
        )}
        {/* Modal för ny leverantör */}
        {showSupplierModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form className="bg-white dark:bg-slate-900 p-6 rounded shadow w-80" onSubmit={handleAddSupplier}>
              <h3 className="font-semibold mb-2">Ny leverantör</h3>
              <input
                type="text"
                placeholder="Leverantörsnamn"
                className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-4"
                value={newSupplierName}
                onChange={e => setNewSupplierName(e.target.value)}
                required
                autoFocus
                disabled={!selectedCategory}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSupplier(e);
                  }
                }}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowSupplierModal(false)}>Avbryt</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded" disabled={!selectedCategory}>Spara</button>
              </div>
            </form>
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded shadow">
        <h2 className="font-semibold mb-4">Transaktioner</h2>
        {items.length === 0 ? (
          <div className="text-gray-500">Inga poster sparade ännu.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-100 dark:bg-slate-800">
                  <th className="px-2 py-1">Månad</th>
                  <th className="px-2 py-1">ID</th>
                  <th className="px-2 py-1">Namn</th>
                  <th className="px-2 py-1">Typ</th>
                  <th className="px-2 py-1">Kategori</th>
                  <th className="px-2 py-1">Leverantör</th>
                  <th className="px-2 py-1">Belopp</th>
                  <th className="px-2 py-1">Bild</th>
                  <th className="px-2 py-1">Notering</th>
                  <th className="px-2 py-1">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={(item.id || '') + '-' + index} className="border-b text-center">
                    <td className="px-2 py-1 text-center">{
                      // Visa alltid månad som YYYY-MM
                      (() => {
                        if (item.month && /^\d{4}-\d{2}$/.test(item.month)) return item.month;
                        const year = item.year || new Date().getFullYear();
                        const monthNum = String(item.month).padStart(2, '0');
                        return `${year}-${monthNum}`;
                      })()
                    }</td>
                    <td className="px-2 py-1 text-center">{item.id}</td>
                    <td className="px-2 py-1 text-center">{item.name}</td>
                    <td className="px-2 py-1 text-center">{item.type === 'income' ? 'Inkomst' : 'Utgift'}</td>
                    <td className="px-2 py-1 text-center">{item.category}</td>
                    <td className="px-2 py-1 text-center">{item.supplier}</td>
                    <td className={`px-2 py-1 text-center font-mono ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{item.amount.toFixed(2)} kr</td>
                    <td className="px-2 py-1 text-center flex items-center justify-center">
                      <span className={`inline-block w-4 h-4 rounded-full ${item.images && item.images.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        title={item.images && item.images.length > 0 ? 'Bilder finns' : 'Inga bilder'}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                        onClick={() => {/* öppna bildmodal här */}}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">{item.note}</td>
                    <td className="px-2 py-1 text-center">
                      {/* Redigeringsknapp */}
                      <button className="px-2 py-1 bg-gray-300 rounded mr-2" title="Redigera" onClick={() => {/* redigera logik */}}>
                        <span role="img" aria-label="edit">✏️</span>
                      </button>
                      {/* Papperskorg */}
                      <button className="px-2 py-1 bg-gray-300 rounded" title="Radera" onClick={() => {/* radera logik */}}>
                        <span role="img" aria-label="delete">🗑️</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EconomyPage;
