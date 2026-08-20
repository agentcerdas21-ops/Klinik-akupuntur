import React, { useState, useEffect } from 'react';
import { Search, User, FileText, Activity, Package, Sparkles, X, ArrowRight } from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { formatIDR, formatDateIndo } from '../../lib/exportUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patientId: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
  onNavigateTab: (tabName: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
  onSelectInvoice,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const { patients, invoices, therapySessions, herbalProducts, services } = useClinic();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle handled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search Results
  const matchedPatients = q
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.patient_code.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.whatsapp.includes(q) ||
          p.main_complaint.toLowerCase().includes(q)
      ).slice(0, 5)
    : patients.slice(0, 3);

  const matchedInvoices = q
    ? invoices.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(q) ||
          (i.patient_name && i.patient_name.toLowerCase().includes(q))
      ).slice(0, 4)
    : [];

  const matchedProducts = q
    ? herbalProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const matchedServices = q
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pasien, kode ACU, faktur INV, layanan, produk herbal..."
            autoFocus
            className="w-full bg-transparent text-slate-900 text-sm md:text-base font-medium placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-mono font-medium text-slate-400 bg-slate-200/70 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 divide-y divide-slate-100 flex-1">
          {/* Patients Section */}
          {matchedPatients.length > 0 && (
            <div className="pt-2 first:pt-0">
              <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-400 tracking-wider uppercase">
                <span>Pasien</span>
                <span className="text-[11px] font-normal lowercase">{matchedPatients.length} hasil</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-emerald-50/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-900">
                            {p.full_name}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-medium">
                            {p.patient_code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{p.main_complaint}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Section */}
          {matchedInvoices.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-400 tracking-wider uppercase">
                <span>Faktur / Invoice</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      onSelectInvoice(inv.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-blue-50/80 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 font-mono">
                            {inv.invoice_number}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({inv.patient_name || 'Umum'})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDateIndo(inv.invoice_date)} • {formatIDR(inv.total)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.payment_status === 'Lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Herbal Products */}
          {matchedProducts.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-400 tracking-wider uppercase">
                <span>Produk Herbal</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onNavigateTab('herbal');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          Stok: {p.stock} {p.unit} • {formatIDR(p.selling_price)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{p.sku}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {matchedServices.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-slate-400 tracking-wider uppercase">
                <span>Layanan Terapi</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onNavigateTab('services');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-100 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.duration} Menit • {formatIDR(s.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchedPatients.length === 0 && matchedInvoices.length === 0 && matchedProducts.length === 0 && matchedServices.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium text-slate-600">Tidak ada data ditemukan untuk "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan nama, nomor kontak, atau kode faktur.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
