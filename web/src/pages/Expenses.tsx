import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import api, { API_BASE_URL } from '../api/api';
import { Toast } from '../components/Toast';
import { BankImportPreview } from '../components/BankImportPreview';
import { useAuth } from '../AuthContext';

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
  categoryId: number;
}

interface Expense {
  id: number;
  displayId: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  month: string;
  categoryId: number;
  supplierId: number;
  notes?: string;
  images?: string[];
  category: Category;
  supplier: Supplier;
  tags?: string[];
}

// Formatera belopp med tusendelsavgränsare
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function Expenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // const [monthPickerValue, setMonthPickerValue] = useState<string>('');
  
  // Ref för import file input
  const importFileInputRef = useRef<HTMLInputElement>(null);
  // Ref för form-element (för att kunna trigga submit från sticky bar)
  const formElRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    categoryId: 0,
    supplierId: 0,
    notes: '',
    month: '' // Använd för redigering
  });
  const [tagsInput, setTagsInput] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDisplayId, setEditingDisplayId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  // Inline row edit state
  const [rowEditingId, setRowEditingId] = useState<number | null>(null);
  const [rowEdit, setRowEdit] = useState<{ amount: string; categoryId: number }>({ amount: '', categoryId: 0 });
  
  // Multi-month selection
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    const now = new Date();
    return [`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`];
  });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Ref för att scrolla till tabellen
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Modal states för plus-knappar
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    categoryId: 0
  });
  
  // Toast notification state
  const [toast, setToast] = useState<{ 
    message: string; 
    type: 'success' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
  } | null>(null);
  
  // Undo state
  const [deletedExpense, setDeletedExpense] = useState<Expense | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<number | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(10);
  
  // Image deletion undo state
  const [deletedImage, setDeletedImage] = useState<{ expenseId: number; filename: string } | null>(null);
  const [imageUndoTimeout, setImageUndoTimeout] = useState<number | null>(null);
  const [imageUndoCountdown, setImageUndoCountdown] = useState<number>(10);
  
  // Image states
  const [imageModalExpense, setImageModalExpense] = useState<Expense | null>(null);
  const [uploadingImages, setUploadingImages] = useState<Record<number, boolean>>({});
  // Notes modal state
  const [noteModalExpense, setNoteModalExpense] = useState<Expense | null>(null);
  const [noteModalText, setNoteModalText] = useState<string>('');
  useEffect(() => {
    setNoteModalText(noteModalExpense?.notes || '');
  }, [noteModalExpense]);
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  // Inline expanded notes per row
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  // Ref för formulär (scroll vid redigering)
  const formRef = useRef<HTMLDivElement>(null);

  // Bank import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  // Budgets state
  const [budgets, setBudgets] = useState<any[]>([]);
  const [newBudget, setNewBudget] = useState<{ categoryId: number; monthlyLimit: string; startMonth?: string; endMonth?: string }>({ categoryId: 0, monthlyLimit: '' });
  // UI: collapsible sections
  const [showBudgetPanel, setShowBudgetPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Persist open/closed state in localStorage
  useEffect(() => {
    try {
      const b = localStorage.getItem('ww:budgets:open');
      const f = localStorage.getItem('ww:filters:open');
      if (b !== null) setShowBudgetPanel(b === '1');
      if (f !== null) setShowFilters(f === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('ww:budgets:open', showBudgetPanel ? '1' : '0'); } catch {}
  }, [showBudgetPanel]);
  useEffect(() => {
    try { localStorage.setItem('ww:filters:open', showFilters ? '1' : '0'); } catch {}
  }, [showFilters]);

  useEffect(() => {
    // Ladda endast om användaren är inloggad
    if (!user) return;
    
    loadCategories();
    loadSuppliers();
    
    // Cleanup timeout on unmount
    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
      if (imageUndoTimeout) {
        clearTimeout(imageUndoTimeout);
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadExpenses();
  }, [selectedYear, searchQuery, typeFilter, categories, suppliers, user]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImages.length]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const params: any = { year: selectedYear };
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      if (typeFilter !== 'all') params.type = typeFilter;
      const response = await api.get('/expenses', { params });
      setExpenses(response.data);
      loadBudgets();
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  const loadBudgets = async () => {
    try {
      const res = await api.get('/budgets/category');
      setBudgets(res.data);
    } catch (e) {
      // Ignorera fel
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawAmount = parseFloat(formData.amount);
    // Utgifter ska vara negativa, inkomster positiva
    const finalAmount = formData.type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    
    try {
      if (editingId) {
        // Uppdatera befintlig post (endast en månad)
        const data = {
          name: formData.name,
          amount: finalAmount,
          type: formData.type,
          categoryId: formData.categoryId,
          supplierId: formData.supplierId,
          month: formData.month,
          notes: formData.notes || undefined,
          tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
        };
        await api.put(`/expenses/${editingId}`, data);
        setToast({ message: 'Post uppdaterad!', type: 'success' });
      } else {
        // Skapa nya poster för varje vald månad
        const promises = selectedMonths.map(month => 
          api.post('/expenses', {
            name: formData.name,
            amount: finalAmount,
            type: formData.type,
            categoryId: formData.categoryId,
            supplierId: formData.supplierId,
            month: month,
            notes: formData.notes || undefined,
            tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
          })
        );
        await Promise.all(promises);
        const count = selectedMonths.length;
        setToast({ 
          message: count === 1 ? 'Post skapad!' : `${count} poster skapade för ${count} månader!`, 
          type: 'success' 
        });
      }
      resetForm();
      loadExpenses();
      // Scrolla till tabellen efter sparning
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Failed to save expense:', error);
      setToast({ message: 'Kunde inte spara posten', type: 'error' });
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      name: expense.name,
      amount: String(Math.abs(expense.amount)),
      type: expense.type,
      categoryId: expense.categoryId,
      supplierId: expense.supplierId,
      notes: expense.notes || '',
      month: expense.month
    });
    setEditingId(expense.id);
    setEditingDisplayId(expense.displayId || null);
    setTagsInput(expense.tags ? expense.tags.join(', ') : '');
    // Scrolla till formulär
    setTimeout(()=>{
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Fokusera namn-fältet
      const nameInput = formRef.current?.querySelector('input[name="expenseName"]') as HTMLInputElement | null;
      nameInput?.focus();
    }, 50);
  };

  // ESC för att avbryta formulär-redigering
  useEffect(() => {
    if (!editingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resetForm();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingId]);

  // ESC för att avbryta snabbredigering
  useEffect(() => {
    if (rowEditingId == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setRowEditingId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rowEditingId]);

  // Spara snabbredigering (används av sticky bar och inline)
  const saveQuickEdit = async () => {
    if (rowEditingId == null) return;
    const exp = expenses.find(e => e.id === rowEditingId);
    if (!exp) return;
    try {
      const amt = parseFloat(rowEdit.amount || '0');
      const finalAmount = exp.type === 'expense' ? -Math.abs(amt) : Math.abs(amt);
      await api.put(`/expenses/${exp.id}`, {
        name: exp.name,
        amount: finalAmount,
        type: exp.type,
        categoryId: rowEdit.categoryId,
        supplierId: exp.supplierId,
        month: exp.month,
        notes: exp.notes || undefined,
        tags: exp.tags || []
      });
      setExpenses(prev => prev.map(e => e.id === exp.id ? { ...e, amount: finalAmount, categoryId: rowEdit.categoryId, category: categories.find(c=>c.id===rowEdit.categoryId) || e.category } : e));
      setRowEditingId(null);
      setToast({ message: 'Post uppdaterad', type: 'success' });
    } catch (err) {
      setToast({ message: 'Kunde inte uppdatera posten', type: 'error' });
    }
  };

  // ENTER för att spara (form eller snabbredigering), ignorerar textarea och öppna modaler
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'textarea') return; // låt radbrytning i textarea
      // Blockera när modaler är öppna
      if (showCategoryModal || showSupplierModal || showImportModal || imageModalExpense || noteModalExpense || lightboxOpen) return;
      if (editingId) {
        e.preventDefault();
        formElRef.current?.requestSubmit();
      } else if (rowEditingId != null) {
        e.preventDefault();
        saveQuickEdit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingId, rowEditingId, showCategoryModal, showSupplierModal, showImportModal, imageModalExpense, noteModalExpense, lightboxOpen, rowEdit.amount, rowEdit.categoryId]);

  const requestDelete = (expense: Expense) => {
    setConfirmDeleteId(expense.id);
  };

  const handleDelete = async (id: number) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;

    // Ta bort från listan direkt (optimistisk uppdatering)
    setExpenses(expenses.filter(e => e.id !== id));
    setDeletedExpense(expenseToDelete);
    setUndoCountdown(10);
    setToast({ message: 'Post raderad! Klicka Ångra för att återställa.', type: 'info' });

    // Rensa tidigare timeout om den finns
    if (undoTimeout) {
      clearTimeout(undoTimeout);
    }

    // Starta nedräkning
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      countdown--;
      setUndoCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Sätt ny timeout för permanent radering
    const timeout = setTimeout(async () => {
      clearInterval(countdownInterval);
      try {
        await api.delete(`/expenses/${id}`);
        setDeletedExpense(null);
        setToast({ message: 'Post permanent raderad!', type: 'success' });
      } catch (error) {
        console.error('Failed to delete expense:', error);
        // Återställ om permanent radering misslyckades
        setExpenses(prev => [...prev, expenseToDelete].sort((a, b) => a.id - b.id));
        setToast({ message: 'Kunde inte radera posten', type: 'error' });
        setDeletedExpense(null);
      }
    }, 10000); // 10 sekunder

    setUndoTimeout(timeout);
  };

  const handleUndo = () => {
    if (!deletedExpense) return;

    // Avbryt timeout
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }

    // Återställ posten i listan
    setExpenses(prev => [...prev, deletedExpense].sort((a, b) => a.id - b.id));
    setDeletedExpense(null);
    setToast({ message: 'Radering ångrad!', type: 'success' });
  };

  const handleImageUpload = async (expenseId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(prev => ({ ...prev, [expenseId]: true }));

    try {
      // Ladda upp alla filer parallellt
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        return api.post(`/expenses/${expenseId}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      });

      // Vänta på alla uppladdningar
      await Promise.all(uploadPromises);
      
      // Hämta uppdaterad expense från backend för att få alla bilder
      const updatedExpense = await api.get(`/expenses/${expenseId}`);

      // Uppdatera expense i state
      setExpenses(prev => prev.map(exp => 
        exp.id === expenseId ? { ...exp, images: updatedExpense.data.images } : exp
      ));

      // Uppdatera modal expense om den är öppen
      if (imageModalExpense?.id === expenseId) {
        setImageModalExpense(prev => prev ? { ...prev, images: updatedExpense.data.images } : null);
      }

      setToast({ message: `${files.length} bild${files.length > 1 ? 'er' : ''} uppladdad${files.length > 1 ? 'e' : ''}!`, type: 'success' });
      
      // Återställ file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Failed to upload image:', error);
      setToast({ message: 'Kunde inte ladda upp bilderna', type: 'error' });
    } finally {
      setUploadingImages(prev => ({ ...prev, [expenseId]: false }));
    }
  };

  const handleImageDelete = async (expenseId: number, filename: string) => {
    // Ta bort bilden från UI direkt (optimistisk uppdatering)
    const currentExpense = expenses.find(e => e.id === expenseId);
    if (!currentExpense || !currentExpense.images) return;

    const updatedImages = currentExpense.images.filter(img => img !== filename);
    
    // Uppdatera expense i state
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId ? { ...exp, images: updatedImages } : exp
    ));

    // Uppdatera modal expense om den är öppen
    if (imageModalExpense?.id === expenseId) {
      setImageModalExpense(prev => prev ? { ...prev, images: updatedImages } : null);
    }

    // Spara raderad bild för undo
    setDeletedImage({ expenseId, filename });
    setImageUndoCountdown(10);
    setToast({ message: 'Bild raderad! Klicka Ångra för att återställa.', type: 'info' });

    // Rensa tidigare timeout om den finns
    if (imageUndoTimeout) {
      clearTimeout(imageUndoTimeout);
    }

    // Starta nedräkning
    let countdown = 10;
    const countdownInterval = setInterval(() => {
      countdown--;
      setImageUndoCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Sätt ny timeout för permanent radering
    const timeout = setTimeout(async () => {
      clearInterval(countdownInterval);
      try {
        await api.delete(`/expenses/${expenseId}/images/${filename}`);
        setDeletedImage(null);
        setToast({ message: 'Bild permanent raderad!', type: 'success' });
      } catch (error) {
        console.error('Failed to delete image:', error);
        // Återställ om permanent radering misslyckades
        setExpenses(prev => prev.map(exp => 
          exp.id === expenseId ? { ...exp, images: [...(exp.images || []), filename] } : exp
        ));
        if (imageModalExpense?.id === expenseId) {
          setImageModalExpense(prev => prev ? { ...prev, images: [...(prev.images || []), filename] } : null);
        }
        setToast({ message: 'Kunde inte radera bilden', type: 'error' });
        setDeletedImage(null);
      }
    }, 10000); // 10 sekunder

    setImageUndoTimeout(timeout);
  };

  const handleImageUndo = () => {
    if (!deletedImage) return;

    // Avbryt timeout
    if (imageUndoTimeout) {
      clearTimeout(imageUndoTimeout);
      setImageUndoTimeout(null);
    }

    // Återställ bilden i listan
    const { expenseId, filename } = deletedImage;
    setExpenses(prev => prev.map(exp => 
      exp.id === expenseId ? { ...exp, images: [...(exp.images || []), filename] } : exp
    ));

    // Återställ i modal om den är öppen
    if (imageModalExpense?.id === expenseId) {
      setImageModalExpense(prev => prev ? { ...prev, images: [...(prev.images || []), filename] } : null);
    }

    setDeletedImage(null);
    setToast({ message: 'Bild återställd!', type: 'success' });
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setToast({ message: 'Endast .xlsx, .xls eller .csv filer tillåts', type: 'error' });
      return;
    }

    setImportFile(file);
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/expenses/import/parse', formData);

      setImportPreview(response.data);
      setImporting(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Kunde inte läsa filen';
      setToast({ message: errorMsg, type: 'error' });
      setImporting(false);
      setImportFile(null);
    }
  };

  const handleImportConfirm = async (selectedTransactions: any[]) => {
    // Validera att alla valda transaktioner har kategori eller leverantör
    const invalid = selectedTransactions.filter(
      t => t.selected && !t.isDuplicate && !t.categoryId && !t.supplierId
    );
    
    if (invalid.length > 0) {
      setToast({ 
        message: `${invalid.length} transaktion${invalid.length > 1 ? 'er' : ''} saknar både kategori och leverantör. Välj minst en av dem.`, 
        type: 'error' 
      });
      return;
    }

    setImporting(true);
    try {
      const importedExpenses: number[] = [];
      
      for (const trans of selectedTransactions) {
        if (trans.selected && !trans.isDuplicate) {
          const response = await api.post('/expenses', {
            name: trans.description,
            amount: trans.amount,
            type: trans.amount < 0 ? 'expense' : 'income',
            month: trans.date.substring(0, 7), // YYYY-MM
            categoryId: trans.categoryId || null,
            supplierId: trans.supplierId || null,
            notes: trans.reference || '',
          });
          importedExpenses.push(response.data.id);
        }
      }

      setToast({ 
        message: `${importedExpenses.length} transaktioner importerade!`, 
        type: 'success',
        action: {
          label: 'Ångra',
          onClick: async () => {
            try {
              for (const id of importedExpenses) {
                await api.delete(`/expenses/${id}`);
              }
              setToast({ message: 'Import ångrad', type: 'info' });
              loadExpenses();
            } catch (error) {
              setToast({ message: 'Kunde inte ångra import', type: 'error' });
            }
          }
        }
      });
      
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview(null);
      loadExpenses();
    } catch (error) {
      setToast({ message: 'Kunde inte importera transaktioner', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      type: 'expense',
      categoryId: 0,
      supplierId: 0,
      notes: '',
      month: ''
    });
    setEditingId(null);
    setEditingDisplayId(null);
    setTagsInput('');
    setSelectedMonths([]); // Återställ valda månader
    // Scrolla till tabellen när man avbryter redigering
    if (editingId) {
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Hantera snabb-tillägg av kategori
  const handleQuickAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await api.post('/categories', { name: newCategoryName });
      await loadCategories();
      setFormData({...formData, categoryId: response.data.id, supplierId: 0});
      setNewCategoryName('');
      setShowCategoryModal(false);
      setToast({ message: `Kategori "${newCategoryName}" skapad!`, type: 'success' });
    } catch (error: any) {
      console.error('Failed to add category:', error);
      setToast({ message: `Kunde inte skapa kategori: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
  };

  // Hantera snabb-tillägg av leverantör
  const handleQuickAddSupplier = async () => {
    if (!newSupplier.name.trim() || !newSupplier.categoryId) return;
    
    try {
      const response = await api.post('/suppliers', newSupplier);
      await loadSuppliers();
      setFormData({...formData, supplierId: response.data.id});
      setNewSupplier({ name: '', categoryId: 0 });
      setShowSupplierModal(false);
      setToast({ message: `Leverantör "${newSupplier.name}" skapad!`, type: 'success' });
    } catch (error: any) {
      console.error('Failed to add supplier:', error);
      setToast({ message: `Kunde inte skapa leverantör: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
  };

  const filteredSuppliers = formData.categoryId
    ? suppliers.filter(s => s.categoryId === formData.categoryId)
    : suppliers;

  // Generate 12 months for selected year
  const yearMonths: { value: string; label: string }[] = [];
  const monthNames = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
  for (let i = 0; i < 12; i++) {
    const value = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
    yearMonths.push({ value, label: monthNames[i] });
  }

  // Generate year options (current year +/- 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let i = -5; i <= 5; i++) {
    yearOptions.push(currentYear + i);
  }

  // Filter for summary: if specific months are selected, only include those months; otherwise include all loaded expenses
  // Apply category chip filter and month selection for summary and table
  const applyCategoryFilter = (list: Expense[]) =>
    selectedCategoryIds.length > 0 ? list.filter(e => selectedCategoryIds.includes(e.categoryId)) : list;

  const bySelectedMonths = (list: Expense[]) =>
    selectedMonths.length > 0 ? list.filter(e => selectedMonths.includes(e.month)) : list;

  const displayedExpenses = applyCategoryFilter(bySelectedMonths(expenses));
  const uniqueTags = Array.from(new Set(displayedExpenses.flatMap(e => e.tags || []))).sort((a,b)=>a.localeCompare(b,'sv'));
  const applyTagFilter = (list: Expense[]) => selectedTags.length>0 ? list.filter(e => (e.tags||[]).some(t => selectedTags.includes(t))) : list;
  const filteredExpenses = applyTagFilter(displayedExpenses);

  const expensesForSummary = filteredExpenses;

  const totalExpenses = selectedMonths.length === 0 ? 0 : expensesForSummary.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = selectedMonths.length === 0 ? 0 : expensesForSummary.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const netTotal = selectedMonths.length === 0 ? 0 : expensesForSummary.reduce((sum, e) => sum + e.amount, 0);

  // Notes helpers for inline display
  // Konfig för när anteckningar visas inline vs modal
  const MAX_INLINE_LINES = 10; // tidigare 15
  const MAX_INLINE_CHARS = 800; // tidigare 1500
  const isInlineFriendly = (text?: string) => {
    if (!text) return false;
    const lines = text.split(/\r?\n/).length;
    return lines <= MAX_INLINE_LINES && text.length <= MAX_INLINE_CHARS;
  };
  const firstNLines = (text: string, n: number) => text.split(/\r?\n/).slice(0, n).join('\n');

  // Anomali-beräkning per kategori (endast utgifter). Kräver minst 4 poster i kategorin.
  const categoryStats = (() => {
    const map: Record<number, { sum: number; count: number; mean: number }> = {};
    filteredExpenses.forEach(e => {
      if (e.type !== 'expense') return;
      const absAmt = Math.abs(e.amount);
      const entry = map[e.categoryId] || (map[e.categoryId] = { sum: 0, count: 0, mean: 0 });
      entry.sum += absAmt;
      entry.count += 1;
    });
    Object.values(map).forEach(entry => { entry.mean = entry.count > 0 ? entry.sum / entry.count : 0; });
    return map;
  })();

  const isAnomaly = (e: Expense) => {
    if (e.type !== 'expense') return false;
    const stats = categoryStats[e.categoryId];
    if (!stats || stats.count < 4) return false;
    const absAmt = Math.abs(e.amount);
    return absAmt > stats.mean * 2; // Enkel heuristik
  };
  // const anomalyCount = filteredExpenses.filter(isAnomaly).length; // UI-sammanfattning borttagen

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Undo Button - Top Right Corner */}
      {deletedExpense && (
        <div className="fixed top-20 right-4 z-50 animate-slideUp">
          <button
            onClick={handleUndo}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Ångra radering ({undoCountdown}s)
          </button>
        </div>
      )}

      {/* Page Title moved above budgets and filters */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ekonomihantering
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hantera dina utgifter och inkomster
        </p>
      </div>

      {/* Collapsible controls wrapper (two-up when both collapsed) */}
      <div className={`grid gap-4 ${(!showBudgetPanel && !showFilters) ? 'md:grid-cols-2' : 'md:grid-cols-1'} mb-8`}>
      {/* Budget panel (collapsible) */}
      <div className={`card p-0 ${showBudgetPanel ? '' : ''}`}
        style={!showBudgetPanel ? {padding:0} : undefined}
      >
        <button
          type="button"
          onClick={() => setShowBudgetPanel(v => !v)}
          className={`w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-xl ${showBudgetPanel ? 'px-6 py-4' : 'px-4 h-12'} md:sticky md:top-20 z-10`}
          style={!showBudgetPanel ? {background:'transparent'} : undefined}
        >
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white`}>Budgetmål per kategori</h3>
          <svg className={`${showBudgetPanel ? 'w-5 h-5' : 'w-4 h-4'} text-gray-600 dark:text-gray-300 transform transition-transform ${showBudgetPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div className={`px-6 pb-6 transition-all duration-300 ${showBudgetPanel ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
        >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newBudget.categoryId || !newBudget.monthlyLimit) return;
            try {
              await api.post('/budgets/category', {
                categoryId: newBudget.categoryId,
                monthlyLimit: parseFloat(newBudget.monthlyLimit),
                startMonth: newBudget.startMonth || undefined,
                endMonth: newBudget.endMonth || undefined,
              });
              setNewBudget({ categoryId: 0, monthlyLimit: '' });
              loadBudgets();
              setToast({ message: 'Budget skapad', type: 'success' });
            } catch (err) {
              setToast({ message: 'Kunde inte skapa budget', type: 'error' });
            }
          }}
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 mt-4"
        >
          <div className="md:col-span-2">
            <select
              value={newBudget.categoryId}
              onChange={(e)=>setNewBudget({...newBudget, categoryId: parseInt(e.target.value)})}
              className="select-field w-full"
            >
              <option value={0}>Välj kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <input
              type="number"
              step="0.01"
              placeholder="Månadstak (kr)"
              value={newBudget.monthlyLimit}
              onChange={(e)=>setNewBudget({...newBudget, monthlyLimit: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <input
              type="month"
              value={newBudget.startMonth || ''}
              onChange={(e)=>setNewBudget({...newBudget, startMonth: e.target.value})}
              className="select-field"
              placeholder="Start"
            />
          </div>
          <div>
            <input
              type="month"
              value={newBudget.endMonth || ''}
              onChange={(e)=>setNewBudget({...newBudget, endMonth: e.target.value})}
              className="select-field"
              placeholder="Slut"
            />
          </div>
          <div className="md:col-span-5 flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={!newBudget.categoryId || !newBudget.monthlyLimit}>Spara budget</button>
            <button type="button" onClick={()=>setNewBudget({ categoryId: 0, monthlyLimit: '' })} className="btn-secondary">Rensa</button>
          </div>
        </form>
        <div className="space-y-4">
          {budgets.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Inga budgetar skapade.</p>}
          {budgets.map(b => {
            const relevantExpenses = displayedExpenses.filter(e => e.categoryId === b.categoryId && e.type==='expense');
            const spent = relevantExpenses.reduce((s,e)=>s+Math.abs(e.amount),0);
            const pct = b.monthlyLimit ? Math.min(100, (spent / Number(b.monthlyLimit))*100) : 0;
            const over = spent > Number(b.monthlyLimit);
            return (
              <div key={b.id} className={`p-4 rounded-lg border ${over? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{b.category?.name || `Kategori #${b.categoryId}`}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tak: {formatCurrency(Number(b.monthlyLimit))} kr – Spent: {formatCurrency(spent)} kr</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async ()=>{
                        const newLimit = prompt('Nytt månadstak (kr):', String(b.monthlyLimit));
                        if (!newLimit) return;
                        await api.put(`/budgets/category/${b.id}`, { monthlyLimit: parseFloat(newLimit) });
                        loadBudgets();
                      }}
                      className="btn-secondary text-xs"
                    >Redigera</button>
                    <button
                      onClick={async ()=>{ if (!confirm('Ta bort budget?')) return; await api.delete(`/budgets/category/${b.id}`); loadBudgets(); }}
                      className="btn-danger text-xs"
                    >Ta bort</button>
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    className={`h-full ${over? 'bg-red-600 dark:bg-red-500' : 'bg-green-600 dark:bg-green-500'}`}
                    style={{ width: pct+'%' }}
                  />
                </div>
                {over && <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">Överskrider budget med {formatCurrency(spent - Number(b.monthlyLimit))} kr</p>}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Filter (collapsible) */}
      <div className={`card p-0`}
        style={!showFilters ? {padding:0} : undefined}
      >
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className={`w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors rounded-xl ${showFilters ? 'px-6 py-4' : 'px-4 h-12'} md:sticky md:top-20 z-10`}
          style={!showFilters ? {background:'transparent'} : undefined}
        >
          <h3 className={`text-lg font-semibold text-gray-900 dark:text-white`}>Filter</h3>
          <svg className={`${showFilters ? 'w-5 h-5' : 'w-4 h-4'} text-gray-600 dark:text-gray-300 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div className={`px-6 pb-6 transition-all duration-300 ${showFilters ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="flex flex-col gap-6 mt-2">
            {/* Taggar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrera på tagg</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  className={`px-3 py-1.5 rounded-full text-sm border ${selectedTags.length === 0 ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                >Alla</button>
                {uniqueTags.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                    >{tag}</button>
                  );
                })}
              </div>
            </div>
            {/* Kategorier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrera på kategori</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryIds([])}
                  className={`px-3 py-1.5 rounded-full text-sm border ${selectedCategoryIds.length === 0 ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                >
                  Alla
                </button>
                {categories.map(cat => {
                  const active = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryIds(prev => active ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                      className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
  </div>
  </div>

      {/* Undo Image Button - Below expense undo button */}
      {deletedImage && (
        <div className="fixed top-36 right-4 z-[60] animate-slideUp">
          <button
            onClick={handleImageUndo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-semibold transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Ångra bild ({imageUndoCountdown}s)
          </button>
        </div>
      )}

      

      {/* Summary Cards */}
      {expenses.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Utgifter</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(totalExpenses)} kr
                </p>
                {selectedMonths.length > 0 && (
                  <p className="mt-1 text-xs text-red-600/70 dark:text-red-400/70">
                    {selectedMonths.length === 1 ? 'Filtrerad månad' : 'Filtrerade månader'}: {selectedMonths.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <svg className="w-10 h-10 text-red-600 dark:text-red-400 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <svg className="w-12 h-12 text-red-600 dark:text-red-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Inkomster</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(totalIncome)} kr
                </p>
                {selectedMonths.length > 0 && (
                  <p className="mt-1 text-xs text-green-600/70 dark:text-green-400/70">
                    {selectedMonths.length === 1 ? 'Filtrerad månad' : 'Filtrerade månader'}: {selectedMonths.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <svg className="w-12 h-12 text-green-600 dark:text-green-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Netto</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(netTotal)} kr
                </p>
                {(() => {
                  const months = selectedMonths.length > 0 ? selectedMonths : [ `${selectedYear}-${String(new Date().getMonth()+1).padStart(2,'0')}` ];
                  const periodSet = new Set(months);
                  const sorted = [...months].sort();
                  const first = sorted[0];
                  const [yearStr, monthStr] = first.split('-');
                  const firstDate = new Date(parseInt(yearStr), parseInt(monthStr)-1, 1);
                  const prevMonths: string[] = [];
                  for (let i=sorted.length; i>0; i--) {
                    const d = new Date(firstDate);
                    d.setMonth(d.getMonth()-i);
                    prevMonths.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
                  }
                  const currentNet = displayedExpenses.filter(e => periodSet.has(e.month)).reduce((s,e)=>s+e.amount,0);
                  const prevSet = new Set(prevMonths);
                  const prevNet = expenses.filter(e => prevSet.has(e.month)).reduce((s,e)=>s+e.amount,0);
                  if (prevMonths.length === 0 || prevNet === 0) return null;
                  const diff = currentNet - prevNet;
                  const pct = (prevNet !== 0) ? (diff/Math.abs(prevNet))*100 : 0;
                  return (
                    <p className={`mt-1 text-xs font-medium ${diff>=0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Trend: {diff>=0? '▲' : '▼'} {formatCurrency(diff)} kr ({pct.toFixed(1)}%) vs föregående period</p>
                  );
                })()}
                {selectedMonths.length > 0 && (
                  <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                    {selectedMonths.length === 1 ? 'Filtrerad månad' : 'Filtrerade månader'}: {selectedMonths.join(', ')}
                  </p>
                )}
              </div>
              <svg className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Taggfilter flyttat in i formulärsektionen */}

      {/* Form */}
      <div ref={formRef} className="card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Redigera post' : 'Lägg till ny post'}
          </h3>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importera från bank
          </button>
        </div>
        
  <form ref={formElRef} onSubmit={handleSubmit} className="space-y-5">
          {editingId && editingDisplayId && (
            <div className="rounded-md bg-gray-50 dark:bg-gray-700/30 p-3 text-sm text-gray-700 dark:text-gray-300">
              Redigerar: <span className="font-mono font-semibold">{editingDisplayId}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Namn *
              </label>
              <input
                type="text"
                name="expenseName"
                placeholder="T.ex. Veckohandling"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Belopp *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typ *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as 'expense' | 'income'})}
                className="select-field"
              >
                <option value="expense">Utgift</option>
                <option value="income">Inkomst</option>
              </select>
            </div>
          </div>

          {/* Multi-month selection - endast vid skapande */}
          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Månader *
              </label>
              <div className="flex items-start gap-4">
                {/* År-dropdown */}
                <div className="w-32">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      setSelectedYear(year);
                      setSelectedMonths([]); // Återställ valda månader när år ändras
                    }}
                    className="select-field"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                {/* Månadsväljare */}
                <div className="flex-1">
                  <div className="flex flex-wrap justify-center gap-2">
                    {/* Alla-knapp */}
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMonths.length === 12) {
                          // Om alla är valda, avmarkera alla
                          setSelectedMonths([]);
                        } else {
                          // Välj alla månader
                          setSelectedMonths(yearMonths.map(m => m.value));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 border-2 ${
                        selectedMonths.length === 12
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Alla
                    </button>
                    
                    {/* Månadsknappar */}
                    {yearMonths.map(month => (
                      <button
                        key={month.value}
                        type="button"
                        onClick={() => {
                          setSelectedMonths(prev => 
                            prev.includes(month.value)
                              ? prev.filter(m => m !== month.value)
                              : [...prev, month.value].sort()
                          );
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                          selectedMonths.includes(month.value)
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {month.label.substring(0, 3)} {/* Första 3 bokstäver */}
                      </button>
                    ))}
                  </div>
                  {/* Native month picker removed per request */}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    const catId = parseInt(e.target.value);
                    setFormData({...formData, categoryId: catId, supplierId: 0});
                  }}
                  className="select-field flex-1"
                  required
                >
                  <option value="0">Välj kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
                  title="Lägg till kategori"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leverantör *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: parseInt(e.target.value)})}
                  className="select-field flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={!formData.categoryId}
                >
                  <option value="0">
                    {formData.categoryId ? 'Välj leverantör' : 'Välj kategori först'}
                  </option>
                  {filteredSuppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.categoryId) {
                      setNewSupplier({ name: '', categoryId: formData.categoryId });
                      setShowSupplierModal(true);
                    }
                  }}
                  disabled={!formData.categoryId}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Lägg till leverantör"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              {!formData.categoryId && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Välj en kategori först för att se tillgängliga leverantörer
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anteckningar
            </label>
            <textarea
              placeholder="Skriv en kort beskrivning..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="textarea-field"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taggar (komma-separerat)</label>
            <input
              type="text"
              placeholder="t.ex. jobb, privat"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Typfilter
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'expense' | 'income')}
                className="select-field"
              >
                <option value="all">Alla</option>
                <option value="expense">Endast utgifter</option>
                <option value="income">Endast inkomster</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sök i poster
              </label>
              <input
                type="text"
                placeholder="Sök på namn, ID, belopp, kategori, leverantör, notering..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* (Tagg- och kategorifilter flyttat till Filter-kortet) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrera på kategori
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategoryIds([])}
                className={`px-3 py-1.5 rounded-full text-sm border ${selectedCategoryIds.length === 0 ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
              >
                Alla
              </button>
              {categories.map(cat => {
                const active = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryIds(prev => active ? prev.filter(id => id !== cat.id) : [...prev, cat.id])}
                    className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {!editingId && (
            <div className="flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                Lägg till
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Sticky action bar för formulär eller snabbredigering */}
      {(editingId || rowEditingId) && (
        <div className="fixed left-0 right-0 bottom-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-700 shadow-lg"
             style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
            {editingId && (
              <div className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                Redigerar posten <span className="font-mono">{editingDisplayId || editingId}</span>
              </div>
            )}
            {rowEditingId && (
              <div className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                Snabbredigering aktiv
              </div>
            )}
            <div className="ml-auto flex gap-3 w-full md:w-auto">
              {editingId && (
                <>
                  <button
                    type="button"
                    onClick={() => formElRef.current?.requestSubmit()}
                    className="btn-primary flex-1 md:flex-none"
                  >
                    Uppdatera post
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1 md:flex-none"
                  >
                    Avbryt redigering
                  </button>
                </>
              )}
              {rowEditingId && (
                <>
                  <button
                    type="button"
                    onClick={saveQuickEdit}
                    className="btn-primary flex-1 md:flex-none"
                  >
                    Spara ändring
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowEditingId(null)}
                    className="btn-secondary flex-1 md:flex-none"
                  >
                    Avbryt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {(editingId || rowEditingId) && (
        <div className="h-20 md:h-16" />
      )}

      {/* Modal för att lägga till kategori */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lägg till kategori
            </h3>
            <input
              type="text"
              placeholder="Kategorinamn"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickAddCategory()}
              className="input-field mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleQuickAddCategory}
                className="btn-primary flex-1"
                disabled={!newCategoryName.trim()}
              >
                Lägg till
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="btn-secondary flex-1"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal för att lägga till leverantör */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lägg till leverantör
            </h3>
            <input
              type="text"
              placeholder="Leverantörsnamn"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickAddSupplier()}
              className="input-field mb-4"
              autoFocus
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Kategori: <span className="font-semibold">{categories.find(c => c.id === newSupplier.categoryId)?.name}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleQuickAddSupplier}
                className="btn-primary flex-1"
                disabled={!newSupplier.name.trim()}
              >
                Lägg till
              </button>
              <button
                onClick={() => {
                  setShowSupplierModal(false);
                  setNewSupplier({ name: '', categoryId: 0 });
                }}
                className="btn-secondary flex-1"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div ref={tableRef} className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedMonths.length > 0
              ? `Alla poster för: ${selectedMonths.join(', ')}`
              : `Alla poster för ${selectedYear}`}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                // Export displayedExpenses to CSV
                const rows = displayedExpenses.map(e => ({
                  Månad: e.month,
                  ID: e.displayId,
                  Namn: e.name,
                  Typ: e.type === 'expense' ? 'Utgift' : 'Inkomst',
                  Kategori: e.category?.name || '',
                  Leverantör: e.supplier?.name || '',
                  Belopp: e.amount,
                  Notering: e.notes || '',
                  Taggar: (e.tags || []).join(', ')
                }));
                const headers = Object.keys(rows[0] || { 'Månad': '', 'ID': '', 'Namn': '', 'Typ': '', 'Kategori': '', 'Leverantör': '', 'Belopp': '', 'Notering': '' });
                const csv = [headers.join(';')]
                  .concat(rows.map(r => headers.map(h => {
                    const v = (r as any)[h];
                    const s = (v === undefined || v === null) ? '' : String(v).replace(/\n/g, ' ').replace(/;/g, ',');
                    return '"' + s.replace(/"/g, '""') + '"';
                  }).join(';')))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const monthsSuffix = selectedMonths.length > 0 ? selectedMonths.join('-') : String(selectedYear);
                a.download = `westwallet_export_${monthsSuffix}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn-secondary"
            >
              Exportera CSV
            </button>
            <button
              type="button"
              onClick={() => {
                const rows = displayedExpenses.map(e => ({
                  Månad: e.month,
                  ID: e.displayId,
                  Namn: e.name,
                  Typ: e.type === 'expense' ? 'Utgift' : 'Inkomst',
                  Kategori: e.category?.name || '',
                  Leverantör: e.supplier?.name || '',
                  Belopp: e.amount,
                  Notering: e.notes || '',
                  Taggar: (e.tags || []).join(', ')
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Export');
                const monthsSuffix = selectedMonths.length > 0 ? selectedMonths.join('-') : String(selectedYear);
                XLSX.writeFile(wb, `westwallet_export_${monthsSuffix}.xlsx`);
              }}
              className="btn-secondary"
            >
              Exportera XLSX
            </button>
          </div>
        </div>
        
        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Inga poster för denna månad</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Månad</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Namn</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Typ</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kategori</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leverantör</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Belopp</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Notering</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bilder</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Taggar</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.map(expense => (
                  <React.Fragment key={expense.id}>
                  <tr className="table-row">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {expense.month}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                      {expense.displayId}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <span>{expense.name}</span>
                        {isAnomaly(expense) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" title="Belopp avviker från kategorins genomsnitt">
                            Avvikelse
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        expense.type === 'expense' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {expense.type === 'expense' ? 'Utgift' : 'Inkomst'}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {rowEditingId === expense.id ? (
                        <select
                          value={rowEdit.categoryId}
                          onChange={(e)=>setRowEdit(prev=>({...prev, categoryId: parseInt(e.target.value)}))}
                          className="select-field"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        expense.category?.name || '-'
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {expense.supplier?.name || '-'}
                    </td>
                    <td className={`px-3 py-4 whitespace-nowrap text-sm text-left font-semibold ${
                      expense.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {rowEditingId === expense.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={rowEdit.amount}
                          onChange={(e)=>setRowEdit(prev=>({...prev, amount: e.target.value }))}
                          className="input-field text-left"
                        />
                      ) : (
                        `${formatCurrency(expense.amount)} kr`
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm w-40 text-gray-600 dark:text-gray-400">
                      <button
                        type="button"
                        onClick={() => setNoteModalExpense(expense)}
                        title={expense.notes && expense.notes.length > 0 ? 'Visa/ändra anteckning' : 'Lägg till anteckning'}
                        className={`inline-flex items-center gap-1 pl-0 pr-2 py-1 rounded-md ${
                          expense.notes && expense.notes.length > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8M5 6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6z"/></svg>
                        <span className="text-xs">{expense.notes && expense.notes.length > 0 ? '1' : '0'}</span>
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-left text-sm">
                      <button
                        onClick={() => setImageModalExpense(expense)}
                        className={`inline-flex items-center gap-1 pl-0 pr-2 py-1 rounded-md ${
                          expense.images && expense.images.length > 0
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {expense.images && expense.images.length > 0 ? expense.images.length : '0'}
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-wrap gap-1">
                        {expense.tags && expense.tags.length > 0 ? expense.tags.map((t,i)=>(
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">{t}</span>
                        )) : <span className="text-gray-400 dark:text-gray-600 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-left text-sm">
                      <div className="flex items-center justify-start gap-1">
                        {rowEditingId === expense.id ? (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">Redigerar – använd nedersta raden</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(expense)}
                              title="Redigera"
                              className="p-2 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-2 4h2m-5 4h6m2 6H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a2 2 0 011.414.586l4.414 4.414A2 2 0 0119 9.414V19a2 2 0 01-2 2z"/></svg>
                            </button>
                            <button
                              onClick={() => { setRowEditingId(expense.id); setRowEdit({ amount: String(Math.abs(expense.amount)), categoryId: expense.categoryId }); }}
                              title="Snabbredigera belopp & kategori"
                              className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4h2m4 0h2a1 1 0 011 1v2m0 4v4m0 4v2a1 1 0 01-1 1h-2m-4 0h-2m-4 0H5a1 1 0 01-1-1v-2m0-4v-4m0-4V5a1 1 0 011-1h2m4 0h4"/></svg>
                            </button>
                            <button
                              onClick={() => requestDelete(expense)}
                              title="Ta bort"
                              className="p-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedNotes[expense.id] && !isInlineFriendly(expense.notes) && (
                    <tr>
                      <td colSpan={11} className="bg-gray-50 dark:bg-gray-900/30 p-4">
                        <div className="text-sm text-gray-800 dark:text-gray-200">
                          <pre className="whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-sans">{expense.notes ? firstNLines(expense.notes, MAX_INLINE_LINES) : ''}</pre>
                          {expense.notes && expense.notes.split(/\r?\n/).length > MAX_INLINE_LINES && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Visar de första {MAX_INLINE_LINES} raderna.</p>
                          )}
                          <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              className="text-xs text-blue-600 dark:text-blue-400 underline"
                              onClick={() => setNoteModalExpense(expense)}
                            >Öppna i modal</button>
                            <button
                              type="button"
                              className="text-xs text-blue-600 dark:text-blue-400 underline"
                              onClick={() => setExpandedNotes(prev => ({...prev, [expense.id]: false}))}
                            >Dölj</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bekräfta radering</h3>
            {(() => {
              const exp = expenses.find(e => e.id === confirmDeleteId);
              return (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  Vill du radera posten {exp ? (<><span className="font-mono">{exp.displayId}</span> – <span className="font-semibold">{exp.name}</span></>) : '...'}?
                  Du kan ångra i 10 sekunder efteråt.
                </p>
              );
            })()}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  if (id !== null) await handleDelete(id);
                }}
                className="btn-danger flex-1"
              >
                Radera
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-secondary flex-1"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModalExpense && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Stäng endast om man klickar på bakgrunden (inte på modalen själv)
            if (e.target === e.currentTarget) {
              setImageModalExpense(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bilder för {imageModalExpense.displayId} - {imageModalExpense.name}
              </h3>
              <button
                onClick={() => setImageModalExpense(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ladda upp bilder
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => handleImageUpload(imageModalExpense.id, e.target.files)}
                  disabled={uploadingImages[imageModalExpense.id]}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    dark:file:bg-blue-900/30 dark:file:text-blue-400
                    dark:hover:file:bg-blue-900/50
                    cursor-pointer"
                />
                {uploadingImages[imageModalExpense.id] && (
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">Laddar upp...</p>
                )}
              </div>

              {/* Images Grid */}
              {imageModalExpense.images && imageModalExpense.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageModalExpense.images.map((image, index) => {
                    const imageUrl = `${API_BASE_URL}/uploads/${image}`;
                    const isPdf = image.toLowerCase().endsWith('.pdf');
                    
                    return (
                      <div key={index} className="relative group">
                        {isPdf ? (
                          <div 
                            className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            onClick={() => window.open(imageUrl, '_blank')}
                          >
                            <div className="text-center">
                              <svg className="w-16 h-16 mx-auto text-red-600 dark:text-red-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-sm text-gray-600 dark:text-gray-400">PDF - Klicka för att öppna</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt={`Bild ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(imageModalExpense.images || [], index)}
                            onError={(e) => {
                              console.error('Failed to load image:', imageUrl);
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em"%3EIngen bild%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        )}
                        <button
                          onClick={() => handleImageDelete(imageModalExpense.id, image)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">Inga bilder uppladdade</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Note Modal (editable) */}
      {noteModalExpense && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNoteModalExpense(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/30">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                Anteckning – {noteModalExpense.displayId}
              </h3>
              <button onClick={() => setNoteModalExpense(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await api.put(`/expenses/${noteModalExpense.id}`, {
                    name: noteModalExpense.name,
                    amount: noteModalExpense.amount,
                    type: noteModalExpense.type,
                    categoryId: noteModalExpense.categoryId,
                    supplierId: noteModalExpense.supplierId,
                    month: noteModalExpense.month,
                    notes: noteModalText || '',
                    tags: noteModalExpense.tags || []
                  });
                  setExpenses(prev => prev.map(e => e.id === noteModalExpense.id ? { ...e, notes: noteModalText || '' } : e));
                  setToast({ message: 'Anteckning sparad', type: 'success' });
                  setNoteModalExpense(null);
                } catch (err) {
                  setToast({ message: 'Kunde inte spara anteckningen', type: 'error' });
                }
              }}
            >
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text</label>
                <textarea
                  value={noteModalText}
                  onChange={(e)=>setNoteModalText(e.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Skriv eller redigera anteckning här..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setNoteModalExpense(null);
                    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                      e.preventDefault();
                      if (noteModalText !== (noteModalExpense?.notes || '')) {
                        // Spara anteckning
                        (async () => {
                          try {
                            await api.put(`/expenses/${noteModalExpense?.id}`, {
                              name: noteModalExpense?.name,
                              amount: noteModalExpense?.amount,
                              type: noteModalExpense?.type,
                              categoryId: noteModalExpense?.categoryId,
                              supplierId: noteModalExpense?.supplierId,
                              month: noteModalExpense?.month,
                              notes: noteModalText || '',
                              tags: noteModalExpense?.tags || []
                            });
                            setExpenses(prev => prev.map(e => e.id === noteModalExpense?.id ? { ...e, notes: noteModalText || '' } : e));
                            setToast({ message: 'Anteckning sparad', type: 'success' });
                            setNoteModalExpense(null);
                          } catch (err) {
                            setToast({ message: 'Kunde inte spara anteckningen', type: 'error' });
                          }
                        })();
                      } else {
                        setNoteModalExpense(null);
                      }
                    }
                  }}
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex flex-col sm:flex-row gap-3 sm:justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 self-start">
                  Enter sparar • Esc stänger utan ändring
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={()=>{ setNoteModalExpense(null); }}
                    className="btn-secondary flex-1 sm:flex-none"
                  >Avbryt</button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 sm:flex-none"
                    disabled={noteModalText === (noteModalExpense.notes || '')}
                  >Spara</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Import Modal */}
      {showImportModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowImportModal(false);
              setImportFile(null);
              setImportPreview(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Importera från bank
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {!importPreview ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Ladda upp en XLSX eller CSV fil från din bank (Sparbanken Skåne format stöds).
                    </p>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Välj fil:
                      </span>
                      <input
                        ref={importFileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        disabled={importing}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          dark:file:bg-blue-900/30 dark:file:text-blue-400
                          dark:hover:file:bg-blue-900/50
                          cursor-pointer"
                      />
                    </label>
                    {importFile && (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">Vald fil: <span className="font-medium">{importFile.name}</span></p>
                    )}
                  </div>
                  {importing && (
                    <div className="text-center py-8">
                      <p className="text-blue-600 dark:text-blue-400">Läser fil...</p>
                    </div>
                  )}
                </>
              ) : (
                <BankImportPreview
                  preview={importPreview}
                  categories={categories}
                  suppliers={suppliers}
                  onConfirm={handleImportConfirm}
                  onCancel={() => {
                    setImportFile(null);
                    setImportPreview(null);
                  }}
                  importing={importing}
                  onCategoryCreated={loadCategories}
                  onSupplierCreated={loadSuppliers}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Full Screen Image Viewing */}
      {lightboxOpen && lightboxImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[70]"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-[80]"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 text-white hover:text-gray-300 z-[80] bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div 
            className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${API_BASE_URL}/uploads/${lightboxImages[lightboxIndex]}`}
              alt={`Bild ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              onError={(e) => {
                console.error('Failed to load lightbox image');
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em"%3EIngen bild%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Next Button */}
          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 text-white hover:text-gray-300 z-[80] bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image Counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded-lg">
            ESC för att stänga | ← → för att navigera
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          action={toast.action}
        />
      )}
    </div>
  );
}
