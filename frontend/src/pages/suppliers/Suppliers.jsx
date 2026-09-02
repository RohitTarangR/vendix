import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Truck, Plus, Search, Edit3, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export default function Suppliers() {
  const queryClient = useQueryClient();
  const { addToast, showConfirm } = useUiStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: async () => {
      const res = await api.get(`/suppliers?search=${search}&page=${page}&limit=8`);
      return res.data.data;
    }
  });

  const suppliers = data?.suppliers || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 8, pages: 1 };

  const createMutation = useMutation({
    mutationFn: (newSupp) => api.post('/suppliers', newSupp),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      addToast('Supplier created successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create supplier', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedSupp }) => api.put(`/suppliers/${id}`, updatedSupp),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      addToast('Supplier updated successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update supplier', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      addToast('Supplier deactivated successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to deactivate supplier', 'error');
    }
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setIsOpen(true);
  };

  const openEditModal = (supp) => {
    setEditingSupplier(supp);
    setFormData({
      name: supp.name,
      phone: supp.phone || '',
      email: supp.email || '',
      address: supp.address || ''
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, updatedSupp: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Deactivate Supplier',
      message: 'Are you sure you want to deactivate this supplier?',
      onConfirm: () => deleteMutation.mutate(id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <Truck className="text-primary" /> Suppliers
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Manage your list of vendors and stock suppliers.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 p-4">
        <div className="relative max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search suppliers..."
            className="pl-10 pr-4 py-2 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Supplier List Table */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading suppliers...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load suppliers.</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center text-textSecondary dark:text-gray-400 space-y-3">
            <Truck className="mx-auto h-12 w-12 text-textSecondary dark:text-gray-400" />
            <h3 className="text-sm font-medium text-slate-950 dark:text-white">No suppliers</h3>
            <p className="text-sm text-textSecondary dark:text-gray-400">Add suppliers to link them with purchase invoices.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium"
            >
              <Plus size={16} /> Add Supplier
            </button>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
                {suppliers.map((supp) => (
                  <tr key={supp.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary dark:text-white">{supp.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">{supp.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">{supp.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-textSecondary dark:text-gray-400 max-w-xs truncate">{supp.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(supp)}
                        className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supp.id)}
                        className="text-red-650 hover:text-red-550 transition inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-separator dark:border-white/10 flex items-center justify-between">
                <span className="text-sm text-textSecondary dark:text-gray-400">
                  Showing page {pagination.page} of {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border rounded bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:bg-white/5 transition disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border rounded bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:bg-white/5 transition disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button onClick={closeModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Supplier Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Phone Number</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Email Address</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Address</label>
                <textarea
                  rows={2}
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  {editingSupplier ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
