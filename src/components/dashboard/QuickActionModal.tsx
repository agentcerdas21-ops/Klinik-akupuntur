import React from 'react';
import {
  UserPlus,
  Activity,
  Receipt,
  ShoppingBag,
  Package,
  PlusCircle,
  MinusCircle,
  X
} from 'lucide-react';

export interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPatientModal?: () => void;
  onOpenTherapyModal?: () => void;
  onOpenInvoices?: () => void;
  onOpenSaleModal?: () => void;
  onOpenHerbalModal?: () => void;
  onOpenIncomeModal?: () => void;
  onOpenExpenseModal?: () => void;
  onAction?: (actionType: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onOpenPatientModal,
  onOpenTherapyModal,
  onOpenInvoices,
  onOpenSaleModal,
  onOpenHerbalModal,
  onOpenIncomeModal,
  onOpenExpenseModal,
  onAction
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_patient',
      title: '+ Pasien Baru',
      desc: 'Form registrasi identitas & keluhan saraf/stroke pasien',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200',
      handler: () => {
        if (onOpenPatientModal) onOpenPatientModal();
        else if (onAction) onAction('new_patient');
      }
    },
    {
      id: 'new_therapy',
      title: '+ Sesi Terapi',
      desc: 'Catat titik meridian akupunktur & evaluasi sesi baru',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200',
      handler: () => {
        if (onOpenTherapyModal) onOpenTherapyModal();
        else if (onAction) onAction('new_therapy');
      }
    },
    {
      id: 'cashier_invoice',
      title: '+ Kasir / Faktur',
      desc: 'Lihat & kelola faktur tagihan, kwitansi, atau pembayaran',
      icon: <Receipt className="w-5 h-5" />,
      color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200',
      handler: () => {
        if (onOpenInvoices) onOpenInvoices();
        else if (onAction) onAction('cashier_invoice');
      }
    },
    {
      id: 'new_sale',
      title: '+ Penjualan',
      desc: 'Transaksi kasir POS cepat: layanan terapi & obat herbal',
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
      handler: () => {
        if (onOpenSaleModal) onOpenSaleModal();
        else if (onAction) onAction('new_sale');
      }
    },
    {
      id: 'herbal_products',
      title: '+ Produk Herbal',
      desc: 'Katalog stok herbal, restok opname, & audit mutasi',
      icon: <Package className="w-5 h-5" />,
      color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200',
      handler: () => {
        if (onOpenHerbalModal) onOpenHerbalModal();
        else if (onAction) onAction('herbal_products');
      }
    },
    {
      id: 'new_income',
      title: '+ Pemasukan',
      desc: 'Catat pemasukan non-pasien, seminar, atau konsultasi',
      icon: <PlusCircle className="w-5 h-5" />,
      color: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300',
      handler: () => {
        if (onOpenIncomeModal) onOpenIncomeModal();
        else if (onAction) onAction('new_income');
      }
    },
    {
      id: 'new_expense',
      title: '+ Pengeluaran',
      desc: 'Catat biaya jarum steril, alkohol, sewa & operasional',
      icon: <MinusCircle className="w-5 h-5" />,
      color: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200',
      handler: () => {
        if (onOpenExpenseModal) onOpenExpenseModal();
        else if (onAction) onAction('new_expense');
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-500/30">
              +
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Quick Action Menu
              </h3>
              <p className="text-[11px] text-slate-500">Pilih tindakan operasional cepat klinik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                onClose();
                act.handler();
              }}
              className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/60 hover:bg-white text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
            >
              <div className={`p-2 rounded-xl shrink-0 transition-colors border ${act.color}`}>
                {act.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {act.title}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {act.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

