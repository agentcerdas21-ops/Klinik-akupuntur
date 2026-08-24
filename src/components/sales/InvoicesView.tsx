import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  Building2,
  Phone,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { Invoice, PaymentStatus } from '../../types';
import { formatIDR, formatDateIndo, generateInvoicePDF, exportToExcel } from '../../lib/exportUtils';

interface InvoicesViewProps {
  selectedInvoiceId?: string | null;
  onClearSelectedInvoice?: () => void;
  onOpenNewSale: () => void;
  onViewPatient?: (patientId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  selectedInvoiceId,
  onClearSelectedInvoice,
  onOpenNewSale,
  onViewPatient
}) => {
  const { invoices, patients, settings, addPayment, updateInvoiceStatus } = useClinic();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Quick Pay Modal
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [settleDate, setSettleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState<'Transfer Bank' | 'Tunai / Cash' | 'QRIS'>('Transfer Bank');

  // If selectedInvoiceId prop changes, automatically open preview
  React.useEffect(() => {
    if (selectedInvoiceId) {
      const inv = invoices.find((i) => i.id === selectedInvoiceId);
      if (inv) setActiveInvoice(inv);
    }
  }, [selectedInvoiceId, invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
          (inv.patient_name && inv.patient_name.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'ALL' || inv.payment_status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }, [invoices, search, statusFilter]);

  const totalInvoiced = filteredInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((acc, i) => {
    const sisa = i.outstanding !== undefined ? i.outstanding : (i.payment_status === 'Lunas' ? 0 : Math.max(0, (i.total || 0) - (i.total_paid || 0)));
    return acc + sisa;
  }, 0);

  const handleDownloadPDF = (inv: Invoice) => {
    const patient = patients.find((p) => p.id === inv.patient_id);
    generateInvoicePDF(inv, patient, settings);
  };

  const handleOpenSettleModal = (inv: Invoice) => {
    setPayModalInvoice(inv);
    const sisa = inv.outstanding !== undefined ? inv.outstanding : Math.max(0, inv.total - (inv.total_paid || 0));
    setSettleAmount(sisa);
    setSettleMethod('Transfer Bank');
    setSettleDate(new Date().toISOString().split('T')[0]);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInvoice || settleAmount <= 0) return;

    const sisa = payModalInvoice.outstanding !== undefined ? payModalInvoice.outstanding : Math.max(0, payModalInvoice.total - (payModalInvoice.total_paid || 0));
    if (settleAmount > sisa) {
      alert(`Jumlah pembayaran melebihi sisa tagihan. Maksimal pembayaran adalah ${formatIDR(sisa)}.`);
      return;
    }

    try {
      addPayment({
        invoice_id: payModalInvoice.id,
        patient_id: payModalInvoice.patient_id,
        amount: Number(settleAmount),
        payment_method: settleMethod,
        payment_date: settleDate || new Date().toISOString().split('T')[0],
        status: Number(settleAmount) >= sisa ? 'Lunas' : 'DP',
        notes: `Pelunasan/Cicilan faktur ${payModalInvoice.invoice_number}`
      });

      setPayModalInvoice(null);

      // If currently previewing this invoice, update preview status
      if (activeInvoice?.id === payModalInvoice.id) {
        const newPaid = (activeInvoice.total_paid || 0) + Number(settleAmount);
        const newOutstanding = Math.max(0, activeInvoice.total - newPaid);
        setActiveInvoice({
          ...activeInvoice,
          total_paid: newPaid,
          outstanding: newOutstanding,
          payment_status: newPaid >= activeInvoice.total ? 'Lunas' : 'DP'
        });
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembayaran');
    }
  };

  const handleExportExcel = () => {
    const data = filteredInvoices.map((inv) => ({
      'Nomor Faktur': inv.invoice_number,
      'Tanggal': formatDateIndo(inv.invoice_date),
      'Nama Pasien': inv.patient_name || 'Umum',
      'Subtotal': inv.subtotal,
      'Diskon': inv.discount,
      'Total Akhir': inv.total,
      'Status Pembayaran': inv.payment_status,
      'Metode': inv.payment_method || '-'
    }));
    exportToExcel(data, `Faktur_Penjualan_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Faktur & Tagihan Layanan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar invoice, status pembayaran, dan cetak PDF faktur resmi klinik
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>+ Buat Faktur Baru</span>
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

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Faktur Diterbitkan</span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{filteredInvoices.length} Faktur</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Nilai Tagihan</span>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{formatIDR(totalInvoiced)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Belum Lunas (Sisa Tagihan)</span>
          <p className={`text-2xl font-black mt-1 font-mono ${totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatIDR(totalOutstanding)}
          </p>
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
              placeholder="Cari nomor faktur INV-... atau nama pasien..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Status Pembayaran ({invoices.length})</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
              <option value="DP">Uang Muka (DP)</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Faktur & Tanggal</th>
                <th className="py-3.5 px-4">Pasien</th>
                <th className="py-3.5 px-4">Jumlah Item</th>
                <th className="py-3.5 px-4 text-right">Total Akhir</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-600">Tidak ada faktur ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setActiveInvoice(inv)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 font-mono block">
                            {inv.invoice_number}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatDateIndo(inv.invoice_date)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {(() => {
                        const pat = patients.find(
                          (p) =>
                            p.id === inv.patient_id ||
                            (p.full_name && p.full_name.trim().toLowerCase() === inv.patient_name?.trim().toLowerCase())
                        );
                        return (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {pat ? pat.full_name : inv.patient_name || 'Pasien Umum'}
                              </span>
                              {pat && onViewPatient && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewPatient(pat.id);
                                  }}
                                  className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-mono font-bold px-1.5 py-0.5 rounded-md border border-emerald-200 transition-colors"
                                  title="Buka Rekam Pasien"
                                >
                                  {pat.patient_code}
                                </button>
                              )}
                            </div>
                            {pat?.phone && (
                              <span className="text-[11px] text-slate-500 font-mono block">
                                {pat.phone}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {inv.items?.length || 1} Layanan/Produk
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      {formatIDR(inv.total)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          inv.payment_status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.payment_status === 'DP'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.payment_status !== 'Lunas' && (
                          <button
                            onClick={() => handleOpenSettleModal(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            title="Lunaskan Tagihan Faktur Ini"
                          >
                            Lunaskan
                          </button>
                        )}
                        <button
                          onClick={() => setActiveInvoice(inv)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Faktur"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL INVOICE PREVIEW MODAL */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Actions */}
            <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono text-slate-200">
                  {activeInvoice.invoice_number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeInvoice.payment_status === 'Lunas'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {activeInvoice.payment_status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(activeInvoice)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </button>
                <button
                  onClick={() => {
                    setActiveInvoice(null);
                    if (onClearSelectedInvoice) onClearSelectedInvoice();
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Body */}
            <div className="p-6 md:p-8 space-y-6 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
              {/* Clinic Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900 tracking-tight">
                      {settings.clinic_name}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">
                    {settings.clinic_tagline}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1 max-w-sm">
                    {settings.address}
                  </p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Praktisi: <strong>{settings.owner_name}</strong> • WA: <strong className="font-mono">{settings.whatsapp}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    FAKTUR PEMBAYARAN
                  </span>
                  <p className="font-mono text-base font-black text-slate-900 mt-0.5">
                    {activeInvoice.invoice_number}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Tanggal: {formatDateIndo(activeInvoice.invoice_date)}
                  </p>
                </div>
              </div>

              {/* Patient & Billing Info */}
              {(() => {
                const linkedPatient = patients.find(
                  (p) =>
                    p.id === activeInvoice.patient_id ||
                    (p.full_name && p.full_name.trim().toLowerCase() === activeInvoice.patient_name?.trim().toLowerCase())
                );

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        DITAGIHKAN KEPADA:
                      </span>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900">
                          {linkedPatient ? linkedPatient.full_name : activeInvoice.patient_name || 'Pasien Umum'}
                        </p>
                        {linkedPatient && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {linkedPatient.patient_code}
                          </span>
                        )}
                      </div>
                      {linkedPatient && (
                        <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                          {linkedPatient.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{linkedPatient.phone}</span>
                            </p>
                          )}
                          {linkedPatient.address && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">{linkedPatient.address}</p>
                          )}
                          {onViewPatient && (
                            <button
                              type="button"
                              onClick={() => {
                                onViewPatient(linkedPatient.id);
                                setActiveInvoice(null);
                              }}
                              className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 underline underline-offset-2"
                            >
                              Buka Rekam & Riwayat Pasien →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        METODE & STATUS:
                      </span>
                      <p className="text-xs font-bold text-slate-800">{activeInvoice.payment_method || 'Transfer Bank'}</p>
                      <span
                        className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mt-1.5 ${
                          activeInvoice.payment_status === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activeInvoice.payment_status === 'DP'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        STATUS: {activeInvoice.payment_status}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Deskripsi Item / Layanan</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Harga Satuan</th>
                      <th className="py-2.5 px-4 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeInvoice.items && activeInvoice.items.length > 0 ? (
                      activeInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{item.item_name}</p>
                            <span className="text-[10px] text-slate-400 uppercase">{item.item_type}</span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatIDR(item.unit_price)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatIDR(item.subtotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-bold text-slate-900">Layanan Terapi Akupunktur</td>
                        <td className="py-3 px-4 text-center font-mono">1</td>
                        <td className="py-3 px-4 text-right font-mono">{formatIDR(activeInvoice.total)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">{formatIDR(activeInvoice.total)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{formatIDR(activeInvoice.subtotal || activeInvoice.total)}</span>
                  </div>
                  {activeInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Diskon:</span>
                      <span className="font-mono font-semibold">-{formatIDR(activeInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Tagihan:</span>
                    <span className="font-mono text-emerald-800">{formatIDR(activeInvoice.total)}</span>
                  </div>
                  {((activeInvoice.total_paid !== undefined && activeInvoice.total_paid > 0) || activeInvoice.payment_status === 'Lunas') && (
                    <div className="flex justify-between text-xs font-bold text-emerald-700">
                      <span>Total Dibayar (Termasuk DP):</span>
                      <span className="font-mono">{formatIDR(activeInvoice.total_paid !== undefined ? activeInvoice.total_paid : activeInvoice.total)}</span>
                    </div>
                  )}
                  {(activeInvoice.outstanding !== undefined ? activeInvoice.outstanding : (activeInvoice.payment_status === 'Lunas' ? 0 : Math.max(0, activeInvoice.total - (activeInvoice.total_paid || 0)))) > 0 && (
                    <div className="flex justify-between text-xs font-black text-rose-600 pt-1 border-t border-dashed border-slate-200">
                      <span>Sisa Tagihan:</span>
                      <span className="font-mono">
                        {formatIDR(
                          activeInvoice.outstanding !== undefined
                            ? activeInvoice.outstanding
                            : Math.max(0, activeInvoice.total - (activeInvoice.total_paid || 0))
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Bank Details Footer */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider block">
                    REKENING PEMBAYARAN RESMI KLINIK:
                  </span>
                  <p className="text-xs font-mono font-black text-emerald-900 mt-0.5">
                    {settings.bank_name} : {settings.bank_account_no}
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Atas Nama: <strong className="font-bold">{settings.bank_account_holder}</strong>
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p className="italic">Terima kasih atas kepercayaan Anda berobat di ACUCARE.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SETTLE MODAL */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Pelunasan Faktur {payModalInvoice.invoice_number}
            </h3>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <p className="text-slate-600">Pasien: <strong className="text-slate-900">{payModalInvoice.patient_name || 'Umum'}</strong></p>
              <p className="text-slate-600 mt-1">Total Tagihan: <strong className="text-emerald-800 font-mono font-bold">{formatIDR(payModalInvoice.total)}</strong></p>
            </div>

            <form onSubmit={handleSettleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  required
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Pelunasan (Rp)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Transfer Bank">Transfer Bank (BSI)</option>
                  <option value="Tunai / Cash">Tunai / Cash</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
                >
                  Simpan & Lunaskan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
