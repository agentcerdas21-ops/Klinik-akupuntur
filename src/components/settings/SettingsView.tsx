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
  LogOut
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabase,
    importDatabase,
    resetDemoData,
    deleteAllPatients
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

  const handleDownloadJSONBackup = () => {
    const payload = exportDatabase();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACUCARE_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const payload = JSON.parse(content);
        importDatabase(payload);
      } catch (err) {
        alert('Format file JSON cadangan tidak valid.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      {/* Backup, Restore & Data Management */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
          <Download className="w-4 h-4 text-blue-600" />
          <span>Cadangan (Backup) & Pemulihan (Restore) Data</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-extrabold text-slate-900 block">
              Download File Backup Lengkap (.json)
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unduh salinan lengkap seluruh data pasien, rekam medis terapi, produk herbal, transaksi kasir, dan keuangan ke komputer Anda.
            </p>
            <button
              onClick={handleDownloadJSONBackup}
              className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup JSON</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-xs font-extrabold text-slate-900 block">
              Pulihkan Database dari File (.json)
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unggah file backup .json yang telah diunduh sebelumnya untuk mengembalikan seluruh catatan klinis.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
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
