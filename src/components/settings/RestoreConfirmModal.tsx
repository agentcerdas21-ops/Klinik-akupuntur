import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Database,
  FileJson,
  Layers,
  Loader2,
  ShieldAlert,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { BackupValidationResult } from '../../types';
import { formatDateIndo } from '../../lib/exportUtils';

interface RestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validationResult: BackupValidationResult | null;
  isRestoring?: boolean;
}

export const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  validationResult,
  isRestoring = false
}) => {
  if (!isOpen || !validationResult || !validationResult.details) return null;

  const { details } = validationResult;
  const { stats } = details;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>Konfirmasi Pemulihan Database</span>
              </h3>
              <p className="text-xs text-slate-400">
                Verifikasi integritas file cadangan ACUCARE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRestoring}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* File Metadata Banner */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <FileJson className="w-3.5 h-3.5 text-blue-600" />
                Format File
              </span>
              <span className="font-extrabold text-slate-800 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-100">
                JSON Backup ACUCARE v{details.backup_version}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Tanggal Dibuat:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDateIndo(details.created_at)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Dibuat Oleh:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {details.exported_by}
                </span>
              </div>
            </div>
          </div>

          {/* Collection Counts Grid */}
          <div>
            <span className="text-xs font-extrabold text-slate-900 block mb-2.5">
              Rincian Data yang Akan Dipulihkan:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Pasien</span>
                <span className="text-lg font-black text-slate-900">{stats.patients}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Sesi Terapi</span>
                <span className="text-lg font-black text-blue-600">{stats.therapy_sessions}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Produk Herbal</span>
                <span className="text-lg font-black text-emerald-600">{stats.herbal_products}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Layanan</span>
                <span className="text-lg font-black text-slate-900">{stats.services}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Penjualan (POS)</span>
                <span className="text-lg font-black text-indigo-600">{stats.sales}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Faktur / Invoice</span>
                <span className="text-lg font-black text-amber-600">{stats.invoices}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Pembayaran</span>
                <span className="text-lg font-black text-slate-900">{stats.payments}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Pemasukan</span>
                <span className="text-lg font-black text-teal-600">{stats.income}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium">Pengeluaran</span>
                <span className="text-lg font-black text-rose-600">{stats.expenses}</span>
              </div>
            </div>
          </div>

          {/* Safety Warning Alert Box */}
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-amber-950 block">
                Peringatan Pemulihan Data
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Restore akan mengubah data aplikasi berdasarkan file backup yang dipilih. Pastikan file backup berasal dari ACUCARE dan merupakan versi data yang benar.
              </p>
              <p className="text-[10px] text-amber-700 font-medium">
                * Sistem secara otomatis menyimpan snapshot pengaman sebelum pemulihan dijalankan.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRestoring}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRestoring}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memulihkan Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Lanjutkan Restore Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
