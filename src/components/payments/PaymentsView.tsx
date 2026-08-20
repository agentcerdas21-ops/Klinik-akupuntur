import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Receipt,
  FileText,
  User,
  Plus
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { PaymentMethod } from '../../types';
import { formatIDR, formatDateIndo, exportToExcel, generateReceiptPDF } from '../../lib/exportUtils';

interface PaymentsViewProps {
  onSelectInvoice: (invoiceId: string) => void;
  onOpenNewPaymentModal: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  onSelectInvoice,
  onOpenNewPaymentModal
}) => {
  const { payments, invoices, patients, settings } = useClinic();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments
      .filter((pay) => {
        const inv = invoices.find((i) => i.id === pay.invoice_id);
        const pat = patients.find((p) => p.id === pay.patient_id);
        const invNum = inv?.invoice_number || '';
        const patName = pat?.full_name || '';

        const matchesSearch =
          invNum.toLowerCase().includes(search.toLowerCase()) ||
          patName.toLowerCase().includes(search.toLowerCase()) ||
          pay.payment_method.toLowerCase().includes(search.toLowerCase()) ||
          (pay.notes && pay.notes.toLowerCase().includes(search.toLowerCase()));

        const matchesMethod = methodFilter === 'ALL' || pay.payment_method === methodFilter;

        return matchesSearch && matchesMethod;
      })
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [payments, invoices, patients, search, methodFilter]);

  const totalCollected = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const handleExportExcel = () => {
    const data = filteredPayments.map((p) => {
      const inv = invoices.find((i) => i.id === p.invoice_id);
      const pat = patients.find((pt) => pt.id === p.patient_id);
      return {
        'ID Pembayaran': p.id,
        'Tanggal': formatDateIndo(p.payment_date),
        'No Faktur': inv?.invoice_number || '-',
        'Nama Pasien': pat?.full_name || 'Umum',
        'Metode Pembayaran': p.payment_method,
        'Jumlah (Rp)': p.amount,
        'Catatan': p.notes || '-'
      };
    });
    exportToExcel(data, `Penerimaan_Kas_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  const handleDownloadReceipt = (payment: any) => {
    const inv = invoices.find((i) => i.id === payment.invoice_id);
    const pat = patients.find((pt) => pt.id === payment.patient_id);
    generateReceiptPDF(payment, inv, pat, settings);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pencatatan Pembayaran & Kwitansi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Riwayat penerimaan kas, transfer Bank BSI, QRIS, dan debit
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewPaymentModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pembayaran</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Transaksi Masuk</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{filteredPayments.length} Pembayaran</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs sm:col-span-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Kas Diterima (Filtered)</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{formatIDR(totalCollected)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari faktur, pasien, atau catatan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Metode Pembayaran</option>
              <option value="Transfer Bank">Transfer Bank (BSI)</option>
              <option value="Tunai / Cash">Tunai / Cash</option>
              <option value="QRIS">QRIS</option>
              <option value="Kartu Debit/Kredit">Kartu Debit/Kredit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Tanggal & Waktu</th>
                <th className="py-3.5 px-4">Faktur / Invoice</th>
                <th className="py-3.5 px-4">Pasien</th>
                <th className="py-3.5 px-4">Metode Bayar</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-right">Jumlah (Rp)</th>
                <th className="py-3.5 px-4 text-right">Kwitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Belum ada riwayat pembayaran.</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => {
                  const inv = invoices.find((i) => i.id === pay.invoice_id);
                  const pat = patients.find((p) => p.id === pay.patient_id);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatDateIndo(pay.payment_date)}
                      </td>

                      <td className="py-3.5 px-4">
                        {inv ? (
                          <button
                            onClick={() => onSelectInvoice(inv.id)}
                            className="font-mono text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{inv.invoice_number}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">
                          {pat?.full_name || 'Pasien Umum'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-xs text-slate-800">
                          {pay.payment_method}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-xs truncate max-w-xs">
                        {pay.notes || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-800 text-sm">
                        {formatIDR(pay.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(pay)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                          title="Cetak Kwitansi PDF"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Kwitansi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
