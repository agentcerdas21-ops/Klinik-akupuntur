import {
  ClinicSettings,
  DatabaseBackupPayload,
  Expense,
  ExpenseCategory,
  HerbalProduct,
  Income,
  Invoice,
  Patient,
  Payment,
  PaymentStatus,
  ProductCategory,
  Sale,
  SaleItem,
  Service,
  ServiceCategory,
  StockAdjustment,
  StockAdjustmentReason,
  TherapySession,
  User
} from '../types';

const STORAGE_PREFIX = 'acucare_db_';

const DEFAULT_SETTINGS: ClinicSettings = {
  clinic_name: 'ACUCARE',
  clinic_tagline: 'Klinik Akupunktur Ahli Saraf Kejepit & Stroke',
  address: 'Ruko Arcadia Residence A-16, Desa Karangsatria, Kecamatan Tambun Utara, Kabupaten Bekasi',
  owner_name: 'Yogi Pangestu',
  phone: '081399670676',
  whatsapp: '081399670676',
  bank_name: 'BSI (Bank Syariah Indonesia)',
  bank_account_no: '5774090170',
  bank_account_holder: 'Yogi Pangestu',
  invoice_footer: 'Terima kasih atas kepercayaan Anda mempercayakan pemulihan kesehatan di ACUCARE.',
  last_backup_at: new Date().toISOString()
};

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_owner_01',
    name: 'Yogi Pangestu',
    email: 'owner@acucare.id',
    role: 'OWNER',
    created_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'usr_admin_01',
    name: 'Siti Rahma (Admin)',
    email: 'admin@acucare.id',
    role: 'ADMIN',
    created_at: '2026-01-10T08:00:00.000Z'
  }
];

const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'sc_1', name: 'Akupunktur Terapi Khusus', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'sc_2', name: 'Akupunktur Umum & Relaksasi', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'sc_3', name: 'Konsultasi & Pemeriksaan', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'sc_4', name: 'Kombinasi & Paket Terapi', active: true, created_at: '2026-01-01T08:00:00.000Z' }
];

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv_1',
    name: 'Terapi Akupunktur Saraf Kejepit (HNP)',
    category: 'Akupunktur Terapi Khusus',
    description: 'Terapi stimulasi titik meridian tulang belakang lumbar/cervical untuk relaksasi saraf, reduksi inflamasi & pelepasan jepitan saraf.',
    duration: 60,
    price: 250000,
    active: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'srv_2',
    name: 'Terapi Pemulihan Pasca Stroke (Rehabilitasi Motorik)',
    category: 'Akupunktur Terapi Khusus',
    description: 'Akupunktur khusus stimulasi motorik dan neuromuskular pasca stroke untuk melancarkan sirkulasi darah otak & aktivasi otot hemiparesis.',
    duration: 75,
    price: 300000,
    active: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'srv_3',
    name: 'Akupunktur Nyeri Sendi & Pinggang (LBP / Sciatica)',
    category: 'Akupunktur Terapi Khusus',
    description: 'Penusukan jarum steril pada titik ashi dan meridian ginjal/kandung kemih untuk mengurai kekakuan dan nyeri linu pinggang.',
    duration: 50,
    price: 200000,
    active: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'srv_4',
    name: 'Konsultasi & Pemeriksaan Denyut Nadi / Lidah TCM',
    category: 'Konsultasi & Pemeriksaan',
    description: 'Pemeriksaan sindrom TCM, evaluasi riwayat medis, denyut nadi organ dan lidah untuk rencana terapi presisi.',
    duration: 30,
    price: 100000,
    active: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'srv_5',
    name: 'Paket Intensif Pemulihan (4 Sesi)',
    category: 'Kombinasi & Paket Terapi',
    description: 'Paket 4 kali sesi akupunktur berjadwal untuk percepatan pemulihan nyeri kronis & saraf kejepit.',
    duration: 60,
    price: 900000,
    active: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  }
];

const DEFAULT_PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'pc_1', name: 'Herbal Saraf & Otot', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'pc_2', name: 'Minyak Gosok & Balur TCM', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'pc_3', name: 'Herbal Sirkulasi Darah & Stroke', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'pc_4', name: 'Teh & Suplemen Pemulihan', active: true, created_at: '2026-01-01T08:00:00.000Z' }
];

const DEFAULT_HERBAL_PRODUCTS: HerbalProduct[] = [
  {
    id: 'hrb_1',
    sku: 'HRB-SRF-01',
    name: 'Kapsul Shen Jin Huo Luo Dan (Pelemas Urat & Saraf)',
    category: 'Herbal Saraf & Otot',
    description: 'Formula herbal ekstrak alami untuk melancarkan sirkulasi chi pada meridian, meredakan kram dan kesemutan saraf kejepit.',
    unit: 'Botol (60 Kapsul)',
    purchase_price: 95000,
    selling_price: 150000,
    stock: 24,
    minimum_stock: 5,
    active: true,
    notes: 'Minum 2x sehari 2 kapsul sesudah makan.',
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'hrb_2',
    sku: 'HRB-OIL-02',
    name: 'Minyak Terapi Herbal Zheng Gu Shui Original',
    category: 'Minyak Gosok & Balur TCM',
    description: 'Minyak balur tradisional premium untuk meredakan memar, pegal linu, spasme otot, dan nyeri persendian.',
    unit: 'Botol 100ml',
    purchase_price: 65000,
    selling_price: 110000,
    stock: 18,
    minimum_stock: 4,
    active: true,
    notes: 'Oleskan pada area pinggang dan punggung yang tegang.',
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'hrb_3',
    sku: 'HRB-STR-03',
    name: 'Angong Niuhuang Wan Herbal Stroke Support',
    category: 'Herbal Sirkulasi Darah & Stroke',
    description: 'Formula herbal pendukung sirkulasi serebrovaskular untuk membantu proses pemulihan mobilitas pasca stroke.',
    unit: 'Box (1 Butir Lilin)',
    purchase_price: 320000,
    selling_price: 480000,
    stock: 6,
    minimum_stock: 3,
    active: true,
    notes: 'Konsumsi sesuai anjuran praktisi.',
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'hrb_4',
    sku: 'HRB-PATCH-04',
    name: 'Koyo Herbal Magnetic Meridian Heat Patch',
    category: 'Minyak Gosok & Balur TCM',
    description: 'Plester herbal hangat dengan partikel magnetik untuk penetrasi dalam pada titik akupunktur tulang ekor & bahu.',
    unit: 'Pack (10 Lembar)',
    purchase_price: 40000,
    selling_price: 75000,
    stock: 3,
    minimum_stock: 5, // Triggers "Stok Menipis"
    active: true,
    notes: 'Tempel selama 6-8 jam pada area nyeri.',
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z'
  }
];

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'ec_1', name: 'Jarum Akupunktur & Perlengkapan Steril', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'ec_2', name: 'Restok Produk Herbal', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'ec_3', name: 'Sewa & Operasional Ruko Arcadia', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'ec_4', name: 'Listrik, Air & Internet', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'ec_5', name: 'Kebersihan & Higienitas Ruang Terapi', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'ec_6', name: 'Marketing & Banner Promosi', active: true, created_at: '2026-01-01T08:00:00.000Z' },
  { id: 'ec_7', name: 'Lain-lain', active: true, created_at: '2026-01-01T08:00:00.000Z' }
];

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'pat_1',
    patient_code: 'ACU-000001',
    full_name: 'Bambang Supriyanto',
    nik: '3275011205750003',
    birth_date: '1975-05-12',
    gender: 'Laki-laki',
    phone: '081288992211',
    whatsapp: '081288992211',
    email: 'bambang.supriyanto@gmail.com',
    address: 'Vila Indah Permai Blok B2 No. 14, Bekasi Utara',
    occupation: 'Wiraswasta',
    emergency_contact: 'Ibu Ratna (Istri) - 081288992299',
    main_complaint: 'Saraf Kejepit Lumbal L4-L5, rasa kebas menjalar ke paha dan betis kanan.',
    additional_complaint: 'Pinggang terasa kaku di pagi hari dan sulit membungkuk.',
    medical_history: 'Pernah rontgen MRI 2025 terindikasi bulging disc L4-L5.',
    allergy_notes: 'Tidak ada riwayat alergi obat/herbal.',
    important_notes: 'Hindari angkat beban berat selama masa terapi.',
    status: 'Aktif',
    created_at: '2026-08-01T09:00:00.000Z',
    updated_at: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'pat_2',
    patient_code: 'ACU-000002',
    full_name: 'Hj. Endang Suryani',
    nik: '3275044810620001',
    birth_date: '1962-10-18',
    gender: 'Perempuan',
    phone: '081377884433',
    whatsapp: '081377884433',
    email: 'endang.suryani@yahoo.com',
    address: 'Perumahan Graha Prima Blok C No. 22, Tambun Utara, Bekasi',
    occupation: 'Pensiunan Guru',
    emergency_contact: 'Dimas (Anak) - 081377884490',
    main_complaint: 'Pemulihan pasca stroke iskemik ringan 3 bulan lalu, tangan kiri masih lemah menggenggam.',
    additional_complaint: 'Bicara agak lambat dan kaki kiri agak terseret saat berjalan jauh.',
    medical_history: 'Hipertensi terkontrol dengan amlodipine.',
    allergy_notes: 'Alergi dingin.',
    important_notes: 'Pantau tensi sebelum penusukan jarum.',
    status: 'Aktif',
    created_at: '2026-08-03T10:30:00.000Z',
    updated_at: '2026-08-18T11:00:00.000Z'
  },
  {
    id: 'pat_3',
    patient_code: 'ACU-000003',
    full_name: 'Hendrik Pratama',
    nik: '3275022008880004',
    birth_date: '1988-08-20',
    gender: 'Laki-laki',
    phone: '085712345678',
    whatsapp: '085712345678',
    email: 'hendrik.p@techco.id',
    address: 'Summarecon Bekasi Cluster Lotus No. 8',
    occupation: 'Software Engineer',
    emergency_contact: 'Siska (Istri) - 085712345699',
    main_complaint: 'Nyeri leher kaku (Cervicalgia) dan migrain berulang akibat duduk lama di depan komputer.',
    additional_complaint: 'Bahu kanan terasa tegang dan telapak tangan sering kesemutan.',
    medical_history: 'Tidak ada riwayat penyakit berat.',
    allergy_notes: 'Tidak ada.',
    important_notes: 'Diberikan edukasi postur ergonomis.',
    status: 'Aktif',
    created_at: '2026-08-08T14:00:00.000Z',
    updated_at: '2026-08-16T15:30:00.000Z'
  },
  {
    id: 'pat_4',
    patient_code: 'ACU-000004',
    full_name: 'Dewi Anggraini',
    nik: '3275036103930002',
    birth_date: '1993-03-21',
    gender: 'Perempuan',
    phone: '081299887766',
    whatsapp: '081299887766',
    email: 'dewi.anggraini@gmail.com',
    address: 'Apartemen Centerpoint Tower B 12-05, Bekasi Selatan',
    occupation: 'Karyawan Swasta',
    emergency_contact: 'Ibu Ratih - 081299887700',
    main_complaint: 'Insomnia berat dan sciatica rasa nyeri pinggul bawah.',
    additional_complaint: 'Sering cemas dan lambung mudah perih.',
    medical_history: 'Gastritis kronis.',
    allergy_notes: 'Alergi makanan laut (udang).',
    important_notes: 'Kombinasi titik Anmian dan Shenmen.',
    status: 'Selesai',
    created_at: '2026-07-15T11:00:00.000Z',
    updated_at: '2026-08-10T12:00:00.000Z'
  }
];

const DEFAULT_THERAPY_SESSIONS: TherapySession[] = [
  {
    id: 'ses_1',
    patient_id: 'pat_1',
    session_number: 1,
    therapy_date: '2026-08-01',
    complaint: 'Nyeri hebat L4-L5 menjalar ke betis kanan (VAS 8/10)',
    condition_before: 'Pasien sulit duduk tegak lebih dari 10 menit, jalan pincang.',
    therapy_type: 'Akupunktur Saraf Kejepit + Elektroakupunktur Frekuensi Rendah',
    treatment_area: 'Shenshu (BL23), Dachangshu (BL25), Huantiao (GB30), Weizhong (BL40), Yanglingquan (GB34), Kunlun (BL60).',
    practitioner_notes: 'Jarum 0.25x40mm dengan stimulasi deqi optimal. Pasang TDP lamp hangat selama 30 menit.',
    condition_after: 'Nyeri berkurang signifikan menjadi VAS 4/10. Otot paravertebral lebih lentur.',
    patient_response: 'Pasien merasakan rasa hangat mengalir dan kesemutan di betis berkurang drastis.',
    next_plan: 'Lanjutkan sesi 2 dalam 4 hari, disarankan jangan mengangkat barang berat.',
    cost: 250000,
    payment_status: 'Lunas',
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'ses_2',
    patient_id: 'pat_1',
    session_number: 2,
    therapy_date: '2026-08-05',
    complaint: 'Sisa kebas di telapak kaki kanan pagi hari (VAS 3/10)',
    condition_before: 'Sudah bisa jalan lebih tegap, rasa nyeri pinggang sudah mereda.',
    therapy_type: 'Akupunktur Saraf Kejepit + TDP Far Infrared Lamp',
    treatment_area: 'Dachangshu (BL25), Guanyuan (CV4), Huantiao (GB30), Chengshan (BL57), Taichong (LR3).',
    practitioner_notes: 'Fokus pada penguatan titik meridian ginjal & kandung kemih serta kelancaran chi.',
    condition_after: 'Mobilitas pinggang bebas rotasi tanpa hambatan nyeri.',
    patient_response: 'Merasa jauh lebih enteng dan bisa tidur nyenyak.',
    next_plan: 'Evaluasi sesi 3 minggu depan dan tambah herbal Shen Jin Huo Luo Dan.',
    cost: 250000,
    payment_status: 'Lunas',
    created_at: '2026-08-05T10:30:00.000Z',
    updated_at: '2026-08-05T10:30:00.000Z'
  },
  {
    id: 'ses_3',
    patient_id: 'pat_2',
    session_number: 1,
    therapy_date: '2026-08-03',
    complaint: 'Tangan kiri lemas pasca stroke, kekuatan genggam grade 3/5.',
    condition_before: 'Jari-jari tangan kiri kaku membuka, rentang gerak bahu terbatas.',
    therapy_type: 'Akupunktur Pemulihan Stroke + Stimulasi Neuromuskular',
    treatment_area: 'Jianyu (LI15), Quchi (LI11), Shousanli (LI10), Waiguan (TE5), Hegu (LI4), Baxie (EX-UE9), Zusanli (ST36).',
    practitioner_notes: 'Stimulasi motorik area kepala Baihui (GV20) dan Sishencong (EX-HN1). Tensi awal 135/85 mmHg.',
    condition_after: 'Jari tangan lebih rileks dan mampu menggenggam botol air kecil secara mandiri.',
    patient_response: 'Ibu Endang merasa optimis dan tangan terasa lebih hangat bertenaga.',
    next_plan: 'Sesi rutin 2x seminggu untuk penguatan neuromuscular pathway.',
    cost: 300000,
    payment_status: 'Lunas',
    created_at: '2026-08-03T11:45:00.000Z',
    updated_at: '2026-08-03T11:45:00.000Z'
  },
  {
    id: 'ses_4',
    patient_id: 'pat_3',
    session_number: 1,
    therapy_date: '2026-08-08',
    complaint: 'Leher kaku tidak bisa menengok ke kanan dan migrain berdenyut.',
    condition_before: 'Otot trapezius sangat tegang keras (spasme).',
    therapy_type: 'Akupunktur Nyeri Leher / Cervicalgia + Guasha Lembut',
    treatment_area: 'Fengchi (GB20), Jianjing (GB21), Tianzhu (BL10), Houxi (SI3), Taichong (LR3).',
    practitioner_notes: 'Penusukan titik ashi bahu atas dengan pemanasan herbal moxa.',
    condition_after: 'Rentang gerak leher kembali 95%, pusing migrain hilang seketika.',
    patient_response: 'Sangat lega, kepala langsung terasa enteng dan pandangan jernih.',
    next_plan: 'Sesi lanjutan jika keluhan kambuh karena kebiasaan lembur.',
    cost: 200000,
    payment_status: 'Lunas',
    created_at: '2026-08-08T15:00:00.000Z',
    updated_at: '2026-08-08T15:00:00.000Z'
  }
];

const DEFAULT_SALES: Sale[] = [
  {
    id: 'sle_1',
    invoice_id: 'inv_1',
    patient_id: 'pat_1',
    patient_name: 'Bambang Supriyanto',
    sale_date: '2026-08-01',
    subtotal: 400000,
    discount: 0,
    total: 400000,
    payment_status: 'Lunas',
    payment_method: 'Transfer',
    notes: 'Terapi Saraf Kejepit + 1 Botol Shen Jin Huo Luo Dan',
    created_at: '2026-08-01T10:05:00.000Z'
  },
  {
    id: 'sle_2',
    invoice_id: 'inv_2',
    patient_id: 'pat_2',
    patient_name: 'Hj. Endang Suryani',
    sale_date: '2026-08-03',
    subtotal: 410000,
    discount: 0,
    total: 410000,
    payment_status: 'Lunas',
    payment_method: 'QRIS',
    notes: 'Terapi Pemulihan Stroke + Minyak Zheng Gu Shui',
    created_at: '2026-08-03T11:50:00.000Z'
  },
  {
    id: 'sle_3',
    invoice_id: 'inv_3',
    patient_id: 'pat_3',
    patient_name: 'Hendrik Pratama',
    sale_date: '2026-08-08',
    subtotal: 200000,
    discount: 0,
    total: 200000,
    payment_status: 'Lunas',
    payment_method: 'Cash',
    notes: 'Akupunktur Nyeri Leher & Sendi',
    created_at: '2026-08-08T15:05:00.000Z'
  },
  {
    id: 'sle_4',
    invoice_id: 'inv_4',
    patient_id: 'pat_1',
    patient_name: 'Bambang Supriyanto',
    sale_date: '2026-08-05',
    subtotal: 250000,
    discount: 0,
    total: 250000,
    payment_status: 'Lunas',
    payment_method: 'Transfer',
    notes: 'Sesi Terapi Ke-2 Saraf Kejepit',
    created_at: '2026-08-05T10:35:00.000Z'
  }
];

const DEFAULT_SALE_ITEMS: SaleItem[] = [
  {
    id: 'sit_1',
    sale_id: 'sle_1',
    item_type: 'service',
    service_id: 'srv_1',
    item_name: 'Terapi Akupunktur Saraf Kejepit (HNP)',
    quantity: 1,
    price: 250000,
    subtotal: 250000
  },
  {
    id: 'sit_2',
    sale_id: 'sle_1',
    item_type: 'product',
    product_id: 'hrb_1',
    item_name: 'Kapsul Shen Jin Huo Luo Dan (Pelemas Urat & Saraf)',
    quantity: 1,
    price: 150000,
    subtotal: 150000
  },
  {
    id: 'sit_3',
    sale_id: 'sle_2',
    item_type: 'service',
    service_id: 'srv_2',
    item_name: 'Terapi Pemulihan Pasca Stroke (Rehabilitasi Motorik)',
    quantity: 1,
    price: 300000,
    subtotal: 300000
  },
  {
    id: 'sit_4',
    sale_id: 'sle_2',
    item_type: 'product',
    product_id: 'hrb_2',
    item_name: 'Minyak Terapi Herbal Zheng Gu Shui Original',
    quantity: 1,
    price: 110000,
    subtotal: 110000
  },
  {
    id: 'sit_5',
    sale_id: 'sle_3',
    item_type: 'service',
    service_id: 'srv_3',
    item_name: 'Akupunktur Nyeri Sendi & Pinggang (LBP / Sciatica)',
    quantity: 1,
    price: 200000,
    subtotal: 200000
  },
  {
    id: 'sit_6',
    sale_id: 'sle_4',
    item_type: 'service',
    service_id: 'srv_1',
    item_name: 'Terapi Akupunktur Saraf Kejepit (HNP)',
    quantity: 1,
    price: 250000,
    subtotal: 250000
  }
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    invoice_number: 'INV-202608-0001',
    patient_id: 'pat_1',
    patient_name: 'Bambang Supriyanto',
    sale_id: 'sle_1',
    invoice_date: '2026-08-01',
    subtotal: 400000,
    discount: 0,
    total: 400000,
    payment_status: 'Lunas',
    payment_method: 'Transfer',
    notes: 'Pembayaran transfer rekening BSI 5774090170 a.n Yogi Pangestu',
    created_at: '2026-08-01T10:05:00.000Z'
  },
  {
    id: 'inv_2',
    invoice_number: 'INV-202608-0002',
    patient_id: 'pat_2',
    patient_name: 'Hj. Endang Suryani',
    sale_id: 'sle_2',
    invoice_date: '2026-08-03',
    subtotal: 410000,
    discount: 0,
    total: 410000,
    payment_status: 'Lunas',
    payment_method: 'QRIS',
    notes: 'QRIS Acucare Clinic',
    created_at: '2026-08-03T11:50:00.000Z'
  },
  {
    id: 'inv_3',
    invoice_number: 'INV-202608-0003',
    patient_id: 'pat_3',
    patient_name: 'Hendrik Pratama',
    sale_id: 'sle_3',
    invoice_date: '2026-08-08',
    subtotal: 200000,
    discount: 0,
    total: 200000,
    payment_status: 'Lunas',
    payment_method: 'Cash',
    notes: 'Pembayaran Tunai di Kasir',
    created_at: '2026-08-08T15:05:00.000Z'
  },
  {
    id: 'inv_4',
    invoice_number: 'INV-202608-0004',
    patient_id: 'pat_1',
    patient_name: 'Bambang Supriyanto',
    sale_id: 'sle_4',
    invoice_date: '2026-08-05',
    subtotal: 250000,
    discount: 0,
    total: 250000,
    payment_status: 'Lunas',
    payment_method: 'Transfer',
    notes: 'Pembayaran transfer BSI',
    created_at: '2026-08-05T10:35:00.000Z'
  }
];

const DEFAULT_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    patient_id: 'pat_1',
    sale_id: 'sle_1',
    invoice_id: 'inv_1',
    payment_date: '2026-08-01',
    amount: 400000,
    payment_method: 'Transfer',
    status: 'Lunas',
    notes: 'Transfer BSI 5774090170 Bambang S.',
    created_at: '2026-08-01T10:06:00.000Z'
  },
  {
    id: 'pay_2',
    patient_id: 'pat_2',
    sale_id: 'sle_2',
    invoice_id: 'inv_2',
    payment_date: '2026-08-03',
    amount: 410000,
    payment_method: 'QRIS',
    status: 'Lunas',
    notes: 'Scan QRIS Kasir',
    created_at: '2026-08-03T11:51:00.000Z'
  },
  {
    id: 'pay_3',
    patient_id: 'pat_3',
    sale_id: 'sle_3',
    invoice_id: 'inv_3',
    payment_date: '2026-08-08',
    amount: 200000,
    payment_method: 'Cash',
    status: 'Lunas',
    notes: 'Tunai diterima Yogi Pangestu',
    created_at: '2026-08-08T15:06:00.000Z'
  },
  {
    id: 'pay_4',
    patient_id: 'pat_1',
    sale_id: 'sle_4',
    invoice_id: 'inv_4',
    payment_date: '2026-08-05',
    amount: 250000,
    payment_method: 'Transfer',
    status: 'Lunas',
    notes: 'Transfer BSI',
    created_at: '2026-08-05T10:36:00.000Z'
  }
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    expense_date: '2026-08-02',
    category: 'Jarum Akupunktur & Perlengkapan Steril',
    description: 'Beli 10 box jarum akupunktur steril Huanqiu 0.25x40mm & 0.25x25mm + Alkohol swab & kapas',
    amount: 320000,
    payment_method: 'Transfer',
    notes: 'Supplier Alkes Medika',
    created_at: '2026-08-02T13:00:00.000Z'
  },
  {
    id: 'exp_2',
    expense_date: '2026-08-04',
    category: 'Listrik, Air & Internet',
    description: 'Tagihan Listrik PLN Klinik & Internet IndiHome Agustus',
    amount: 450000,
    payment_method: 'Transfer',
    notes: 'Operasional bulanan',
    created_at: '2026-08-04T09:00:00.000Z'
  },
  {
    id: 'exp_3',
    expense_date: '2026-08-06',
    category: 'Kebersihan & Higienitas Ruang Terapi',
    description: 'Sprei sekali pakai (disposable bed sheet), desinfektan lantai, & tissue handuk',
    amount: 180000,
    payment_method: 'Cash',
    notes: 'Beli di grosir Tambun',
    created_at: '2026-08-06T16:00:00.000Z'
  }
];

const DEFAULT_INCOME: Income[] = [
  {
    id: 'inc_1',
    income_date: '2026-08-07',
    category: 'Jasa Konsultasi Korporat / Seminar Kesehatan',
    description: 'Honorarium Narasumber Edukasi Ergonomi & Pencegahan Saraf Kejepit PT Cipta Bekasi',
    amount: 1500000,
    source: 'Corporate Workshop',
    notes: 'Pemasukan di luar pasien reguler',
    created_at: '2026-08-07T17:00:00.000Z'
  }
];

const DEFAULT_STOCK_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj_1',
    product_id: 'hrb_1',
    product_name: 'Kapsul Shen Jin Huo Luo Dan (Pelemas Urat & Saraf)',
    adjustment_type: 'IN',
    quantity_change: 25,
    stock_before: 0,
    stock_after: 25,
    reason: 'Barang masuk',
    notes: 'Stok awal pembukaan klinik',
    adjusted_by: 'Yogi Pangestu',
    created_at: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'adj_2',
    product_id: 'hrb_1',
    product_name: 'Kapsul Shen Jin Huo Luo Dan (Pelemas Urat & Saraf)',
    adjustment_type: 'OUT',
    quantity_change: -1,
    stock_before: 25,
    stock_after: 24,
    reason: 'Penjualan Kasir',
    notes: 'Faktur INV-202608-0001 (Bambang Supriyanto)',
    adjusted_by: 'Yogi Pangestu',
    created_at: '2026-08-01T10:05:00.000Z'
  }
];

class StorageEngine {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaultsIfEmpty();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      if (!data) return defaultValue;
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  public initDefaultsIfEmpty(forceReset: boolean = false): void {
    const initialized = localStorage.getItem(STORAGE_PREFIX + 'initialized');
    if (!initialized || forceReset) {
      this.set('settings', DEFAULT_SETTINGS);
      this.set('users', DEFAULT_USERS);
      this.set('patients', DEFAULT_PATIENTS);
      this.set('therapy_sessions', DEFAULT_THERAPY_SESSIONS);
      this.set('services', DEFAULT_SERVICES);
      this.set('service_categories', DEFAULT_SERVICE_CATEGORIES);
      this.set('herbal_products', DEFAULT_HERBAL_PRODUCTS);
      this.set('product_categories', DEFAULT_PRODUCT_CATEGORIES);
      this.set('sales', DEFAULT_SALES);
      this.set('sale_items', DEFAULT_SALE_ITEMS);
      this.set('invoices', DEFAULT_INVOICES);
      this.set('payments', DEFAULT_PAYMENTS);
      this.set('expenses', DEFAULT_EXPENSES);
      this.set('expense_categories', DEFAULT_EXPENSE_CATEGORIES);
      this.set('income', DEFAULT_INCOME);
      localStorage.setItem(STORAGE_PREFIX + 'initialized', 'true');
    }
  }

  // --- CLINIC SETTINGS ---
  public getSettings(): ClinicSettings {
    return this.get<ClinicSettings>('settings', DEFAULT_SETTINGS);
  }

  public updateSettings(settings: Partial<ClinicSettings>): ClinicSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.set('settings', updated);
    return updated;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.get<User[]>('users', DEFAULT_USERS);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.set('users', users);
  }

  // --- PATIENTS ---
  public getPatients(): Patient[] {
    return this.get<Patient[]>('patients', []);
  }

  public getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  }

  public generatePatientCode(): string {
    const patients = this.getPatients();
    let maxNum = 0;
    patients.forEach((p) => {
      const match = p.patient_code.match(/ACU-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `ACU-${String(nextNum).padStart(6, '0')}`;
  }

  public savePatient(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Patient {
    const patients = this.getPatients();
    const now = new Date().toISOString();

    if (patient.id) {
      const index = patients.findIndex((p) => p.id === patient.id);
      if (index >= 0) {
        const existing = patients[index];
        const updated: Patient = {
          ...existing,
          ...patient,
          id: patient.id,
          created_at: existing.created_at,
          updated_at: now
        };
        patients[index] = updated;
        this.set('patients', patients);
        return updated;
      }
    }

    const newPatient: Patient = {
      ...patient,
      id: 'pat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      patient_code: patient.patient_code || this.generatePatientCode(),
      created_at: now,
      updated_at: now
    };
    patients.unshift(newPatient);
    this.set('patients', patients);
    return newPatient;
  }

  public deletePatient(patientId: string): boolean {
    const patients = this.getPatients().filter((p) => p.id !== patientId);
    this.set('patients', patients);

    // Cascade delete associated records
    const sessions = this.getTherapySessions().filter((s) => s.patient_id !== patientId);
    this.set('therapy_sessions', sessions);

    const sales = this.getSales();
    const patientSales = sales.filter((s) => s.patient_id === patientId);
    const saleIdsToDelete = new Set(patientSales.map((s) => s.id));

    const remainingSales = sales.filter((s) => s.patient_id !== patientId);
    this.set('sales', remainingSales);

    const saleItems = this.getSaleItems().filter((item) => !saleIdsToDelete.has(item.sale_id));
    this.set('sale_items', saleItems);

    const invoices = this.getInvoices().filter((inv) => inv.patient_id !== patientId);
    this.set('invoices', invoices);

    const payments = this.getPayments().filter((pay) => pay.patient_id !== patientId);
    this.set('payments', payments);

    return true;
  }

  public deleteAllPatientData(): boolean {
    this.set('patients', []);
    this.set('therapy_sessions', []);
    this.set('sales', []);
    this.set('sale_items', []);
    this.set('invoices', []);
    this.set('payments', []);
    return true;
  }

  // --- THERAPY SESSIONS ---
  public getTherapySessions(patientId?: string): TherapySession[] {
    const sessions = this.get<TherapySession[]>('therapy_sessions', []);
    if (patientId) {
      return sessions.filter((s) => s.patient_id === patientId).sort((a, b) => b.session_number - a.session_number);
    }
    return sessions.sort((a, b) => new Date(b.therapy_date).getTime() - new Date(a.therapy_date).getTime());
  }

  public getNextSessionNumber(patientId: string): number {
    const sessions = this.getTherapySessions(patientId);
    if (sessions.length === 0) return 1;
    const max = Math.max(...sessions.map((s) => s.session_number || 1));
    return max + 1;
  }

  public saveTherapySession(session: Omit<TherapySession, 'id' | 'created_at' | 'updated_at'> & { id?: string }): TherapySession {
    const sessions = this.getTherapySessions();
    const now = new Date().toISOString();

    if (session.id) {
      const index = sessions.findIndex((s) => s.id === session.id);
      if (index >= 0) {
        const existing = sessions[index];
        const updated: TherapySession = {
          ...existing,
          ...session,
          id: session.id,
          created_at: existing.created_at,
          updated_at: now
        };
        sessions[index] = updated;
        this.set('therapy_sessions', sessions);
        return updated;
      }
    }

    const newSession: TherapySession = {
      ...session,
      id: 'ses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      created_at: now,
      updated_at: now
    };
    sessions.unshift(newSession);
    this.set('therapy_sessions', sessions);
    return newSession;
  }

  public deleteTherapySession(sessionId: string): boolean {
    const sessions = this.getTherapySessions().filter((s) => s.id !== sessionId);
    this.set('therapy_sessions', sessions);
    return true;
  }

  // --- SERVICES ---
  public getServices(activeOnly: boolean = false): Service[] {
    const services = this.get<Service[]>('services', DEFAULT_SERVICES);
    if (activeOnly) {
      return services.filter((s) => s.active);
    }
    return services;
  }

  public saveService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Service {
    const services = this.getServices();
    const now = new Date().toISOString();

    if (service.id) {
      const index = services.findIndex((s) => s.id === service.id);
      if (index >= 0) {
        const existing = services[index];
        const updated: Service = {
          ...existing,
          ...service,
          id: service.id,
          created_at: existing.created_at,
          updated_at: now
        };
        services[index] = updated;
        this.set('services', services);
        return updated;
      }
    }

    const newService: Service = {
      ...service,
      id: 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      created_at: now,
      updated_at: now
    };
    services.unshift(newService);
    this.set('services', services);
    return newService;
  }

  public deleteService(id: string): boolean {
    const services = this.getServices().filter((s) => s.id !== id);
    this.set('services', services);
    return true;
  }

  public getServiceCategories(): ServiceCategory[] {
    return this.get<ServiceCategory[]>('service_categories', DEFAULT_SERVICE_CATEGORIES);
  }

  public saveServiceCategory(cat: Omit<ServiceCategory, 'id' | 'created_at'> & { id?: string }): ServiceCategory {
    const cats = this.getServiceCategories();
    if (cat.id) {
      const index = cats.findIndex((c) => c.id === cat.id);
      if (index >= 0) {
        cats[index] = { ...cats[index], ...cat, id: cat.id };
        this.set('service_categories', cats);
        return cats[index];
      }
    }
    const newCat: ServiceCategory = {
      ...cat,
      id: 'sc_' + Date.now(),
      created_at: new Date().toISOString()
    };
    cats.push(newCat);
    this.set('service_categories', cats);
    return newCat;
  }

  public deleteServiceCategory(id: string): boolean {
    const cats = this.getServiceCategories().filter((c) => c.id !== id);
    this.set('service_categories', cats);
    return true;
  }

  // --- HERBAL PRODUCTS ---
  public getHerbalProducts(activeOnly: boolean = false): HerbalProduct[] {
    const products = this.get<HerbalProduct[]>('herbal_products', DEFAULT_HERBAL_PRODUCTS);
    if (activeOnly) {
      return products.filter((p) => p.active);
    }
    return products;
  }

  public saveHerbalProduct(product: Omit<HerbalProduct, 'id' | 'created_at' | 'updated_at'> & { id?: string }): HerbalProduct {
    const products = this.getHerbalProducts();
    const now = new Date().toISOString();

    if (product.id) {
      const index = products.findIndex((p) => p.id === product.id);
      if (index >= 0) {
        const existing = products[index];
        const updated: HerbalProduct = {
          ...existing,
          ...product,
          id: product.id,
          created_at: existing.created_at,
          updated_at: now
        };
        products[index] = updated;
        this.set('herbal_products', products);
        return updated;
      }
    }

    const newProduct: HerbalProduct = {
      ...product,
      id: 'hrb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      created_at: now,
      updated_at: now
    };
    products.unshift(newProduct);
    this.set('herbal_products', products);
    return newProduct;
  }

  public adjustStock(
    productId: string,
    deltaQuantity: number,
    reason: StockAdjustmentReason = 'Koreksi stok',
    notes?: string,
    adjustedBy?: string
  ): boolean {
    const products = this.getHerbalProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index < 0) return false;

    const currentStock = products[index].stock || 0;
    const newStock = Math.max(0, currentStock + deltaQuantity);
    products[index].stock = newStock;
    products[index].updated_at = new Date().toISOString();
    this.set('herbal_products', products);

    // Also record stock adjustment log
    const newAdj: StockAdjustment = {
      id: 'adj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      product_id: products[index].id,
      product_name: products[index].name,
      adjustment_type: deltaQuantity >= 0 ? 'IN' : 'OUT',
      quantity_change: deltaQuantity,
      stock_before: currentStock,
      stock_after: newStock,
      reason,
      notes,
      adjusted_by: adjustedBy || 'Yogi Pangestu (Owner)',
      created_at: new Date().toISOString()
    };
    const allAdj = this.get<StockAdjustment[]>('stock_adjustments', DEFAULT_STOCK_ADJUSTMENTS);
    allAdj.unshift(newAdj);
    this.set('stock_adjustments', allAdj);

    return true;
  }

  public getStockAdjustments(productId?: string): StockAdjustment[] {
    const adjustments = this.get<StockAdjustment[]>('stock_adjustments', DEFAULT_STOCK_ADJUSTMENTS);
    if (productId) {
      return adjustments
        .filter((a) => a.product_id === productId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return adjustments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public recordStockAdjustment(data: {
    product_id: string;
    adjustment_type: 'IN' | 'OUT' | 'SET';
    quantity_change: number;
    reason: StockAdjustmentReason;
    notes?: string;
    adjusted_by?: string;
  }): StockAdjustment | null {
    const products = this.getHerbalProducts();
    const index = products.findIndex((p) => p.id === data.product_id);
    if (index < 0) return null;

    const product = products[index];
    const stockBefore = product.stock || 0;
    let stockAfter = stockBefore;

    if (data.adjustment_type === 'IN') {
      stockAfter = stockBefore + Math.abs(data.quantity_change);
    } else if (data.adjustment_type === 'OUT') {
      stockAfter = Math.max(0, stockBefore - Math.abs(data.quantity_change));
    } else if (data.adjustment_type === 'SET') {
      stockAfter = Math.max(0, data.quantity_change);
    }

    product.stock = stockAfter;
    product.updated_at = new Date().toISOString();
    products[index] = product;
    this.set('herbal_products', products);

    const newAdj: StockAdjustment = {
      id: 'adj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      product_id: product.id,
      product_name: product.name,
      adjustment_type: data.adjustment_type,
      quantity_change:
        data.adjustment_type === 'SET'
          ? stockAfter - stockBefore
          : data.adjustment_type === 'OUT'
          ? -Math.abs(data.quantity_change)
          : Math.abs(data.quantity_change),
      stock_before: stockBefore,
      stock_after: stockAfter,
      reason: data.reason,
      notes: data.notes,
      adjusted_by: data.adjusted_by || 'Yogi Pangestu (Owner)',
      created_at: new Date().toISOString()
    };

    const allAdj = this.get<StockAdjustment[]>('stock_adjustments', DEFAULT_STOCK_ADJUSTMENTS);
    allAdj.unshift(newAdj);
    this.set('stock_adjustments', allAdj);

    return newAdj;
  }

  public deleteHerbalProduct(id: string): boolean {
    const products = this.getHerbalProducts().filter((p) => p.id !== id);
    this.set('herbal_products', products);
    return true;
  }

  public getProductCategories(): ProductCategory[] {
    return this.get<ProductCategory[]>('product_categories', DEFAULT_PRODUCT_CATEGORIES);
  }

  public saveProductCategory(cat: Omit<ProductCategory, 'id' | 'created_at'> & { id?: string }): ProductCategory {
    const cats = this.getProductCategories();
    if (cat.id) {
      const index = cats.findIndex((c) => c.id === cat.id);
      if (index >= 0) {
        cats[index] = { ...cats[index], ...cat, id: cat.id };
        this.set('product_categories', cats);
        return cats[index];
      }
    }
    const newCat: ProductCategory = {
      ...cat,
      id: 'pc_' + Date.now(),
      created_at: new Date().toISOString()
    };
    cats.push(newCat);
    this.set('product_categories', cats);
    return newCat;
  }

  public deleteProductCategory(id: string): boolean {
    const cats = this.getProductCategories().filter((c) => c.id !== id);
    this.set('product_categories', cats);
    return true;
  }

  // --- SALES & SALE ITEMS ---
  public getSales(patientId?: string): Sale[] {
    const sales = this.get<Sale[]>('sales', DEFAULT_SALES);
    const saleItems = this.getSaleItems();

    const salesWithItems = sales.map((sale) => ({
      ...sale,
      items: saleItems.filter((item) => item.sale_id === sale.id)
    }));

    if (patientId) {
      return salesWithItems
        .filter((s) => s.patient_id === patientId)
        .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
    }
    return salesWithItems.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime());
  }

  public getSaleItems(): SaleItem[] {
    return this.get<SaleItem[]>('sale_items', DEFAULT_SALE_ITEMS);
  }

  public generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}-`;

    const invoices = this.getInvoices();
    let maxNum = 0;
    invoices.forEach((inv) => {
      if (inv.invoice_number.startsWith(prefix)) {
        const numPart = parseInt(inv.invoice_number.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  }

  public createSaleWithItems(
    saleData: {
      patient_id?: string;
      patient_name?: string;
      sale_date: string;
      discount: number;
      payment_method: Sale['payment_method'];
      payment_status: Sale['payment_status'];
      amount_paid?: number;
      notes?: string;
    },
    items: Array<{
      item_type: 'service' | 'product';
      service_id?: string;
      product_id?: string;
      item_name: string;
      quantity: number;
      price: number;
    }>
  ): { sale: Sale; invoice: Invoice; payment?: Payment } {
    const now = new Date().toISOString();
    const saleId = 'sle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const invoiceId = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const invoiceNumber = this.generateInvoiceNumber();

    // Calculate subtotal
    let subtotal = 0;
    const newSaleItems: SaleItem[] = items.map((item, idx) => {
      const itemSubtotal = item.quantity * item.price;
      subtotal += itemSubtotal;

      // Deduct herbal stock if product and log
      if (item.item_type === 'product' && item.product_id) {
        this.adjustStock(
          item.product_id,
          -item.quantity,
          'Penjualan Kasir',
          `Faktur ${invoiceNumber} - ${saleData.patient_name || 'Pasien Umum'}`
        );
      }

      return {
        id: 'sit_' + Date.now() + '_' + idx,
        sale_id: saleId,
        item_type: item.item_type,
        service_id: item.service_id,
        product_id: item.product_id,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal
      };
    });

    const total = Math.max(0, subtotal - (saleData.discount || 0));

    // Determine actual payment status
    const paidAmount =
      saleData.amount_paid !== undefined
        ? Number(saleData.amount_paid)
        : saleData.payment_status === 'Lunas'
        ? total
        : saleData.payment_status === 'DP'
        ? total / 2
        : 0;

    let finalPaymentStatus: PaymentStatus = 'Belum Lunas';
    if (paidAmount >= total && total > 0) {
      finalPaymentStatus = 'Lunas';
    } else if (paidAmount > 0) {
      finalPaymentStatus = 'DP';
    } else {
      finalPaymentStatus = saleData.payment_status || 'Belum Lunas';
    }

    // Create Sale record
    const newSale: Sale = {
      id: saleId,
      invoice_id: invoiceId,
      patient_id: saleData.patient_id,
      patient_name: saleData.patient_name,
      sale_date: saleData.sale_date,
      subtotal,
      discount: saleData.discount || 0,
      total,
      payment_status: finalPaymentStatus,
      payment_method: saleData.payment_method,
      notes: saleData.notes,
      items: newSaleItems,
      created_at: now
    };

    // Create Invoice record
    const newInvoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      patient_id: saleData.patient_id,
      patient_name: saleData.patient_name,
      sale_id: saleId,
      invoice_date: saleData.sale_date,
      subtotal,
      discount: saleData.discount || 0,
      total,
      payment_status: finalPaymentStatus,
      payment_method: saleData.payment_method,
      notes: saleData.notes,
      created_at: now
    };

    // Save to storage
    const allSales = this.get<Sale[]>('sales', []);
    allSales.unshift(newSale);
    this.set('sales', allSales);

    const allSaleItems = this.get<SaleItem[]>('sale_items', []);
    allSaleItems.push(...newSaleItems);
    this.set('sale_items', allSaleItems);

    const allInvoices = this.get<Invoice[]>('invoices', []);
    allInvoices.unshift(newInvoice);
    this.set('invoices', allInvoices);

    // Create initial payment record if paid
    let newPayment: Payment | undefined;
    if (paidAmount > 0) {
      newPayment = {
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        patient_id: saleData.patient_id,
        sale_id: saleId,
        invoice_id: invoiceId,
        payment_date: saleData.sale_date,
        amount: paidAmount,
        payment_method: saleData.payment_method,
        status: finalPaymentStatus,
        notes: `Pembayaran ${finalPaymentStatus === 'Lunas' ? 'Lunas' : 'DP'} untuk faktur ${invoiceNumber}`,
        created_at: now
      };
      const allPayments = this.get<Payment[]>('payments', []);
      allPayments.unshift(newPayment);
      this.set('payments', allPayments);
    }

    return { sale: newSale, invoice: newInvoice, payment: newPayment };
  }

  // --- INVOICES ---
  public getInvoices(patientId?: string): Invoice[] {
    const invoices = this.get<Invoice[]>('invoices', DEFAULT_INVOICES);
    if (patientId) {
      return invoices
        .filter((i) => i.patient_id === patientId)
        .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
    }
    return invoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime());
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  }

  // --- PAYMENTS ---
  public getPayments(patientId?: string): Payment[] {
    const payments = this.get<Payment[]>('payments', DEFAULT_PAYMENTS);
    if (patientId) {
      return payments
        .filter((p) => p.patient_id === patientId)
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
    }
    return payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  public recordPayment(payment: Omit<Payment, 'id' | 'created_at'>): Payment {
    const now = new Date().toISOString();
    const newPayment: Payment = {
      ...payment,
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      created_at: now
    };
    const payments = this.getPayments();
    payments.unshift(newPayment);
    this.set('payments', payments);

    // Automatically recalculate and sync invoice and sale status
    if (payment.invoice_id || payment.sale_id) {
      const invoices = this.get<Invoice[]>('invoices', []);
      const invIndex = invoices.findIndex(
        (i) => i.id === payment.invoice_id || (payment.sale_id && i.sale_id === payment.sale_id)
      );

      if (invIndex >= 0) {
        const targetInvoice = invoices[invIndex];
        const invoicePayments = payments.filter(
          (p) =>
            p.invoice_id === targetInvoice.id ||
            (targetInvoice.sale_id && p.sale_id === targetInvoice.sale_id)
        );
        const totalPaid = invoicePayments.reduce((acc, p) => acc + (p.amount || 0), 0);

        let newStatus: PaymentStatus = 'Belum Lunas';
        if (totalPaid >= targetInvoice.total && targetInvoice.total > 0) {
          newStatus = 'Lunas';
        } else if (totalPaid > 0) {
          newStatus = 'DP';
        }

        invoices[invIndex].payment_status = newStatus;
        this.set('invoices', invoices);

        if (targetInvoice.sale_id) {
          const sales = this.get<Sale[]>('sales', []);
          const sIndex = sales.findIndex((s) => s.id === targetInvoice.sale_id);
          if (sIndex >= 0) {
            sales[sIndex].payment_status = newStatus;
            this.set('sales', sales);
          }
        }
      }
    }

    return newPayment;
  }

  public updateInvoiceStatus(id: string, status: PaymentStatus): void {
    const invoices = this.get<Invoice[]>('invoices', []);
    const index = invoices.findIndex((i) => i.id === id);
    if (index >= 0) {
      invoices[index].payment_status = status;
      this.set('invoices', invoices);

      if (invoices[index].sale_id) {
        const sales = this.get<Sale[]>('sales', []);
        const sIndex = sales.findIndex((s) => s.id === invoices[index].sale_id);
        if (sIndex >= 0) {
          sales[sIndex].payment_status = status;
          this.set('sales', sales);
        }
      }
    }
  }

  // --- EXPENSES ---
  public getExpenses(): Expense[] {
    return this.get<Expense[]>('expenses', DEFAULT_EXPENSES).sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
  }

  public saveExpense(expense: Omit<Expense, 'id' | 'created_at'> & { id?: string }): Expense {
    const expenses = this.getExpenses();
    const now = new Date().toISOString();

    if (expense.id) {
      const index = expenses.findIndex((e) => e.id === expense.id);
      if (index >= 0) {
        expenses[index] = { ...expenses[index], ...expense, id: expense.id };
        this.set('expenses', expenses);
        return expenses[index];
      }
    }

    const newExpense: Expense = {
      ...expense,
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      created_at: now
    };
    expenses.unshift(newExpense);
    this.set('expenses', expenses);
    return newExpense;
  }

  public deleteExpense(id: string): boolean {
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    this.set('expenses', expenses);
    return true;
  }

  public getExpenseCategories(): ExpenseCategory[] {
    return this.get<ExpenseCategory[]>('expense_categories', DEFAULT_EXPENSE_CATEGORIES);
  }

  public saveExpenseCategory(cat: Omit<ExpenseCategory, 'id' | 'created_at'> & { id?: string }): ExpenseCategory {
    const cats = this.getExpenseCategories();
    if (cat.id) {
      const index = cats.findIndex((c) => c.id === cat.id);
      if (index >= 0) {
        cats[index] = { ...cats[index], ...cat, id: cat.id };
        this.set('expense_categories', cats);
        return cats[index];
      }
    }
    const newCat: ExpenseCategory = {
      ...cat,
      id: 'ec_' + Date.now(),
      created_at: new Date().toISOString()
    };
    cats.push(newCat);
    this.set('expense_categories', cats);
    return newCat;
  }

  public deleteExpenseCategory(id: string): boolean {
    const cats = this.getExpenseCategories().filter((c) => c.id !== id);
    this.set('expense_categories', cats);
    return true;
  }

  // --- INCOME (MANUAL ADDITIONAL) ---
  public getIncomes(): Income[] {
    return this.get<Income[]>('income', DEFAULT_INCOME).sort((a, b) => new Date(b.income_date).getTime() - new Date(a.income_date).getTime());
  }

  public saveIncome(income: Omit<Income, 'id' | 'created_at'> & { id?: string }): Income {
    const incomes = this.getIncomes();
    const now = new Date().toISOString();

    if (income.id) {
      const index = incomes.findIndex((i) => i.id === income.id);
      if (index >= 0) {
        incomes[index] = { ...incomes[index], ...income, id: income.id };
        this.set('income', incomes);
        return incomes[index];
      }
    }

    const newIncome: Income = {
      ...income,
      id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      created_at: now
    };
    incomes.unshift(newIncome);
    this.set('income', incomes);
    return newIncome;
  }

  public deleteIncome(id: string): boolean {
    const incomes = this.getIncomes().filter((i) => i.id !== id);
    this.set('income', incomes);
    return true;
  }

  // --- BACKUP & RESTORE ---
  public exportFullDatabase(exportedBy: string = 'Yogi Pangestu (Owner)'): DatabaseBackupPayload {
    const backup: DatabaseBackupPayload = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      exported_by: exportedBy,
      settings: this.getSettings(),
      users: this.getUsers(),
      patients: this.getPatients(),
      therapy_sessions: this.getTherapySessions(),
      services: this.getServices(),
      service_categories: this.getServiceCategories(),
      herbal_products: this.getHerbalProducts(),
      product_categories: this.getProductCategories(),
      sales: this.getSales(),
      sale_items: this.getSaleItems(),
      payments: this.getPayments(),
      invoices: this.getInvoices(),
      expenses: this.getExpenses(),
      expense_categories: this.getExpenseCategories(),
      income: this.getIncomes(),
      stock_adjustments: this.getStockAdjustments()
    };

    // Update last backup timestamp
    this.updateSettings({ last_backup_at: backup.exported_at });
    return backup;
  }

  public importFullDatabase(payload: DatabaseBackupPayload): boolean {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Format file backup tidak valid.');
    }
    if (payload.settings) this.set('settings', payload.settings);
    if (Array.isArray(payload.users)) this.set('users', payload.users);
    if (Array.isArray(payload.patients)) this.set('patients', payload.patients);
    if (Array.isArray(payload.therapy_sessions)) this.set('therapy_sessions', payload.therapy_sessions);
    if (Array.isArray(payload.services)) this.set('services', payload.services);
    if (Array.isArray(payload.service_categories)) this.set('service_categories', payload.service_categories);
    if (Array.isArray(payload.herbal_products)) this.set('herbal_products', payload.herbal_products);
    if (Array.isArray(payload.product_categories)) this.set('product_categories', payload.product_categories);
    if (Array.isArray(payload.sales)) this.set('sales', payload.sales);
    if (Array.isArray(payload.sale_items)) this.set('sale_items', payload.sale_items);
    if (Array.isArray(payload.payments)) this.set('payments', payload.payments);
    if (Array.isArray(payload.invoices)) this.set('invoices', payload.invoices);
    if (Array.isArray(payload.expenses)) this.set('expenses', payload.expenses);
    if (Array.isArray(payload.expense_categories)) this.set('expense_categories', payload.expense_categories);
    if (Array.isArray(payload.income)) this.set('income', payload.income);
    if (Array.isArray(payload.stock_adjustments)) this.set('stock_adjustments', payload.stock_adjustments);

    return true;
  }
}

export const db = new StorageEngine();
