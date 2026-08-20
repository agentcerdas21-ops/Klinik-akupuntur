import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  PieChart as PieIcon,
  Activity,
  Package,
  Users,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useClinic } from '../../context/DbContext';
import { formatIDR, formatDateIndo, exportToExcel } from '../../lib/exportUtils';

export const ReportsView: React.FC = () => {
  const {
    patients,
    therapySessions,
    herbalProducts,
    sales,
    expenses,
    income,
    totalRevenue,
    totalExpense,
    netIncome,
    settings
  } = useClinic();

  const [timeRange, setTimeRange] = useState<'30days' | '90days' | 'year' | 'all'>('30days');

  // Breakdown of Therapy vs Herbal Sales
  const revenueBreakdown = useMemo(() => {
    let therapyTotal = 0;
    let herbalTotal = 0;

    sales.forEach((s) => {
      s.items?.forEach((item) => {
        if (item.item_type === 'service') {
          therapyTotal += item.subtotal;
        } else {
          herbalTotal += item.subtotal;
        }
      });
    });

    // If therapy sessions exist independently
    if (therapyTotal === 0) {
      therapyTotal = therapySessions.reduce((acc, s) => acc + (s.cost || 0), 0);
    }

    return [
      { name: 'Layanan Terapi Akupunktur', value: therapyTotal, color: '#0d9488' },
      { name: 'Produk Obat Herbal', value: herbalTotal, color: '#3b82f6' },
      { name: 'Pemasukan Lainnya', value: income.reduce((acc, i) => acc + i.amount, 0), color: '#8b5cf6' }
    ];
  }, [sales, therapySessions, income]);

  // Specialization Distribution (Saraf Kejepit vs Stroke vs Other)
  const complaintDistribution = useMemo(() => {
    let hnpCount = 0;
    let strokeCount = 0;
    let jointCount = 0;
    let otherCount = 0;

    patients.forEach((p) => {
      const c = (p.main_complaint + ' ' + (p.additional_complaint || '') + ' ' + (p.medical_history || '')).toLowerCase();
      if (c.includes('kejepit') || c.includes('hnp') || c.includes('lumbal') || c.includes('sciatica')) {
        hnpCount++;
      } else if (c.includes('stroke') || c.includes('hemiparesis') || c.includes('kelumpuhan')) {
        strokeCount++;
      } else if (c.includes('sendi') || c.includes('lutut') || c.includes('osteoarthritis') || c.includes('bahu')) {
        jointCount++;
      } else {
        otherCount++;
      }
    });

    return [
      { name: 'Saraf Kejepit (HNP)', count: hnpCount, color: '#059669' },
      { name: 'Pasca Stroke & Saraf', count: strokeCount, color: '#2563eb' },
      { name: 'Nyeri Sendi & Tulang', count: jointCount, color: '#d97706' },
      { name: 'Keluhan Lainnya', count: otherCount, color: '#64748b' }
    ];
  }, [patients]);

  // Expenses by Category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const handleExportFullReport = () => {
    const summaryData = [
      { Indikator: 'Total Pasien Terdaftar', Nilai: patients.length },
      { Indikator: 'Total Sesi Terapi Selesai', Nilai: therapySessions.length },
      { Indikator: 'Total Pendapatan Kotor (Rp)', Nilai: totalRevenue },
      { Indikator: 'Total Pengeluaran Kas (Rp)', Nilai: totalExpense },
      { Indikator: 'Laba Bersih / Surplus (Rp)', Nilai: netIncome },
      { Indikator: 'Total Produk Herbal', Nilai: herbalProducts.length }
    ];
    exportToExcel(summaryData, `Laporan_Eksekutif_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan Keuangan & Statistik Klinis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi performa praktek Yogi Pangestu: efektivitas terapi saraf kejepit & laba rugi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={handleExportFullReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel Lengkap</span>
          </button>
        </div>
      </div>

      {/* Financial P&L Statement Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Ringkasan Laporan Laba Rugi (Income Statement)</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">Periode Berjalan</span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Revenue Stream */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-bold text-slate-900">
              <span>A. Total Pendapatan Operasional (Kotor)</span>
              <span className="font-mono text-emerald-700">{formatIDR(totalRevenue)}</span>
            </div>
            {revenueBreakdown.map((item) => (
              <div key={item.name} className="flex justify-between text-slate-600 pl-4 text-xs">
                <span>• {item.name}</span>
                <span className="font-mono">{formatIDR(item.value)}</span>
              </div>
            ))}
          </div>

          {/* Expense Stream */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex justify-between font-bold text-slate-900">
              <span>B. Total Beban Operasional & Bahan Medis</span>
              <span className="font-mono text-rose-600">({formatIDR(totalExpense)})</span>
            </div>
            {expenseByCategory.map((item) => (
              <div key={item.category} className="flex justify-between text-slate-600 pl-4 text-xs">
                <span>• {item.category}</span>
                <span className="font-mono">{formatIDR(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Net Profit */}
          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center">
            <div>
              <span className="font-black text-slate-900 text-base block">
                LABA BERSIH (NET SURPLUS):
              </span>
              <span className="text-[11px] text-slate-400">Pendapatan Kotor dikurangi seluruh Pengeluaran</span>
            </div>
            <span
              className={`text-xl font-black font-mono ${
                netIncome >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatIDR(netIncome)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialization Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Fokus Keluhan Pasien
              </h3>
              <p className="text-xs text-slate-500">Spesialisasi Saraf Kejepit & Pasca Stroke</p>
            </div>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complaintDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {complaintDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {complaintDistribution.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-slate-700 font-medium truncate">{c.name}:</span>
                <span className="font-bold text-slate-900">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown by Category */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Struktur Pengeluaran Operasional
              </h3>
              <p className="text-xs text-slate-500">Alokasi biaya jarum, ruko, & obat herbal</p>
            </div>
            <BarChart3 className="w-5 h-5 text-rose-600" />
          </div>

          <div className="h-64">
            {expenseByCategory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Belum ada data pengeluaran
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseByCategory} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickFormatter={(v) => `Rp${v / 1000}k`} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => formatIDR(Number(v))} />
                  <Bar dataKey="amount" fill="#f43f5e" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
