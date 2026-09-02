import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Package, Plus, Search, Edit3, Trash2, X, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../utils/rbac';
import CustomSelect from '../../components/common/CustomSelect';

export default function Products() {
  const { user } = useAuthStore();
  const canManage = hasPermission(user, 'manage_products');

  const queryClient = useQueryClient();
  const { addToast, showConfirm } = useUiStore();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    tax: '',
    unit: 'pcs',
    minStock: 0,
    currentStock: 0
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    }
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', search, categoryId, page],
    queryFn: async () => {
      const res = await api.get(`/products?search=${search}&categoryId=${categoryId}&page=${page}&limit=8`);
      return res.data.data;
    }
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 8, pages: 1 };

  const createMutation = useMutation({
    mutationFn: (newProd) => api.post('/products', newProd),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      addToast('Product created successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create product', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedProd }) => api.put(`/products/${id}`, updatedProd),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      addToast('Product updated successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update product', 'error');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      addToast('Product archived successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to archive product', 'error');
    }
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      categoryId: categories[0]?.id || '',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      tax: '',
      unit: 'pcs',
      minStock: 0,
      currentStock: 0
    });
    setIsOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || '',
      description: prod.description || '',
      categoryId: prod.categoryId,
      purchasePrice: prod.purchasePrice,
      sellingPrice: prod.sellingPrice,
      mrp: prod.mrp || '',
      tax: prod.tax || '',
      unit: prod.unit || 'pcs',
      minStock: prod.minStock,
      currentStock: prod.currentStock
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingProduct(null);
  };

  const generateSku = () => {
    if (!formData.name || !formData.categoryId) {
      addToast('Please enter a product name and select a category first', 'info');
      return;
    }

    const cat = categories.find(c => c.id === formData.categoryId);
    const catPrefix = cat ? cat.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() : 'CAT';
    const namePrefix = formData.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();

    const count = products.filter(p => p.categoryId === formData.categoryId).length + 1;
    const numStr = count.toString().padStart(3, '0');

    setFormData(prev => ({ ...prev, sku: `${catPrefix}-${namePrefix}-${numStr}` }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, updatedProd: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleArchive = (id) => {
    showConfirm({
      title: 'Archive Product',
      message: 'Are you sure you want to archive this product?',
      onConfirm: () => archiveMutation.mutate(id)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <Package className="text-primary" /> Products
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Manage your business catalog, SKUs, and details.</p>
        </div>
        {canManage && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
          >
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search SKU, barcode, name..."
            className="pl-10 pr-4 py-2 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm outline-none"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto z-[60]">
          <CustomSelect
            className="w-full sm:w-48"
            value={categoryId}
            onChange={(val) => { setCategoryId(val); setPage(1); }}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading products...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load products.</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-textSecondary dark:text-gray-400 space-y-3">
            <Package className="mx-auto h-12 w-12 text-textSecondary dark:text-gray-400" />
            <h3 className="text-sm font-medium text-slate-950 dark:text-white">No products</h3>
            <p className="text-sm text-textSecondary dark:text-gray-400">Add a product to start building your store catalog.</p>
            {canManage && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium"
              >
                <Plus size={16} /> Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Cost Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-textPrimary dark:text-white">{prod.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">{prod.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">{prod.category?.name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-textPrimary dark:text-white">
                      ₹{parseFloat(prod.sellingPrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      ₹{parseFloat(prod.purchasePrice).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${prod.currentStock <= prod.minStock ? 'text-red-600' : 'text-textPrimary dark:text-white'}`}>
                        {prod.currentStock} {prod.unit || 'pcs'}
                      </span>
                      {prod.currentStock <= prod.minStock && (
                        <div className="text-[10px] text-red-500 font-medium">Low Stock Alert</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {canManage ? (
                        <>
                          <button
                            onClick={() => openEditModal(prod)}
                            className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                          >
                            <Edit3 size={16} /> Edit
                          </button>
                          <button
                            onClick={() => handleArchive(prod.id)}
                            className="text-red-650 hover:text-red-550 transition inline-flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Archive
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openEditModal(prod)}
                          className="text-textSecondary dark:text-gray-400 hover:text-slate-750 transition inline-flex items-center gap-1"
                        >
                          <Search size={16} /> View Details
                        </button>
                      )}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={closeModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <fieldset disabled={!canManage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Product Name *</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Category *</label>
                    <div className="relative z-[70]">
                      <CustomSelect
                        value={formData.categoryId}
                        onChange={(val) => setFormData({ ...formData, categoryId: val })}
                        options={categories.map(c => ({ value: c.id, label: c.name }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">SKU (Unique Identifier) *</label>
                    <div className="mt-1 flex rounded-mac-btn shadow-mac-subtle dark:shadow-none">
                      <input
                        type="text"
                        required
                        className="flex-1 min-w-0 block w-full rounded-none rounded-l-lg border border-separator dark:border-white/10 focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. SNAC-CHIP-001"
                      />
                      <button
                        type="button"
                        onClick={generateSku}
                        className="inline-flex items-center px-3 py-2 border border-l-0 border-separator dark:border-white/10 rounded-r-lg bg-slate-50 dark:bg-white/5 text-textSecondary dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/10 hover:text-primary transition-colors text-sm font-medium"
                        title="Auto-Generate SKU"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Barcode / UPC</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Purchase Price (Cost) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">MRP</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Tax (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Minimum Stock Alert Level</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    />
                  </div>

                  {!editingProduct && (
                    <div>
                      <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Opening Stock Quantity</label>
                      <input
                        type="number"
                        className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                        value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Description</label>
                  <textarea
                    rows={2}
                    className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </fieldset>

              <div className="flex justify-end gap-3 pt-4 border-t border-separator dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 border border-separator dark:border-white/10 rounded-mac-btn text-sm font-medium text-textSecondary dark:text-gray-400 hover:bg-slate-50 dark:bg-white/5 transition"
                >
                  {canManage ? 'Cancel' : 'Close'}
                </button>
                {canManage && (
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="py-2 px-4 border border-transparent rounded-mac-btn text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
