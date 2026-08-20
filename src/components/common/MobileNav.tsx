import React from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  CreditCard,
  Menu,
  Plus
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenQuickAction: () => void;
  onToggleMoreMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAction,
  onToggleMoreMenu
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a1b24] border-t border-slate-800 md:hidden px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {/* Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors ${
          activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="mt-1">Ringkasan</span>
      </button>

      {/* Pasien */}
      <button
        onClick={() => onSelectTab('patients')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors ${
          activeTab === 'patients' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="mt-1">Pasien</span>
      </button>

      {/* Center Floating Action Button (+) */}
      <div className="relative -top-4">
        <button
          onClick={onOpenQuickAction}
          id="mobile-quick-action-btn"
          className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 border-2 border-[#0a1b24] active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Terapi */}
      <button
        onClick={() => onSelectTab('therapy')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors ${
          activeTab === 'therapy' ? 'text-emerald-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Activity className="w-5 h-5" />
        <span className="mt-1">Terapi</span>
      </button>

      {/* More / Menu Drawer */}
      <button
        onClick={onToggleMoreMenu}
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-medium transition-colors ${
          activeTab !== 'dashboard' && activeTab !== 'patients' && activeTab !== 'therapy'
            ? 'text-emerald-400 font-bold'
            : 'text-slate-400'
        }`}
      >
        <Menu className="w-5 h-5" />
        <span className="mt-1">Lainnya</span>
      </button>
    </div>
  );
};
