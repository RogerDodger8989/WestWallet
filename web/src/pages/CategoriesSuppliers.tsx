import React, { useState, useEffect } from 'react';
import api from '../api/api';

interface Category {
  id: number;
  name: string;
  suppliers?: Supplier[];
}

interface Supplier {
  id: number;
  name: string;
  categoryId: number;
  organizationNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  bankAccount?: string;
  contactPerson?: string;
  notes?: string;
}

export function CategoriesSuppliers() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    categoryId: 0,
    organizationNumber: '',
    address: '',
    postalCode: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    bankAccount: '',
    contactPerson: '',
    notes: ''
  });
  const [editingSupplier, setEditingSupplier] = useState<number | null>(null);

  useEffect(() => {
    loadCategories();
    loadSuppliers();
  }, []);

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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting category:', categoryName);
    try {
      if (editingCategory) {
        console.log('Updating category:', editingCategory);
        await api.put(`/categories/${editingCategory}`, { name: categoryName });
      } else {
        console.log('Creating new category');
        const response = await api.post('/categories', { name: categoryName });
        console.log('Category created:', response.data);
      }
      setCategoryName('');
      setEditingCategory(null);
      loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      console.error('Error response:', error.response?.data);
      alert(`Kunde inte spara kategori: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Är du säker på att du vill ta bort denna kategori?')) {
      try {
        await api.delete(`/categories/${id}`);
        loadCategories();
        loadSuppliers();
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('Kunde inte ta bort kategori');
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setEditingCategory(category.id);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...supplierForm,
      categoryId: supplierForm.categoryId || selectedCategory || 0
    };
    
    console.log('Submitting supplier:', data);
    try {
      if (editingSupplier) {
        console.log('Updating supplier:', editingSupplier);
        await api.put(`/suppliers/${editingSupplier}`, data);
      } else {
        console.log('Creating new supplier');
        const response = await api.post('/suppliers', data);
        console.log('Supplier created:', response.data);
      }
      resetSupplierForm();
      loadSuppliers();
    } catch (error: any) {
      console.error('Failed to save supplier:', error);
      console.error('Error response:', error.response?.data);
      alert(`Kunde inte spara leverantör: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (confirm('Är du säker på att du vill ta bort denna leverantör?')) {
      try {
        await api.delete(`/suppliers/${id}`);
        loadSuppliers();
      } catch (error) {
        console.error('Failed to delete supplier:', error);
        alert('Kunde inte ta bort leverantör');
      }
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierForm({
      name: supplier.name,
      categoryId: supplier.categoryId,
      organizationNumber: supplier.organizationNumber || '',
      address: supplier.address || '',
      postalCode: supplier.postalCode || '',
      city: supplier.city || '',
      country: supplier.country || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      bankAccount: supplier.bankAccount || '',
      contactPerson: supplier.contactPerson || '',
      notes: supplier.notes || ''
    });
    setEditingSupplier(supplier.id);
    setSelectedCategory(supplier.categoryId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      categoryId: 0,
      organizationNumber: '',
      address: '',
      postalCode: '',
      city: '',
      country: '',
      email: '',
      phone: '',
      bankAccount: '',
      contactPerson: '',
      notes: ''
    });
    setEditingSupplier(null);
  };

  const filteredSuppliers = selectedCategory 
    ? suppliers.filter(s => s.categoryId === selectedCategory)
    : suppliers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Kategorier & Leverantörer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Organisera dina kategorier och leverantörer
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Categories Section */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Kategorier
            </h2>
            
            <form onSubmit={handleCategorySubmit} className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Kategorinamn"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="input-field"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingCategory ? 'Uppdatera' : 'Lägg till'}
                </button>
                {editingCategory && (
                  <button 
                    type="button" 
                    onClick={() => { setCategoryName(''); setEditingCategory(null); }} 
                    className="btn-secondary flex-1"
                  >
                    Avbryt
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-2">
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedCategory === cat.id 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-600' 
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {cat.name}
                    </span>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => handleEditCategory(cat)}
                        className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded transition-colors"
                        title="Redigera"
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Ta bort"
                      >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Inga kategorier ännu
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Suppliers Section */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Leverantörer {selectedCategory && `för ${categories.find(c => c.id === selectedCategory)?.name}`}
            </h2>
            
            <form onSubmit={handleSupplierSubmit} className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leverantörsnamn *
                  </label>
                  <input
                    type="text"
                    placeholder="T.ex. ICA Supermarket"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategori *
                  </label>
                  <select
                    value={supplierForm.categoryId || selectedCategory || ''}
                    onChange={(e) => setSupplierForm({...supplierForm, categoryId: parseInt(e.target.value)})}
                    className="select-field"
                    required
                  >
                    <option value="">Välj kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organisationsnummer
                  </label>
                  <input
                    type="text"
                    placeholder="XXXXXX-XXXX"
                    value={supplierForm.organizationNumber}
                    onChange={(e) => setSupplierForm({...supplierForm, organizationNumber: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="text"
                    placeholder="08-123 45 67"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Adress
                  </label>
                  <input
                    type="text"
                    placeholder="Gatunamn 123"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postnummer
                  </label>
                  <input
                    type="text"
                    placeholder="123 45"
                    value={supplierForm.postalCode}
                    onChange={(e) => setSupplierForm({...supplierForm, postalCode: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stad
                  </label>
                  <input
                    type="text"
                    placeholder="Stockholm"
                    value={supplierForm.city}
                    onChange={(e) => setSupplierForm({...supplierForm, city: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Land
                  </label>
                  <input
                    type="text"
                    placeholder="Sverige"
                    value={supplierForm.country}
                    onChange={(e) => setSupplierForm({...supplierForm, country: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-post
                  </label>
                  <input
                    type="email"
                    placeholder="info@foretag.se"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bankkonto
                  </label>
                  <input
                    type="text"
                    placeholder="1234-5678901"
                    value={supplierForm.bankAccount}
                    onChange={(e) => setSupplierForm({...supplierForm, bankAccount: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kontaktperson
                  </label>
                  <input
                    type="text"
                    placeholder="Anna Andersson"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({...supplierForm, contactPerson: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Anteckningar
                  </label>
                  <textarea
                    placeholder="Övrig information..."
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                    className="textarea-field"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingSupplier ? 'Uppdatera leverantör' : 'Lägg till leverantör'}
                </button>
                {editingSupplier && (
                  <button type="button" onClick={resetSupplierForm} className="btn-secondary flex-1">
                    Avbryt
                  </button>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {filteredSuppliers.map(supplier => (
                <div key={supplier.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {supplier.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        {supplier.organizationNumber && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Org.nr: {supplier.organizationNumber}
                          </div>
                        )}
                        {supplier.address && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {supplier.address}
                            {(supplier.postalCode || supplier.city) && `, ${supplier.postalCode} ${supplier.city}`}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {supplier.email}
                          </div>
                        )}
                        {supplier.bankAccount && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            {supplier.bankAccount}
                          </div>
                        )}
                        {supplier.contactPerson && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {supplier.contactPerson}
                          </div>
                        )}
                      </div>
                      {supplier.notes && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
                          {supplier.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button onClick={() => handleEditSupplier(supplier)} className="btn-success whitespace-nowrap">
                        Redigera
                      </button>
                      <button onClick={() => handleDeleteSupplier(supplier.id)} className="btn-danger whitespace-nowrap">
                        Ta bort
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSuppliers.length === 0 && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedCategory ? 'Inga leverantörer i denna kategori' : 'Inga leverantörer ännu'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
