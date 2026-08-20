import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('acucare_supabase_url') || '';
  const localKey = localStorage.getItem('acucare_supabase_anon_key') || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey
  };
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('acucare_supabase_url', url);
  localStorage.setItem('acucare_supabase_anon_key', key);
  supabaseClient = null; // reset client
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      supabaseClient = createClient(url, key);
      return supabaseClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export const SUPABASE_SQL_SCHEMA = `-- ==================================================================
-- ACUCARE CLINIC MANAGEMENT — COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Klinik Akupunktur Ahli Saraf Kejepit & Stroke (Yogi Pangestu)
-- ==================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nik TEXT,
  birth_date DATE,
  gender TEXT NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  address TEXT,
  occupation TEXT,
  emergency_contact TEXT,
  main_complaint TEXT NOT NULL,
  additional_complaint TEXT,
  medical_history TEXT,
  allergy_notes TEXT,
  important_notes TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Selesai', 'Menunggu', 'Nonaktif')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON patients (patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (full_name);

-- 3. THERAPY SESSIONS
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_number INT NOT NULL DEFAULT 1,
  therapy_date DATE NOT NULL DEFAULT CURRENT_DATE,
  complaint TEXT NOT NULL,
  condition_before TEXT,
  therapy_type TEXT NOT NULL,
  treatment_area TEXT,
  practitioner_notes TEXT,
  condition_after TEXT,
  patient_response TEXT,
  next_plan TEXT,
  cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'DP', 'Belum Lunas', 'Refund')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON therapy_sessions (patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON therapy_sessions (therapy_date);

-- 4. SERVICE CATEGORIES & SERVICES
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration INT NOT NULL DEFAULT 60, -- minutes
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCT CATEGORIES & HERBAL PRODUCTS
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS herbal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'Botol',
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  minimum_stock INT NOT NULL DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_herbal_sku ON herbal_products (sku);

-- 6. SALES & SALE ITEMS
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Lunas' CHECK (payment_status IN ('Lunas', 'DP', 'Belum Lunas', 'Refund')),
  payment_method TEXT NOT NULL DEFAULT 'Transfer' CHECK (payment_method IN ('Cash', 'Transfer', 'QRIS', 'Debit', 'Other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'product')),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES herbal_products(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);

-- 7. INVOICES & PAYMENTS
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Lunas',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Transfer',
  status TEXT NOT NULL DEFAULT 'Lunas',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EXPENSES & EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'Transfer',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ADDITIONAL INCOME
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CLINIC SETTINGS
CREATE TABLE IF NOT EXISTS clinic_settings (
  id INT PRIMARY KEY DEFAULT 1,
  clinic_name TEXT NOT NULL,
  clinic_tagline TEXT,
  address TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_account_no TEXT NOT NULL,
  bank_account_holder TEXT NOT NULL,
  invoice_footer TEXT,
  last_backup_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) ENABLEMENT
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE herbal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- POLICIES: Allow authenticated clinic staff full access
CREATE POLICY "Clinic Staff Access users" ON users FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access patients" ON patients FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access therapy_sessions" ON therapy_sessions FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access services" ON services FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access herbal_products" ON herbal_products FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access sales" ON sales FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access sale_items" ON sale_items FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access payments" ON payments FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access expenses" ON expenses FOR ALL USING (true);
CREATE POLICY "Clinic Staff Access income" ON income FOR ALL USING (true);
`;
