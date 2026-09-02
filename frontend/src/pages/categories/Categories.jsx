import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { FolderOpen, Plus, Search, Edit3, Trash2, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import CustomSelect from '../../components/common/CustomSelect';

export default function Categories() {
  const queryClient = useQueryClient();
  const { addToast, showConfirm } = useUiStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE'
  });

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['categories', search],
    queryFn: async () => {
      const res = await api.get(`/categories?search=${search}`);
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newCat) => api.post('/categories', newCat),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      addToast('Category created successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create category', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedCat }) => api.put(`/categories/${id}`, updatedCat),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      addToast('Category updated successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update category', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      addToast('Category deleted successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete category', 'error');
    }
  });

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', status: 'ACTIVE' });
    setIsOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '', status: cat.status });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, updatedCat: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    showConfirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category?',
      onConfirm: () => deleteMutation.mutate(id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <FolderOpen className="text-primary" /> Categories
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Manage your shop's product categories.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 p-4">
        <div className="relative max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            className="pl-10 pr-4 py-2 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading categories...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load categories.</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-textSecondary dark:text-gray-400 space-y-3">
            <FolderOpen className="mx-auto h-12 w-12 text-textSecondary dark:text-gray-400" />
            <h3 className="text-sm font-medium text-slate-950 dark:text-white">No categories</h3>
            <p className="text-sm text-textSecondary dark:text-gray-400">Get started by creating a new category.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium"
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-separator dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary dark:text-white">{cat.name}</td>
                  <td className="px-6 py-4 text-sm text-textSecondary dark:text-gray-400 max-w-xs truncate">{cat.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 border border-green-150' : 'bg-surfaceSolid dark:bg-white/10 text-textPrimary dark:text-white'
                      }`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-600 hover:text-red-500 transition inline-flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-155">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={closeModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Category Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Status</label>
                <div className="relative z-[70]">
                  <CustomSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' }
                    ]}
                  />
                </div>
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
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
