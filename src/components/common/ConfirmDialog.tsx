import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  requiredTypedConfirmation?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDangerous = false,
  requiredTypedConfirmation
}) => {
  const [typedInput, setTypedInput] = React.useState('');

  if (!isOpen) return null;

  const isConfirmDisabled = requiredTypedConfirmation
    ? typedInput.trim() !== requiredTypedConfirmation
    : false;

  const handleConfirm = () => {
    onConfirm();
    setTypedInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isDangerous ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {requiredTypedConfirmation && (
          <div className="mt-4 p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl">
            <p className="text-xs font-semibold text-rose-800">
              Ketik <span className="font-mono bg-rose-200/80 px-1.5 py-0.5 rounded text-rose-900 font-bold">{requiredTypedConfirmation}</span> untuk konfirmasi:
            </p>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={`Ketik ${requiredTypedConfirmation}`}
              className="mt-2 w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-xs cursor-pointer ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
