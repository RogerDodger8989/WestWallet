import React, { useState, useEffect, useRef } from 'react';
import type { EconomyItem } from '../../store/useEconomyStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import Toast from '../../components/Toast';
import { useEconomyStore } from '../../store/useEconomyStore';
import { uploadImage, deleteImage, getImages } from '../../api/imageApi';

const EconomyPage: React.FC = () => {
      // Modal för notering
      const [showNoteModal, setShowNoteModal] = useState(false);
      const [noteModalContent, setNoteModalContent] = useState('');
      // Undo state
      const [undoData, setUndoData] = useState<{ item: EconomyItem, type: 'delete' | 'edit', prev?: EconomyItem } | null>(null);
      const [undoTimeout, setUndoTimeout] = useState<number | null>(null);
    // Hjälpfunktioner för att slå upp namn
    const getCategoryName = (id: string) => {
      const cat = categories.find(cat => cat.id === id || cat.name === id);
      return cat ? cat.name : 'Okänd';
    };
    const getSupplierName = (id: string) => {
      const sup = suppliers.find(sup => sup.id === id || sup.name === id);
      return sup ? sup.name : 'Okänd';
    };
  // State för modaler och val
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EconomyItem | null>(null);
  // Bildhantering
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageList, setImageList] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [overlayImage, setOverlayImage] = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, _setSelectedCategory] = useState(() => localStorage.getItem('selectedCategory') || '');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [selectedSupplier, _setSelectedSupplier] = useState(() => localStorage.getItem('selectedSupplier') || '');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [month, setMonth] = useState('');
  const [note, setNote] = useState('');
  // State för redigering
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('income');
  const [editMonth, setEditMonth] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editNote, setEditNote] = useState('');

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
    // month är YYYY-MM, dela upp till year och month (number)
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    await addItem({
      name,
      amount: Number(amount),
      type: type as 'income' | 'expense',
      category: selectedCategory,
      supplier: selectedSupplier,
      note,
      year,
      month: monthNum,
    });
    setToast({ message: 'Post sparad!', type: 'success' });
    setName('');
    setAmount('');
    setNote('');
  };

  // Hantera öppning av redigeringsmodal
  const openEditModal = (item: EconomyItem) => {
    setSelectedItem(item);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
    setEditType(item.type);
    setEditMonth(`${item.year}-${item.month.toString().padStart(2, '0')}`);
    setEditCategory(item.category);
    setEditSupplier(item.supplier);
    setEditNote(item.note || '');
    setShowEditModal(true);
  };

  // Hantera öppning av raderingsmodal
  const openDeleteModal = (item: EconomyItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Hantera redigering av post
  const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const [yearStr, monthStr] = editMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const prevItem = { ...selectedItem! };
    const updatedItem = {
      ...selectedItem!,
      name: editName,
      amount: parseFloat(editAmount),
      type: editType as 'income' | 'expense',
      year,
      month: monthNum,
      category: editCategory,
      supplier: editSupplier,
      note: editNote,
    };
    await useEconomyStore.getState().updateItem(updatedItem);
    setShowEditModal(false);
    setSelectedItem(null);
    setUndoData({ item: updatedItem, type: 'edit', prev: prevItem });
    if (undoTimeout) clearTimeout(undoTimeout);
    setUndoTimeout(setTimeout(() => setUndoData(null), 10000));
  };

  // Hantera radering av post
  const handleDeleteExpense = async () => {
    if (!selectedItem) return;
    const validObjectId = /^[a-fA-F0-9]{24}$/.test(selectedItem.id);
    if (!validObjectId) {
      setToast({ message: 'Kan inte radera: ogiltigt id', type: 'error' });
      setShowDeleteModal(false);
      setSelectedItem(null);
      return;
    }
    const deletedItem = { ...selectedItem };
    await useEconomyStore.getState().deleteItem(selectedItem.id);
    setShowDeleteModal(false);
    setSelectedItem(null);
    setUndoData({ item: deletedItem, type: 'delete' });
    if (undoTimeout) clearTimeout(undoTimeout);
    setUndoTimeout(setTimeout(() => setUndoData(null), 10000));
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
                {items
                  .filter(item => /^[a-fA-F0-9]{24}$/.test(item.id))
                  .filter(item => item.name && item.category && item.supplier && typeof item.amount === 'number')
                  .map((item, index) => (
                  <tr key={(item.id || '') + '-' + index} className="border-b text-center">
                    <td className="px-2 py-1 text-center">{`${item.year}-${item.month.toString().padStart(2, '0')}`}</td>
                    <td className="px-2 py-1 text-center">{item.displayId ? item.displayId : 'Okänd'}</td>
                    <td className="px-2 py-1 text-center">{item.name}</td>
                    <td className="px-2 py-1 text-center">{item.type === 'income' ? 'Inkomst' : 'Utgift'}</td>
                    <td className="px-2 py-1 text-center">{getCategoryName(item.category)}</td>
                    <td className="px-2 py-1 text-center">{getSupplierName(item.supplier)}</td>
                    <td className={`px-2 py-1 text-center font-mono ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{item.amount.toFixed(2)} kr</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`inline-block w-4 h-4 rounded-full ${item.images && item.images.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        title={item.images && item.images.length > 0 ? 'Bilder finns' : 'Inga bilder'}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                        onClick={async () => {
                          setSelectedItem(item);
                          setShowImageModal(true);
                          setImageLoading(true);
                          try {
                            const imgs = await getImages(item.id, 'economy');
                            setImageList(imgs);
                            setImageError('');
                          } catch (err: any) {
                            setImageError('Kunde inte hämta bilder');
                          }
                          setImageLoading(false);
                        }}
                      />
                          {/* Modal för bildhantering */}
                          {showImageModal && selectedItem && (
                            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                              <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-[500px] max-h-[80vh] overflow-y-auto relative">
                                <h3 className="font-semibold mb-2">Bilder för post: {selectedItem.displayId}</h3>
                                {imageError && <div className="text-red-600 mb-2">{imageError}</div>}
                                <div
                                  className="border-2 border-dashed rounded p-4 mb-4 text-center cursor-pointer bg-gray-50"
                                  onClick={() => fileInputRef.current?.click()}
                                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                  onDrop={async e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const files = Array.from(e.dataTransfer.files);
                                    setImageLoading(true);
                                    try {
                                      await uploadImage(selectedItem.id, files as File[], 'economy');
                                      const imgs = await getImages(selectedItem.id, 'economy');
                                      setImageList(imgs);
                                      setImageError('');
                                    } catch (err: any) {
                                      setImageError('Kunde inte ladda upp bilder');
                                    }
                                    setImageLoading(false);
                                  }}
                                >
                                  <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={async e => {
                                      if (!e.target.files) return;
                                      setImageLoading(true);
                                      try {
                                        await uploadImage(selectedItem.id, Array.from(e.target.files), 'economy');
                                        const imgs = await getImages(selectedItem.id, 'economy');
                                        setImageList(imgs);
                                        setImageError('');
                                      } catch (err: any) {
                                        setImageError('Kunde inte ladda upp bilder');
                                      }
                                      setImageLoading(false);
                                    }}
                                  />
                                  <span className="text-gray-600">Dra in bilder här eller klicka för att välja filer</span>
                                </div>
                                <div className="flex flex-wrap gap-3 mb-4">
                                  {imageLoading ? <span>Laddar bilder...</span> : null}
                                  {imageList.length === 0 && !imageLoading ? <span className="text-gray-400">Inga bilder uppladdade.</span> : null}
                                  {imageList.map(img => (
                                    <div key={img} className="relative group">
                                      <img
                                        src={img}
                                        alt="thumbnail"
                                        className="w-20 h-20 object-cover rounded shadow cursor-pointer border border-gray-300"
                                        onClick={() => setOverlayImage(img)}
                                      />
                                      <button
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-1 text-xs opacity-80 group-hover:opacity-100"
                                        title="Ta bort bild"
                                        onClick={async e => {
                                          e.stopPropagation();
                                          setImageLoading(true);
                                          try {
                                            await deleteImage(selectedItem.id, img, 'economy');
                                            const imgs = await getImages(selectedItem.id, 'economy');
                                            setImageList(imgs);
                                            setImageError('');
                                          } catch (err: any) {
                                            setImageError('Kunde inte ta bort bild');
                                          }
                                          setImageLoading(false);
                                        }}
                                      >🗑️</button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 justify-end mt-4">
                                  <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => { setShowImageModal(false); setSelectedItem(null); setImageList([]); setOverlayImage(null); }}>Stäng</button>
                                </div>
                                {/* Overlay för stor bild */}
                                {overlayImage && (
                                  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setOverlayImage(null)}>
                                    <img src={overlayImage} alt="stor bild" className="max-w-[80vw] max-h-[80vh] rounded shadow-lg" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                    </td>
                    <td className="px-2 py-1 text-center" style={{ position: 'relative' }}>
                      <span
                        className={`inline-block w-4 h-4 rounded-full ${item.note && item.note.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                        onClick={() => { setNoteModalContent(item.note || ''); setShowNoteModal(true); }}
                        onMouseEnter={e => {
                          const tooltip = document.createElement('div');
                          tooltip.innerText = item.note || 'Ingen notering';
                          tooltip.style.position = 'fixed';
                          const rect = e.currentTarget.getBoundingClientRect();
                          tooltip.style.top = `${rect.top - 40}px`;
                          tooltip.style.left = `${rect.left + rect.width / 2}px`;
                          tooltip.style.transform = 'translateX(-50%)';
                          tooltip.style.background = '#fff';
                          tooltip.style.color = '#222';
                          tooltip.style.padding = '6px 12px';
                          tooltip.style.borderRadius = '6px';
                          tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                          tooltip.style.zIndex = '9999';
                          tooltip.className = 'note-tooltip';
                          document.body.appendChild(tooltip);
                        }}
                        onMouseLeave={e => {
                          const tooltips = document.querySelectorAll('.note-tooltip');
                          tooltips.forEach(t => t.remove());
                        }}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button className="px-2 py-1 bg-gray-300 rounded mr-2" title="Redigera" onClick={() => openEditModal(item)}>
                        <span role="img" aria-label="edit">✏️</span>
                      </button>
                      <button className="px-2 py-1 bg-gray-300 rounded" title="Radera" onClick={() => openDeleteModal(item)}>
                        <span role="img" aria-label="delete">🗑️</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {/* Modal för notering */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-80">
            <h3 className="font-semibold mb-2">Notering</h3>
            <p>{noteModalContent ? noteModalContent : 'Ingen notering'}</p>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowNoteModal(false)}>Stäng</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast med ångerknapp uppe till höger */}
      {undoData && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000 }}>
          <div className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-4">
            {undoData.type === 'delete' ? 'Post raderad!' : 'Post uppdaterad!'}
            <button className="bg-white text-blue-600 px-2 py-1 rounded" onClick={async () => {
              if (undoTimeout) clearTimeout(undoTimeout);
              setUndoTimeout(null);
              if (undoData.type === 'delete') {
                await useEconomyStore.getState().addItem(undoData.item);
              } else if (undoData.type === 'edit' && undoData.prev) {
                await useEconomyStore.getState().updateItem(undoData.prev);
              }
              setUndoData(null);
            }}>Ångra</button>
          </div>
        </div>
      )}
    </div>
      {/* Modal för notering */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-80">
            <h3 className="font-semibold mb-2">Notering</h3>
            <p>{noteModalContent ? noteModalContent : 'Ingen notering'}</p>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowNoteModal(false)}>Stäng</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast med ångerknapp uppe till höger */}
      {undoData && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000 }}>
          <div className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-4">
            {undoData.type === 'delete' ? 'Post raderad!' : 'Post uppdaterad!'}
            <button className="bg-white text-blue-600 px-2 py-1 rounded" onClick={async () => {
              if (undoTimeout) clearTimeout(undoTimeout);
              setUndoTimeout(null);
              if (undoData.type === 'delete') {
                await useEconomyStore.getState().addItem(undoData.item);
              } else if (undoData.type === 'edit' && undoData.prev) {
                await useEconomyStore.getState().updateItem(undoData.prev);
              }
              setUndoData(null);
            }}>Ångra</button>
          </div>
        </div>
      )}
      {/* Modal för redigering */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form className="bg-white dark:bg-slate-900 p-6 rounded shadow w-96" onSubmit={handleEditExpense}>
            <h3 className="font-semibold mb-2">Redigera post</h3>
            <input type="text" placeholder="Namn" className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" required value={editName} onChange={e => setEditName(e.target.value)} />
            <input type="number" step="0.01" placeholder="Belopp (kr)" className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" required value={editAmount} onChange={e => setEditAmount(e.target.value)} />
            <select className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" required value={editType} onChange={e => setEditType(e.target.value)}>
              <option value="income">Inkomst</option>
              <option value="expense">Utgift</option>
            </select>
            <input type="month" className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" required value={editMonth} onChange={e => setEditMonth(e.target.value)} />
            <select className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" required value={editCategory} onChange={e => setEditCategory(e.target.value)}>
              <option value="">Välj kategori</option>
              {categories.map(cat => (
                <option key={cat.id || cat.name} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" required value={editSupplier} onChange={e => setEditSupplier(e.target.value)}>
              <option value="">Välj leverantör</option>
              {suppliers.map(sup => (
                <option key={sup.id || sup.name} value={sup.id}>{sup.name}</option>
              ))}
            </select>
            <textarea placeholder="Notering" className="p-2 rounded border dark:bg-slate-800 dark:text-white w-full mb-2" value={editNote} onChange={e => setEditNote(e.target.value)} />
            <div className="flex gap-2 justify-end mt-2">
              <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => { setShowEditModal(false); setSelectedItem(null); }}>Avbryt</button>
              <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Spara</button>
            </div>
          </form>
        </div>
      )}
      {/* Modal för radering */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded shadow w-80">
            <h3 className="font-semibold mb-2">Radera post</h3>
            <p>Vill du radera denna post?</p>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-3 py-1 bg-gray-300 rounded" onClick={() => { setShowDeleteModal(false); setSelectedItem(null); }}>Avbryt</button>
              <button type="button" className="px-3 py-1 bg-red-600 text-white rounded" onClick={handleDeleteExpense}>Radera</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EconomyPage;
