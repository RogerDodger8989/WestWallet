import React, { useState } from 'react';

// Dummy data for categories and suppliers
const categories = [
  { id: 'cat1', name: 'Boende' },
  { id: 'cat2', name: 'Bil' },
  { id: 'cat3', name: 'Mat' },
];
type Supplier = { id: string; name: string };
type SupplierMap = Record<string, Supplier[]>;
const suppliers: SupplierMap = {
  cat1: [{ id: 'sup1', name: 'Hyresvärden' }],
  cat2: [{ id: 'sup2', name: 'Shell' }, { id: 'sup3', name: 'Mekonomen' }],
  cat3: [{ id: 'sup4', name: 'ICA' }],
};

export default function EconomyForm() {
  const [type, setType] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [months, setMonths] = useState<string[]>([]);
  const [name, setName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showUndo, setShowUndo] = useState<boolean>(false);

  // Stepwise panel logic
  return (
    <div className="economy-form max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Skapa ny post</h2>
      {/* Step 1: Type */}
      <div className="mb-4 flex gap-4">
        <button className={`btn ${type==='Utgift'?'btn-active':''}`} onClick={()=>setType('Utgift')}>💸 Utgift</button>
        <button className={`btn ${type==='Inkomst'?'btn-active':''}`} onClick={()=>setType('Inkomst')}>💰 Inkomst</button>
      </div>
      {/* Step 2: Category */}
      {type && (
        <div className="mb-4">
          <label>Kategori</label>
          <select value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">Välj kategori</option>
            {categories.map(cat=>(<option key={cat.id} value={cat.id}>{cat.name}</option>))}
          </select>
          <button className="ml-2">+ Lägg till kategori</button>
        </div>
      )}
      {/* Step 3: Supplier */}
      {category && (
        <div className="mb-4">
          <label>Leverantör</label>
          <select value={supplier} onChange={e=>setSupplier(e.target.value)}>
            <option value="">Välj leverantör</option>
            {(suppliers[category]||[]).map((sup: Supplier)=>(<option key={sup.id} value={sup.id}>{sup.name}</option>))}
          </select>
          <button className="ml-2">+ Lägg till leverantör</button>
        </div>
      )}
      {/* Step 4: Months */}
      {supplier && (
        <div className="mb-4">
          <label>Månad/Månader</label>
          <input type="month" onChange={e=>setMonths([e.target.value])} />
          <button className="ml-2">+ Fler månader</button>
        </div>
      )}
      {/* Step 5: Fields */}
      {months.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label>Namn</label>
            <input value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label>Belopp</label>
            <input value={amount} onChange={e=>setAmount(e.target.value)} className={type==='Utgift'?'text-red-600':'text-green-600'} />
          </div>
          <div className="col-span-2">
            <label>Notering</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} />
          </div>
        </div>
      )}
      {/* Action buttons */}
      {months.length > 0 && (
        <div className="flex gap-4 mt-4">
          <button className="btn btn-primary">Lägg till post</button>
          <button className="btn">Avbryt</button>
        </div>
      )}
      {/* Undo button */}
      {showUndo && (
        <div className="fixed top-4 left-4 bg-yellow-200 px-4 py-2 rounded shadow">Ångra radering (10 sek)</div>
      )}
    </div>
  );
}
