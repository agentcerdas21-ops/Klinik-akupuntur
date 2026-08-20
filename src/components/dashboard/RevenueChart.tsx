import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useClinic } from '../../context/DbContext';
import { formatIDR } from '../../lib/exportUtils';
import { Calendar } from 'lucide-react';

export const RevenueChart: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | 'this_month' | '3m' | '6m' | 'this_year'>('30d');
  const { sales, expenses, income } = useClinic();

  // Aggregate data by date
  const dateMap: Record<string, { date: string; displayDate: string; revenue: number; expense: number; netIncome: number }> = {};

  // Build daily timeline for the last N days
  const daysCount = period === '7d' ? 7 : period === '30d' ? 30 : period === 'this_month' ? 30 : period === '3m' ? 90 : period === '6m' ? 180 : 365;
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const isoDate = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: daysCount > 30 ? 'short' : 'numeric'
    });

    dateMap[isoDate] = {
      date: isoDate,
      displayDate,
      revenue: 0,
      expense: 0,
      netIncome: 0
    };
  }

  // Populate sales & income
  sales.forEach((s) => {
    const dateKey = s.sale_date;
    if (dateMap[dateKey]) {
      dateMap[dateKey].revenue += s.total || 0;
    }
  });

  income.forEach((inc) => {
    const dateKey = inc.income_date;
    if (dateMap[dateKey]) {
      dateMap[dateKey].revenue += inc.amount || 0;
    }
  });

  // Populate expenses
  expenses.forEach((e) => {
    const dateKey = e.expense_date;
    if (dateMap[dateKey]) {
      dateMap[dateKey].expense += e.amount || 0;
    }
  });

  // Calculate Net Income per date
  const chartData = Object.values(dateMap).map((d) => ({
    ...d,
    netIncome: d.revenue - d.expense
  }));

  // Aggregation totals for the selected period
  const periodRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);
  const periodExpense = chartData.reduce((acc, d) => acc + d.expense, 0);
  const periodNet = periodRevenue - periodExpense;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-semibold text-slate-300 mb-1.5">{label}</p>
          <div className="space-y-1">
            <p className="text-emerald-400">
              Pendapatan: <span className="font-bold">{formatIDR(payload[0]?.value || 0)}</span>
            </p>
            <p className="text-rose-400">
              Pengeluaran: <span className="font-bold">{formatIDR(payload[1]?.value || 0)}</span>
            </p>
            <div className="border-t border-slate-700 pt-1 mt-1 font-bold text-sky-300">
              Net Income: {formatIDR(payload[2]?.value || 0)}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Arus Keuangan & Profitabilitas</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pendapatan vs Pengeluaran vs Net Income Klinik
          </p>
        </div>

        {/* Period Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setPeriod('3m')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === '3m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3 Bulan
          </button>
          <button
            onClick={() => setPeriod('6m')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === '6m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6 Bulan
          </button>
          <button
            onClick={() => setPeriod('this_year')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === 'this_year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tahun Ini
          </button>
        </div>
      </div>

      {/* Mini Summary Strip */}
      <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50/70 rounded-xl my-3 px-3 border border-slate-100 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Pendapatan</span>
          <p className="text-sm font-extrabold text-emerald-700">{formatIDR(periodRevenue)}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Pengeluaran</span>
          <p className="text-sm font-extrabold text-rose-600">{formatIDR(periodExpense)}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Net Income Periode</span>
          <p className={`text-sm font-extrabold ${periodNet >= 0 ? 'text-sky-700' : 'text-rose-600'}`}>
            {formatIDR(periodNet)}
          </p>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : `${v / 1000}rb`)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => {
                if (value === 'revenue') return 'Pendapatan';
                if (value === 'expense') return 'Pengeluaran';
                if (value === 'netIncome') return 'Net Income';
                return value;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRev)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExp)"
            />
            <Area
              type="monotone"
              dataKey="netIncome"
              stroke="#0284c7"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNet)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
