import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/storage';
import {
  BackupValidationResult,
  ClinicSettings,
  DatabaseBackupPayload,
  Expense,
  ExpenseCategory,
  HerbalProduct,
  Income,
  Invoice,
  Patient,
  Payment,
  PaymentStatus,
  ProductCategory,
  Sale,
  Service,
  ServiceCategory,
  StockAdjustment,
  StockAdjustmentReason,
  TherapySession
} from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface DbContextType {
  settings: ClinicSettings;
  patients: Patient[];
  therapySessions: TherapySession[];
  services: Service[];
  serviceCategories: ServiceCategory[];
  herbalProducts: HerbalProduct[];
  productCategories: ProductCategory[];
  stockAdjustments: StockAdjustment[];
  sales: Sale[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  income: Income[];
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // Actions
  addPatient: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => Patient;
  updatePatient: (id: string, data: Partial<Patient>) => Patient;
  deletePatient: (id: string) => void;
  deleteAllPatients: () => void;

  addTherapySession: (data: Omit<TherapySession, 'id' | 'created_at' | 'updated_at'>) => TherapySession;
  updateTherapySession: (id: string, data: Partial<TherapySession>) => TherapySession;
  deleteTherapySession: (id: string) => void;

  addService: (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Service;
  updateService: (id: string, data: Partial<Service>) => Service;
  deleteService: (id: string) => void;
  saveServiceCategory: (name: string, id?: string) => void;
  deleteServiceCategory: (id: string) => void;

  addHerbalProduct: (data: Omit<HerbalProduct, 'id' | 'created_at' | 'updated_at'>) => HerbalProduct;
  updateHerbalProduct: (id: string, data: Partial<HerbalProduct>) => HerbalProduct;
  adjustProductStock: (id: string, qty: number, reason?: StockAdjustmentReason, notes?: string) => void;
  recordStockAdjustment: (data: {
    product_id: string;
    adjustment_type: 'IN' | 'OUT' | 'SET';
    quantity_change: number;
    reason: StockAdjustmentReason;
    notes?: string;
    adjusted_by?: string;
  }) => StockAdjustment | null;
  deleteHerbalProduct: (id: string) => void;
  saveProductCategory: (name: string, id?: string) => void;
  deleteProductCategory: (id: string) => void;

  createSale: (
    saleData: {
      patient_id?: string;
      patient_name?: string;
      sale_date: string;
      discount: number;
      payment_method: Sale['payment_method'];
      payment_status: Sale['payment_status'];
      amount_paid?: number;
      notes?: string;
    },
    items: Array<{
      item_type: 'service' | 'product';
      service_id?: string;
      product_id?: string;
      item_name: string;
      quantity: number;
      price: number;
    }>
  ) => { sale: Sale; invoice: Invoice; payment?: Payment };

  recordPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Payment;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at'>) => Payment;
  createCompleteSaleTransaction: (
    saleData: any,
    items: any
  ) => { sale: Sale; invoice: Invoice; payment?: Payment };
  updateInvoiceStatus: (id: string, status: PaymentStatus) => void;
  restockProduct: (id: string, qty: number) => void;

  addExpense: (data: Omit<Expense, 'id' | 'created_at'>) => Expense;
  deleteExpense: (id: string) => void;
  saveExpenseCategory: (name: string, id?: string) => void;
  deleteExpenseCategory: (id: string) => void;

  addIncome: (data: Omit<Income, 'id' | 'created_at'>) => Income;
  deleteIncome: (id: string) => void;

  updateSettings: (data: Partial<ClinicSettings>) => void;
  resetDemoData: () => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDatabase: () => DatabaseBackupPayload;
  exportFullDatabaseJSON: () => DatabaseBackupPayload;
  validateBackupFile: (payload: any) => BackupValidationResult;
  importDatabase: (payload: DatabaseBackupPayload) => void;
  importDatabaseJSON: (payload: DatabaseBackupPayload) => void;

  // Alerts & KPIs
  lowStockProducts: HerbalProduct[];
  outOfStockProducts: HerbalProduct[];
  unpaidInvoices: Invoice[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Subscribe to storage modifications
  useEffect(() => {
    return db.subscribe(() => {
      setVersion((v) => v + 1);
    });
  }, []);

  const showToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const id = 'tst_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Raw data from storage
  const settings = db.getSettings();
  const patients = db.getPatients();
  const therapySessions = db.getTherapySessions();
  const services = db.getServices();
  const serviceCategories = db.getServiceCategories();
  const herbalProducts = db.getHerbalProducts();
  const productCategories = db.getProductCategories();
  const stockAdjustments = db.getStockAdjustments();
  const sales = db.getSales();
  const invoices = db.getInvoices();
  const payments = db.getPayments();
  const expenses = db.getExpenses();
  const expenseCategories = db.getExpenseCategories();
  const income = db.getIncomes();

  // Alerts
  const lowStockProducts = herbalProducts.filter((p) => p.stock <= p.minimum_stock && p.stock > 0);
  const outOfStockProducts = herbalProducts.filter((p) => p.stock === 0);
  const unpaidInvoices = invoices.filter((i) => i.payment_status === 'Belum Lunas' || i.payment_status === 'DP');

  // KPI Calculations
  const salesRevenue = sales.reduce((acc, s) => acc + (s.total || 0), 0);
  const additionalIncome = income.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalRevenue = salesRevenue + additionalIncome;
  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpense;

  // Actions
  const addPatient = (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Patient => {
    try {
      const newPat = db.savePatient(data);
      showToast('success', 'Pasien Berhasil Didaftarkan', `${newPat.full_name} (${newPat.patient_code})`);
      return newPat;
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Pasien', err.message);
      throw err;
    }
  };

  const updatePatient = (id: string, data: Partial<Patient>): Patient => {
    try {
      const updated = db.savePatient({ ...data, id } as any);
      showToast('success', 'Data Pasien Diperbarui', updated.full_name);
      return updated;
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Pasien', err.message);
      throw err;
    }
  };

  const deletePatient = (id: string) => {
    try {
      const pat = db.getPatientById(id);
      db.deletePatient(id);
      showToast('success', 'Pasien Berhasil Dihapus', pat?.full_name || id);
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Pasien', err.message);
    }
  };

  const deleteAllPatients = () => {
    try {
      db.deleteAllPatientData();
      showToast('warning', 'Semua Data Pasien Dihapus', 'Database pasien telah dikosongkan secara permanen.');
    } catch (err: any) {
      showToast('error', 'Gagal Mengosongkan Data', err.message);
    }
  };

  const addTherapySession = (data: Omit<TherapySession, 'id' | 'created_at' | 'updated_at'>): TherapySession => {
    try {
      const session = db.saveTherapySession(data);
      showToast('success', 'Sesi Terapi Dicatat', `Sesi ${session.session_number} berhasil disimpan.`);
      return session;
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Sesi Terapi', err.message);
      throw err;
    }
  };

  const updateTherapySession = (id: string, data: Partial<TherapySession>): TherapySession => {
    try {
      const session = db.saveTherapySession({ ...data, id } as any);
      showToast('success', 'Sesi Terapi Diperbarui');
      return session;
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Sesi', err.message);
      throw err;
    }
  };

  const deleteTherapySession = (id: string) => {
    try {
      db.deleteTherapySession(id);
      showToast('success', 'Sesi Terapi Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Sesi', err.message);
    }
  };

  const addService = (data: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service => {
    try {
      const srv = db.saveService(data);
      showToast('success', 'Layanan Ditambahkan', srv.name);
      return srv;
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Layanan', err.message);
      throw err;
    }
  };

  const updateService = (id: string, data: Partial<Service>): Service => {
    try {
      const srv = db.saveService({ ...data, id } as any);
      showToast('success', 'Layanan Diperbarui', srv.name);
      return srv;
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Layanan', err.message);
      throw err;
    }
  };

  const deleteService = (id: string) => {
    try {
      db.deleteService(id);
      showToast('success', 'Layanan Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Layanan', err.message);
    }
  };

  const saveServiceCategory = (name: string, id?: string) => {
    try {
      db.saveServiceCategory({ id, name, active: true });
      showToast('success', id ? 'Kategori Layanan Diperbarui' : 'Kategori Layanan Ditambahkan', name);
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Kategori', err.message);
    }
  };

  const deleteServiceCategory = (id: string) => {
    try {
      db.deleteServiceCategory(id);
      showToast('success', 'Kategori Layanan Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Kategori', err.message);
    }
  };

  const addHerbalProduct = (data: Omit<HerbalProduct, 'id' | 'created_at' | 'updated_at'>): HerbalProduct => {
    try {
      const prod = db.saveHerbalProduct(data);
      showToast('success', 'Produk Herbal Ditambahkan', prod.name);
      return prod;
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Produk', err.message);
      throw err;
    }
  };

  const updateHerbalProduct = (id: string, data: Partial<HerbalProduct>): HerbalProduct => {
    try {
      const prod = db.saveHerbalProduct({ ...data, id } as any);
      showToast('success', 'Produk Herbal Diperbarui', prod.name);
      return prod;
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Produk', err.message);
      throw err;
    }
  };

  const adjustProductStock = (id: string, qty: number, reason: StockAdjustmentReason = 'Koreksi stok', notes?: string) => {
    try {
      db.adjustStock(id, qty, reason, notes);
      showToast('success', 'Stok Disesuaikan');
    } catch (err: any) {
      showToast('error', 'Gagal Menyesuaikan Stok', err.message);
    }
  };

  const recordStockAdjustment = (data: {
    product_id: string;
    adjustment_type: 'IN' | 'OUT' | 'SET';
    quantity_change: number;
    reason: StockAdjustmentReason;
    notes?: string;
    adjusted_by?: string;
  }): StockAdjustment | null => {
    try {
      const res = db.recordStockAdjustment(data);
      if (res) {
        showToast('success', 'Penyesuaian Stok Tersimpan', `${res.product_name} (Stok: ${res.stock_after})`);
      }
      return res;
    } catch (err: any) {
      showToast('error', 'Gagal Menyesuaikan Stok', err.message);
      return null;
    }
  };

  const deleteHerbalProduct = (id: string) => {
    try {
      db.deleteHerbalProduct(id);
      showToast('success', 'Produk Herbal Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Produk', err.message);
    }
  };

  const saveProductCategory = (name: string, id?: string) => {
    try {
      db.saveProductCategory({ id, name, active: true });
      showToast('success', id ? 'Kategori Produk Diperbarui' : 'Kategori Produk Ditambahkan', name);
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Kategori', err.message);
    }
  };

  const deleteProductCategory = (id: string) => {
    try {
      db.deleteProductCategory(id);
      showToast('success', 'Kategori Produk Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Kategori', err.message);
    }
  };

  const createSale = (saleData: any, items: any) => {
    try {
      const res = db.createSaleWithItems(saleData, items);
      showToast('success', 'Transaksi Penjualan Berhasil', `Faktur ${res.invoice.invoice_number} telah diterbitkan.`);
      return res;
    } catch (err: any) {
      showToast('error', 'Gagal Membuat Penjualan', err.message);
      throw err;
    }
  };

  const recordPayment = (payment: Omit<Payment, 'id' | 'created_at'>): Payment => {
    try {
      const pay = db.recordPayment(payment);
      showToast('success', 'Pembayaran Dicatat', `Nominal ${pay.amount.toLocaleString('id-ID')}`);
      return pay;
    } catch (err: any) {
      showToast('error', 'Gagal Mencatat Pembayaran', err.message);
      throw err;
    }
  };

  const addExpense = (data: Omit<Expense, 'id' | 'created_at'>): Expense => {
    try {
      const exp = db.saveExpense(data);
      showToast('success', 'Pengeluaran Dicatat', exp.description);
      return exp;
    } catch (err: any) {
      showToast('error', 'Gagal Mencatat Pengeluaran', err.message);
      throw err;
    }
  };

  const deleteExpense = (id: string) => {
    try {
      db.deleteExpense(id);
      showToast('success', 'Pengeluaran Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Pengeluaran', err.message);
    }
  };

  const saveExpenseCategory = (name: string) => {
    try {
      db.saveExpenseCategory({ name, active: true });
      showToast('success', 'Kategori Pengeluaran Ditambahkan', name);
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Kategori', err.message);
    }
  };

  const deleteExpenseCategory = (id: string) => {
    try {
      db.deleteExpenseCategory(id);
      showToast('success', 'Kategori Pengeluaran Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Kategori', err.message);
    }
  };

  const addIncome = (data: Omit<Income, 'id' | 'created_at'>): Income => {
    try {
      const inc = db.saveIncome(data);
      showToast('success', 'Pemasukan Dicatat', inc.description);
      return inc;
    } catch (err: any) {
      showToast('error', 'Gagal Mencatat Pemasukan', err.message);
      throw err;
    }
  };

  const deleteIncome = (id: string) => {
    try {
      db.deleteIncome(id);
      showToast('success', 'Pemasukan Dihapus');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Pemasukan', err.message);
    }
  };

  const updateSettings = (data: Partial<ClinicSettings>) => {
    try {
      db.updateSettings(data);
      showToast('success', 'Pengaturan Klinik Disimpan');
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Pengaturan', err.message);
    }
  };

  const resetDemoData = () => {
    try {
      db.initDefaultsIfEmpty(true);
      showToast('info', 'Demo Data Direset', 'Database dikembalikan ke data awal klinik.');
    } catch (err: any) {
      showToast('error', 'Gagal Mereset Data', err.message);
    }
  };

  const exportDatabase = (): DatabaseBackupPayload => {
    return db.exportFullDatabase();
  };

  const importDatabase = (payload: DatabaseBackupPayload) => {
    try {
      db.importFullDatabase(payload);
      showToast('success', 'Restore Database Berhasil', `File backup tanggal ${payload.exported_at} sukses dimuat.`);
    } catch (err: any) {
      showToast('error', 'Gagal Restore Database', err.message);
    }
  };

  const updateInvoiceStatus = (id: string, status: PaymentStatus) => {
    try {
      db.updateInvoiceStatus(id, status);
      showToast('success', 'Status Faktur Diperbarui', `Status faktur diubah menjadi ${status}`);
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Status Faktur', err.message);
    }
  };

  return (
    <DbContext.Provider
      value={{
        settings,
        patients,
        therapySessions,
        services,
        serviceCategories,
        herbalProducts,
        productCategories,
        stockAdjustments,
        sales,
        invoices,
        payments,
        expenses,
        expenseCategories,
        income,
        toasts,
        showToast,
        removeToast,
        addPatient,
        updatePatient,
        deletePatient,
        deleteAllPatients,
        addTherapySession,
        updateTherapySession,
        deleteTherapySession,
        addService,
        updateService,
        deleteService,
        saveServiceCategory,
        deleteServiceCategory,
        addHerbalProduct,
        updateHerbalProduct,
        adjustProductStock,
        recordStockAdjustment,
        restockProduct: adjustProductStock,
        deleteHerbalProduct,
        saveProductCategory,
        deleteProductCategory,
        createSale,
        createCompleteSaleTransaction: createSale,
        recordPayment,
        addPayment: recordPayment,
        updateInvoiceStatus,
        addExpense,
        deleteExpense,
        saveExpenseCategory,
        deleteExpenseCategory,
        addIncome,
        deleteIncome,
        updateSettings,
        resetDemoData,
        resetToDemoData: resetDemoData,
        clearAllData: deleteAllPatients,
        exportDatabase,
        exportFullDatabaseJSON: exportDatabase,
        validateBackupFile: (payload: any) => db.validateBackupPayload(payload),
        importDatabase,
        importDatabaseJSON: importDatabase,
        lowStockProducts,
        outOfStockProducts,
        unpaidInvoices,
        totalRevenue,
        totalExpense,
        netIncome
      }}
    >
      {children}
    </DbContext.Provider>
  );
};

export const useClinic = (): DbContextType => {
  const context = useContext(DbContext);
  if (!context) {
    throw new Error('useClinic must be used within a DbProvider');
  }
  return context;
};
