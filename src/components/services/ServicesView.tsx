import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Clock,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { Service } from '../../types';
import { formatIDR } from '../../lib/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ServicesView: React.FC = () => {
  const {
    services,
    serviceCategories,
    addService,
    updateService,
    deleteService
  } = useClinic();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Akupunktur Utama');
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(150000);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingService(null);
    setName('');
    setCategory(serviceCategories[0]?.name || 'Akupunktur Utama');
    setDuration(45);
    setPrice(150000);
    setDescription('');
    setIsActive(true);
    setIsFormModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setCategory(s.category);
    setDuration(s.duration);
    setPrice(s.price);
    setDescription(s.description || '');
    setIsActive(s.active);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      category: category.trim(),
      duration: Number(duration),
      price: Number(price),
      description: description.trim() || '',
      active: isActive
    };

    if (editingService) {
      updateService(editingService.id, payload);
    } else {
      addService(payload);
    }

    setIsFormModalOpen(false);
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(services.map((s) => s.category)));

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Katalog Layanan & Tarif Terapi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar paket penanganan akupunktur medis, stroke recovery, saraf kejepit, dan bekam
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Layanan Baru</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama layanan, paket, atau durasi..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="ALL">Semua Kategori Layanan ({services.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <p className="font-semibold text-slate-600">Tidak ada layanan ditemukan.</p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Layanan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(service.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Layanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                    {service.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{service.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {service.description || 'Prosedur terapi penusukan jarum akupunktur steril pada titik meridian spesifik.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{service.duration} Menit</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Tarif Layanan</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {formatIDR(service.price)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add/Edit Service */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              {editingService ? 'Edit Layanan Terapi' : 'Tambah Layanan Baru'}
            </h3>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Akupunktur Saraf Kejepit Lumbal (L4-L5)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Layanan</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Akupunktur Utama / Bekam"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit)</label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Layanan (Rp) *</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={price === 0 ? '' : price}
                  onChange={(e) => setPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi & Prosedur</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan penanganan, teknik stimulasi titik, dan manfaat terapi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="srv_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="srv_active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Layanan Aktif dan Dapat Dipilih di Kasir
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md"
                >
                  {editingService ? 'Simpan Perubahan' : 'Simpan Layanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteService(deleteTargetId);
        }}
        title="Hapus Layanan Terapi?"
        message="Layanan ini akan dihapus dari katalog tarif klinik."
        confirmText="Hapus Layanan"
        isDangerous={true}
      />
    </div>
  );
};
