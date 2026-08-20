import React from 'react';
import {
  UserPlus,
  Activity,
  ShoppingBag,
  CreditCard,
  FileText,
  MinusCircle,
  PlusCircle,
  X
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionType: string) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onAction
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'new_patient',
      title: 'Daftar Pasien Baru',
      desc: 'Form registrasi identitas & riwayat keluhan pasien',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
    },
    {
      id: 'new_therapy',
      title: 'Catat Sesi Terapi',
      desc: 'Dokumentasi titik meridian, respons & evaluasi terapi',
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-teal-100 text-teal-700 hover:bg-teal-200'
    },
    {
      id: 'new_sale',
      title: 'Transaksi Penjualan & Kasir',
      desc: 'Layanan akupunktur + pembelian obat herbal',
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
      id: 'new_payment',
      title: 'Catat Pembayaran',
      desc: 'Pelunasan faktur, transfer BSI, QRIS, atau cash',
      icon: <CreditCard className="w-5 h-5" />,
      color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
    },
    {
      id: 'new_expense',
      title: 'Catat Pengeluaran Klinik',
      desc: 'Jarum steril, sewa, listrik, operasional ruko',
      icon: <MinusCircle className="w-5 h-5" />,
      color: 'bg-rose-100 text-rose-700 hover:bg-rose-200'
    },
    {
      id: 'new_income',
      title: 'Pemasukan Tambahan',
      desc: 'Jasa konsultasi korporat / seminar / lainnya',
      icon: <PlusCircle className="w-5 h-5" />,
      color: 'bg-amber-100 text-amber-700 hover:bg-amber-200'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Aksi Cepat Operasional</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pilih tindakan yang ingin dilakukan</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => {
                onAction(act.id);
                onClose();
              }}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 hover:bg-white text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${act.color}`}>
                {act.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {act.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{act.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
