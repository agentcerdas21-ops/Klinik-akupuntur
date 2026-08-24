import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ClinicSettings, DatabaseBackupPayload, Invoice, Patient, Sale, TherapySession } from '../types';

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

// ==========================================
// EXCEL & CSV EXPORT / IMPORT
// ==========================================

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Data') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportToCSV(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// EXCEL DATABASE BACKUP EXPORT (11 SHEETS)
// ==========================================

export function exportDatabaseToExcel(payload: DatabaseBackupPayload, customFileName?: string) {
  const wb = XLSX.utils.book_new();
  const dateStr = (payload.created_at || payload.exported_at || new Date().toISOString()).split('T')[0];

  // Helper map for fast patient lookup
  const patientMap = new Map<string, string>();
  (payload.patients || []).forEach((p) => {
    patientMap.set(p.id, p.full_name);
  });

  // 1. Sheet: Pasien
  const patientsData = (payload.patients || []).map((p, idx) => ({
    'No': idx + 1,
    'Kode Pasien': p.patient_code || '-',
    'Nama Lengkap': p.full_name || '-',
    'NIK': p.nik || '-',
    'Tanggal Lahir': p.birth_date || '-',
    'Jenis Kelamin': p.gender || '-',
    'No. WhatsApp': p.whatsapp || '-',
    'No. Telepon / HP': p.phone || '-',
    'Email': p.email || '-',
    'Alamat': p.address || '-',
    'Pekerjaan': p.occupation || '-',
    'Kontak Darurat': p.emergency_contact || '-',
    'Keluhan Utama': p.main_complaint || '-',
    'Keluhan Tambahan': p.additional_complaint || '-',
    'Riwayat Penyakit': p.medical_history || '-',
    'Catatan Alergi': p.allergy_notes || '-',
    'Catatan Penting': p.important_notes || '-',
    'Status': p.status || 'Aktif',
    'Terdaftar Sejak': p.created_at ? formatDateIndo(p.created_at) : '-'
  }));
  const wsPatients = XLSX.utils.json_to_sheet(patientsData.length > 0 ? patientsData : [{ 'Info': 'Tidak ada data pasien' }]);
  XLSX.utils.book_append_sheet(wb, wsPatients, 'Pasien');

  // 2. Sheet: Terapi
  const therapyData = (payload.therapy_sessions || []).map((s, idx) => ({
    'No': idx + 1,
    'Tanggal Terapi': s.therapy_date ? formatDateIndo(s.therapy_date) : '-',
    'Sesi Ke': s.session_number || 1,
    'ID Pasien': s.patient_id,
    'Nama Pasien': patientMap.get(s.patient_id) || 'Pasien',
    'Jenis Terapi': s.therapy_type || 'Akupunktur',
    'Area / Titik Meridian': s.treatment_area || '-',
    'Keluhan Sesi Ini': s.complaint || '-',
    'Kondisi Sebelum': s.condition_before || '-',
    'Kondisi Sesudah': s.condition_after || '-',
    'Catatan Praktisi': s.practitioner_notes || '-',
    'Respons & Rencana Lanjut': s.patient_response || s.next_plan || '-',
    'Biaya Terapi (Rp)': s.cost || 0,
    'Status Pembayaran': s.payment_status || 'Lunas',
    'Metode Pembayaran': s.payment_method || '-'
  }));
  const wsTherapy = XLSX.utils.json_to_sheet(therapyData.length > 0 ? therapyData : [{ 'Info': 'Tidak ada riwayat sesi terapi' }]);
  XLSX.utils.book_append_sheet(wb, wsTherapy, 'Terapi');

  // 3. Sheet: Layanan
  const servicesData = (payload.services || []).map((sv, idx) => ({
    'No': idx + 1,
    'Nama Layanan': sv.name || '-',
    'Kategori': sv.category || '-',
    'Durasi (Menit)': sv.duration || 60,
    'Tarif Layanan (Rp)': sv.price || 0,
    'Status Aktif': sv.active ? 'Aktif' : 'Nonaktif',
    'Deskripsi': sv.description || '-'
  }));
  const wsServices = XLSX.utils.json_to_sheet(servicesData.length > 0 ? servicesData : [{ 'Info': 'Tidak ada data layanan' }]);
  XLSX.utils.book_append_sheet(wb, wsServices, 'Layanan');

  // 4. Sheet: Produk Herbal
  const herbalData = (payload.herbal_products || []).map((h, idx) => ({
    'No': idx + 1,
    'Kode SKU': h.sku || '-',
    'Nama Produk Herbal': h.name || '-',
    'Kategori': h.category || '-',
    'Satuan': h.unit || 'Botol',
    'Harga Modal / Beli (Rp)': h.purchase_price || 0,
    'Harga Jual (Rp)': h.selling_price || 0,
    'Stok Saat Ini': h.stock || 0,
    'Stok Minimum': h.minimum_stock || 5,
    'Status Aktif': h.active ? 'Aktif' : 'Nonaktif',
    'Keterangan': h.description || h.notes || '-'
  }));
  const wsHerbal = XLSX.utils.json_to_sheet(herbalData.length > 0 ? herbalData : [{ 'Info': 'Tidak ada data produk herbal' }]);
  XLSX.utils.book_append_sheet(wb, wsHerbal, 'Produk Herbal');

  // 5. Sheet: Stok
  const stockData = (payload.stock_adjustments || []).map((st, idx) => ({
    'No': idx + 1,
    'Tanggal & Waktu': st.created_at ? formatDateIndo(st.created_at) : '-',
    'Nama Produk': st.product_name || '-',
    'Tipe Perubahan': st.adjustment_type || 'OUT',
    'Jumlah Perubahan': st.quantity_change || 0,
    'Stok Sebelum': st.stock_before ?? '-',
    'Stok Sesudah': st.stock_after ?? '-',
    'Alasan Penyesuaian': st.reason || '-',
    'Catatan': st.notes || '-',
    'Dicatat Oleh': st.adjusted_by || 'Yogi Pangestu'
  }));
  const wsStock = XLSX.utils.json_to_sheet(stockData.length > 0 ? stockData : [{ 'Info': 'Tidak ada riwayat penyesuaian stok' }]);
  XLSX.utils.book_append_sheet(wb, wsStock, 'Stok');

  // 6. Sheet: Penjualan
  const salesData = (payload.sales || []).map((sl, idx) => ({
    'No': idx + 1,
    'Tanggal Penjualan': sl.sale_date ? formatDateIndo(sl.sale_date) : '-',
    'No. Faktur / Invoice': sl.invoice_id || `INV-${sl.id.slice(-6).toUpperCase()}`,
    'ID Pasien': sl.patient_id || '-',
    'Nama Pasien / Pembeli': sl.patient_name || (sl.patient_id ? patientMap.get(sl.patient_id) : 'Pasien Umum'),
    'Subtotal (Rp)': sl.subtotal || sl.total || 0,
    'Diskon (Rp)': sl.discount || 0,
    'Total Akhir (Rp)': sl.total || 0,
    'Status Pembayaran': sl.payment_status || 'Lunas',
    'Metode Pembayaran': sl.payment_method || 'Transfer',
    'Catatan': sl.notes || '-'
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesData.length > 0 ? salesData : [{ 'Info': 'Tidak ada transaksi penjualan' }]);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Penjualan');

  // 7. Sheet: Detail Penjualan
  const saleItemsData = (payload.sale_items || []).map((it, idx) => ({
    'No': idx + 1,
    'ID Penjualan': it.sale_id,
    'Tipe Item': it.item_type === 'service' ? 'Layanan Terapi' : 'Produk Herbal',
    'Nama Layanan / Produk': it.item_name || '-',
    'Kuantitas (Qty)': it.quantity || 1,
    'Harga Satuan (Rp)': it.price || 0,
    'Subtotal (Rp)': it.subtotal || ((it.quantity || 1) * (it.price || 0))
  }));
  const wsSaleItems = XLSX.utils.json_to_sheet(saleItemsData.length > 0 ? saleItemsData : [{ 'Info': 'Tidak ada rincian item penjualan' }]);
  XLSX.utils.book_append_sheet(wb, wsSaleItems, 'Detail Penjualan');

  // 8. Sheet: Pembayaran
  const paymentsData = (payload.payments || []).map((pm, idx) => ({
    'No': idx + 1,
    'Tanggal Bayar': pm.payment_date ? formatDateIndo(pm.payment_date) : '-',
    'ID Transaksi': pm.id,
    'ID Pasien': pm.patient_id || '-',
    'ID Penjualan': pm.sale_id || '-',
    'Nominal Bayar (Rp)': pm.amount || 0,
    'Metode Pembayaran': pm.payment_method || 'Transfer',
    'Status': pm.status || 'Lunas',
    'Keterangan / Referensi': pm.notes || '-'
  }));
  const wsPayments = XLSX.utils.json_to_sheet(paymentsData.length > 0 ? paymentsData : [{ 'Info': 'Tidak ada riwayat pembayaran' }]);
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Pembayaran');

  // 9. Sheet: Invoice
  const invoicesData = (payload.invoices || []).map((inv, idx) => ({
    'No': idx + 1,
    'Nomor Faktur (Invoice)': inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`,
    'Tanggal Terbit': inv.invoice_date ? formatDateIndo(inv.invoice_date) : '-',
    'ID Pasien': inv.patient_id || '-',
    'Nama Pasien': inv.patient_name || (inv.patient_id ? patientMap.get(inv.patient_id) : 'Pasien Umum'),
    'Subtotal (Rp)': inv.subtotal || inv.total || 0,
    'Diskon (Rp)': inv.discount || 0,
    'Total Tagihan (Rp)': inv.total || 0,
    'Status Pembayaran': inv.payment_status || 'Lunas',
    'Metode Pembayaran': inv.payment_method || '-',
    'Catatan Faktur': inv.notes || '-'
  }));
  const wsInvoices = XLSX.utils.json_to_sheet(invoicesData.length > 0 ? invoicesData : [{ 'Info': 'Tidak ada data faktur/invoice' }]);
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoice');

  // 10. Sheet: Pemasukan
  const incomeData = (payload.income || []).map((inc, idx) => ({
    'No': idx + 1,
    'Tanggal Pemasukan': inc.income_date ? formatDateIndo(inc.income_date) : '-',
    'Kategori': inc.category || '-',
    'Deskripsi / Uraian': inc.description || '-',
    'Sumber Dana': inc.source || '-',
    'Nominal (Rp)': inc.amount || 0,
    'Catatan': inc.notes || '-'
  }));
  const wsIncome = XLSX.utils.json_to_sheet(incomeData.length > 0 ? incomeData : [{ 'Info': 'Tidak ada catatan pemasukan tambahan' }]);
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Pemasukan');

  // 11. Sheet: Pengeluaran
  const expensesData = (payload.expenses || []).map((exp, idx) => ({
    'No': idx + 1,
    'Tanggal Pengeluaran': exp.expense_date ? formatDateIndo(exp.expense_date) : '-',
    'Kategori Pengeluaran': exp.category || '-',
    'Deskripsi / Keperluan': exp.description || '-',
    'Metode Pembayaran': exp.payment_method || 'Transfer',
    'Nominal Beban (Rp)': exp.amount || 0,
    'Catatan': exp.notes || '-'
  }));
  const wsExpenses = XLSX.utils.json_to_sheet(expensesData.length > 0 ? expensesData : [{ 'Info': 'Tidak ada data pengeluaran' }]);
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran');

  const fileName = customFileName || `ACUCARE_Backup_Data_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ==========================================
// PDF BACKUP & CLINICAL REPORT (PRINT-READY)
// ==========================================

export function generateBackupReportPDF(payload: DatabaseBackupPayload) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const settings = payload.settings || {
    clinic_name: 'ACUCARE',
    clinic_tagline: 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke',
    address: 'Ruko Arcadia Residence A-16, Desa Karangsatria, Kecamatan Tambun Utara, Kabupaten Bekasi',
    owner_name: 'Yogi Pangestu',
    whatsapp: '081399670676'
  };

  const primaryNavy = [15, 38, 52];
  const accentEmerald = [16, 185, 129];
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  const backupDate = payload.created_at || payload.exported_at || new Date().toISOString();

  // 1. Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.clinic_name || 'ACUCARE', 16, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 230);
  doc.text(settings.clinic_tagline || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke', 16, 20);
  doc.text(`Praktisi: ${settings.owner_name} | WA: ${settings.whatsapp}`, 16, 26);

  // Title Right
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.text('LAPORAN DOKUMENTASI CADANGAN', 194, 16, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Backup: ${formatDateIndo(backupDate)}`, 194, 23, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Versi: ${payload.backup_version || '1.0'} (${payload.app_name || 'ACUCARE'})`, 194, 29, { align: 'right' });

  // 2. Financial & Clinic Metric Calculations
  const patientsCount = (payload.patients || []).length;
  const therapyCount = (payload.therapy_sessions || []).length;
  const salesCount = (payload.sales || []).length;
  const herbalCount = (payload.herbal_products || []).length;
  const invoicesCount = (payload.invoices || []).length;

  const totalSalesRevenue = (payload.sales || []).reduce((acc, s) => acc + (s.total || 0), 0);
  const totalIncome = (payload.income || []).reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalExpense = (payload.expenses || []).reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalRevenue = totalSalesRevenue + totalIncome;
  const netIncome = totalRevenue - totalExpense;
  const totalStockQty = (payload.herbal_products || []).reduce((acc, h) => acc + (h.stock || 0), 0);

  // Summary Metrics Table
  const summaryTableRows = [
    ['Total Pasien Terdaftar', `${patientsCount} Pasien`, 'Total Pemasukan & Penjualan', formatIDR(totalRevenue)],
    ['Total Sesi Terapi Akupunktur', `${therapyCount} Sesi`, 'Total Beban & Pengeluaran', formatIDR(totalExpense)],
    ['Total Transaksi Penjualan', `${salesCount} Transaksi`, 'Laba Bersih (Net Income)', formatIDR(netIncome)],
    ['Varian Produk Herbal', `${herbalCount} Produk (${totalStockQty} Unit Stok)`, 'Faktur / Kwitansi Terbit', `${invoicesCount} Faktur`]
  ];

  autoTable(doc, {
    startY: 42,
    head: [['Metrik Klinis & Inventori', 'Jumlah / Status', 'Metrik Finansial & Kasir', 'Nominal']],
    body: summaryTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 38, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 45, fontStyle: 'bold' },
      2: { fontStyle: 'bold', cellWidth: 50 },
      3: { cellWidth: 45, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // 3. Rekapitulasi Data Collections Table
  const collectionsRows = [
    ['1', 'Master Pasien & Rekam Medis', `${patientsCount} Data`, 'Valid & Terhubung'],
    ['2', 'Riwayat Sesi Terapi Akupunktur', `${therapyCount} Sesi`, 'Valid & Terhubung'],
    ['3', 'Master Layanan & Tarif Tindakan', `${(payload.services || []).length} Layanan`, 'Valid'],
    ['4', 'Master Produk Herbal & Stok', `${herbalCount} Produk (${totalStockQty} unit)`, 'Valid'],
    ['5', 'Transaksi Kasir Penjualan (POS)', `${salesCount} Transaksi`, 'Valid'],
    ['6', 'Rincian Item Penjualan (Sale Items)', `${(payload.sale_items || []).length} Item`, 'Valid'],
    ['7', 'Faktur / Kwitansi Tagihan (Invoices)', `${invoicesCount} Faktur`, 'Valid'],
    ['8', 'Pencatatan Pembayaran (Payments)', `${(payload.payments || []).length} Rekam`, 'Valid'],
    ['9', 'Pencatatan Pemasukan Kas', `${(payload.income || []).length} Rekam`, 'Valid'],
    ['10', 'Pencatatan Pengeluaran & Beban', `${(payload.expenses || []).length} Rekam`, 'Valid'],
    ['11', 'Riwayat Log Penyesuaian Stok', `${(payload.stock_adjustments || []).length} Log`, 'Valid']
  ];

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Rekapitulasi Struktur Koleksi Database:', 16, currentY);

  autoTable(doc, {
    startY: currentY + 2,
    head: [['No', 'Nama Koleksi Database', 'Jumlah Record Data', 'Status Integritas']],
    body: collectionsRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 90, fontStyle: 'bold' },
      2: { cellWidth: 50, halign: 'center' },
      3: { cellWidth: 40, halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 4. Sample Recent Patients Table
  if (currentY < 230 && (payload.patients || []).length > 0) {
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Daftar Pasien Terdaftar (Sampel Ringkas):', 16, currentY);

    const patientRows = (payload.patients || []).slice(0, 8).map((p, idx) => [
      idx + 1,
      p.patient_code || '-',
      p.full_name || '-',
      p.gender || '-',
      p.whatsapp || p.phone || '-',
      p.main_complaint ? (p.main_complaint.length > 35 ? p.main_complaint.substring(0, 35) + '...' : p.main_complaint) : '-',
      p.status || 'Aktif'
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      head: [['No', 'Kode', 'Nama Pasien', 'L/P', 'Kontak WA', 'Keluhan Utama', 'Status']],
      body: patientRows,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 7.5
      },
      styles: {
        fontSize: 7,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22, fontStyle: 'bold' },
        2: { cellWidth: 38 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 28 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 16, halign: 'center' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Signature section
  if (currentY < 255) {
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(8);
    doc.text(`Bekasi, ${formatDateIndo(backupDate)}`, 145, currentY + 4);
    doc.text('Penanggung Jawab Database & Praktisi,', 145, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.owner_name, 145, currentY + 22);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Klinik ACUCARE', 145, currentY + 26);
  }

  const cleanDate = backupDate.split('T')[0];
  doc.save(`ACUCARE_Laporan_Backup_${cleanDate}.pdf`);
}


export async function parseImportFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// PDF GENERATION (INVOICE, RECEIPT, THERAPY, FINANCE)
// ==========================================

export function generateInvoicePDF(
  invoice: Invoice & { items?: any[] },
  patient: Patient | undefined,
  settings: ClinicSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryNavy = [15, 38, 52]; // #0f2634
  const accentEmerald = [16, 185, 129]; // #10b981
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // Clinic Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.clinic_name || 'ACUCARE', 16, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 230);
  doc.text(settings.clinic_tagline || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke', 16, 23);
  doc.text(`Praktisi: ${settings.owner_name} | WA: ${settings.whatsapp}`, 16, 29);

  // Invoice Title badge right-aligned
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('FAKTUR / INVOICE', 194, 18, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(invoice.invoice_number, 194, 26, { align: 'right' });

  // Clinic Address & Patient Details Block
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(9);

  // Left side: Clinic Address
  doc.setFont('helvetica', 'bold');
  doc.text('DITERBITKAN OLEH:', 16, 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const splitAddress = doc.splitTextToSize(settings.address, 75);
  doc.text(splitAddress, 16, 54);

  // Right side: Billed To
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('TAGIHAN KEPADA PASIEN:', 115, 48);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Nama: ${patient?.full_name || invoice.patient_name || 'Pasien Umum'}`, 115, 54);
  doc.text(`Kode Pasien: ${patient?.patient_code || '-'}`, 115, 59);
  doc.text(`WhatsApp/HP: ${patient?.whatsapp || patient?.phone || '-'}`, 115, 64);
  doc.text(`Tanggal: ${formatDateIndo(invoice.invoice_date)}`, 115, 69);
  doc.text(`Status Pembayaran: ${invoice.payment_status.toUpperCase()}`, 115, 74);

  // Table items
  const tableRows: any[] = [];
  const invItems = invoice.items || [];
  if (invItems.length > 0) {
    invItems.forEach((item, index) => {
      tableRows.push([
        index + 1,
        (item.item_name || 'Item') + (item.item_type === 'service' ? ' (Layanan)' : ' (Herbal)'),
        item.quantity || 1,
        formatIDR(item.unit_price || item.price || 0),
        formatIDR(item.subtotal || ((item.quantity || 1) * (item.unit_price || item.price || 0)))
      ]);
    });
  } else {
    tableRows.push([1, 'Layanan Terapi Akupunktur', 1, formatIDR(invoice.subtotal || invoice.total), formatIDR(invoice.subtotal || invoice.total)]);
  }

  autoTable(doc, {
    startY: 82,
    head: [['No', 'Deskripsi Layanan / Produk', 'Qty', 'Harga Satuan', 'Subtotal']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 38, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: 3.5
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 38, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary box
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Payment Instruction Box on Left
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, finalY, 105, 36, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Informasi Pembayaran / Transfer:', 20, finalY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Bank: ${settings.bank_name}`, 20, finalY + 14);
  doc.text(`No. Rekening: ${settings.bank_account_no}`, 20, finalY + 20);
  doc.text(`Atas Nama: ${settings.bank_account_holder}`, 20, finalY + 26);
  doc.text(`Konfirmasi WA: ${settings.whatsapp}`, 20, finalY + 32);

  // Totals on Right
  const totalsX = 120;
  const valuesX = 194;

  const totalPaid = invoice.total_paid || 0;
  const outstanding = invoice.outstanding !== undefined ? invoice.outstanding : Math.max(0, invoice.total - totalPaid);

  let currentTotalsY = finalY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Subtotal:', totalsX, currentTotalsY);
  doc.text(formatIDR(invoice.subtotal || invoice.total), valuesX, currentTotalsY, { align: 'right' });

  if (invoice.discount > 0) {
    currentTotalsY += 5.5;
    doc.text('Diskon:', totalsX, currentTotalsY);
    doc.text(`- ${formatIDR(invoice.discount)}`, valuesX, currentTotalsY, { align: 'right' });
  }

  // Total Tagihan Line
  currentTotalsY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('TOTAL TAGIHAN:', totalsX, currentTotalsY);
  doc.text(formatIDR(invoice.total), valuesX, currentTotalsY, { align: 'right' });

  if (totalPaid > 0) {
    currentTotalsY += 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(5, 150, 105);
    doc.text('Total Dibayar (DP/Cicilan):', totalsX, currentTotalsY);
    doc.text(formatIDR(totalPaid), valuesX, currentTotalsY, { align: 'right' });
  }

  if (outstanding > 0) {
    currentTotalsY += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text('Sisa Tagihan:', totalsX, currentTotalsY);
    doc.text(formatIDR(outstanding), valuesX, currentTotalsY, { align: 'right' });
  }

  currentTotalsY += 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  const isLunas = invoice.payment_status === 'Lunas';
  const isDP = invoice.payment_status === 'DP';
  doc.setTextColor(isLunas ? 16 : isDP ? 217 : 220, isLunas ? 185 : isDP ? 119 : 38, isLunas ? 129 : 6);
  doc.text(`[ STATUS: ${invoice.payment_status.toUpperCase()} ]`, valuesX, currentTotalsY, { align: 'right' });

  // Signature and Footer
  const signY = finalY + 46;
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(9);
  doc.text('Bekasi, ' + formatDateIndo(invoice.invoice_date), 150, signY);
  doc.text('Praktisi Akupunktur,', 150, signY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(settings.owner_name, 150, signY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Klinik ACUCARE', 150, signY + 29);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Terima kasih atas kunjungan dan kepercayaan Anda di ACUCARE.', 105, 285, { align: 'center' });

  // Save/Download
  doc.save(`${invoice.invoice_number}_${(patient?.full_name || 'Pasien').replace(/\s+/g, '_')}.pdf`);
}

export function generateReceiptPDF(
  payment: any,
  invoice: Invoice | undefined,
  patient: Patient | undefined,
  settings: ClinicSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 landscape / portrait for compact receipt
  });

  const primaryNavy = [15, 38, 52];

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 148, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.clinic_name || 'ACUCARE', 12, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(settings.clinic_tagline || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke', 12, 17);
  doc.text(`Alamat: Ruko Arcadia Residence A-16, Bekasi | WA: ${settings.whatsapp}`, 12, 22);

  // Kwitansi Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('KWITANSI PEMBAYARAN SAH', 74, 38, { align: 'center' });

  // Receipt Content Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(12, 44, 124, 75, 2, 2, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. Kwitansi: REC-${payment.id.slice(-6).toUpperCase()}`, 16, 52);
  doc.text(`Tanggal Bayar: ${formatDateIndo(payment.payment_date)}`, 16, 58);
  doc.text(`Telah Terima Dari: ${patient?.full_name || invoice?.patient_name || 'Pasien Umum'}`, 16, 64);
  doc.text(`Untuk Pembayaran: ${payment.notes || `Faktur ${invoice?.invoice_number || '-'}`}`, 16, 70);
  doc.text(`Metode: ${payment.payment_method}`, 16, 76);

  // Amount Box
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(16, 82, 116, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105);
  doc.text(`Jumlah: ${formatIDR(payment.amount)} (LUNAS)`, 74, 91, { align: 'center' });

  // Footer signature
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Bekasi, ' + formatDateIndo(payment.payment_date), 95, 104);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.owner_name, 95, 115);

  doc.save(`Kwitansi_${payment.id.slice(-6)}.pdf`);
}


export function generateTherapyResumePDF(
  patient: Patient,
  sessions: TherapySession[],
  settings: ClinicSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(15, 38, 52);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.clinic_name || 'ACUCARE', 16, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 230);
  doc.text('RIWAYAT DAN EVALUASI TERAPI AKUPUNKTUR', 16, 22);
  doc.text(`Praktisi: ${settings.owner_name} | Telp: ${settings.whatsapp}`, 16, 28);

  // Patient Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, 40, 178, 28, 2, 2, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nama Pasien: ${patient.full_name}`, 20, 47);
  doc.setFont('helvetica', 'normal');
  doc.text(`Kode: ${patient.patient_code}  |  Gender: ${patient.gender}  |  Usia/Tgl Lahir: ${patient.birth_date || '-'}`, 20, 53);
  doc.text(`Keluhan Utama: ${patient.main_complaint}`, 20, 59);
  doc.text(`Catatan Alergi: ${patient.allergy_notes || 'Tidak ada riwayat alergi'}`, 20, 65);

  // Session table
  const rows = sessions.map((s) => [
    `Sesi ${s.session_number}\n${formatDateIndo(s.therapy_date)}`,
    s.therapy_type,
    s.treatment_area || '-',
    `Sebelum: ${s.condition_before || '-'}\nSesudah: ${s.condition_after || '-'}`,
    s.patient_response || s.next_plan || '-'
  ]);

  autoTable(doc, {
    startY: 73,
    head: [['Sesi & Tgl', 'Jenis Terapi', 'Area Titik Meridian', 'Kondisi Sebelum & Sesudah', 'Respons & Rencana']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 38, 52],
      textColor: [255, 255, 255],
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { cellWidth: 38 },
      3: { cellWidth: 42 },
      4: { cellWidth: 'auto' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const disclaimer = 'Disclaimer: Catatan terapi digunakan sebagai dokumentasi layanan internal dan bukan pengganti diagnosis medis oleh tenaga kesehatan yang berwenang.';
  doc.text(doc.splitTextToSize(disclaimer, 178), 16, finalY);

  doc.save(`Riwayat_Terapi_${patient.patient_code}_${patient.full_name.replace(/\s+/g, '_')}.pdf`);
}

export function generateFinancialReportPDF(
  periodTitle: string,
  summary: {
    totalRevenue: number;
    totalSales: number;
    totalExpense: number;
    netIncome: number;
    totalTransactions: number;
    totalPatients: number;
    totalPayments: number;
  },
  revenueSources: Array<{ name: string; value: number }>,
  expenseCategories: Array<{ category: string; amount: number; count: number }>,
  transactions: Array<{
    date: string;
    type: string;
    category: string;
    description: string;
    reference: string;
    amount: number;
    status: string;
  }>,
  settings: ClinicSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryNavy = [15, 38, 52];
  const accentEmerald = [16, 185, 129];
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Clinic Brand
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.clinic_name || 'ACUCARE', 16, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 230);
  doc.text(settings.clinic_tagline || 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke', 16, 20);
  doc.text(`Praktisi: ${settings.owner_name} | Telp/WA: ${settings.whatsapp}`, 16, 26);

  // Title Right
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('LAPORAN KEUANGAN', 194, 16, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Periode: ${periodTitle}`, 194, 23, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Dicetak: ${formatDateIndo(new Date().toISOString())}`, 194, 29, { align: 'right' });

  // Summary Metrics Table
  const summaryRows = [
    ['Total Pemasukan (Revenue)', formatIDR(summary.totalRevenue), 'Total Pengeluaran (Beban)', formatIDR(summary.totalExpense)],
    ['Total Penjualan Kasir', formatIDR(summary.totalSales), 'Laba Bersih (Net Income)', formatIDR(summary.netIncome)],
    ['Jumlah Transaksi', `${summary.totalTransactions} transaksi`, 'Jumlah Pasien Terlayani', `${summary.totalPatients} pasien`]
  ];

  autoTable(doc, {
    startY: 42,
    head: [['Metrik Pemasukan', 'Nominal', 'Metrik Beban & Hasil', 'Nominal']],
    body: summaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 38, 52],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      2: { fontStyle: 'bold', cellWidth: 50 },
      3: { halign: 'right', fontStyle: 'bold' }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 6;

  // Transactions Table
  const txRows = transactions.slice(0, 45).map((t, idx) => [
    idx + 1,
    formatDateIndo(t.date),
    t.type,
    t.category,
    t.description,
    t.reference,
    formatIDR(t.amount),
    t.status
  ]);

  if (txRows.length === 0) {
    txRows.push([1, '-', 'Info', '-', 'Tidak ada transaksi pada periode ini', '-', 'Rp 0', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Referensi', 'Nominal', 'Status']],
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 20 },
      3: { cellWidth: 26 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 26 },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 18, halign: 'center' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Signature section if space allows, otherwise new page
  if (finalY < 250) {
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(8.5);
    doc.text(`Bekasi, ${formatDateIndo(new Date().toISOString())}`, 145, finalY + 4);
    doc.text('Penanggung Jawab Keuangan & Praktek,', 145, finalY + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.owner_name, 145, finalY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Praktisi Utama ACUCARE', 145, finalY + 29);
  }

  const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Laporan_Keuangan_ACUCARE_${cleanPeriod}.pdf`);
}

// ==========================================
// WHATSAPP URL GENERATOR
// ==========================================

export function getWhatsAppUrl(phone: string, text: string): string {
  if (!phone) return '#';
  // Normalize phone number (e.g., 0812... -> 62812...)
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
