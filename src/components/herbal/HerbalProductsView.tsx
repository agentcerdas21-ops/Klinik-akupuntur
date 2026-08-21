import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Edit,
  Trash2,
  Download,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { useAuth } from '../../context/AuthContext';
import { HerbalProduct, StockAdjustmentReason } from '../../types';
import { formatIDR, exportToExcel } from '../../lib/exportUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const HerbalProductsView: React.FC = () => {
  const { user } = useAuth();
  const {
    herbalProducts,
    productCategories,
    lowStockProducts,
    stockAdjustments,
    addHerbalProduct,
    updateHerbalProduct,
    deleteHerbalProduct,
    adjustProductStock,
    recordStockAdjustment
  } = useClinic();

  // Active View Tab: 'products' | 'audit_trail'
  const [activeTab, setActiveTab] = useState<'products' | 'audit_trail'>('products');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'SAFE'>('ALL');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<HerbalProduct | null>(null);

  // Advanced Stock Adjustment Modal
  const [stockAdjustmentTarget, setStockAdjustmentTarget] = useState<HerbalProduct | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'SET'>('IN');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<StockAdjustmentReason>('Barang Masuk / Pembelian');
  const [adjustNotes, setAdjustNotes] = useState('');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Herbal Saraf');
  const [buyPrice, setBuyPrice] = useState(50000);
  const [sellingPrice, setSellingPrice] = useState(85000);
  const [stock, setStock] = useState(20);
  const [minStock, setMinStock] = useState(5);
  const [unit, setUnit] = useState('Botol');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`HRB-${Math.floor(100 + Math.random() * 900)}`);
    setCategory(productCategories[0]?.name || 'Herbal Saraf');
    setBuyPrice(50000);
    setSellingPrice(85000);
    setStock(20);
    setMinStock(5);
    setUnit('Botol');
    setDescription('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: HerbalProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setBuyPrice(p.purchase_price);
    setSellingPrice(p.selling_price);
    setStock(p.stock);
    setMinStock(p.minimum_stock);
    setUnit(p.unit);
    setDescription(p.description || '');
    setIsFormModalOpen(true);
  };

  const openStockModal = (p: HerbalProduct, defaultType: 'IN' | 'OUT' | 'SET' = 'IN') => {
    setStockAdjustmentTarget(p);
    setAdjustType(defaultType);
    setAdjustQty(defaultType === 'SET' ? p.stock : 10);
    setAdjustReason(
      defaultType === 'IN'
        ? 'Barang Masuk / Pembelian'
        : defaultType === 'OUT'
        ? 'Barang Rusak / Kadaluarsa'
        : 'Koreksi Stok Fisik / Opname'
    );
    setAdjustNotes('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      purchase_price: Number(buyPrice),
      selling_price: Number(sellingPrice),
      stock: Number(stock),
      minimum_stock: Number(minStock),
      unit: unit.trim(),
      active: true,
      description: description.trim() || ''
    };

    if (editingProduct) {
      updateHerbalProduct(editingProduct.id, payload);
    } else {
      addHerbalProduct(payload);
    }

    setIsFormModalOpen(false);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustmentTarget) return;

    if (adjustType === 'IN' && adjustQty <= 0) {
      return alert('Jumlah barang masuk harus lebih dari 0');
    }
    if (adjustType === 'OUT') {
      if (adjustQty <= 0) return alert('Jumlah pengurangan harus lebih dari 0');
      if (adjustQty > stockAdjustmentTarget.stock) {
        return alert(`Pengurangan (${adjustQty}) melebihi stok yang ada (${stockAdjustmentTarget.stock})`);
      }
    }
    if (adjustType === 'SET' && adjustQty < 0) {
      return alert('Stok fisik tidak boleh negatif');
    }

    recordStockAdjustment({
      product_id: stockAdjustmentTarget.id,
      adjustment_type: adjustType,
      quantity_change: Number(adjustQty),
      reason: adjustReason,
      notes: adjustNotes || undefined,
      adjusted_by: user?.name || 'Admin'
    });

    setStockAdjustmentTarget(null);
  };

  const filteredProducts = useMemo(() => {
    return herbalProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

      let matchesStock = true;
      if (stockStatusFilter === 'LOW') {
        matchesStock = p.stock <= p.minimum_stock && p.stock > 0;
      } else if (stockStatusFilter === 'OUT') {
        matchesStock = p.stock <= 0;
      } else if (stockStatusFilter === 'SAFE') {
        matchesStock = p.stock > p.minimum_stock;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [herbalProducts, search, categoryFilter, stockStatusFilter]);

  // Calculate total inventory value
  const totalStockValue = useMemo(
    () => herbalProducts.reduce((acc, p) => acc + p.stock * p.selling_price, 0),
    [herbalProducts]
  );
  const totalCostValue = useMemo(
    () => herbalProducts.reduce((acc, p) => acc + p.stock * p.purchase_price, 0),
    [herbalProducts]
  );

  const handleExportExcel = () => {
    const dataToExport = filteredProducts.map((p) => ({
      'SKU': p.sku,
      'Nama Produk': p.name,
      'Kategori': p.category,
      'Stok Saat Ini': p.stock,
      'Batas Min': p.minimum_stock,
      'Satuan': p.unit,
      'Harga Beli (Modal)': p.purchase_price,
      'Harga Jual': p.selling_price,
      'Total Nilai Jual': p.stock * p.selling_price,
      'Total Modal (HPP)': p.stock * p.purchase_price,
      'Status': p.stock <= 0 ? 'Habis' : p.stock <= p.minimum_stock ? 'Menipis' : 'Aman'
    }));
    exportToExcel(dataToExport, `Stok_Herbal_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportAuditTrail = () => {
    const dataToExport = stockAdjustments.map((a) => {
      const delta = a.quantity_change ?? a.delta_quantity ?? 0;
      return {
        'Waktu': new Date(a.created_at).toLocaleString('id-ID'),
        'SKU Produk': a.product_sku || '-',
        'Nama Produk': a.product_name,
        'Tipe Mutasi': a.adjustment_type || a.type || 'ADJ',
        'Perubahan (Delta)': delta > 0 ? `+${delta}` : `${delta}`,
        'Stok Sebelum': a.stock_before,
        'Stok Sesudah': a.stock_after,
        'Alasan / Kategori': a.reason,
        'Catatan': a.notes || '-',
        'No. Ref / Faktur': a.reference_id || '-',
        'Petugas': a.adjusted_by || a.created_by || 'Admin'
      };
    });
    exportToExcel(dataToExport, `Mutasi_Stok_ACUCARE_${new Date().toISOString().split('T')[0]}`);
  };

  const categories = useMemo(
    () => Array.from(new Set(herbalProducts.map((p) => p.category))),
    [herbalProducts]
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Produk Herbal & Stok
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventori obat herbal, riwayat audit mutasi stok, dan restok otomatis terintegrasi kasir POS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'products' ? (
            <>
              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Produk Herbal Baru</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download Rekap Stok Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleExportAuditTrail}
              className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Riwayat Mutasi Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Produk & Stok ({herbalProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_trail')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audit_trail'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Audit Mutasi Stok ({stockAdjustments.length})</span>
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && activeTab === 'products' && (
        <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-950">
                Peringatan: {lowStockProducts.length} Produk Herbal Mencapai Batas Minimum!
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Segera lakukan restok agar tidak mengganggu operasional pengobatan pasien.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lowStockProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openStockModal(p, 'IN')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Restok {p.name}</span>
                <span className="bg-rose-800 px-1.5 py-0.2 rounded text-[10px]">
                  {p.stock} {p.unit}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: PRODUCTS LIST */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Jenis Produk
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{herbalProducts.length} Item</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Nilai Jual
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{formatIDR(totalStockValue)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Modal Persediaan (HPP)
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{formatIDR(totalCostValue)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Produk Perlu Restok
              </span>
              <p
                className={`text-2xl font-black mt-1 font-mono ${
                  lowStockProducts.length > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {lowStockProducts.length} Item
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama produk, SKU, atau kategori..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="ALL">Semua Kategori ({herbalProducts.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="ALL">Semua Status Stok</option>
                  <option value="LOW">Stok Menipis ({lowStockProducts.length})</option>
                  <option value="OUT">Stok Habis</option>
                  <option value="SAFE">Stok Aman</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">SKU & Nama Produk</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4 text-center">Stok & Status</th>
                    <th className="py-3.5 px-4 text-right">Harga Modal</th>
                    <th className="py-3.5 px-4 text-right">Harga Jual</th>
                    <th className="py-3.5 px-4 text-right">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <p className="font-semibold text-slate-600">Tidak ada produk ditemukan.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLow = product.stock <= product.minimum_stock && product.stock > 0;
                      const isOut = product.stock <= 0;
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* SKU & Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isOut
                                    ? 'bg-rose-200 text-rose-900'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                <Package className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block group-hover:text-emerald-800 transition-colors">
                                  {product.name}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 font-medium">
                                  {product.sku}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4 text-slate-600 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                              {product.category}
                            </span>
                          </td>

                          {/* Stock & Status */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold text-xs font-mono ${
                                  isOut
                                    ? 'bg-rose-200 text-rose-900 border border-rose-300'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {product.stock} {product.unit}
                              </span>
                              {isLow && (
                                <span className="text-[10px] text-amber-700 font-bold">
                                  (Min: {product.minimum_stock})
                                </span>
                              )}
                              {isOut && (
                                <span className="text-[10px] text-rose-700 font-bold">
                                  (Habis)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Buy Price */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                            {formatIDR(product.purchase_price)}
                          </td>

                          {/* Selling Price */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatIDR(product.selling_price)}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openStockModal(product, 'IN')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Atur Stok / Mutasi"
                              >
                                ± Stok
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Produk"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetId(product.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL / RIWAYAT MUTASI */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Log Mutasi & Audit Stok</h3>
                <p className="text-xs text-slate-500">
                  Semua transaksi penjualan kasir, restok barang, koreksi opname tercatat otomatis
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4 text-center">Tipe & Perubahan</th>
                    <th className="py-3 px-4 text-center">Stok (Sebelum → Sesudah)</th>
                    <th className="py-3 px-4">Alasan & Catatan</th>
                    <th className="py-3 px-4 text-right">Petugas / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {stockAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-semibold text-slate-600">Belum ada riwayat mutasi stok tercatat.</p>
                      </td>
                    </tr>
                  ) : (
                    stockAdjustments.map((item) => {
                      const delta = item.quantity_change ?? item.delta_quantity ?? 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(item.created_at).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{item.product_name}</p>
                            {item.product_sku && (
                              <p className="text-[10px] font-mono text-slate-500">{item.product_sku}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                                delta > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {delta > 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs">
                            <span className="text-slate-500">{item.stock_before}</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            <span className="font-bold text-slate-900">{item.stock_after}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 text-xs">{item.reason}</p>
                            {item.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5">{item.notes}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-xs font-medium text-slate-700 block">
                              {item.adjusted_by || item.created_by || 'Admin'}
                            </span>
                            {item.reference_id && (
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                Ref: {item.reference_id.substring(0, 10)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Herbal Product */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
              {editingProduct ? 'Edit Data Produk Herbal' : 'Tambah Produk Herbal Baru'}
            </h3>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Kapsul Herbal Saraf Kejepit Lumbal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Kode *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Herbal Saraf / Herbal Stroke"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Botol / Box / Pcs"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Beli Modal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={buyPrice === 0 ? '' : buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={sellingPrice === 0 ? '' : sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    min={1}
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Aturan Pakai</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Khasiat, aturan minum, dan anjuran konsumsi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Advanced Stock Adjustment */}
      {stockAdjustmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Penyesuaian & Mutasi Stok
            </h3>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <p className="text-xs font-bold text-slate-900">{stockAdjustmentTarget.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                Stok saat ini: <strong className="text-slate-800">{stockAdjustmentTarget.stock} {stockAdjustmentTarget.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="mt-4 space-y-3.5">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aksi Mutasi</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('IN');
                      setAdjustReason('Barang Masuk / Pembelian');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      adjustType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + Barang Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('OUT');
                      setAdjustReason('Barang Rusak / Kadaluarsa');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      adjustType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    - Kurangi Stok
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('SET');
                      setAdjustReason('Koreksi Stok Fisik / Opname');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      adjustType === 'SET'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    = Set Opname
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {adjustType === 'IN'
                    ? `Jumlah Barang Masuk (${stockAdjustmentTarget.unit})`
                    : adjustType === 'OUT'
                    ? `Jumlah Pengurangan (${stockAdjustmentTarget.unit})`
                    : `Jumlah Stok Fisik Riil (${stockAdjustmentTarget.unit})`}
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Mutasi</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as StockAdjustmentReason)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Barang Masuk / Pembelian">Barang Masuk / Pembelian Suplier</option>
                  <option value="Koreksi Stok Fisik / Opname">Koreksi Stok Fisik / Stock Opname</option>
                  <option value="Barang Rusak / Kadaluarsa">Barang Rusak / Kadaluarsa</option>
                  <option value="Retur Pasien">Retur dari Pasien</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Contoh: No. PO / Catatan fisik rak..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  Simpan Mutasi Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteHerbalProduct(deleteTargetId);
        }}
        title="Hapus Produk Herbal?"
        message="Produk herbal ini akan dihapus dari daftar katalog klinik."
        confirmText="Hapus Produk"
        isDangerous={true}
      />
    </div>
  );
};
