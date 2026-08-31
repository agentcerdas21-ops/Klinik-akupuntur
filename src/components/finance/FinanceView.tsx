import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Pencil,
  X
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { Expense, ExpenseCategory, Income, PaymentMethod } from '../../types';
import { formatIDR, formatDateIndo, exportToExcel } from '../../lib/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FinanceViewProps {
  initialTab?: 'expenses' | 'income';
  autoOpenModal?: 'expense' | 'income' | null;
  onClearAutoOpenModal?: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  initialTab = 'expenses',
  autoOpenModal,
  onClearAutoOpenModal
}) => {
  const {
    expenses,
    expenseCategories,
    saveExpenseCategory,
    deleteExpenseCategory,
    income,
    totalRevenue,
    totalExpense,
    netIncome,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome
  } = useClinic();
  const { isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>(initialTab);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    if (autoOpenModal === 'expense') {
      setActiveTab('expenses');
      setShowExpenseModal(true);
      if (onClearAutoOpenModal) onClearAutoOpenModal();
    } else if (autoOpenModal === 'income') {
      setActiveTab('income');
      setShowIncomeModal(true);
      if (onClearAutoOpenModal) onClearAutoOpenModal();
    }
  }, [autoOpenModal, onClearAutoOpenModal]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<string>(
    expenseCategories[0]?.name || 'Jarum & Medis Steril'
  );
  const [expenseAmount, setExpenseAmount] = useState(150000);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('Cash');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Category Dropdown Custom State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
        setIsAddingCategory(false);
        setEditingCategoryId(null);
      }
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Keep expenseCategory synchronized with available categories
  useEffect(() => {
    if (expenseCategories.length > 0) {
      if (!expenseCategory) {
        setExpenseCategory(expenseCategories[0].name);
      }
    }
  }, [expenseCategories, expenseCategory]);

  const handleSaveNewCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    try {
      const saved = saveExpenseCategory(trimmed);
      setExpenseCategory(saved.name);
      setNewCategoryName('');
      setIsAddingCategory(false);
      setIsCategoryDropdownOpen(false);
    } catch {
      // Toast is handled in context
    }
  };

  const handleSaveEditCategory = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editingCategoryName.trim();
    if (!trimmed) return;

    const oldCat = expenseCategories.find((c) => c.id === id);
    try {
      const updated = saveExpenseCategory(trimmed, id);
      if (oldCat && expenseCategory === oldCat.name) {
        setExpenseCategory(updated.name);
      }
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } catch {
      // Toast is handled in context
    }
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const deletedName = categoryToDelete.name;
    deleteExpenseCategory(categoryToDelete.id);
    if (expenseCategory === deletedName) {
      const remaining = expenseCategories.filter((c) => c.id !== categoryToDelete.id);
      setExpenseCategory(remaining[0]?.name || 'Lainnya');
    }
    setCategoryToDelete(null);
  };

  // Income Form State
  const [incomeTitle, setIncomeTitle] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('Konsultasi / Lainnya');
  const [incomeAmount, setIncomeAmount] = useState(200000);
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeSource, setIncomeSource] = useState('Konsultasi Tambahan');
  const [incomeNotes, setIncomeNotes] = useState('');

  // Submit Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || expenseAmount <= 0) return;

    addExpense({
      description: expenseTitle.trim(),
      category: expenseCategory.trim(),
      amount: Number(expenseAmount),
      expense_date: expenseDate,
      payment_method: expenseMethod,
      notes: expenseNotes.trim() || undefined
    });

    setExpenseTitle('');
    setExpenseAmount(150000);
    setExpenseNotes('');
    setShowExpenseModal(false);
  };

  // Submit Income
  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeTitle.trim() || incomeAmount <= 0) return;

    addIncome({
      description: incomeTitle.trim(),
      category: incomeCategory.trim(),
      amount: Number(incomeAmount),
      income_date: incomeDate,
      source: incomeSource.trim(),
      notes: incomeNotes.trim() || undefined
    });

    setIncomeTitle('');
    setIncomeAmount(200000);
    setIncomeNotes('');
    setShowIncomeModal(false);
  };

  // Available Categories for Table Filter
  const availableCategoriesList = useMemo(() => {
    const catSet = new Set<string>();
    expenseCategories.forEach((c) => {
      if (c.active !== false && c.name) catSet.add(c.name);
    });
    expenses.forEach((e) => {
      if (e.category) catSet.add(e.category);
    });
    return Array.from(catSet);
  }, [expenseCategories, expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesSearch =
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }, [expenses, search, categoryFilter]);

  // Filtered Income
  const filteredIncome = useMemo(() => {
    return income
      .filter((inc) => {
        const matchesSearch =
          inc.description.toLowerCase().includes(search.toLowerCase()) ||
          inc.category.toLowerCase().includes(search.toLowerCase()) ||
          (inc.notes && inc.notes.toLowerCase().includes(search.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => new Date(b.income_date).getTime() - new Date(a.income_date).getTime());
  }, [income, search]);

  const handleExportExpenses = () => {
    const data = filteredExpenses.map((e) => ({
      'Tanggal': formatDateIndo(e.expense_date),
      'Keterangan': e.description,
      'Kategori': e.category,
      'Jumlah (Rp)': e.amount,
      'Metode': e.payment_method,
      'Catatan': e.notes || '-'
    }));
    exportToExcel(data, `Pengeluaran_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Keuangan & Arus Kas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan pengeluaran jarum steril, sewa ruko, gaji, dan analisis laba bersih
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pengeluaran</span>
          </button>
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pemasukan Manual</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">{formatIDR(totalRevenue)}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Penjualan Layanan & Herbal + Pemasukan</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2 font-mono">{formatIDR(totalExpense)}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Operasional & Pembelian Stok</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Income (Surplus)</span>
            <div className={`p-2 rounded-xl ${netIncome >= 0 ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 font-mono ${netIncome >= 0 ? 'text-sky-800' : 'text-rose-600'}`}>
            {formatIDR(netIncome)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {netIncome >= 0 ? 'Klinik menghasilkan keuntungan bersih' : 'Arus kas periode ini defisit'}
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pengeluaran ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'income'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Pemasukan Manual ({income.length})
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* TAB 1: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-2 max-w-xl w-full">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari keterangan pengeluaran atau kategori..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {availableCategoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExportExpenses}
                  className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  <span>Excel Pengeluaran</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Keterangan Pengeluaran</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          Belum ada catatan pengeluaran.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatDateIndo(exp.expense_date)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{exp.description}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200/60">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-xs">{exp.payment_method}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-xs">
                            {exp.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-600">
                            {formatIDR(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setDeleteExpenseId(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Sumber Pemasukan</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 px-4 text-right">Jumlah (Rp)</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredIncome.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          Belum ada catatan pemasukan manual.
                        </td>
                      </tr>
                    ) : (
                      filteredIncome.map((inc) => (
                        <tr key={inc.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {formatDateIndo(inc.income_date)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{inc.description}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/60">
                              {inc.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-xs">
                            {inc.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                            {formatIDR(inc.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setDeleteIncomeId(inc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="Hapus Pemasukan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Catat Pengeluaran Klinik
            </h3>

            <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Pengeluaran *
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="Contoh: Beli Jarum Akupunktur Steril 5 Box"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative" ref={categoryDropdownRef}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setIsAddingCategory(false);
                      setEditingCategoryId(null);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer hover:bg-slate-100/70 transition-colors text-left"
                  >
                    <span className="truncate">{expenseCategory || 'Pilih Kategori'}</span>
                    {isCategoryDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 max-h-64 overflow-y-auto space-y-1">
                      {/* Category List */}
                      {expenseCategories
                        .filter((c) => c.active !== false)
                        .map((cat) => {
                          const isSelected = expenseCategory === cat.name;
                          const isEditingThis = editingCategoryId === cat.id;

                          if (isEditingThis) {
                            return (
                              <div
                                key={cat.id}
                                className="p-1.5 bg-slate-50 border border-rose-200 rounded-xl space-y-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveEditCategory(cat.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingCategoryId(null);
                                    }
                                  }}
                                  placeholder="Nama kategori..."
                                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                                />
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCategoryId(null)}
                                    className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-200 rounded-md cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditCategory(cat.id)}
                                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Simpan</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={cat.id}
                              onClick={() => {
                                setExpenseCategory(cat.name);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between group transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-50 text-rose-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                                <span className="truncate">{cat.name}</span>
                              </div>
                              <div
                                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryId(cat.id);
                                    setEditingCategoryName(cat.name);
                                    setIsAddingCategory(false);
                                  }}
                                  title="Edit Kategori"
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCategoryToDelete(cat)}
                                  title="Hapus Kategori"
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                      {/* Divider */}
                      <div className="border-t border-slate-100 my-1"></div>

                      {/* Add Category Section */}
                      {isAddingCategory ? (
                        <div
                          className="p-2 bg-slate-50 border border-rose-200 rounded-xl space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="block text-[11px] font-bold text-slate-700">
                            Nama Kategori Baru:
                          </label>
                          <input
                            type="text"
                            autoFocus
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveNewCategory();
                              } else if (e.key === 'Escape') {
                                setIsAddingCategory(false);
                              }
                            }}
                            placeholder="Contoh: Transportasi"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCategory(false);
                                setNewCategoryName('');
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNewCategory()}
                              disabled={!newCategoryName.trim()}
                              className="px-3 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingCategory(true);
                            setNewCategoryName('');
                            setEditingCategoryId(null);
                          }}
                          className="w-full py-2 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                        >
                          <Plus className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>+ Tambah Kategori</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Biaya (Rp) *</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={expenseAmount === 0 ? '' : expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Cash">Tunai / Cash</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Debit">Debit Card</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Keterangan toko / supplier..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Income */}
      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Catat Pemasukan Manual
            </h3>

            <form onSubmit={handleIncomeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber / Judul Pemasukan *
                </label>
                <input
                  type="text"
                  required
                  value={incomeTitle}
                  onChange={(e) => setIncomeTitle(e.target.value)}
                  placeholder="Contoh: Konsultasi Seminar Saraf Kejepit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={incomeCategory}
                    onChange={(e) => setIncomeCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={incomeDate}
                    onChange={(e) => setIncomeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Pemasukan (Rp) *</label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={incomeAmount === 0 ? '' : incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
                >
                  Simpan Pemasukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Dialog */}
      <ConfirmDialog
        isOpen={!!deleteExpenseId}
        onClose={() => setDeleteExpenseId(null)}
        onConfirm={() => {
          if (deleteExpenseId) deleteExpense(deleteExpenseId);
        }}
        title="Hapus Catatan Pengeluaran?"
        message="Catatan pengeluaran ini akan dihapus dari buku kas operasional."
        confirmText="Hapus Pengeluaran"
        isDangerous={true}
      />

      {/* Delete Income Dialog */}
      <ConfirmDialog
        isOpen={!!deleteIncomeId}
        onClose={() => setDeleteIncomeId(null)}
        onConfirm={() => {
          if (deleteIncomeId) deleteIncome(deleteIncomeId);
        }}
        title="Hapus Catatan Pemasukan?"
        message="Catatan pemasukan manual ini akan dihapus dari buku kas."
        confirmText="Hapus Pemasukan"
        isDangerous={true}
      />

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="Hapus Kategori Pengeluaran?"
        message={`Kategori "${categoryToDelete?.name}" akan dihapus dari daftar pilihan. Catatan transaksi pengeluaran historis yang sudah ada tetap aman dan tidak akan terhapus.`}
        confirmText="Hapus Kategori"
        isDangerous={true}
      />
    </div>
  );
};
