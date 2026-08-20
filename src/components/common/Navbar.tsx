import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  FileText,
  Menu,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/DbContext';
import { formatIDR } from '../../lib/exportUtils';

interface NavbarProps {
  onOpenSearch: () => void;
  onToggleMobileSidebar: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectPatient: (patientId: string) => void;
  onSelectInvoice: (invoiceId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onToggleMobileSidebar,
  onNavigateTab,
  onSelectInvoice
}) => {
  const { user, role, switchRole, logout, isOwner } = useAuth();
  const { settings, lowStockProducts, unpaidInvoices } = useClinic();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const totalAlerts = lowStockProducts.length + unpaidInvoices.length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile Toggle & Clinic Title / Subtitle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight text-base md:text-lg">
              {settings.clinic_name || 'ACUCARE'}
            </span>
            <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/60">
              Saraf Kejepit & Stroke
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:block truncate max-w-sm">
            Praktisi: <strong className="text-slate-700 font-semibold">{settings.owner_name}</strong> • Bekasi
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden lg:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-100/80 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 text-xs md:text-sm font-medium transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span>Cari pasien, faktur, obat herbal, terapi...</span>
          </div>
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white rounded border border-slate-300 text-slate-500 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
          title="Cari"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications & Alerts Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifikasi & Peringatan"
          >
            <Bell className="w-5 h-5" />
            {totalAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Popover */}
          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">Pemberitahuan Operasional</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {totalAlerts} Menunggu
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {lowStockProducts.length === 0 && unpaidInvoices.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Semua stok aman dan seluruh tagihan telah lunas.
                  </div>
                ) : (
                  <>
                    {lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigateTab('herbal');
                          setShowAlerts(false);
                        }}
                        className="p-3 hover:bg-amber-50/60 cursor-pointer transition-colors flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                          <p className="text-[11px] text-amber-700 mt-0.5">
                            Stok tersisa <strong className="font-bold">{p.stock} {p.unit}</strong> (Batas min: {p.minimum_stock})
                          </p>
                        </div>
                      </div>
                    ))}

                    {unpaidInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => {
                          onSelectInvoice(inv.id);
                          setShowAlerts(false);
                        }}
                        className="p-3 hover:bg-rose-50/60 cursor-pointer transition-colors flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {inv.invoice_number} • {inv.patient_name || 'Umum'}
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Tagihan <strong className="font-bold">{formatIDR(inv.total)}</strong> ({inv.payment_status})
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500">Role:</span>
          <button
            onClick={() => switchRole(isOwner ? 'ADMIN' : 'OWNER')}
            className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              isOwner
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-indigo-600 text-white shadow-2xs'
            }`}
            title="Klik untuk beralih mode Owner / Admin"
          >
            {role}
          </button>
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name?.charAt(0) || 'Y'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.name || 'Yogi Pangestu'}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold leading-tight">
                {role === 'OWNER' ? 'Owner / Praktisi' : 'Administrator'}
              </span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigateTab('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profil Praktisi & Sertifikat</span>
                </button>
                <button
                  onClick={() => {
                    onNavigateTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Pengaturan & Database</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-xs text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
