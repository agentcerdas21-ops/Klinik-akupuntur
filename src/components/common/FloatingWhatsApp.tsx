import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useClinic } from '../../context/DbContext';

export const FloatingWhatsApp: React.FC = () => {
  const { settings } = useClinic();
  const rawNumber = (settings.whatsapp || '081399670676').replace(/\D/g, '');
  const waNumber = rawNumber.startsWith('0') ? '62' + rawNumber.slice(1) : rawNumber;
  const message = encodeURIComponent('Halo ACUCARE, saya ingin melakukan booking/konsultasi. Mohon informasi jadwal yang tersedia. Terima kasih.');
  const waUrl = `https://wa.me/${waNumber}?text=${message}`;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="floating-whatsapp-btn"
        className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3.5 rounded-full shadow-xl shadow-emerald-700/25 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 focus:ring-4 focus:ring-emerald-300"
      >
        <MessageCircle className="w-5 h-5 fill-current animate-pulse" />
        <span className="text-sm font-bold tracking-tight hidden sm:inline">Booking WhatsApp</span>
        <span className="text-xs bg-emerald-700/80 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/50 hidden md:inline">
          0813-9967-0676
        </span>
      </a>
    </div>
  );
};
