import React from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  ShoppingBag,
  CreditCard,
  FileText,
  Stethoscope,
  Package,
  DollarSign,
  BarChart3,
  Database,
  Award,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClinic } from '../../context/DbContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  ownerOnly?: boolean;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab?: (tabId: string) => void;
  setActiveTab?: (tabId: string) => void;
  onNavigate?: (tabId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  setActiveTab,
  onNavigate,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { user, isOwner, role, logout } = useAuth();
  const { patients, unpaidInvoices, lowStockProducts } = useClinic();

  const handleSelect = onSelectTab || setActiveTab || onNavigate || (() => {});

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      id: 'patients',
      label: 'Pasien',
      icon: <Users className="w-5 h-5" />,
      badge: patients.length
    },
    {
      id: 'therapy',
      label: 'Sesi Terapi',
      icon: <Activity className="w-5 h-5" />
    },
    {
      id: 'sales',
      label: 'Penjualan',
      icon: <ShoppingBag className="w-5 h-5" />
    },
    {
      id: 'payments',
      label: 'Pembayaran',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'invoices',
      label: 'Faktur / Invoice',
      icon: <FileText className="w-5 h-5" />,
      badge: unpaidInvoices.length > 0 ? unpaidInvoices.length : undefined,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'services',
      label: 'Layanan',
      icon: <Stethoscope className="w-5 h-5" />
    },
    {
      id: 'herbal',
      label: 'Produk Herbal',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} tipis` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'finance',
      label: 'Keuangan',
      icon: <DollarSign className="w-5 h-5" />,
      ownerOnly: false
    },
    {
      id: 'reports',
      label: 'Laporan',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'backup',
      label: 'Impor & Backup',
      icon: <Database className="w-5 h-5" />,
      ownerOnly: false
    },
    {
      id: 'profile',
      label: 'Profil Praktisi',
      icon: <Award className="w-5 h-5" />
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5" />,
      ownerOnly: false
    }
  ];

  const filteredNav = navItems.filter((item) => !item.ownerOnly || isOwner);

  const handleNavClick = (tabId: string) => {
    handleSelect(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0a1b24] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 shadow-2xl md:shadow-none md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 bg-[#08151c] border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-emerald-900/30">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-base tracking-wider leading-none">
              ACUCARE
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mt-1">
              Clinic Management
            </span>
          </div>
        </div>

        {/* Practitioner Quick Badge */}
        <div className="px-4 py-3 mx-3 mt-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'YP'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100 truncate">{user?.name || 'Yogi Pangestu'}</p>
              <p className="text-[10px] text-emerald-400 font-medium truncate">
                {role === 'OWNER' ? 'Owner / Praktisi' : 'Staff Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Keluar (Logout)"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                id={`sidebar-link-${item.id}`}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Booking CTA */}
        <div className="p-3 border-t border-slate-800/80 bg-[#08151c]">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-900/40">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Hotline Pasien
            </p>
            <p className="text-xs font-semibold text-slate-200 mt-1 font-mono">0813-9967-0676</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Ruko Arcadia A-16, Tambun</p>
          </div>
        </div>
      </aside>
    </>
  );
};
