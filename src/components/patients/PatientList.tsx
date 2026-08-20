import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  Phone,
  MessageCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { Patient, PatientStatus } from '../../types';
import { exportToExcel, exportToCSV, formatDateIndo } from '../../lib/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PatientListProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (patient: Patient) => void;
  onSelectPatient: (patientId: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onSelectPatient
}) => {
  const { patients, therapySessions, deletePatient, deleteAllPatients } = useClinic();
  const { isOwner } = useAuth();

  // Search, Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name_asc' | 'sessions_desc'>('created_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals for deletion
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // Pre-calculate session count & last session date for each patient
  const patientStats = useMemo(() => {
    const stats: Record<string, { totalSessions: number; lastSessionDate?: string }> = {};
    patients.forEach((p) => {
      const pSessions = therapySessions.filter((s) => s.patient_id === p.id);
      stats[p.id] = {
        totalSessions: pSessions.length,
        lastSessionDate: pSessions.length > 0 ? pSessions[0].therapy_date : undefined
      };
    });
    return stats;
  }, [patients, therapySessions]);

  // Filtering & Sorting logic
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        const matchesSearch =
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.patient_code.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search) ||
          p.whatsapp.includes(search) ||
          p.main_complaint.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;

        return matchesSearch && matchesStatus && matchesGender;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.full_name.localeCompare(b.full_name);
        }
        if (sortBy === 'created_asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'sessions_desc') {
          const countA = patientStats[a.id]?.totalSessions || 0;
          const countB = patientStats[b.id]?.totalSessions || 0;
          return countB - countA;
        }
        // created_desc default
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [patients, search, statusFilter, genderFilter, sortBy, patientStats]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportExcel = () => {
    const dataToExport = filteredPatients.map((p) => ({
      'Kode Pasien': p.patient_code,
      'Nama Lengkap': p.full_name,
      'NIK': p.nik || '-',
      'Tanggal Lahir': p.birth_date || '-',
      'Jenis Kelamin': p.gender,
      'No WhatsApp': p.whatsapp,
      'Alamat': p.address || '-',
      'Keluhan Utama': p.main_complaint,
      'Riwayat Medis': p.medical_history || '-',
      'Status': p.status,
      'Total Sesi Terapi': patientStats[p.id]?.totalSessions || 0,
      'Tanggal Terdaftar': formatDateIndo(p.created_at)
    }));
    exportToExcel(dataToExport, `Data_Pasien_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredPatients.map((p) => ({
      'Kode Pasien': p.patient_code,
      'Nama Lengkap': p.full_name,
      'Jenis Kelamin': p.gender,
      'No WhatsApp': p.whatsapp,
      'Keluhan Utama': p.main_complaint,
      'Status': p.status,
      'Total Sesi': patientStats[p.id]?.totalSessions || 0
    }));
    exportToCSV(dataToExport, `Data_Pasien_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  const patientToDelete = patients.find((p) => p.id === deleteTargetId);

  return (
    <div className="space-y-5">
      {/* Page Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Rekam Medis Pasien
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data demografi, riwayat terapi, keluhan dan kontak pasien
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenAddModal}
            id="add-patient-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Pasien Baru</span>
          </button>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Unduh format Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Unduh format CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama pasien, kode ACU, WhatsApp, atau keluhan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Status ({patients.length})</option>
              <option value="Aktif">Aktif Terapi</option>
              <option value="Selesai">Selesai / Pulih</option>
              <option value="Menunggu">Menunggu Jadwal</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="lg:col-span-2">
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="created_desc">Terbaru</option>
              <option value="name_asc">Nama (A-Z)</option>
              <option value="sessions_desc">Sesi Terbanyak</option>
              <option value="created_asc">Terlama</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Patient ID & Nama</th>
                <th className="py-3.5 px-4">Kontak / WhatsApp</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Gender</th>
                <th className="py-3.5 px-4">Keluhan Utama</th>
                <th className="py-3.5 px-4 text-center">Total Sesi</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Tidak ada pasien ditemukan.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter !== 'ALL'
                        ? 'Coba atur ulang filter pencarian Anda.'
                        : 'Klik tombol + Pasien Baru untuk mendaftarkan pasien pertama.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p) => {
                  const stats = patientStats[p.id] || { totalSessions: 0 };
                  const cleanWA = p.whatsapp.replace(/\D/g, '');
                  const waNumber = cleanWA.startsWith('0') ? '62' + cleanWA.slice(1) : cleanWA;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(p.id)}
                    >
                      {/* ID & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {p.full_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-emerald-800 transition-colors">
                              {p.full_name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 font-medium">
                              {p.patient_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp / Phone */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-700">{p.whatsapp}</span>
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Chat WhatsApp Pasien"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-600 text-xs">
                        {p.gender}
                      </td>

                      {/* Keluhan Utama */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-800 truncate" title={p.main_complaint}>
                          {p.main_complaint}
                        </p>
                        {stats.lastSessionDate && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Terapi: {formatDateIndo(stats.lastSessionDate)}
                          </span>
                        )}
                      </td>

                      {/* Total Sesi */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
                          {stats.totalSessions} Sesi
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            p.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                              : p.status === 'Selesai'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300/60'
                              : p.status === 'Menunggu'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPatient(p.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Buka Rekam Pasien"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Pasien"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pasien"
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
            Menampilkan <strong className="text-slate-800">{paginatedPatients.length}</strong> dari{' '}
            <strong className="text-slate-800">{filteredPatients.length}</strong> total pasien
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

      {/* Owner Dangerous Action: Delete All Patients */}
      {isOwner && patients.length > 0 && (
        <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-950">Zona Pembersihan Database (Owner Only)</p>
              <p className="text-[11px] text-rose-700">
                Kosongkan seluruh data pasien, histori sesi terapi, dan relasi transaksi secara permanen.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            Hapus Semua Data Pasien
          </button>
        </div>
      )}

      {/* Single Patient Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deletePatient(deleteTargetId);
        }}
        title="Hapus Data Pasien?"
        message={`Data pasien "${patientToDelete?.full_name || ''}" (${patientToDelete?.patient_code || ''}) serta seluruh riwayat sesi terapi dan faktur terkait akan dihapus secara permanen dari database.`}
        confirmText="Hapus Permanen"
        isDangerous={true}
      />

      {/* Delete All Patients Dialog with typed confirmation */}
      <ConfirmDialog
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={() => deleteAllPatients()}
        title="Hapus SEMUA Data Pasien?"
        message="PERINGATAN KRITIKAL: Tindakan ini akan menghapus seluruh data pasien, sesi terapi, dan data faktur terkait dari database secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Semua Sekarang"
        isDangerous={true}
        requiredTypedConfirmation="HAPUS SEMUA DATA"
      />
    </div>
  );
};
