import React, { useState, useEffect } from 'react';
import { X, Activity, User, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { useClinic } from '../../context/DbContext';
import { TherapySession, PaymentStatus } from '../../types';

interface TherapyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: TherapySession | null;
  initialPatientId?: string;
  onSuccess?: (session: TherapySession) => void;
}

export const TherapyFormModal: React.FC<TherapyFormModalProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  initialPatientId,
  onSuccess
}) => {
  const { patients, therapySessions, services, addTherapySession, updateTherapySession } = useClinic();

  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [sessionNumber, setSessionNumber] = useState(1);
  const [therapyDate, setTherapyDate] = useState(new Date().toISOString().split('T')[0]);
  const [therapyType, setTherapyType] = useState('Akupunktur Saraf Kejepit (HNP)');
  const [treatmentArea, setTreatmentArea] = useState('');
  const [conditionBefore, setConditionBefore] = useState('');
  const [conditionAfter, setConditionAfter] = useState('');
  const [patientResponse, setPatientResponse] = useState('');
  const [practitionerNotes, setPractitionerNotes] = useState('');
  const [nextPlan, setNextPlan] = useState('');
  const [cost, setCost] = useState(150000);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // When patient selection changes, auto-compute the next session number
  useEffect(() => {
    if (sessionToEdit) {
      setPatientId(sessionToEdit.patient_id);
      setSessionNumber(sessionToEdit.session_number);
      setTherapyDate(sessionToEdit.therapy_date);
      setTherapyType(sessionToEdit.therapy_type);
      setTreatmentArea(sessionToEdit.treatment_area || '');
      setConditionBefore(sessionToEdit.condition_before || '');
      setConditionAfter(sessionToEdit.condition_after || '');
      setPatientResponse(sessionToEdit.patient_response || '');
      setPractitionerNotes(sessionToEdit.practitioner_notes || '');
      setNextPlan(sessionToEdit.next_plan || '');
      setCost(sessionToEdit.cost);
      setPaymentStatus(sessionToEdit.payment_status);
    } else {
      const selectedPid = initialPatientId || (patients.length > 0 ? patients[0].id : '');
      setPatientId(selectedPid);

      if (selectedPid) {
        const existingCount = therapySessions.filter((s) => s.patient_id === selectedPid).length;
        setSessionNumber(existingCount + 1);
      } else {
        setSessionNumber(1);
      }

      setTherapyDate(new Date().toISOString().split('T')[0]);
      setTherapyType('Akupunktur Saraf Kejepit (HNP)');
      setTreatmentArea('');
      setConditionBefore('');
      setConditionAfter('');
      setPatientResponse('');
      setPractitionerNotes('');
      setNextPlan('');
      setCost(150000);
      setPaymentStatus('Lunas');
    }
    setErrors({});
  }, [sessionToEdit, initialPatientId, isOpen, patients, therapySessions]);

  const handlePatientChange = (newPid: string) => {
    setPatientId(newPid);
    if (!sessionToEdit && newPid) {
      const count = therapySessions.filter((s) => s.patient_id === newPid).length;
      setSessionNumber(count + 1);
    }
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!patientId) errs.patientId = 'Pilih pasien terlebih dahulu';
    if (!therapyType.trim()) errs.therapyType = 'Jenis terapi wajib diisi';
    if (cost < 0) errs.cost = 'Biaya tidak valid';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      patient_id: patientId,
      session_number: Number(sessionNumber),
      therapy_date: therapyDate,
      therapy_type: therapyType.trim(),
      complaint: selectedPatient?.main_complaint || therapyType.trim(),
      treatment_area: treatmentArea.trim() || undefined,
      condition_before: conditionBefore.trim() || undefined,
      condition_after: conditionAfter.trim() || undefined,
      patient_response: (patientResponse.trim() || conditionAfter.trim()) || undefined,
      practitioner_notes: practitionerNotes.trim() || undefined,
      next_plan: nextPlan.trim() || undefined,
      cost: Number(cost),
      payment_status: paymentStatus
    };

    let result: TherapySession;
    if (sessionToEdit) {
      result = updateTherapySession(sessionToEdit.id, payload);
    } else {
      result = addTherapySession(payload);
    }

    if (onSuccess) onSuccess(result);
    onClose();
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {sessionToEdit ? 'Edit Rekam Sesi Terapi' : 'Catat Sesi Terapi Akupunktur'}
              </h3>
              <p className="text-xs text-slate-400">
                Praktisi: <span className="text-emerald-400 font-semibold">Yogi Pangestu</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Patient Selection & Session # */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Pasien <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={patientId}
                disabled={!!sessionToEdit}
                onChange={(e) => handlePatientChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  errors.patientId ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
                }`}
              >
                <option value="">-- Pilih Pasien Rekam Medis --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.patient_code}) - {p.main_complaint.slice(0, 30)}...
                  </option>
                ))}
              </select>
              {selectedPatient && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  Keluhan Pasien: {selectedPatient.main_complaint}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Sesi <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={sessionNumber}
                onChange={(e) => setSessionNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-center bg-slate-50"
              />
            </div>
          </div>

          {/* Date & Therapy Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Terapi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={therapyDate}
                onChange={(e) => setTherapyDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Layanan Terapi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={therapyType}
                onChange={(e) => setTherapyType(e.target.value)}
                placeholder="Akupunktur Saraf Kejepit (HNP) / Stroke / dsb"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quick Presets for Therapy Type */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Preset:</span>
            {[
              'Akupunktur Saraf Kejepit (HNP)',
              'Akupunktur Pemulihan Stroke',
              'Akupunktur Nyeri Sendi & Pinggang',
              'Akupunktur Relaksasi & Migrain'
            ].map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setTherapyType(preset)}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 rounded-md text-slate-600 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Area & Meridian Points */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Area Tindakan & Titik Meridian Penusukan
            </label>
            <input
              type="text"
              value={treatmentArea}
              onChange={(e) => setTreatmentArea(e.target.value)}
              placeholder="Contoh: BL-23 (Shenshu), BL-25 (Dachangshu), GB-30 (Huantiao), ST-36 (Zusanli)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Condition Before & After */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kondisi Pasien Sebelum Terapi
              </label>
              <textarea
                rows={2}
                value={conditionBefore}
                onChange={(e) => setConditionBefore(e.target.value)}
                placeholder="Skala nyeri 8/10, kaki kanan kebas sulit digerakkan, pinggang kaku..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kondisi Setelah Terapi & Respons Pasien
              </label>
              <textarea
                rows={2}
                value={conditionAfter}
                onChange={(e) => {
                  setConditionAfter(e.target.value);
                  setPatientResponse(e.target.value);
                }}
                placeholder="Sensasi DeQi hangat terasa, nyeri turun ke skala 4/10, otot pinggang lemas..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Practitioner Notes & Next Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Khusus Praktisi (Yogi Pangestu)
              </label>
              <textarea
                rows={2}
                value={practitionerNotes}
                onChange={(e) => setPractitionerNotes(e.target.value)}
                placeholder="Respon saraf motorik sangat baik, stimulasi jarum ditingkatkan bertahap..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rencana Sesi Berikutnya / Anjuran
              </label>
              <textarea
                rows={2}
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value)}
                placeholder="Jadwal sesi berikutnya 3 hari lagi, hindari angkat beban & kompres hangat..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Cost & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biaya Sesi Terapi (Rp)
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Pembayaran</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Lunas')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentStatus === 'Lunas'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Lunas
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Belum Lunas')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    paymentStatus === 'Belum Lunas'
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Belum Lunas
                </button>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
              {sessionToEdit ? 'Simpan Perubahan Sesi' : 'Simpan Rekam Sesi Terapi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
