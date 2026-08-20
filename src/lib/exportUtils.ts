import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ClinicSettings, Invoice, Patient, Sale, TherapySession } from '../types';

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
  const totalsX = 135;
  const valuesX = 194;

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Subtotal:', totalsX, finalY + 7);
  doc.text(formatIDR(invoice.subtotal || invoice.total), valuesX, finalY + 7, { align: 'right' });

  if (invoice.discount > 0) {
    doc.text('Diskon:', totalsX, finalY + 14);
    doc.text(`- ${formatIDR(invoice.discount)}`, valuesX, finalY + 14, { align: 'right' });
  }

  // Grand Total Line
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX, finalY + 18, valuesX, finalY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('TOTAL TAGIHAN:', totalsX, finalY + 26);
  doc.text(formatIDR(invoice.total), valuesX, finalY + 26, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(invoice.payment_status === 'Lunas' ? 16 : 220, invoice.payment_status === 'Lunas' ? 185 : 38, invoice.payment_status === 'Lunas' ? 129 : 38);
  doc.text(`[ STATUS: ${invoice.payment_status.toUpperCase()} ]`, valuesX, finalY + 33, { align: 'right' });

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
