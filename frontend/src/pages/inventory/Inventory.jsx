import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { ClipboardList, Plus, Search, Edit3, Trash2, X, AlertTriangle, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import CustomSelect from '../../components/common/CustomSelect';

export default function Inventory() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    type: 'ADJUSTMENT',
    reason: ''
  });

  // Fetch products for dropdown selection
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });
  const products = productsData || [];

  // Filter low stock products from products list
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock);

  // Fetch transaction history
  const { data: txData, isLoading, isError } = useQuery({
    queryKey: ['inventory-transactions', page],
    queryFn: async () => {
      const res = await api.get(`/inventory/transactions?page=${page}&limit=8`);
      return res.data.data;
    }
  });

  const transactions = txData?.transactions || [];
  const pagination = txData?.pagination || { total: 0, page: 1, limit: 8, pages: 1 };

  const adjustMutation = useMutation({
    mutationFn: (adjustment) => api.post('/inventory/adjust', adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries(['inventory-transactions']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['products-list']);
      addToast('Stock adjusted successfully!', 'success');
      closeModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to adjust stock', 'error');
    }
  });

  const openModal = () => {
    setFormData({
      productId: products[0]?.id || '',
      quantity: '',
      type: 'ADJUSTMENT',
      reason: ''
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    adjustMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <ClipboardList className="text-primary" /> Inventory Management
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Track stock levels, record audits, and view transaction history.</p>
        </div>
        <button
          onClick={openModal}
          disabled={products.length === 0}
          className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none disabled:opacity-50"
        >
          <Plus size={18} /> Adjust Stock
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-mac-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
            <AlertTriangle className="h-5 w-5 text-red-650" />
            <span>Low Stock / Out of Stock Alert</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map(p => (
              <div key={p.id} className="bg-white dark:bg-[#1C1C1E] rounded-mac-btn p-3 border border-red-100 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-textPrimary dark:text-white">{p.name}</h4>
                  <p className="text-xs text-textSecondary dark:text-gray-400">SKU: {p.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-red-600">{p.currentStock} {p.unit || 'pcs'}</span>
                  <p className="text-[10px] text-textSecondary dark:text-gray-400">Min: {p.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions History */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-separator dark:border-white/10">
          <h3 className="font-bold text-textPrimary dark:text-white">Inventory Movement Logs</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading history...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load logs.</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-textSecondary dark:text-gray-400">
            No stock transactions recorded yet.
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Quantity Change</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary dark:text-white">
                      {tx.product?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      {tx.product?.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'SALE' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' :
                        tx.type === 'PURCHASE' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' :
                        tx.type === 'OPENING_STOCK' ? 'bg-surfaceSolid dark:bg-white/10 text-textPrimary dark:text-white' :
                        'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {tx.quantity > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <ArrowUpRight size={14} /> +{tx.quantity}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          <ArrowDownLeft size={14} /> {tx.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      {tx.referenceId || '-'}
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
                    className="p-2 border border-separator dark:border-white/10 rounded bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:bg-white/5 transition disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page === pagination.pages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border border-separator dark:border-white/10 rounded bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:bg-white/5 transition disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Adjustment Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">Manual Stock Adjustment</h3>
              <button onClick={closeModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Select Product *</label>
                <div className="relative z-[80]">
                  <CustomSelect
                    value={formData.productId}
                    onChange={(val) => setFormData({ ...formData, productId: val })}
                    options={products.map(p => ({ value: p.id, label: `${p.name} (SKU: ${p.sku})` }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Quantity Change *</label>
                <input
                  type="number"
                  placeholder="e.g. +10 or -5"
                  required
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
                <p className="text-xs text-textSecondary dark:text-gray-400 mt-1">Use positive numbers to add stock, and negative to deduct stock.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Type *</label>
                <div className="relative z-[70]">
                  <CustomSelect
                    value={formData.type}
                    onChange={(val) => setFormData({ ...formData, type: val })}
                    options={[
                      { value: 'ADJUSTMENT', label: 'Stock Adjustment' },
                      { value: 'DAMAGE', label: 'Damaged / Expired Goods' },
                      { value: 'RETURN', label: 'Sales Return' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Reason / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Audit, damaged box"
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                  disabled={adjustMutation.isLoading}
                  className="py-2 px-4 border border-transparent rounded-mac-btn text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
