import React, { useState, useRef } from 'react';
import {
  Building2,
  CreditCard,
  Shield,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  FileJson,
  FileSpreadsheet,
  FileText,
  Database
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { RestoreConfirmModal } from './RestoreConfirmModal';
import { exportDatabaseToExcel, generateBackupReportPDF, formatDateIndo } from '../../lib/exportUtils';
import { BackupValidationResult } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabase,
    validateBackupFile,
    importDatabase,
    resetDemoData,
    deleteAllPatients,
    showToast
  } = useClinic();

  const { user, role, isOwner, switchRole, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Clinic Profile
  const [clinicName, setClinicName] = useState(settings.clinic_name);
  const [clinicTagline, setClinicTagline] = useState(settings.clinic_tagline);
  const [ownerName, setOwnerName] = useState(settings.owner_name);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [address, setAddress] = useState(settings.address);
  const [bankName, setBankName] = useState(settings.bank_name);
  const [bankAccountNo, setBankAccountNo] = useState(settings.bank_account_no);
  const [bankAccountHolder, setBankAccountHolder] = useState(settings.bank_account_holder);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Restore State
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<BackupValidationResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Danger Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      clinic_name: clinicName.trim(),
      clinic_tagline: clinicTagline.trim(),
      owner_name: ownerName.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      bank_name: bankName.trim(),
      bank_account_no: bankAccountNo.trim(),
      bank_account_holder: bankAccountHolder.trim()
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // 1. JSON Backup (Main restore source)
  const handleDownloadJSONBackup = () => {
    try {
      const payload = exportDatabase();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = (payload.created_at || payload.exported_at || new Date().toISOString()).split('T')[0];
      a.download = `ACUCARE_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', 'Backup JSON Berhasil', 'File cadangan utama berhasil diunduh ke perangkat Anda.');
    } catch (err: any) {
      showToast('error', 'Gagal Mengunduh Backup', err.message || 'Terjadi kesalahan saat membuat file JSON.');
    }
  };

  // 2. Excel Backup (Multi-sheet spreadsheet export)
  const handleDownloadExcelBackup = () => {
    try {
      const payload = exportDatabase();
      exportDatabaseToExcel(payload);
      showToast('success', 'Export Excel Berhasil', 'File spreadsheet 11 sheet berhasil diunduh.');
    } catch (err: any) {
      showToast('error', 'Gagal Export Excel', err.message || 'Terjadi kesalahan saat membuat file Excel.');
    }
  };

  // 3. PDF Backup Report (Print-ready documentation)
  const handleDownloadPDFBackup = () => {
    try {
      const payload = exportDatabase();
      generateBackupReportPDF(payload);
      showToast('success', 'Laporan PDF Berhasil', 'Dokumen laporan cadangan berhasil dibuat.');
    } catch (err: any) {
      showToast('error', 'Gagal Membuat PDF', err.message || 'Terjadi kesalahan saat menyusun dokumen PDF.');
    }
  };

  // Handle Restore File Selection & Validation
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const validation = validateBackupFile(parsed);

        if (!validation.valid || !validation.payload) {
          showToast('error', 'File Backup Tidak Valid', validation.message || 'Format file tidak sesuai standar ACUCARE.');
          return;
        }

        setPendingValidation(validation);
        setIsRestoreModalOpen(true);
      } catch (err: any) {
        showToast('error', 'File Backup Tidak Valid', 'Format file bukan JSON yang valid atau file rusak.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteRestore = () => {
    if (!pendingValidation || !pendingValidation.payload) return;

    setIsRestoring(true);
    try {
      importDatabase(pendingValidation.payload);
      setIsRestoreModalOpen(false);
      setPendingValidation(null);
      showToast('success', 'Database Berhasil Dipulihkan', 'Seluruh data klinis dan keuangan telah dikembalikan seperti semula.');
    } catch (err: any) {
      showToast('error', 'Gagal Memulihkan Database', err.message || 'Terjadi kesalahan saat memulihkan data.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Pengaturan Klinik & Keamanan Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola profil klinik, informasi transfer rekening Bank BSI, akun praktisi, dan cadangan data
        </p>
      </div>

      {/* Role Switcher Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold">{user?.name || 'Yogi Pangestu'}</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isOwner ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-blue-400/20 text-blue-300'
                }`}
              >
                {role}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOwner
                ? 'Hak akses penuh Owner: Ubah Pengaturan, Backup/Restore, dan Hapus Data'
                : 'Hak akses Staff Admin: Mengelola Pasien, Kasir POS, dan Rekam Terapi'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Ganti Peran:</span>
          <button
            onClick={() => switchRole(isOwner ? 'ADMIN' : 'OWNER')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            {isOwner ? 'Beralih ke Admin (Staff)' : 'Beralih ke Owner (Yogi)'}
          </button>
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl text-xs font-bold transition-all border border-rose-800/60 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>

      {/* Form Clinic Settings */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Identitas & Profil Klinik ACUCARE</span>
          </h3>
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Perubahan Berhasil Disimpan!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Klinik</label>
            <input
              type="text"
              required
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tagline Spesialisasi</label>
            <input
              type="text"
              required
              value={clinicTagline}
              onChange={(e) => setClinicTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik / Praktisi Utama</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Resmi Klinik</label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Praktek Klinik Lengkap</label>
          <textarea
            rows={2}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Bank Account Details */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rekening Bank untuk Faktur & Invoice Pasien</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="BSI"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening</label>
              <input
                type="text"
                required
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="5774090170"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Atas Nama Rekening</label>
              <input
                type="text"
                required
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="Yogi Pangestu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            Simpan Informasi Klinik
          </button>
        </div>
      </form>

      {/* Cadangan (Backup) & Pemulihan (Restore) Data */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Cadangan (Backup) & Pemulihan (Restore) Data</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lindungi dan simpan seluruh rekam medis, riwayat terapi, produk herbal, serta transaksi kasir klinik secara aman.
            </p>
          </div>
          {settings.last_backup_at && (
            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium shrink-0 self-start sm:self-auto">
              Backup Terakhir: {formatDateIndo(settings.last_backup_at)}
            </span>
          )}
        </div>

        {/* 1. BAGIAN DOWNLOAD BACKUP DENGAN 3 FORMAT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              1. Download Backup Database
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Pilih format sesuai kebutuhan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Format JSON */}
            <div className="p-4.5 bg-blue-50/50 rounded-2xl border border-blue-200/80 flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                    UTAMA RESTORE
                  </span>
                </div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Backup JSON
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  File cadangan utama seluruh database ACUCARE. Wajib digunakan untuk memulihkan (restore) sistem saat ganti HP, restart, atau cache bersih.
                </p>
              </div>

              <button
                onClick={handleDownloadJSONBackup}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Backup JSON</span>
              </button>
            </div>

            {/* Format Excel */}
            <div className="p-4.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                    11 MULTI-SHEET
                  </span>
                </div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Excel (.xlsx)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Ekspor tabular seluruh database ke file Excel 11 sheet (Pasien, Terapi, Layanan, Herbal, Stok, Penjualan, Detail, Pembayaran, Invoice, Pemasukan, Pengeluaran).
                </p>
              </div>

              <button
                onClick={handleDownloadExcelBackup}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Download Backup Excel</span>
              </button>
            </div>

            {/* Format PDF */}
            <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all shadow-2xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md">
                    DOKUMENTASI
                  </span>
                </div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Laporan PDF
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Dokumentasi resmi laporan cadangan klinis siap cetak berisi ringkasan metrik pasien, rekapitulasi koleksi, neraca finansial, dan pengesahan praktisi.
                </p>
              </div>

              <button
                onClick={handleDownloadPDFBackup}
                className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Laporan PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. BAGIAN RESTORE DATABASE DARI JSON */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block">
            2. Pemulihan (Restore) Database
          </span>

          <div className="p-5 bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-extrabold text-slate-900 block">
                  Pulihkan Seluruh Catatan dari File Backup (.json)
                </span>
                <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                  Unggah file cadangan JSON ACUCARE. Sistem akan memvalidasi integritas data dan menampilkan pratinjau sebelum melakukan pemulihan.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-md"
            >
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* DANGER ZONE (Owner Only) */}
      <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-rose-200/80 pb-3">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="font-extrabold text-rose-950 text-base">
            Zona Berbahaya (Owner Only)
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-rose-100">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Pulihkan Data Demo Awal (Seed Database)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reset ke contoh data klinis standar (Pasien saraf kejepit, stroke, produk herbal, & faktur).
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Reset ke Data Demo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-rose-200">
          <div>
            <span className="text-xs font-bold text-rose-700 block">
              Hapus Seluruh Data Pasien (Kosongkan Database Pasien)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Menghapus permanen seluruh data pasien dan riwayat terapi dari sistem.
            </p>
          </div>
          <button
            onClick={() => {
              if (!isOwner) {
                alert('Aksi ini hanya dapat dilakukan oleh Owner (Yogi Pangestu).');
                return;
              }
              setIsClearAllConfirmOpen(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Seluruh Data Pasien</span>
          </button>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <RestoreConfirmModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setPendingValidation(null);
        }}
        onConfirm={handleExecuteRestore}
        validationResult={pendingValidation}
        isRestoring={isRestoring}
      />

      {/* Reset Confirm */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetDemoData();
          setIsResetConfirmOpen(false);
        }}
        title="Reset ke Data Demo?"
        message="Aksi ini akan menimpa data yang ada saat ini dengan data rekam medis demo standar ACUCARE."
        confirmText="Reset Data Demo"
        isDangerous={false}
      />

      {/* Clear All Confirm */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={() => {
          deleteAllPatients();
          setIsClearAllConfirmOpen(false);
        }}
        title="PERINGATAN: Kosongkan Database Pasien?"
        message="Aksi ini TIDAK DAPAT DIBATALKAN. Seluruh data pasien dan rekam sesi terapi akan dihapus secara permanen dari sistem."
        confirmText="Ya, Hapus Semuanya"
        isDangerous={true}
      />
    </div>
  );
};

