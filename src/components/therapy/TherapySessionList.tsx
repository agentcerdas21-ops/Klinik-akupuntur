import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Edit,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { TherapySession } from '../../types';
import { formatIDR, formatDateIndo, exportToExcel } from '../../lib/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface TherapySessionListProps {
  onOpenAddModal: (patientId?: string) => void;
  onOpenEditModal: (session: TherapySession) => void;
  onSelectPatient: (patientId: string) => void;
}

export const TherapySessionList: React.FC<TherapySessionListProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onSelectPatient
}) => {
  const { therapySessions, patients, deleteTherapySession } = useClinic();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return therapySessions
      .filter((s) => {
        const patient = patients.find((p) => p.id === s.patient_id);
        const patientName = patient?.full_name || '';
        const patientCode = patient?.patient_code || '';

        const matchesSearch =
          patientName.toLowerCase().includes(search.toLowerCase()) ||
          patientCode.toLowerCase().includes(search.toLowerCase()) ||
          s.therapy_type.toLowerCase().includes(search.toLowerCase()) ||
          (s.treatment_area && s.treatment_area.toLowerCase().includes(search.toLowerCase()));

        const matchesType = typeFilter === 'ALL' || s.therapy_type === typeFilter;
        const matchesPayment = paymentFilter === 'ALL' || s.payment_status === paymentFilter;

        return matchesSearch && matchesType && matchesPayment;
      })
      .sort((a, b) => new Date(b.therapy_date).getTime() - new Date(a.therapy_date).getTime());
  }, [therapySessions, patients, search, typeFilter, paymentFilter]);

  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportExcel = () => {
    const dataToExport = filteredSessions.map((s) => {
      const p = patients.find((pat) => pat.id === s.patient_id);
      return {
        'Nomor Sesi': `Sesi Ke-${s.session_number}`,
        'Tanggal Terapi': formatDateIndo(s.therapy_date),
        'Nama Pasien': p?.full_name || '-',
        'Kode Pasien': p?.patient_code || '-',
        'Jenis Terapi': s.therapy_type,
        'Area / Titik': s.treatment_area || '-',
        'Kondisi Sebelum': s.condition_before || '-',
        'Kondisi Sesudah / Respons': s.condition_after || s.patient_response || '-',
        'Catatan Praktisi': s.practitioner_notes || '-',
        'Biaya': s.cost,
        'Status Pembayaran': s.payment_status
      };
    });
    exportToExcel(dataToExport, `Rekam_Terapi_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Rekam Sesi Terapi Akupunktur
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log tindakan penusukan jarum, area meridian, observasi dan evaluasi respon pasien
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Sesi Baru</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export Excel Rekam Terapi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Clinical Disclaimer */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Disclaimer Klinis:</strong> Catatan terapi ini digunakan sebagai dokumentasi catatan layanan operasional internal praktik ACUCARE dan bukan pengganti diagnosis medis formal tenaga kesehatan.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama pasien, kode ACU, atau jenis terapi..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Pembayaran</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Jenis Terapi</option>
              <option value="Akupunktur Saraf Kejepit (HNP)">Akupunktur Saraf Kejepit</option>
              <option value="Akupunktur Pemulihan Stroke">Akupunktur Stroke</option>
              <option value="Akupunktur Nyeri Sendi & Pinggang">Nyeri Sendi & Pinggang</option>
              <option value="Akupunktur Relaksasi & Migrain">Relaksasi & Migrain</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Sesi & Tanggal</th>
                <th className="py-3.5 px-4">Nama Pasien</th>
                <th className="py-3.5 px-4">Jenis Terapi & Area</th>
                <th className="py-3.5 px-4">Evaluasi / Respons</th>
                <th className="py-3.5 px-4 text-right">Biaya</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Tidak ada sesi terapi ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik "+ Catat Sesi Baru" untuk mendokumentasikan tindakan terapi.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedSessions.map((session) => {
                  const patient = patients.find((p) => p.id === session.patient_id);
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(session.patient_id)}
                    >
                      {/* Session # and Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-xs font-mono">
                            #{session.session_number}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs">
                            {formatDateIndo(session.therapy_date)}
                          </span>
                        </div>
                      </td>

                      {/* Patient Name & Code */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {patient?.full_name || 'Pasien Terhapus'}
                          </p>
                          <span className="text-[11px] font-mono text-slate-500 font-medium">
                            {patient?.patient_code}
                          </span>
                        </div>
                      </td>

                      {/* Therapy Type & Area */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{session.therapy_type}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Titik: {session.treatment_area || '-'}
                        </p>
                      </td>

                      {/* Evaluation / Response */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 truncate" title={session.condition_after || session.patient_response}>
                          {session.condition_after || session.patient_response || '-'}
                        </p>
                        {session.next_plan && (
                          <span className="text-[10px] text-blue-700 font-medium block truncate mt-0.5">
                            Plan: {session.next_plan}
                          </span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatIDR(session.cost)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            session.payment_status === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {session.payment_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenEditModal(session)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Sesi"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteSessionId(session.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Menampilkan <strong className="text-slate-800">{paginatedSessions.length}</strong> dari{' '}
            <strong className="text-slate-800">{filteredSessions.length}</strong> total sesi
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Session Dialog */}
      <ConfirmDialog
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={() => {
          if (deleteSessionId) deleteTherapySession(deleteSessionId);
        }}
        title="Hapus Sesi Terapi?"
        message="Catatan dokumentasi sesi terapi ini akan dihapus secara permanen dari rekam medis pasien."
        confirmText="Hapus Sesi"
        isDangerous={true}
      />
    </div>
  );
};
