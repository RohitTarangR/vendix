import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Warehouse, Plus, Edit3, Trash2, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export default function Stores() {
  const queryClient = useQueryClient();
  const { addToast, showConfirm } = useUiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });

  const { data: stores = [], isLoading, isError } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await api.get('/stores');
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newStore) => api.post('/stores', newStore),
    onSuccess: () => {
      queryClient.invalidateQueries(['stores']);
      addToast('Store branch created successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create store branch', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedStore }) => api.put(`/stores/${id}`, updatedStore),
    onSuccess: () => {
      queryClient.invalidateQueries(['stores']);
      addToast('Store branch updated successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update store branch', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/stores/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['stores']);
      addToast('Store branch deleted successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete store branch', 'error');
    }
  });

  const openAddModal = () => {
    setEditingStore(null);
    setFormData({
      name: '',
      location: ''
    });
    setIsOpen(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      location: store.location || ''
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingStore(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, updatedStore: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Branch/Store',
      message: 'Are you sure you want to delete this branch/store?',
      onConfirm: () => deleteMutation.mutate(id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <Warehouse className="text-primary" /> Stores / Branches
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Manage multiple physical outlets or warehouse stores.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
        >
          <Plus size={18} /> Add Branch
        </button>
      </div>

      {/* Stores List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-textSecondary dark:text-gray-400">Loading stores...</div>
        ) : isError ? (
          <div className="col-span-full py-8 text-center text-red-500">Failed to load stores.</div>
        ) : stores.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#1C1C1E] rounded-mac-card border border-separator dark:border-white/10 p-12 text-center text-textSecondary dark:text-gray-400 space-y-3">
            <Warehouse className="mx-auto h-12 w-12 text-textSecondary dark:text-gray-400" />
            <h3 className="text-sm font-medium text-slate-955">No store branches configured</h3>
            <p className="text-sm text-textSecondary dark:text-gray-400">Configuring branches allows you to track analytics and stock locations.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium"
            >
              <Plus size={16} /> Add Branch
            </button>
          </div>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md hover:border-separator dark:border-white/10 transition duration-150">
              <div className="space-y-2">
                <div className="p-3 bg-primary/10 rounded-mac-btn w-fit text-primary">
                  <Warehouse size={24} />
                </div>
                <h3 className="text-lg font-bold text-textPrimary dark:text-white">{store.name}</h3>
                <p className="text-sm text-textSecondary dark:text-gray-400">{store.location || 'No location address configured'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-separator dark:border-white/10 mt-6">
                <button
                  onClick={() => openEditModal(store)}
                  className="flex items-center gap-1.5 text-slate-655 hover:text-primary text-sm font-medium transition"
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="flex items-center gap-1.5 text-red-655 hover:text-red-550 text-sm font-medium transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">
                {editingStore ? 'Edit Branch Info' : 'Add New Branch'}
              </h3>
              <button onClick={closeModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Branch Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Location Address / Area</label>
                <textarea
                  rows={2}
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-separator dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 border border-separator dark:border-white/10 rounded-mac-btn text-sm font-medium text-textSecondary dark:text-gray-400 hover:bg-slate-50 dark:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="py-2 px-4 border border-transparent rounded-mac-btn text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50"
                >
                  {editingStore ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
