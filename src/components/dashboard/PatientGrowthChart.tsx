import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useClinic } from '../../context/DbContext';

export const PatientGrowthChart: React.FC = () => {
  const { patients, therapySessions } = useClinic();

  // Status Distribution
  const activeCount = patients.filter((p) => p.status === 'Aktif').length;
  const finishedCount = patients.filter((p) => p.status === 'Selesai').length;
  const waitingCount = patients.filter((p) => p.status === 'Menunggu').length;
  const nonactiveCount = patients.filter((p) => p.status === 'Nonaktif').length;

  const statusData = [
    { name: 'Aktif Terapi', value: activeCount || 1, color: '#10b981' },
    { name: 'Selesai / Pulih', value: finishedCount || 0, color: '#0284c7' },
    { name: 'Menunggu Jadwal', value: waitingCount || 0, color: '#f59e0b' },
    { name: 'Non-aktif', value: nonactiveCount || 0, color: '#94a3b8' }
  ].filter((d) => d.value > 0);

  // Common complaints breakdown
  const complaintCounts: Record<string, number> = {
    'Saraf Kejepit (HNP)': 0,
    'Pemulihan Stroke': 0,
    'Nyeri Sendi / Pinggang': 0,
    'Migrain / Leher Kaku': 0,
    'Lainnya': 0
  };

  patients.forEach((p) => {
    const text = (p.main_complaint + ' ' + (p.additional_complaint || '')).toLowerCase();
    if (text.includes('saraf') || text.includes('kejepit') || text.includes('hnp') || text.includes('lumbal')) {
      complaintCounts['Saraf Kejepit (HNP)']++;
    } else if (text.includes('stroke') || text.includes('motorik') || text.includes('lumpuh')) {
      complaintCounts['Pemulihan Stroke']++;
    } else if (text.includes('pinggang') || text.includes('sendi') || text.includes('lutut') || text.includes('sciatica')) {
      complaintCounts['Nyeri Sendi / Pinggang']++;
    } else if (text.includes('leher') || text.includes('cervical') || text.includes('migrain') || text.includes('kepala')) {
      complaintCounts['Migrain / Leher Kaku']++;
    } else {
      complaintCounts['Lainnya']++;
    }
  });

  const complaintBarData = Object.keys(complaintCounts).map((k) => ({
    category: k,
    count: complaintCounts[k]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Complaints Breakdown Bar */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Distribusi Kategori Keluhan Pasien</h4>
            <p className="text-xs text-slate-500 mt-0.5">Spesialisasi Saraf Kejepit & Pemulihan Stroke</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
            {patients.length} Pasien
          </span>
        </div>

        <div className="h-56 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={complaintBarData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                formatter={(val: any) => [`${val} Pasien`, 'Jumlah']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patient Status Donut Pie */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="pb-3 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 text-sm">Status & Retensi Pasien</h4>
          <p className="text-xs text-slate-500 mt-0.5">Rasio pasien aktif berobat & selesai terapi</p>
        </div>

        <div className="h-44 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                innerRadius={45}
                outerRadius={68}
                paddingAngle={4}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, name: any) => [`${val} Pasien`, name]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}:</span>
              <strong className="text-slate-900 font-bold ml-auto">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
