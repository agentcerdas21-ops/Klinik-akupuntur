import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  User,
  UserPlus,
  CreditCard,
  CheckCircle2,
  Search,
  FileText,
  DollarSign,
  Receipt,
  Info,
  ExternalLink,
  MessageCircle,
  Tag,
  Check,
  X,
  Calendar
} from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { PaymentMethod, PaymentStatus, Patient } from '../../types';
import { formatIDR, formatDateIndo, getWhatsAppUrl } from '../../lib/exportUtils';
import { PatientFormModal } from '../patients/PatientFormModal';

interface SalesPOSViewProps {
  initialPatientId?: string;
  onSaleComplete: (invoiceId: string) => void;
  onViewPatient?: (patientId: string) => void;
}

interface CartItem {
  id: string;
  item_type: 'service' | 'herbal';
  item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  maxStock?: number;
}

export const SalesPOSView: React.FC<SalesPOSViewProps> = ({
  initialPatientId,
  onSaleComplete,
  onViewPatient
}) => {
  const {
    patients,
    services,
    serviceCategories,
    herbalProducts,
    productCategories,
    settings,
    createSale
  } = useClinic();

  const [saleDate, setSaleDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Catalog search / tabs / categories
  const [catalogTab, setCatalogTab] = useState<'all' | 'services' | 'herbal'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Success modal after checkout
  const [completedInvoiceId, setCompletedInvoiceId] = useState<string | null>(null);

  // Set default initial patient if passed
  useEffect(() => {
    if (initialPatientId) {
      setPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  // Sync discount percent
  useEffect(() => {
    if (discountPercent !== null) {
      const calculated = Math.round((subtotal * discountPercent) / 100);
      setDiscount(calculated);
    }
  }, [discountPercent, subtotal]);

  const total = Math.max(0, subtotal - discount);

  // Auto-set amountPaid to total when total changes and user hasn't explicitly set custom DP
  useEffect(() => {
    setAmountPaid(total);
  }, [total]);

  const change = Math.max(0, amountPaid - total);
  const outstanding = Math.max(0, total - amountPaid);
  const paymentStatus: PaymentStatus =
    amountPaid >= total && total > 0 ? 'Lunas' : amountPaid > 0 ? 'DP' : 'Belum Lunas';

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId),
    [patients, patientId]
  );

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 8);
    const q = patientSearch.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.patient_code.toLowerCase().includes(q) ||
          (p.phone && p.phone.includes(q)) ||
          (p.main_complaint && p.main_complaint.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [patients, patientSearch]);

  // Add Item to Cart
  const handleAddToCart = (item: {
    id: string;
    type: 'service' | 'herbal';
    name: string;
    price: number;
    stock?: number;
  }) => {
    const existingIndex = cart.findIndex(
      (c) => c.item_id === item.id && c.item_type === item.type
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + 1;
      if (item.type === 'herbal' && item.stock !== undefined && newQty > item.stock) {
        alert(`Stok produk tidak mencukupi! Tersedia hanya ${item.stock}`);
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].subtotal = newQty * updated[existingIndex].unit_price;
      setCart(updated);
    } else {
      if (item.type === 'herbal' && item.stock !== undefined && item.stock < 1) {
        alert('Stok produk herbal ini telah habis!');
        return;
      }
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        item_type: item.type,
        item_id: item.id,
        item_name: item.name,
        unit_price: item.price,
        quantity: 1,
        subtotal: item.price,
        maxStock: item.stock
      };
      setCart([...cart, newItem]);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const item = cart[index];
    if (item.item_type === 'herbal' && item.maxStock !== undefined && newQty > item.maxStock) {
      alert(`Stok tidak mencukupi! Maksimal ${item.maxStock}`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    updated[index].subtotal = newQty * updated[index].unit_price;
    setCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Keranjang transaksi masih kosong. Silakan pilih layanan atau produk herbal.');
      return;
    }

    const { invoice } = createSale(
      {
        patient_id: patientId || undefined,
        patient_name: selectedPatient?.full_name || 'Umum',
        sale_date: saleDate || new Date().toISOString().split('T')[0],
        discount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        amount_paid: Number(amountPaid),
        notes: notes || undefined
      },
      cart.map((c) => ({
        item_type: c.item_type === 'herbal' ? 'product' : 'service',
        service_id: c.item_type === 'service' ? c.item_id : undefined,
        product_id: c.item_type === 'herbal' ? c.item_id : undefined,
        item_name: c.item_name,
        quantity: c.quantity,
        price: c.unit_price
      }))
    );

    setCompletedInvoiceId(invoice.id);
  };

  const handleFinishAndOpenInvoice = () => {
    if (completedInvoiceId) {
      const invId = completedInvoiceId;
      setCompletedInvoiceId(null);
      setCart([]);
      setDiscount(0);
      setDiscountPercent(null);
      setNotes('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      onSaleComplete(invId);
    }
  };

  const handleNewSale = () => {
    setCompletedInvoiceId(null);
    setCart([]);
    setDiscount(0);
    setDiscountPercent(null);
    setNotes('');
    setPatientId('');
    setSaleDate(new Date().toISOString().split('T')[0]);
  };

  // Filter Catalog
  const filteredServices = useMemo(() => {
    return services
      .filter((s) => s.active)
      .filter((s) => {
        const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
        const matchesSearch =
          !catalogSearch.trim() ||
          s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
          s.category.toLowerCase().includes(catalogSearch.toLowerCase());
        return matchesCategory && matchesSearch;
      });
  }, [services, selectedCategory, catalogSearch]);

  const filteredProducts = useMemo(() => {
    return herbalProducts.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        !catalogSearch.trim() ||
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [herbalProducts, selectedCategory, catalogSearch]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kasir & Transaksi Penjualan (POS)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Proses pembayaran terapi akupunktur & produk herbal terintegrasi invoice, stok, dan laporan keuangan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Catalog Picker (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
            {/* Tab switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCatalogTab('all');
                    setSelectedCategory('all');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    catalogTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogTab('services');
                    setSelectedCategory('all');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    catalogTab === 'services'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Layanan Terapi ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogTab('herbal');
                    setSelectedCategory('all');
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    catalogTab === 'herbal'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Obat Herbal ({herbalProducts.length})
                </button>
              </div>

              {/* Search in catalog */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Cari layanan atau herbal..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Sub Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Kategori
              </button>
              {catalogTab !== 'herbal' &&
                serviceCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === c.name
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              {catalogTab !== 'services' &&
                productCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === c.name
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {/* SERVICES */}
              {(catalogTab === 'all' || catalogTab === 'services') &&
                filteredServices.map((s) => (
                  <button
                    key={`srv_${s.id}`}
                    type="button"
                    onClick={() =>
                      handleAddToCart({
                        id: s.id,
                        type: 'service',
                        name: s.name,
                        price: s.price
                      })
                    }
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/40 text-left transition-all group flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          {s.category || 'Layanan'}
                        </span>
                        <span className="text-[10px] text-slate-500">{s.duration} Mnt</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-emerald-900 leading-snug">
                        {s.name}
                      </p>
                      {s.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-xs font-mono font-extrabold text-slate-900">
                        {formatIDR(s.price)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        + Tambah
                      </span>
                    </div>
                  </button>
                ))}

              {/* HERBAL PRODUCTS */}
              {(catalogTab === 'all' || catalogTab === 'herbal') &&
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock <= p.minimum_stock && p.stock > 0;
                  return (
                    <button
                      key={`hrb_${p.id}`}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() =>
                        handleAddToCart({
                          id: p.id,
                          type: 'herbal',
                          name: p.name,
                          price: p.selling_price,
                          stock: p.stock
                        })
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between shadow-2xs ${
                        isOutOfStock
                          ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                          : 'border-slate-200/80 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/40 group hover:shadow-xs cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider bg-blue-100/70 px-1.5 py-0.5 rounded">
                            {p.category || 'Herbal'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isOutOfStock
                                ? 'bg-rose-200 text-rose-900'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-900 font-semibold'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isOutOfStock
                              ? 'Habis'
                              : `Stok: ${p.stock} ${p.unit}`}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1.5 group-hover:text-blue-900 leading-snug">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-xs font-mono font-extrabold text-slate-900">
                          {formatIDR(p.selling_price)}
                        </span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {isOutOfStock ? 'Habis' : '+ Tambah'}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Cart & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleCheckout}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4"
          >
            {/* Transaction Date Selector */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tanggal Transaksi / Penjualan</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSaleDate(new Date().toISOString().split('T')[0])}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                      saleDate === new Date().toISOString().split('T')[0]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      setSaleDate(d.toISOString().split('T')[0]);
                    }}
                    className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Kemarin
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                id="sale-date-input"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            {/* Searchable Patient Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Pasien Penerima Layanan
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddPatientModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Pasien Baru</span>
                </button>
              </div>

              {selectedPatient ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          {selectedPatient.full_name}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded">
                          {selectedPatient.patient_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {selectedPatient.gender} • {selectedPatient.phone || 'Tanpa no. HP'}
                      </p>
                      {selectedPatient.main_complaint && (
                        <p className="text-[11px] text-emerald-900 font-medium line-clamp-1 mt-0.5">
                          Keluhan: {selectedPatient.main_complaint}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPatientId('')}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Ganti Pasien"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedPatient.whatsapp && (
                    <a
                      href={getWhatsAppUrl(
                        selectedPatient.whatsapp,
                        `Halo ${selectedPatient.full_name}, kami dari Klinik Akupunktur ACUCARE...`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>Kirim WhatsApp ({selectedPatient.whatsapp})</span>
                    </a>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={patientSearch}
                      onFocus={() => setIsPatientDropdownOpen(true)}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setIsPatientDropdownOpen(true);
                      }}
                      placeholder="Cari pasien berdasarkan nama, kode, no. HP..."
                      className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                    {patientSearch && (
                      <button
                        type="button"
                        onClick={() => setPatientSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isPatientDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                      <div
                        onClick={() => {
                          setPatientId('');
                          setIsPatientDropdownOpen(false);
                          setPatientSearch('');
                        }}
                        className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-700">-- Pasien Umum (Non-Member) --</span>
                        <span className="text-[10px] text-slate-400">Anonim</span>
                      </div>
                      {filteredPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPatientId(p.id);
                            setIsPatientDropdownOpen(false);
                            setPatientSearch('');
                          }}
                          className="p-2.5 hover:bg-emerald-50/60 cursor-pointer text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{p.full_name}</p>
                            <p className="text-[10px] text-slate-500">
                              {p.patient_code} • {p.phone || 'No HP -'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Pilih
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Keranjang ({cart.length} Item)
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200 my-2">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-400" />
                  <span>Pilih layanan atau obat herbal dari katalog sebelah kiri</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto my-2 pr-1">
                  {cart.map((item, idx) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.item_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {formatIDR(item.unit_price)} × {item.quantity}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right shrink-0 w-20">
                        <span className="text-xs font-mono font-bold text-slate-900 block">
                          {formatIDR(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Discount */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Item:</span>
                <span className="font-mono font-semibold text-slate-800">{formatIDR(subtotal)}</span>
              </div>

              {/* Discount inputs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Potongan Diskon (Rp):</span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={discount}
                    onChange={(e) => {
                      setDiscount(Number(e.target.value));
                      setDiscountPercent(null);
                    }}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Quick discount chips */}
                <div className="flex items-center justify-end gap-1 text-[10px]">
                  <span className="text-slate-400">Quick:</span>
                  {[0, 5, 10, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct === 0 ? null : pct)}
                      className={`px-1.5 py-0.5 rounded font-semibold cursor-pointer ${
                        discountPercent === pct || (pct === 0 && discount === 0)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDiscount(50000);
                      setDiscountPercent(null);
                    }}
                    className="px-1.5 py-0.5 rounded font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                  >
                    50rb
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Akhir Tagihan:</span>
                <span className="font-mono text-emerald-800 text-base">{formatIDR(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    'Transfer Bank',
                    'Tunai / Cash',
                    'QRIS',
                    'Kartu Debit/Kredit'
                  ] as PaymentMethod[]
                ).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center truncate cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Transfer Details Box */}
            {paymentMethod === 'Transfer Bank' && (
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Rekening Resmi Klinik ACUCARE:</span>
                </div>
                <div className="font-mono text-emerald-900 font-bold text-sm">
                  {settings.bank_name} : {settings.bank_account_no}
                </div>
                <p className="text-[11px] text-emerald-800">
                  a.n. <strong className="font-bold">{settings.bank_account_holder}</strong>
                </p>
              </div>
            )}

            {/* Amount Paid & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Dibayar (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />

                {/* Quick cash presets */}
                <div className="flex items-center gap-1 mt-1.5 overflow-x-auto text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(total)}
                    className="px-1.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer whitespace-nowrap"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(total / 2)}
                    className="px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer whitespace-nowrap"
                  >
                    DP 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="px-1.5 py-0.5 rounded font-semibold bg-rose-100 text-rose-900 hover:bg-rose-200 cursor-pointer whitespace-nowrap"
                  >
                    Belum Lunas
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {amountPaid >= total ? 'Kembalian' : 'Sisa Piutang'}
                </label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl text-sm font-mono font-bold text-slate-900 flex items-center justify-between">
                  <span>{formatIDR(amountPaid >= total ? change : outstanding)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold ${
                      paymentStatus === 'Lunas'
                        ? 'bg-emerald-200 text-emerald-900'
                        : paymentStatus === 'DP'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan transaksi (opsional)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Checkout Submit Button */}
            <button
              type="submit"
              disabled={cart.length === 0}
              id="checkout-btn"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Proses Transaksi & Terbitkan Faktur</span>
            </button>
          </form>
        </div>
      </div>

      {/* MODAL: ADD PATIENT FAST POPUP */}
      <PatientFormModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        onSuccess={(newPat) => {
          setPatientId(newPat.id);
          setIsAddPatientModalOpen(false);
        }}
      />

      {/* MODAL: CHECKOUT SUCCESS */}
      {completedInvoiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Transaksi Berhasil Disimpan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Faktur resmi dan catatan stok telah diperbarui ke database klinik.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-bold text-slate-900">{formatDateIndo(saleDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pasien:</span>
                <span className="font-bold text-slate-900">{selectedPatient?.full_name || 'Umum'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-bold text-slate-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Pembayaran:</span>
                <span className="font-bold text-emerald-700">{paymentStatus}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total:</span>
                <span className="font-mono font-bold text-slate-900">{formatIDR(total)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleFinishAndOpenInvoice}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Receipt className="w-4 h-4" />
                <span>Buka & Cetak Faktur (Invoice)</span>
              </button>

              {selectedPatient && selectedPatient.whatsapp && (
                <a
                  href={getWhatsAppUrl(
                    selectedPatient.whatsapp,
                    `Halo ${selectedPatient.full_name}, terima kasih atas kunjungan Anda di Klinik Akupunktur ACUCARE (Ahli Saraf Kejepit & Stroke). Transaksi Anda telah tercatat dengan total ${formatIDR(
                      total
                    )}. Semoga lekas sembuh!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Kirim Konfirmasi WhatsApp</span>
                </a>
              )}

              {selectedPatient && onViewPatient && (
                <button
                  type="button"
                  onClick={() => {
                    const pid = selectedPatient.id;
                    setCompletedInvoiceId(null);
                    onViewPatient(pid);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-600" />
                  <span>Lihat Riwayat & Profil Pasien</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNewSale}
                className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
