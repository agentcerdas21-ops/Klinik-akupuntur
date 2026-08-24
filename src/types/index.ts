export type UserRole = 'OWNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type PatientStatus = 'Aktif' | 'Selesai' | 'Menunggu' | 'Nonaktif';
export type Gender = 'Laki-laki' | 'Perempuan';

export interface Patient {
  id: string;
  patient_code: string; // e.g. ACU-000001
  full_name: string;
  nik?: string;
  birth_date?: string;
  gender: Gender;
  phone: string;
  whatsapp: string;
  email?: string;
  address?: string;
  occupation?: string;
  emergency_contact?: string;
  main_complaint: string;
  additional_complaint?: string;
  medical_history?: string;
  allergy_notes?: string;
  important_notes?: string;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'Lunas' | 'DP' | 'Belum Lunas' | 'Refund';
export type PaymentMethod = 'Cash' | 'Transfer' | 'QRIS' | 'Debit' | 'Other';

export interface TherapySession {
  id: string;
  patient_id: string;
  session_number: number;
  therapy_date: string;
  complaint: string;
  condition_before: string;
  therapy_type: string;
  treatment_area: string;
  practitioner_notes: string;
  condition_after: string;
  patient_response: string;
  next_plan: string;
  cost: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  sale_id?: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number; // in minutes
  price: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface HerbalProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  unit: string; // Botol, Box, Strip, Pcs, Bungkus, Kapsul, Sachet
  purchase_price: number;
  selling_price: number;
  stock: number;
  minimum_stock: number;
  active: boolean;
  image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type StockAdjustmentReason =
  | 'Barang masuk'
  | 'Barang Masuk / Pembelian'
  | 'Barang rusak'
  | 'Koreksi stok'
  | 'Stock opname'
  | 'Penjualan Kasir'
  | 'Lainnya'
  | string;

export interface StockAdjustment {
  id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  adjustment_type: 'IN' | 'OUT' | 'SET';
  type?: 'IN' | 'OUT' | 'SET';
  quantity_change: number;
  delta_quantity?: number;
  stock_before: number;
  stock_after: number;
  reason: StockAdjustmentReason;
  notes?: string;
  reference_id?: string;
  adjusted_by?: string;
  created_by?: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  item_type: 'service' | 'product';
  service_id?: string;
  product_id?: string;
  item_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoice_id?: string;
  patient_id?: string; // can be empty for guest/walk-in product purchase
  patient_name?: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string;
  items?: SaleItem[];
  created_at: string;
}

export interface Payment {
  id: string;
  patient_id?: string;
  sale_id?: string;
  invoice_id?: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. INV-202608-0001
  patient_id?: string;
  patient_name?: string;
  sale_id: string;
  invoice_date: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  items?: Array<SaleItem & { unit_price?: number }>;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Income {
  id: string;
  income_date: string;
  category: string;
  description: string;
  amount: number;
  source: string;
  notes?: string;
  created_at: string;
}

export interface ClinicSettings {
  id?: string;
  clinic_name: string;
  clinic_tagline: string;
  address: string;
  owner_name: string;
  phone: string;
  whatsapp: string;
  bank_name: string;
  bank_account_no: string;
  bank_account_holder: string;
  invoice_footer: string;
  last_backup_at?: string;
}

export interface DatabaseBackupPayload {
  app_name?: string;
  backup_version?: string;
  app_version?: string;
  version?: string;
  created_at?: string;
  exported_at: string;
  exported_by: string;
  total_records?: {
    patients: number;
    therapy_sessions: number;
    services: number;
    herbal_products: number;
    sales: number;
    sale_items: number;
    payments: number;
    invoices: number;
    expenses: number;
    income: number;
    stock_adjustments?: number;
  };
  settings: ClinicSettings;
  users: User[];
  patients: Patient[];
  therapy_sessions: TherapySession[];
  services: Service[];
  service_categories: ServiceCategory[];
  herbal_products: HerbalProduct[];
  product_categories: ProductCategory[];
  sales: Sale[];
  sale_items: SaleItem[];
  payments: Payment[];
  invoices: Invoice[];
  expenses: Expense[];
  expense_categories: ExpenseCategory[];
  income: Income[];
  stock_adjustments?: StockAdjustment[];
}

export interface BackupValidationResult {
  valid: boolean;
  message?: string;
  details?: {
    app_name: string;
    backup_version: string;
    app_version: string;
    created_at: string;
    exported_by: string;
    stats: {
      patients: number;
      therapy_sessions: number;
      services: number;
      herbal_products: number;
      sales: number;
      sale_items: number;
      payments: number;
      invoices: number;
      expenses: number;
      income: number;
      stock_adjustments: number;
    };
  };
  payload?: DatabaseBackupPayload;
}
