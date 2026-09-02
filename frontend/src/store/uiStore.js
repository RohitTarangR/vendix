import { create } from 'zustand';
import { toast } from 'react-toastify';

export const useUiStore = create((set, get) => ({
  // Toast notifications state (kept array for backward compatibility with UiOverlay if needed, though we will remove it there)
  toasts: [],
  addToast: (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'info') {
      toast.info(message);
    } else {
      toast(message);
    }
  },
  removeToast: (id) => {
    // Handled by react-toastify automatically
  },

  // Confirmation dialog state
  confirmState: {
    isOpen: false,
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    onConfirm: null,
    onCancel: null
  },
  showConfirm: ({ title, message, onConfirm, onCancel }) => {
    set({
      confirmState: {
        isOpen: true,
        title: title || 'Are you sure?',
        message: message || 'This action cannot be undone.',
        onConfirm: () => {
          if (onConfirm) onConfirm();
          get().closeConfirm();
        },
        onCancel: () => {
          if (onCancel) onCancel();
          get().closeConfirm();
        }
      }
    });
  },
  closeConfirm: () => {
    set({
      confirmState: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
      }
    });
  }
}));
