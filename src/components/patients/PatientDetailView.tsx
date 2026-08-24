import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Plus,
  MessageCircle,
  Phone,
  FileText,
  Activity,
  CreditCard,
  ShoppingBag,
  Download,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { Patient, TherapySession } from '../../types';
import { formatIDR, formatDateIndo, generateTherapyResumePDF, generateInvoicePDF } from '../../lib/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PatientDetailViewProps {
  patientId: string;
  onBack: () => void;
  onEditPatient: (patient: Patient) => void;
  onOpenAddTherapy: (patientId: string) => void;
  onEditTherapy: (session: TherapySession) => void;
  onOpenNewSale: (patientId: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patientId,
  onBack,
  onEditPatient,
  onOpenAddTherapy,
  onEditTherapy,
  onOpenNewSale,
  onSelectInvoice
}) => {
  const { patients, therapySessions, invoices, payments, sales, settings, deletePatient, deleteTherapySession } = useClinic();
  const { isOwner } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'medical' | 'therapy' | 'payments' | 'invoices' | 'sales'>('therapy');
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [showDeletePatientModal, setShowDeletePatientModal] = useState(false);

  const patient = patients.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <div className="p-8 bg-white rounded-3xl text-center border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Data pasien tidak ditemukan atau telah dihapus.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          ← Kembali ke Daftar Pasien
        </button>
      </div>
    );
  }

  // Filter linked records
  const patientSessions = therapySessions.filter((s) => s.patient_id === patient.id).sort((a, b) => b.session_number - a.session_number);
  const patientInvoices = invoices.filter((i) => i.patient_id === patient.id);
  const patientPayments = payments.filter((p) => p.patient_id === patient.id);
  const patientSales = sales.filter((s) => s.patient_id === patient.id);

  // Financial summary
  const totalInvoiced = patientInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const totalPaid = patientPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const outstanding = Math.max(0, totalInvoiced - totalPaid);

  const cleanWA = patient.whatsapp.replace(/\D/g, '');
  const waNumber = cleanWA.startsWith('0') ? '62' + cleanWA.slice(1) : cleanWA;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo Bapak/Ibu ${patient.full_name}, kami dari Klinik ACUCARE ingin menanyakan perkembangan kondisi pasca terapi akupunktur.`)}`;

  const handleDownloadResume = () => {
    generateTherapyResumePDF(patient, patientSessions, settings);
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pasien</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadResume}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Download PDF Riwayat & Evaluasi Terapi Pasien"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resume PDF</span>
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp Pasien</span>
          </a>
          <button
            onClick={() => onEditPatient(patient)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Pasien</span>
          </button>
        </div>
      </div>

      {/* Patient Hero Identity Card */}
      <div className="bg-gradient-to-r from-[#0a1c27] via-[#102b3c] to-[#0d2432] rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{patient.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                  {patient.patient_code}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    patient.status === 'Aktif'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : patient.status === 'Selesai'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {patient.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 mt-2">
                <span>Gender: <strong className="text-white">{patient.gender}</strong></span>
                <span>WhatsApp: <strong className="text-emerald-300 font-mono">{patient.whatsapp}</strong></span>
                {patient.birth_date && (
                  <span>Tgl Lahir: <strong className="text-white">{patient.birth_date}</strong></span>
                )}
                {patient.occupation && (
                  <span>Pekerjaan: <strong className="text-white">{patient.occupation}</strong></span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-3 p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 max-w-2xl">
                <strong className="text-emerald-400 font-bold">Keluhan Utama:</strong> {patient.main_complaint}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons on Hero */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              onClick={() => onOpenAddTherapy(patient.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Sesi Terapi</span>
            </button>
            <button
              onClick={() => onOpenNewSale(patient.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <span>+ Buat Faktur / Obat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial & Session Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Sesi Terapi</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{patientSessions.length}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Sesi tercatat dalam sistem</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Tagihan (Invoice)</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{formatIDR(totalInvoiced)}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">{patientInvoices.length} Faktur diterbitkan</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Pembayaran</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{formatIDR(totalPaid)}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Telah diterima klinik</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Sisa Tagihan (Outstanding)</span>
          <p className={`text-2xl font-black mt-1 font-mono ${outstanding > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatIDR(outstanding)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {outstanding > 0 ? 'Belum lunas / DP' : 'Lunas semua'}
          </span>
        </div>
      </div>

      {/* 6 Tabs Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 pt-2 overflow-x-auto">
          {[
            { id: 'therapy', label: `Riwayat Terapi (${patientSessions.length})`, icon: <Activity className="w-4 h-4" /> },
            { id: 'profile', label: 'Profil Pasien', icon: <FileText className="w-4 h-4" /> },
            { id: 'medical', label: 'Catatan Medis & Alergi', icon: <AlertCircle className="w-4 h-4" /> },
            { id: 'invoices', label: `Faktur (${patientInvoices.length})`, icon: <FileText className="w-4 h-4" /> },
            { id: 'payments', label: `Pembayaran (${patientPayments.length})`, icon: <CreditCard className="w-4 h-4" /> },
            { id: 'sales', label: `Penjualan & Produk (${patientSales.length})`, icon: <ShoppingBag className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* TAB 1: THERAPY SESSIONS TIMELINE */}
          {activeTab === 'therapy' && (
            <div className="space-y-6">
              {/* Disclaimer */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Disclaimer Klinis:</strong> Catatan terapi digunakan sebagai dokumentasi layanan internal dan bukan pengganti diagnosis medis oleh tenaga kesehatan yang berwenang.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Kronologi & Timeline Terapi Akupunktur</h3>
                <button
                  onClick={() => onOpenAddTherapy(patient.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Sesi Terapi</span>
                </button>
              </div>

              {patientSessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                  <p className="text-sm font-medium text-slate-600">Belum ada sesi terapi dicatat untuk pasien ini.</p>
                  <p className="text-xs text-slate-400 mt-1">Klik tombol "+ Tambah Sesi Terapi" di atas untuk mencatat sesi pertama.</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200">
                  {patientSessions.map((session) => (
                    <div key={session.id} className="relative pl-10">
                      {/* Timeline Dot */}
                      <div className="absolute left-2 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-xs" />

                      {/* Session Box */}
                      <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-5 shadow-2xs transition-all space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-extrabold text-xs font-mono">
                              Sesi Ke-{session.session_number}
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {formatDateIndo(session.therapy_date)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {formatIDR(session.cost)}
                            </span>
                            {session.payment_method && (
                              <span className="text-[10px] text-slate-500 font-medium font-sans">
                                • {session.payment_method}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                session.payment_status === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {session.payment_status}
                            </span>
                            {session.invoice_id && (
                              <button
                                onClick={() => onSelectInvoice(session.invoice_id!)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                title="Buka Faktur Pembayaran Sesi Ini"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Faktur</span>
                              </button>
                            )}
                            <button
                              onClick={() => onEditTherapy(session)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-white transition-colors"
                              title="Edit Sesi"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteSessionId(session.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                              title="Hapus Sesi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-bold text-slate-700 block mb-0.5">Jenis Terapi:</span>
                            <p className="text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                              {session.therapy_type}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-700 block mb-0.5">Area & Titik Meridian:</span>
                            <p className="text-slate-900 bg-white p-2.5 rounded-xl border border-slate-200">
                              {session.treatment_area || '-'}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-700 block mb-0.5">Kondisi Sebelum Terapi:</span>
                            <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                              {session.condition_before || '-'}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-slate-700 block mb-0.5">Kondisi Setelah Terapi & Respons:</span>
                            <p className="text-emerald-900 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80 font-medium">
                              {session.condition_after || session.patient_response || '-'}
                            </p>
                          </div>
                        </div>

                        {session.practitioner_notes && (
                          <div className="text-xs bg-white p-3 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-700 block mb-0.5">Catatan Praktisi (Yogi Pangestu):</span>
                            <p className="text-slate-600 leading-relaxed">{session.practitioner_notes}</p>
                          </div>
                        )}

                        {session.next_plan && (
                          <div className="text-xs bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/70 text-blue-950">
                            <strong className="font-bold text-blue-900">Rencana Terapi Berikutnya:</strong> {session.next_plan}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Informasi Demografi & Identitas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <strong className="text-slate-900">{patient.full_name}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Kode Pasien:</span>
                    <span className="font-mono font-bold text-emerald-800">{patient.patient_code}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">NIK (KTP):</span>
                    <span className="font-mono text-slate-800">{patient.nik || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Tanggal Lahir:</span>
                    <span className="text-slate-800">{patient.birth_date ? formatDateIndo(patient.birth_date) : '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Jenis Kelamin:</span>
                    <span className="text-slate-800">{patient.gender}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Pekerjaan:</span>
                    <span className="text-slate-800">{patient.occupation || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Tanggal Terdaftar:</span>
                    <span className="text-slate-800">{formatDateIndo(patient.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Kontak & Alamat Domisili</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">No. WhatsApp:</span>
                    <strong className="text-slate-900 font-mono">{patient.whatsapp}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">No. HP Alternatif:</span>
                    <span className="text-slate-800 font-mono">{patient.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email:</span>
                    <span className="text-slate-800">{patient.email || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Kontak Darurat:</span>
                    <span className="text-slate-800 font-semibold">{patient.emergency_contact || '-'}</span>
                  </div>
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">Alamat Lengkap:</span>
                    <p className="text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                      {patient.address || 'Belum diisi'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLINICAL NOTES */}
          {activeTab === 'medical' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                <span className="font-bold text-slate-800 block mb-1">Keluhan Utama:</span>
                <p className="text-slate-900 bg-white p-3 rounded-xl border border-slate-200 font-medium">
                  {patient.main_complaint}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                  <span className="font-bold text-slate-800 block mb-1">Keluhan Tambahan / Penyerta:</span>
                  <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    {patient.additional_complaint || 'Tidak ada keluhan tambahan'}
                  </p>
                </div>

                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                  <span className="font-bold text-slate-800 block mb-1">Riwayat Medis & Hasil Rontgen/MRI:</span>
                  <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    {patient.medical_history || 'Tidak ada riwayat medis tercatat'}
                  </p>
                </div>

                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                  <span className="font-bold text-rose-800 block mb-1">Catatan Alergi Pasien:</span>
                  <p className="text-rose-900 bg-rose-50/60 p-3 rounded-xl border border-rose-200 font-medium">
                    {patient.allergy_notes || 'Tidak ada riwayat alergi'}
                  </p>
                </div>

                <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                  <span className="font-bold text-slate-800 block mb-1">Catatan Khusus Praktisi:</span>
                  <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    {patient.important_notes || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Faktur Diterbitkan</h4>
                <button
                  onClick={() => onOpenNewSale(patient.id)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  + Buat Faktur Baru
                </button>
              </div>

              {patientInvoices.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Belum ada faktur untuk pasien ini.</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {patientInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv.id)}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 font-mono">{inv.invoice_number}</p>
                          <p className="text-[11px] text-slate-500">{formatDateIndo(inv.invoice_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900 font-mono">{formatIDR(inv.total)}</p>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.payment_status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {inv.payment_status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInvoicePDF(inv, patient, settings);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download PDF Faktur"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Riwayat Pembayaran</h4>
              {patientPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Belum ada riwayat pembayaran tercatat.</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {patientPayments.map((pay) => (
                    <div key={pay.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Metode: <span className="text-emerald-800">{pay.payment_method}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">{formatDateIndo(pay.payment_date)} • {pay.notes || '-'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 font-mono">{formatIDR(pay.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SALES */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Item Layanan & Produk Dibeli</h4>
              {patientSales.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Belum ada item transaksi.</div>
              ) : (
                <div className="space-y-3">
                  {patientSales.map((sale) => (
                    <div key={sale.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between font-semibold border-b border-slate-200 pb-2">
                        <span>Tanggal: {formatDateIndo(sale.sale_date)}</span>
                        <span className="font-bold text-slate-900">{formatIDR(sale.total)}</span>
                      </div>
                      <div className="space-y-1">
                        {sale.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-slate-600">
                            <span>{item.item_name} × {item.quantity}</span>
                            <span className="font-mono">{formatIDR(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Patient Permanent Button at bottom */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={() => setShowDeletePatientModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Hapus Pasien Secara Permanen</span>
        </button>
      </div>

      {/* Delete Session Confirm */}
      <ConfirmDialog
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={() => {
          if (deleteSessionId) deleteTherapySession(deleteSessionId);
        }}
        title="Hapus Sesi Terapi?"
        message="Catatan dokumentasi sesi terapi ini akan dihapus dari rekam medis pasien."
        confirmText="Hapus Sesi"
        isDangerous={true}
      />

      {/* Delete Patient Confirm */}
      <ConfirmDialog
        isOpen={showDeletePatientModal}
        onClose={() => setShowDeletePatientModal(false)}
        onConfirm={() => {
          deletePatient(patient.id);
          onBack();
        }}
        title="Hapus Data Pasien?"
        message={`«Data pasien "${patient.full_name}" akan dihapus secara permanen dan tidak dapat dikembalikan.»`}
        confirmText="Hapus Permanen"
        isDangerous={true}
      />
    </div>
  );
};
