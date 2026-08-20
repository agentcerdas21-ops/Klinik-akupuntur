import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  CreditCard,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  CheckCircle2,
  AlertCircle
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
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useClinic } from '../../context/DbContext';
import {
  formatIDR,
  formatDateIndo,
  exportToExcel,
  exportToCSV,
  generateFinancialReportPDF
} from '../../lib/exportUtils';
import { PaymentMethod } from '../../types';

type PeriodMode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const ReportsView: React.FC = () => {
  const {
    patients,
    therapySessions,
    herbalProducts,
    sales,
    expenses,
    income,
    payments,
    settings,
    totalRevenue: globalRevenue,
    totalExpense: globalExpense,
    netIncome: globalNetIncome
  } = useClinic();

  // Active Period Mode: Harian | Mingguan | Bulanan | Tahunan
  const [periodMode, setPeriodMode] = useState<PeriodMode>('bulanan');

  // Filter Selectors State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Transaction Table Filters
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'PENJUALAN' | 'PEMASUKAN' | 'PENGELUARAN'>('ALL');

  // Available Years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    yearsSet.add(currentYear + 1);

    sales.forEach((s) => {
      if (s.sale_date) yearsSet.add(new Date(s.sale_date).getFullYear());
    });
    expenses.forEach((e) => {
      if (e.expense_date) yearsSet.add(new Date(e.expense_date).getFullYear());
    });
    income.forEach((i) => {
      if (i.income_date) yearsSet.add(new Date(i.income_date).getFullYear());
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [sales, expenses, income]);

  // Compute Period Range & Title
  const { periodTitle, isInPeriod, periodStart, periodEnd } = useMemo(() => {
    if (periodMode === 'harian') {
      const title = formatDateIndo(selectedDate);
      const checkFn = (dateStr?: string) => {
        if (!dateStr) return false;
        return dateStr.split('T')[0] === selectedDate;
      };
      return {
        periodTitle: `Harian - ${title}`,
        isInPeriod: checkFn,
        periodStart: selectedDate,
        periodEnd: selectedDate
      };
    }

    if (periodMode === 'mingguan') {
      const ref = new Date(selectedWeekDate);
      const day = ref.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(ref);
      monday.setDate(ref.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];

      const title = `${formatDateIndo(monStr)} s/d ${formatDateIndo(sunStr)}`;
      const checkFn = (dateStr?: string) => {
        if (!dateStr) return false;
        const d = dateStr.split('T')[0];
        return d >= monStr && d <= sunStr;
      };

      return {
        periodTitle: `Mingguan (${title})`,
        isInPeriod: checkFn,
        periodStart: monStr,
        periodEnd: sunStr
      };
    }

    if (periodMode === 'bulanan') {
      const monthStr = String(selectedMonth).padStart(2, '0');
      const prefix = `${selectedYear}-${monthStr}`;
      const title = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
      const checkFn = (dateStr?: string) => {
        if (!dateStr) return false;
        return dateStr.startsWith(prefix);
      };

      return {
        periodTitle: `Bulanan - ${title}`,
        isInPeriod: checkFn,
        periodStart: `${prefix}-01`,
        periodEnd: `${prefix}-31`
      };
    }

    // Tahunan
    const prefix = `${selectedYear}-`;
    const title = `Tahun ${selectedYear}`;
    const checkFn = (dateStr?: string) => {
      if (!dateStr) return false;
      return dateStr.startsWith(prefix);
    };

    return {
      periodTitle: `Tahunan - ${title}`,
      isInPeriod: checkFn,
      periodStart: `${selectedYear}-01-01`,
      periodEnd: `${selectedYear}-12-31`
    };
  }, [periodMode, selectedDate, selectedWeekDate, selectedMonth, selectedYear]);

  // Filtered Datasets Based on Active Period
  const periodSales = useMemo(() => sales.filter((s) => isInPeriod(s.sale_date)), [sales, isInPeriod]);
  const periodExpenses = useMemo(() => expenses.filter((e) => isInPeriod(e.expense_date)), [expenses, isInPeriod]);
  const periodIncome = useMemo(() => income.filter((i) => isInPeriod(i.income_date)), [income, isInPeriod]);
  const periodPayments = useMemo(() => payments.filter((p) => isInPeriod(p.payment_date)), [payments, isInPeriod]);
  const periodTherapy = useMemo(() => therapySessions.filter((t) => isInPeriod(t.therapy_date)), [therapySessions, isInPeriod]);

  // Financial Metrics Calculation
  const totalSales = useMemo(() => periodSales.reduce((acc, s) => acc + (s.total || 0), 0), [periodSales]);
  const additionalIncome = useMemo(() => periodIncome.reduce((acc, i) => acc + (i.amount || 0), 0), [periodIncome]);
  const totalRevenue = useMemo(() => totalSales + additionalIncome, [totalSales, additionalIncome]);
  const totalExpense = useMemo(() => periodExpenses.reduce((acc, e) => acc + (e.amount || 0), 0), [periodExpenses]);
  const netIncome = useMemo(() => totalRevenue - totalExpense, [totalRevenue, totalExpense]);
  const totalPaymentsAmount = useMemo(() => periodPayments.reduce((acc, p) => acc + (p.amount || 0), 0), [periodPayments]);

  const totalTransactions = periodSales.length + periodIncome.length + periodExpenses.length;

  // Distinct Patients Served in Period
  const distinctPatients = useMemo(() => {
    const patientIds = new Set<string>();
    periodSales.forEach((s) => {
      if (s.patient_id) patientIds.add(s.patient_id);
    });
    periodTherapy.forEach((t) => {
      if (t.patient_id) patientIds.add(t.patient_id);
    });
    return patientIds.size;
  }, [periodSales, periodTherapy]);

  // Average Daily Income for Monthly
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const avgDailyIncome = useMemo(() => {
    if (periodMode === 'bulanan') {
      return totalRevenue / (daysInMonth || 30);
    }
    if (periodMode === 'mingguan') {
      return totalRevenue / 7;
    }
    return totalRevenue;
  }, [periodMode, totalRevenue, daysInMonth]);

  // Revenue Breakdown by Source (Layanan Terapi vs Herbal vs Pemasukan Lainnya)
  const revenueSources = useMemo(() => {
    let therapyTotal = 0;
    let herbalTotal = 0;

    periodSales.forEach((s) => {
      s.items?.forEach((item) => {
        if (item.item_type === 'service') {
          therapyTotal += item.subtotal;
        } else {
          herbalTotal += item.subtotal;
        }
      });
    });

    // Fallback if standalone therapy sessions recorded
    if (therapyTotal === 0 && periodTherapy.length > 0) {
      therapyTotal = periodTherapy.reduce((acc, t) => acc + (t.cost || 0), 0);
    }

    return [
      {
        name: 'Layanan Terapi Akupunktur',
        value: therapyTotal,
        color: '#0d9488',
        desc: 'Akupunktur Saraf Kejepit, Stroke, Sendi & Umum'
      },
      {
        name: 'Produk Obat Herbal',
        value: herbalTotal,
        color: '#2563eb',
        desc: 'Formula herbal, minyak gosok, suplemen'
      },
      {
        name: 'Pemasukan Manual Lainnya',
        value: additionalIncome,
        color: '#8b5cf6',
        desc: 'Konsultasi korporat, seminar, dsb.'
      }
    ];
  }, [periodSales, periodTherapy, additionalIncome]);

  // Expense Breakdown by Category
  const expenseCategories = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {};
    periodExpenses.forEach((e) => {
      const cat = e.category || 'Lainnya';
      if (!map[cat]) {
        map[cat] = { amount: 0, count: 0 };
      }
      map[cat].amount += e.amount;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, totalExpense]);

  // Periodic Charts Data
  const chartData = useMemo(() => {
    if (periodMode === 'mingguan') {
      // 7 days Monday to Sunday
      const ref = new Date(selectedWeekDate);
      const day = ref.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(ref);
      monday.setDate(ref.getDate() + diffToMonday);

      const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
      return days.map((dayName, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        const dStr = d.toISOString().split('T')[0];

        const daySales = sales.filter((s) => s.sale_date?.split('T')[0] === dStr).reduce((acc, s) => acc + (s.total || 0), 0);
        const dayInc = income.filter((i) => i.income_date?.split('T')[0] === dStr).reduce((acc, i) => acc + (i.amount || 0), 0);
        const dayExp = expenses.filter((e) => e.expense_date?.split('T')[0] === dStr).reduce((acc, e) => acc + (e.amount || 0), 0);

        const rev = daySales + dayInc;
        return {
          label: `${dayName} (${d.getDate()}/${d.getMonth() + 1})`,
          shortLabel: dayName,
          pemasukan: rev,
          pengeluaran: dayExp,
          net: rev - dayExp
        };
      });
    }

    if (periodMode === 'bulanan') {
      // Days 1 to daysInMonth
      const monthStr = String(selectedMonth).padStart(2, '0');
      const daysCount = new Date(selectedYear, selectedMonth, 0).getDate();

      const result = [];
      for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
        const dayStr = `${selectedYear}-${monthStr}-${String(dayNum).padStart(2, '0')}`;
        const daySales = sales.filter((s) => s.sale_date?.split('T')[0] === dayStr).reduce((acc, s) => acc + (s.total || 0), 0);
        const dayInc = income.filter((i) => i.income_date?.split('T')[0] === dayStr).reduce((acc, i) => acc + (i.amount || 0), 0);
        const dayExp = expenses.filter((e) => e.expense_date?.split('T')[0] === dayStr).reduce((acc, e) => acc + (e.amount || 0), 0);

        const rev = daySales + dayInc;
        result.push({
          label: `Tgl ${dayNum}`,
          shortLabel: `${dayNum}`,
          pemasukan: rev,
          pengeluaran: dayExp,
          net: rev - dayExp
        });
      }
      return result;
    }

    if (periodMode === 'tahunan') {
      // 12 Months comparison
      return MONTH_NAMES.map((mName, idx) => {
        const mStr = String(idx + 1).padStart(2, '0');
        const prefix = `${selectedYear}-${mStr}`;

        const mSales = sales.filter((s) => s.sale_date?.startsWith(prefix)).reduce((acc, s) => acc + (s.total || 0), 0);
        const mInc = income.filter((i) => i.income_date?.startsWith(prefix)).reduce((acc, i) => acc + (i.amount || 0), 0);
        const mExp = expenses.filter((e) => e.expense_date?.startsWith(prefix)).reduce((acc, e) => acc + (e.amount || 0), 0);

        const rev = mSales + mInc;
        return {
          label: mName,
          shortLabel: mName.substring(0, 3),
          pemasukan: rev,
          pengeluaran: mExp,
          net: rev - mExp
        };
      });
    }

    // Harian Chart Data
    return [
      { label: 'Penjualan Terapi & Herbal', nominal: totalSales, fill: '#059669' },
      { label: 'Pemasukan Lainnya', nominal: additionalIncome, fill: '#8b5cf6' },
      { label: 'Pengeluaran Operasional', nominal: totalExpense, fill: '#e11d48' },
      { label: 'Laba Bersih (Net)', nominal: netIncome, fill: netIncome >= 0 ? '#10b981' : '#f43f5e' }
    ];
  }, [periodMode, selectedWeekDate, selectedMonth, selectedYear, sales, income, expenses, totalSales, additionalIncome, totalExpense, netIncome]);

  // Combined Financial Transactions Ledger for the Period
  const periodTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'Penjualan' | 'Pemasukan' | 'Pengeluaran';
      category: string;
      description: string;
      reference: string;
      amount: number;
      status: string;
      payment_method?: string;
    }> = [];

    periodSales.forEach((s) => {
      const itemsDesc = s.items?.map((i) => `${i.item_name} (${i.quantity}x)`).join(', ') || 'Layanan & Herbal';
      list.push({
        id: `sale_${s.id}`,
        date: s.sale_date,
        type: 'Penjualan',
        category: s.items?.some((i) => i.item_type === 'service') ? 'Layanan Terapi & Herbal' : 'Produk Herbal',
        description: itemsDesc,
        reference: s.patient_name || (s.patient_id ? `Pasien ID: ${s.patient_id.slice(-4)}` : 'Pasien Umum'),
        amount: s.total,
        status: s.payment_status || 'Lunas',
        payment_method: s.payment_method
      });
    });

    periodIncome.forEach((inc) => {
      list.push({
        id: `inc_${inc.id}`,
        date: inc.income_date,
        type: 'Pemasukan',
        category: inc.category || 'Pemasukan Lain',
        description: inc.description,
        reference: inc.source || 'Kas Masuk',
        amount: inc.amount,
        status: 'Lunas'
      });
    });

    periodExpenses.forEach((exp) => {
      list.push({
        id: `exp_${exp.id}`,
        date: exp.expense_date,
        type: 'Pengeluaran',
        category: exp.category,
        description: exp.description,
        reference: exp.notes || 'Operasional',
        amount: exp.amount,
        status: 'Beban Dibayar',
        payment_method: exp.payment_method
      });
    });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [periodSales, periodIncome, periodExpenses]);

  // Filtered Table Transactions
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      const matchSearch =
        tx.description.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.category.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.reference.toLowerCase().includes(txSearch.toLowerCase()) ||
        tx.date.includes(txSearch);

      if (!matchSearch) return false;

      if (txTypeFilter === 'PENJUALAN') return tx.type === 'Penjualan';
      if (txTypeFilter === 'PEMASUKAN') return tx.type === 'Pemasukan';
      if (txTypeFilter === 'PENGELUARAN') return tx.type === 'Pengeluaran';
      return true;
    });
  }, [periodTransactions, txSearch, txTypeFilter]);

  // Navigation Handlers for Period Selectors
  const handlePrevPeriod = () => {
    if (periodMode === 'harian') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (periodMode === 'mingguan') {
      const d = new Date(selectedWeekDate);
      d.setDate(d.getDate() - 7);
      setSelectedWeekDate(d.toISOString().split('T')[0]);
    } else if (periodMode === 'bulanan') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear((y) => y - 1);
      } else {
        setSelectedMonth((m) => m - 1);
      }
    } else if (periodMode === 'tahunan') {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNextPeriod = () => {
    if (periodMode === 'harian') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (periodMode === 'mingguan') {
      const d = new Date(selectedWeekDate);
      d.setDate(d.getDate() + 7);
      setSelectedWeekDate(d.toISOString().split('T')[0]);
    } else if (periodMode === 'bulanan') {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear((y) => y + 1);
      } else {
        setSelectedMonth((m) => m + 1);
      }
    } else if (periodMode === 'tahunan') {
      setSelectedYear((y) => y + 1);
    }
  };

  // Export Handlers
  const handleExportExcel = () => {
    const summaryData = [
      { 'Indikator': 'Periode Laporan', 'Nilai': periodTitle },
      { 'Indikator': 'Total Pemasukan (Revenue)', 'Nilai': totalRevenue },
      { 'Indikator': 'Total Penjualan Kasir', 'Nilai': totalSales },
      { 'Indikator': 'Total Pengeluaran (Beban)', 'Nilai': totalExpense },
      { 'Indikator': 'Laba Bersih (Net Income)', 'Nilai': netIncome },
      { 'Indikator': 'Jumlah Transaksi', 'Nilai': totalTransactions },
      { 'Indikator': 'Jumlah Pasien Terlayani', 'Nilai': distinctPatients },
      { 'Indikator': 'Total Pembayaran Masuk', 'Nilai': totalPaymentsAmount }
    ];

    const txData = filteredTransactions.map((t, idx) => ({
      'No': idx + 1,
      'Tanggal': formatDateIndo(t.date),
      'Jenis': t.type,
      'Kategori': t.category,
      'Deskripsi': t.description,
      'Referensi / Pasien': t.reference,
      'Nominal (Rp)': t.amount,
      'Status': t.status,
      'Metode': t.payment_method || '-'
    }));

    const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToExcel(
      txData.length > 0 ? txData : summaryData,
      `Laporan_Keuangan_${cleanPeriod}`
    );
  };

  const handleExportCSV = () => {
    const txData = filteredTransactions.map((t, idx) => ({
      'No': idx + 1,
      'Tanggal': formatDateIndo(t.date),
      'Jenis': t.type,
      'Kategori': t.category,
      'Deskripsi': t.description,
      'Referensi': t.reference,
      'Nominal': t.amount,
      'Status': t.status
    }));

    const cleanPeriod = periodTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToCSV(txData, `Laporan_Keuangan_${cleanPeriod}`);
  };

  const handleDownloadPDF = () => {
    generateFinancialReportPDF(
      periodTitle,
      {
        totalRevenue,
        totalSales,
        totalExpense,
        netIncome,
        totalTransactions,
        totalPatients: distinctPatients,
        totalPayments: totalPaymentsAmount
      },
      revenueSources,
      expenseCategories,
      filteredTransactions,
      settings
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Laporan Keuangan Praktek
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring arus kas, laba bersih & sumber pendapatan praktek Yogi Pangestu
              </p>
            </div>
          </div>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Cetak Laporan"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export CSV"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Unduh Laporan PDF"
          >
            <Download className="w-4 h-4" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Period Filter Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Period Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setPeriodMode('harian')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'harian'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setPeriodMode('mingguan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'mingguan'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setPeriodMode('bulanan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'bulanan'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriodMode('tahunan')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodMode === 'tahunan'
                  ? 'bg-white text-emerald-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Quick Info Period Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Periode Aktif:</span>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-xs rounded-full">
              {periodTitle}
            </span>
          </div>
        </div>

        {/* Period Selector Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPeriod}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Periode Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mode: Harian Date Selector */}
            {periodMode === 'harian' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                />
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Hari Ini
                </button>
              </div>
            )}

            {/* Mode: Mingguan Selector */}
            {periodMode === 'mingguan' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedWeekDate}
                  onChange={(e) => setSelectedWeekDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                />
                <button
                  onClick={() => setSelectedWeekDate(todayStr)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Minggu Ini
                </button>
              </div>
            )}

            {/* Mode: Bulanan Selector */}
            {periodMode === 'bulanan' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setSelectedMonth(new Date().getMonth() + 1);
                    setSelectedYear(new Date().getFullYear());
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Bulan Ini
                </button>
              </div>
            )}

            {/* Mode: Tahunan Selector */}
            {periodMode === 'tahunan' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-emerald-500 cursor-pointer"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedYear(new Date().getFullYear())}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Tahun Ini
                </button>
              </div>
            )}

            <button
              onClick={handleNextPeriod}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Periode Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            *Semua metrik dan grafik otomatis terupdate sesuai data transaksi real di database.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards for the Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pemasukan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Pemasukan</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
              {formatIDR(totalRevenue)}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <span>Penjualan: {formatIDR(totalSales)}</span>
              {additionalIncome > 0 && <span>+ Lain: {formatIDR(additionalIncome)}</span>}
            </div>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Pengeluaran</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black font-mono text-rose-600">
              {formatIDR(totalExpense)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {periodExpenses.length} catatan transaksi beban
            </p>
          </div>
        </div>

        {/* Card 3: Net Income (Laba Bersih) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Laba Bersih (Net Income)</span>
            <span
              className={`p-2 rounded-xl ${
                netIncome >= 0 ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p
              className={`text-xl sm:text-2xl font-black font-mono ${
                netIncome >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatIDR(netIncome)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Pemasukan - Pengeluaran</p>
          </div>
        </div>

        {/* Card 4: Volume & Pasien */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Volume & Kunjungan</span>
            <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {totalTransactions}
              </p>
              <span className="text-xs text-slate-500">Tx</span>
              <span className="text-slate-300">|</span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {distinctPatients}
              </p>
              <span className="text-xs text-slate-500">Pasien</span>
            </div>
            {periodMode === 'bulanan' ? (
              <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                Rata-rata: {formatIDR(avgDailyIncome)} /hari
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                Bayar Masuk: {formatIDR(totalPaymentsAmount)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Visual Dynamic Chart Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>
                {periodMode === 'harian' && `Grafik Keuangan Harian (${formatDateIndo(selectedDate)})`}
                {periodMode === 'mingguan' && 'Grafik Keuangan Mingguan (Senin - Minggu)'}
                {periodMode === 'bulanan' && `Grafik Harian Pemasukan vs Pengeluaran (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})`}
                {periodMode === 'tahunan' && `Grafik Evaluasi Keuangan Tahunan (12 Bulan ${selectedYear})`}
              </span>
            </h3>
            <p className="text-xs text-slate-500">Komparasi data transaksi real dari database klinik</p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">Pengeluaran</span>
            </div>
            {periodMode === 'tahunan' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600 font-medium">Net Income</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-72 w-full">
          {periodMode === 'harian' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickFormatter={(v) => `Rp${v / 1000}k`} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(v: any) => formatIDR(Number(v))} />
                <Bar dataKey="nominal" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="shortLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickFormatter={(v) => `Rp${v / 1000}k`} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(v: any, name: any) => [
                    formatIDR(Number(v)),
                    name === 'pemasukan' ? 'Pemasukan' : name === 'pengeluaran' ? 'Pengeluaran' : 'Laba Bersih'
                  ]}
                />
                <Bar dataKey="pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} name="pemasukan" />
                <Bar dataKey="pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} name="pengeluaran" />
                {periodMode === 'tahunan' && (
                  <Bar dataKey="net" fill="#3b82f6" radius={[4, 4, 0, 0]} name="net" />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdown Grid: Sumber Pemasukan vs Detail Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Detail Sumber Pemasukan */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Detail Sumber Pemasukan</span>
              </h3>
              <p className="text-xs text-slate-500">Distribusi layanan akupunktur & penjualan herbal</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {formatIDR(totalRevenue)}
            </span>
          </div>

          <div className="space-y-3">
            {revenueSources.map((src) => {
              const pct = totalRevenue > 0 ? ((src.value / totalRevenue) * 100).toFixed(1) : '0';
              return (
                <div
                  key={src.name}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: src.color }}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{src.name}</p>
                      <p className="text-[11px] text-slate-500 leading-snug">{src.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black font-mono text-slate-900">
                      {formatIDR(src.value)}
                    </p>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Box: Detail Pengeluaran Berdasarkan Kategori */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Detail Pengeluaran per Kategori</span>
              </h3>
              <p className="text-xs text-slate-500">Struktur beban jarum steril, sewa, listrik & operasional</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-600">
              {formatIDR(totalExpense)}
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {expenseCategories.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada data pengeluaran pada periode ini.
              </div>
            ) : (
              expenseCategories.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{cat.category}</p>
                    <p className="text-[10px] text-slate-500">{cat.count} transaksi pengeluaran</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black font-mono text-rose-700">
                      {formatIDR(cat.amount)}
                    </p>
                    <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Financial Transactions Ledger */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Buku Transaksi Keuangan Periode ({filteredTransactions.length} Data)</span>
            </h3>
            <p className="text-xs text-slate-500">Rincian mutasi transaksi kasir, pemasukan, dan pengeluaran</p>
          </div>

          {/* Search & Type Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-emerald-500 w-40 sm:w-52"
              />
            </div>

            <select
              value={txTypeFilter}
              onChange={(e: any) => setTxTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="PENJUALAN">Penjualan</option>
              <option value="PEMASUKAN">Pemasukan</option>
              <option value="PENGELUARAN">Pengeluaran</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold">
                <th className="py-3 px-3.5 rounded-l-xl">Tanggal</th>
                <th className="py-3 px-3.5">Jenis</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5">Deskripsi</th>
                <th className="py-3 px-3.5">Pasien / Referensi</th>
                <th className="py-3 px-3.5 text-right">Nominal</th>
                <th className="py-3 px-3.5 text-center rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada catatan transaksi yang sesuai dengan filter periode.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 text-slate-600 font-medium whitespace-nowrap">
                      {formatDateIndo(tx.date)}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'Penjualan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type === 'Pemasukan'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 font-semibold whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-3 px-3.5 text-slate-800 max-w-xs truncate" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td
                      className={`py-3 px-3.5 text-right font-black font-mono whitespace-nowrap ${
                        tx.type === 'Pengeluaran' ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {tx.type === 'Pengeluaran' ? `- ${formatIDR(tx.amount)}` : `+ ${formatIDR(tx.amount)}`}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'Lunas' || tx.status === 'Beban Dibayar'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
