import { useUiStore } from '../../store/uiStore';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function UiOverlay() {
  const { toasts, removeToast, confirmState } = useUiStore();

  const toastIcons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />
  };

  const toastClasses = {
    success: 'bg-green-50 border-green-200 text-green-800 shadow-green-100/50',
    error: 'bg-red-50 border-red-200 text-red-800 shadow-red-100/50',
    info: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100/50'
  };

  return (
    <>
      {/* Toast Notifications Stack (Replaced by react-toastify in App.jsx) */}

      {/* Custom Confirmation Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-separator dark:border-white/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-mac-card border border-amber-100 shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-textPrimary dark:text-white">{confirmState.title}</h3>
                <p className="text-sm text-textSecondary dark:text-gray-400 leading-relaxed">{confirmState.message}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={confirmState.onCancel}
                className="py-2.5 px-5 border border-separator dark:border-white/10 rounded-mac-card hover:bg-slate-50 dark:bg-white/5 transition text-sm font-bold text-textSecondary dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-mac-card transition text-sm font-bold shadow-mac-subtle dark:shadow-none"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
