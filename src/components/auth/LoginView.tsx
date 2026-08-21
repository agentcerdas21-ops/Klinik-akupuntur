import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Stethoscope,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('owner@acucare.id');
  const [password, setPassword] = useState('acucare2026');
  const [selectedRole, setSelectedRole] = useState<UserRole>('OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const quickAccounts = [
    {
      name: 'Yogi Pangestu',
      role: 'OWNER' as UserRole,
      title: 'Owner & Praktisi Akupunktur',
      email: 'owner@acucare.id',
      badge: 'Akses Penuh',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      name: 'Siti Rahma',
      role: 'ADMIN' as UserRole,
      title: 'Staf Administrasi & Kasir',
      email: 'admin@acucare.id',
      badge: 'Akses Operasional',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  ];

  const handleSelectQuickAccount = (account: typeof quickAccounts[0]) => {
    setEmail(account.email);
    setSelectedRole(account.role);
    setPassword('acucare2026');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email yang valid.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const success = login(email.trim(), selectedRole);
      if (!success) {
        setErrorMsg('Gagal masuk ke sistem. Periksa kembali email atau peran.');
        setIsLoading(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen w-screen bg-[#071318] text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto selection:bg-emerald-500 selection:text-white">
      {/* Background Ambience Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl transform -translate-y-24" />
        <div className="w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl transform translate-x-32 translate-y-32" />
      </div>

      {/* Top Header Branding */}
      <header className="relative z-10 w-full max-w-md pt-4 text-center">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-700 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-900/40 border border-emerald-400/30">
            A
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white tracking-wider leading-none">
              ACUCARE
            </h1>
            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
              Clinic Management System
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Spesialis Terapi Akupunktur & Herbal Saraf Kejepit / Stroke
        </p>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 w-full max-w-md my-auto py-6">
        <div className="bg-[#0b1c24]/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>Masuk ke Akun Anda</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pilih akun staf klinik atau masukkan data login untuk mengakses aplikasi
            </p>
          </div>

          {/* Quick Account Selector */}
          <div className="space-y-2 mb-6">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilihan Akun Cepat (Klik untuk memilih):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickAccounts.map((acc) => {
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectQuickAccount(acc)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {acc.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{acc.title}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${acc.badgeColor}`}>
                        {acc.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/70 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Alamat Email</span>
              </label>
              <input
                type="email"
                required
                id="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@acucare.id"
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kata Sandi / PIN</span>
                </span>
                <span className="text-[10px] text-slate-500">Default: acucare2026</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Peran / Tingkat Hak Akses</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('OWNER')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === 'OWNER'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Owner (Penuh)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRole === 'ADMIN'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Admin (Staff)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-900"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="login-submit-btn"
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Sistem ACUCARE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer Clinic Location */}
      <footer className="relative z-10 w-full max-w-md pb-2 text-center text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">
          Klinik Akupunktur & Herbal ACUCARE
        </p>
        <p className="mt-0.5">
          Ruko Arcadia Blok A-16, Tambun Selatan, Bekasi &bull; WhatsApp: 0813-9967-0676
        </p>
      </footer>
    </div>
  );
};
