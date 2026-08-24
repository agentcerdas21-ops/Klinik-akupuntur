import React from 'react';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  Plus,
  AlertTriangle,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/DbContext';
import { StatCard } from '../common/StatCard';
import { RevenueChart } from './RevenueChart';
import { PatientGrowthChart } from './PatientGrowthChart';
import { formatIDR, formatDateIndo } from '../../lib/exportUtils';

interface ExecutiveDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenQuickAction?: (actionType?: string) => void;
  onOpenPatientModal?: () => void;
  onOpenTherapyModal?: () => void;
  onOpenSaleModal?: () => void;
  onOpenInvoices?: () => void;
  onOpenExpenseModal?: () => void;
  onSelectPatient: (patientId: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateTab,
  onOpenQuickAction,
  onOpenPatientModal,
  onOpenTherapyModal,
  onOpenSaleModal,
  onOpenInvoices,
  onOpenExpenseModal,
  onSelectPatient,
  onSelectInvoice
}) => {
  const { user, isOwner } = useAuth();
  const {
    settings,
    patients,
    therapySessions,
    sales,
    invoices,
    expenses,
    totalRevenue,
    totalExpense,
    netIncome,
    lowStockProducts,
    unpaidInvoices
  } = useClinic();

  const activePatientsCount = patients.filter((p) => p.status === 'Aktif').length;
  const recentSessions = therapySessions.slice(0, 4);
  const recentInvoices = invoices.slice(0, 4);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#0a1c27] via-[#102a3a] to-[#0d2330] rounded-3xl p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Operasional Klinik Aktif
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {greeting}, {user?.name || 'Yogi Pangestu'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Ringkasan performa dan operasional <strong className="text-emerald-300 font-semibold">{settings.clinic_name}</strong> hari ini.
            Semua metrik dan laporan dihitung langsung secara real-time dari database.
          </p>
        </div>

        {/* Quick Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
          <button
            onClick={() => {
              if (onOpenPatientModal) onOpenPatientModal();
              else if (onOpenQuickAction) onOpenQuickAction('new_patient');
              else onNavigateTab('patients');
            }}
            id="dash-add-patient-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pasien Baru</span>
          </button>
          <button
            onClick={() => {
              if (onOpenTherapyModal) onOpenTherapyModal();
              else if (onOpenQuickAction) onOpenQuickAction('new_therapy');
              else onNavigateTab('therapy');
            }}
            id="dash-add-therapy-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Sesi Terapi</span>
          </button>
          <button
            onClick={() => {
              if (onOpenInvoices) onOpenInvoices();
              else if (onOpenSaleModal) onOpenSaleModal();
              else if (onOpenQuickAction) onOpenQuickAction('new_sale');
              else onNavigateTab('sales');
            }}
            id="dash-add-sale-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>Kasir / Faktur</span>
          </button>
        </div>
      </div>

      {/* Operational Alerts Bar (if any) */}
      {(lowStockProducts.length > 0 || unpaidInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unpaidInvoices.length > 0 && (
            <div
              onClick={() => onNavigateTab('invoices')}
              className="flex items-center justify-between p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl hover:bg-rose-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-200/80 text-rose-800 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-950">
                    {unpaidInvoices.length} Faktur Belum Lunas / DP
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Total sisa piutang berjalan:{' '}
                    <strong>
                      {formatIDR(
                        unpaidInvoices.reduce(
                          (acc, i) =>
                            acc +
                            (i.outstanding !== undefined
                              ? i.outstanding
                              : i.payment_status === 'Lunas'
                              ? 0
                              : Math.max(0, (i.total || 0) - (i.total_paid || 0))),
                          0
                        )
                      )}
                    </strong>
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div
              onClick={() => onNavigateTab('herbal')}
              className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl hover:bg-amber-100/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-200/80 text-amber-800 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-950">
                    {lowStockProducts.length} Produk Herbal Stok Menipis
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Periksa persediaan obat herbal dan segera restok
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
          )}
        </div>
      )}

      {/* 6 Essential KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          id="stat-total-patients"
          title="Total Pasien"
          value={patients.length}
          subtitle={`${activePatientsCount} Aktif berobat`}
          icon={<Users className="w-5 h-5" />}
          variant="slate"
          onClick={() => onNavigateTab('patients')}
        />

        <StatCard
          id="stat-active-patients"
          title="Pasien Aktif"
          value={activePatientsCount}
          subtitle="Jadwal terapi rutin"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
          badge={`${patients.length > 0 ? Math.round((activePatientsCount / patients.length) * 100) : 0}%`}
          badgeType="success"
          onClick={() => onNavigateTab('patients')}
        />

        <StatCard
          id="stat-total-sessions"
          title="Sesi Terapi"
          value={therapySessions.length}
          subtitle="Tercatat dalam rekam"
          icon={<Activity className="w-5 h-5" />}
          variant="navy"
          onClick={() => onNavigateTab('therapy')}
        />

        <StatCard
          id="stat-total-revenue"
          title="Pendapatan"
          value={formatIDR(totalRevenue)}
          subtitle="Layanan + Herbal"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
          onClick={() => onNavigateTab('reports')}
        />

        <StatCard
          id="stat-total-expenses"
          title="Pengeluaran"
          value={formatIDR(totalExpense)}
          subtitle="Jarum, sewa & operasional"
          icon={<TrendingDown className="w-5 h-5" />}
          variant="rose"
          onClick={() => onNavigateTab('finance')}
        />

        <StatCard
          id="stat-net-income"
          title="Net Income"
          value={formatIDR(netIncome)}
          subtitle="Revenue - Expense"
          icon={<DollarSign className="w-5 h-5" />}
          variant={netIncome >= 0 ? 'emerald' : 'rose'}
          badge={netIncome >= 0 ? 'Surplus' : 'Defisit'}
          badgeType={netIncome >= 0 ? 'success' : 'danger'}
          onClick={() => onNavigateTab('reports')}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6">
        <RevenueChart />
        <PatientGrowthChart />
      </div>

      {/* Recent Operational Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Therapy Sessions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Sesi Terapi Terkini</h3>
              <p className="text-xs text-slate-500 mt-0.5">Catatan penusukan & respons pasien</p>
            </div>
            <button
              onClick={() => onNavigateTab('therapy')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Sesi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 divide-y divide-slate-100">
            {recentSessions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">Belum ada sesi terapi tercatat.</div>
            ) : (
              recentSessions.map((ses) => {
                const pat = patients.find((p) => p.id === ses.patient_id);
                return (
                  <div
                    key={ses.id}
                    onClick={() => onSelectPatient(ses.patient_id)}
                    className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        S{ses.session_number}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {pat?.full_name || 'Pasien'}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-mono">
                            {pat?.patient_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{ses.therapy_type}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateIndo(ses.therapy_date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-slate-900 block font-mono">
                        {formatIDR(ses.cost)}
                      </span>
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                          ses.payment_status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ses.payment_status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Invoices & Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Faktur & Transaksi Terkini</h3>
              <p className="text-xs text-slate-500 mt-0.5">Layanan akupunktur & produk herbal</p>
            </div>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Faktur</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 divide-y divide-slate-100">
            {recentInvoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">Belum ada transaksi faktur.</div>
            ) : (
              recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv.id)}
                  className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {inv.invoice_number}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate">
                          ({inv.patient_name || 'Umum'})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Metode: <span className="font-semibold text-slate-700">{inv.payment_method || 'Transfer'}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateIndo(inv.invoice_date)}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-slate-900 block font-mono">
                      {formatIDR(inv.total)}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        inv.payment_status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
