import React, { useState, useEffect } from 'react';
import { X, User, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { Gender, Patient, PatientStatus } from '../../types';
import { db } from '../../lib/storage';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: Patient | null;
  onSuccess?: (patient: Patient) => void;
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  patientToEdit,
  onSuccess
}) => {
  const { addPatient, updatePatient } = useClinic();

  const [activeFormTab, setActiveFormTab] = useState<'identity' | 'clinical'>('identity');
  const [patientCode, setPatientCode] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('Laki-laki');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Clinical info
  const [mainComplaint, setMainComplaint] = useState('');
  const [additionalComplaint, setAdditionalComplaint] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergyNotes, setAllergyNotes] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [status, setStatus] = useState<PatientStatus>('Aktif');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patientToEdit) {
      setPatientCode(patientToEdit.patient_code);
      setFullName(patientToEdit.full_name);
      setNik(patientToEdit.nik || '');
      setBirthDate(patientToEdit.birth_date || '');
      setGender(patientToEdit.gender);
      setPhone(patientToEdit.phone || '');
      setWhatsapp(patientToEdit.whatsapp || '');
      setEmail(patientToEdit.email || '');
      setAddress(patientToEdit.address || '');
      setOccupation(patientToEdit.occupation || '');
      setEmergencyContact(patientToEdit.emergency_contact || '');
      setMainComplaint(patientToEdit.main_complaint);
      setAdditionalComplaint(patientToEdit.additional_complaint || '');
      setMedicalHistory(patientToEdit.medical_history || '');
      setAllergyNotes(patientToEdit.allergy_notes || '');
      setImportantNotes(patientToEdit.important_notes || '');
      setStatus(patientToEdit.status);
    } else {
      // Auto-generate next code
      setPatientCode(db.generatePatientCode());
      setFullName('');
      setNik('');
      setBirthDate('');
      setGender('Laki-laki');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setAddress('');
      setOccupation('');
      setEmergencyContact('');
      setMainComplaint('');
      setAdditionalComplaint('');
      setMedicalHistory('');
      setAllergyNotes('');
      setImportantNotes('');
      setStatus('Aktif');
    }
    setErrors({});
    setActiveFormTab('identity');
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Nama lengkap wajib diisi';
    if (!whatsapp.trim() && !phone.trim()) errs.whatsapp = 'Nomor WhatsApp atau HP wajib diisi';
    if (!mainComplaint.trim()) errs.mainComplaint = 'Keluhan utama pasien wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      if (errors.mainComplaint && activeFormTab === 'identity') {
        setActiveFormTab('clinical');
      }
      return;
    }

    const payload = {
      patient_code: patientCode,
      full_name: fullName.trim(),
      nik: nik.trim() || undefined,
      birth_date: birthDate || undefined,
      gender,
      phone: (phone || whatsapp).trim(),
      whatsapp: (whatsapp || phone).trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      occupation: occupation.trim() || undefined,
      emergency_contact: emergencyContact.trim() || undefined,
      main_complaint: mainComplaint.trim(),
      additional_complaint: additionalComplaint.trim() || undefined,
      medical_history: medicalHistory.trim() || undefined,
      allergy_notes: allergyNotes.trim() || undefined,
      important_notes: importantNotes.trim() || undefined,
      status
    };

    let resultPatient: Patient;
    if (patientToEdit) {
      resultPatient = updatePatient(patientToEdit.id, payload);
    } else {
      resultPatient = addPatient(payload);
    }

    if (onSuccess) onSuccess(resultPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {patientToEdit ? 'Edit Rekam Medis Pasien' : 'Pendaftaran Pasien Baru'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                ID Pasien: <span className="text-emerald-400 font-bold">{patientCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveFormTab('identity')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeFormTab === 'identity'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Identitas & Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('clinical')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeFormTab === 'clinical'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Informasi Keluhan & Riwayat
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* TAB 1: IDENTITY */}
          {activeFormTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pasien <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Bapak Bambang Supriyanto"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      errors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                    }`}
                  />
                  {errors.fullName && <p className="text-xs text-rose-600 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp Pasien <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Telepon / HP Alternatif
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0813xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Laki-laki')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        gender === 'Laki-laki'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Perempuan')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        gender === 'Perempuan'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Perempuan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK (KTP)</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="3275xxxxxxxxxxxx"
                    maxLength={16}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Wiraswasta / Karyawan / Pensiunan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kontak Darurat (Keluarga Terdekat)
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Nama Pasangan/Anak - No HP (misal: Ibu Ratna - 081288992299)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat lengkap tempat tinggal pasien..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('clinical')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Lanjut ke Informasi Keluhan →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL / COMPLAINTS */}
          {activeFormTab === 'clinical' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan Utama <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={mainComplaint}
                  onChange={(e) => setMainComplaint(e.target.value)}
                  placeholder="Contoh: Saraf Kejepit Lumbal L4-L5, rasa kebas menjalar ke paha dan kaki kanan..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    errors.mainComplaint ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {errors.mainComplaint && (
                  <p className="text-xs text-rose-600 mt-1">{errors.mainComplaint}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan Tambahan / Gejala Penyerta
                </label>
                <textarea
                  rows={2}
                  value={additionalComplaint}
                  onChange={(e) => setAdditionalComplaint(e.target.value)}
                  placeholder="Pinggang kaku di pagi hari, sakit saat membungkuk, leher tegang..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Riwayat Medis / Rontgen / MRI
                  </label>
                  <textarea
                    rows={2}
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Hasil MRI/Rontgen sebelumnya, riwayat stroke, hipertensi..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Alergi Pasien
                  </label>
                  <textarea
                    rows={2}
                    value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)}
                    placeholder="Alergi dingin, alergi obat, plester, dsb (atau 'Tidak ada')..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Khusus Praktisi
                  </label>
                  <input
                    type="text"
                    value={importantNotes}
                    onChange={(e) => setImportantNotes(e.target.value)}
                    placeholder="Hindari angkat beban, pantau tensi..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Terapi</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PatientStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Aktif">Aktif Terapi</option>
                    <option value="Selesai">Selesai / Pulih</option>
                    <option value="Menunggu">Menunggu Jadwal</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('identity')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Kembali ke Identitas
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                  >
                    {patientToEdit ? 'Simpan Perubahan Pasien' : 'Daftarkan Pasien'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
