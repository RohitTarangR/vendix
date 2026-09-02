import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Plus, Search, Eye, Calendar, User, DollarSign, X, Check, ShoppingBag, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import CustomSelect from '../../components/common/CustomSelect';

export default function Purchases() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Purchase Form state
  const [supplierId, setSupplierId] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputQty, setInputQty] = useState(1);
  const [inputCost, setInputCost] = useState(0);

  // Fetch purchases list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchases', page],
    queryFn: async () => {
      const res = await api.get(`/purchases?page=${page}&limit=8`);
      return res.data.data;
    }
  });

  const purchases = data?.purchases || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 8, pages: 1 };

  // Fetch suppliers for select dropdown
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers?limit=100');
      return res.data.data.suppliers;
    }
  });
  const suppliers = suppliersData || [];

  // Fetch products for select dropdown
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });
  const products = productsData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newPurchase) => api.post('/purchases', newPurchase),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboard-stats']);
      setIsAddOpen(false);
      resetForm();
      addToast('Purchase recorded successfully and stock has been updated', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to record purchase', 'error');
    }
  });

  const openDetails = async (purchaseId) => {
    try {
      const res = await api.get(`/purchases/${purchaseId}`);
      setSelectedPurchase(res.data.data);
      setIsDetailOpen(true);
    } catch (err) {
      addToast('Failed to load purchase details', 'error');
    }
  };

  const handleAddProductToCart = () => {
    if (!selectedProductId) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(inputQty);
    const price = parseFloat(inputCost || product.purchasePrice);

    if (qty <= 0) {
      addToast('Quantity must be greater than 0', 'error');
      return;
    }

    const existingIndex = cart.findIndex(item => item.productId === selectedProductId);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += qty;
      newCart[existingIndex].price = price;
      newCart[existingIndex].total = newCart[existingIndex].quantity * price;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: qty,
        price: price,
        total: qty * price
      }]);
    }

    setSelectedProductId('');
    setInputQty(1);
    setInputCost(0);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierId) {
      addToast('Please select a supplier', 'error');
      return;
    }
    if (cart.length === 0) {
      addToast('Please add at least one product to the purchase order', 'error');
      return;
    }

    const payload = {
      supplierId,
      purchaseNumber: purchaseNumber || undefined,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };

    createMutation.mutate(payload);
  };

  const resetForm = () => {
    setSupplierId('');
    setPurchaseNumber('');
    setCart([]);
    setSelectedProductId('');
    setInputQty(1);
    setInputCost(0);
  };

  const totalPurchaseAmount = cart.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <ShoppingBag className="text-primary" /> Purchase Inbound Stock
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Record supplier purchase invoices and replenish stock counts.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
        >
          <Plus size={16} /> Record Purchase
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading purchase invoices...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load purchase invoices.</div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-textSecondary dark:text-gray-400">
            No purchases logged. Replenish your stock by logging your first invoice.
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Purchase No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary dark:text-white">
                    {p.purchaseNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                    {p.supplier?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-textPrimary dark:text-white">
                    ₹{parseFloat(p.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openDetails(p.id)}
                      className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                    >
                      <Eye size={16} /> View Details
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

      {/* Add Purchase Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center h-full !mt-0 justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">Record Stock Purchase</h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/10 rounded text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative z-[80]">
                  <label className="block text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-2">Supplier</label>
                  <CustomSelect
                    value={supplierId}
                    onChange={(val) => setSupplierId(val)}
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    placeholder="Select Supplier"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-2">Invoice / Purchase No (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    className="w-full rounded-mac-btn border border-separator dark:border-white/10 text-sm px-3 py-2 outline-none h-10"
                    value={purchaseNumber}
                    onChange={(e) => setPurchaseNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Add Product Section */}
              <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-mac-card border border-separator dark:border-white/10 space-y-3">
                <h4 className="font-bold text-textSecondary dark:text-gray-400 text-xs uppercase tracking-wider">Add Products to Purchase Invoice</h4>
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-6">
                    <div className="relative z-[70]">
                      <label className="block text-[10px] font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1">Product</label>
                      <CustomSelect
                        value={selectedProductId}
                        onChange={(val) => {
                          setSelectedProductId(val);
                          const prod = products.find(p => p.id === val);
                          if (prod) {
                            setInputCost(parseFloat(prod.purchasePrice));
                          }
                        }}
                        options={products.map(p => ({ value: p.id, label: `${p.name} (SKU: ${p.sku})` }))}
                        placeholder="Select Product"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-mac-btn border border-separator dark:border-white/10 text-xs px-3 py-1.5 outline-none h-8"
                      value={inputQty}
                      onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1">Cost Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-mac-btn border border-separator dark:border-white/10 text-xs px-3 py-1.5 outline-none h-8"
                      value={inputCost}
                      onChange={(e) => setInputCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProductToCart}
                    className="col-span-2 py-1.5 bg-secondary text-white rounded-mac-btn text-xs font-bold shadow-mac-subtle dark:shadow-none hover:bg-secondary/90 transition h-8"
                  >
                    Add Line
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-textSecondary dark:text-gray-400 text-xs uppercase tracking-wider">Purchase Line Items</h4>
                <div className="border border-separator dark:border-white/10 rounded-mac-card overflow-hidden">
                  <table className="min-w-full divide-y divide-separator dark:divide-white/10 text-xs">
                    <thead className="bg-slate-50 dark:bg-white/5">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-textSecondary dark:text-gray-400">Product SKU</th>
                        <th className="px-4 py-2 text-left font-semibold text-textSecondary dark:text-gray-400">Name</th>
                        <th className="px-4 py-2 text-center font-semibold text-textSecondary dark:text-gray-400">Qty</th>
                        <th className="px-4 py-2 text-right font-semibold text-textSecondary dark:text-gray-400">Cost</th>
                        <th className="px-4 py-2 text-right font-semibold text-textSecondary dark:text-gray-400">Total</th>
                        <th className="px-4 py-2 text-right font-semibold text-textSecondary dark:text-gray-400"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator dark:divide-white/10">
                      {cart.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-textPrimary dark:text-white font-medium">{item.sku}</td>
                          <td className="px-4 py-2 text-textSecondary dark:text-gray-400">{item.name}</td>
                          <td className="px-4 py-2 text-center text-textPrimary dark:text-white font-semibold">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-textSecondary dark:text-gray-400">₹{item.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-textPrimary dark:text-white font-bold">₹{item.total.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeFromCart(index)}
                              className="text-red-500 hover:text-red-655 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {cart.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-6 text-center text-textSecondary dark:text-gray-400">
                            No lines added yet. Add products above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary and Submit */}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-bold text-textPrimary dark:text-white">
                  Total Purchase Cost: <span className="text-lg text-textPrimary dark:text-white font-black">₹{totalPurchaseAmount.toFixed(2)}</span>
                </span>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || cart.length === 0}
                  className="py-2 px-6 bg-primary text-white rounded-mac-btn text-sm font-bold shadow-mac-subtle dark:shadow-none hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Recording...' : 'Submit Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {isDetailOpen && selectedPurchase && (
        <div className="fixed inset-0 z-[100] flex items-center h-full !mt-0 justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">Purchase Order Details</h3>
              <button onClick={() => setIsDetailOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/10 rounded text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm text-textPrimary dark:text-white">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-xs text-textSecondary dark:text-gray-400 uppercase tracking-wider font-semibold">Purchase No</p>
                  <p className="font-bold text-textPrimary dark:text-white">{selectedPurchase.purchaseNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-textSecondary dark:text-gray-400 uppercase tracking-wider font-semibold">Logged Date</p>
                  <p className="text-textSecondary dark:text-gray-400">{new Date(selectedPurchase.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-textSecondary dark:text-gray-400 uppercase tracking-wider font-semibold">Supplier Name</p>
                  <p className="text-slate-750 font-medium">{selectedPurchase.supplier?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-textSecondary dark:text-gray-400 uppercase tracking-wider font-semibold">Supplier Contact</p>
                  <p className="text-textSecondary dark:text-gray-400">{selectedPurchase.supplier?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-bold text-textSecondary dark:text-gray-400 text-xs uppercase tracking-wider">Received Products</h4>
                <div className="border border-slate-150 rounded-mac-btn overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-150 text-xs">
                    <thead className="bg-slate-50 dark:bg-white/5">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-textSecondary dark:text-gray-400">Product</th>
                        <th className="px-3 py-2 text-center font-semibold text-textSecondary dark:text-gray-400">Qty</th>
                        <th className="px-3 py-2 text-right font-semibold text-textSecondary dark:text-gray-400">Cost</th>
                        <th className="px-3 py-2 text-right font-semibold text-textSecondary dark:text-gray-400">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-separator dark:divide-white/10 bg-white dark:bg-[#1C1C1E]">
                      {selectedPurchase.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-textPrimary dark:text-white font-medium">{item.product?.name}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-950 dark:text-white">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-slate-655">₹{parseFloat(item.price).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-bold text-textPrimary dark:text-white">₹{parseFloat(item.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-separator dark:border-white/10 font-bold">
                <span className="text-slate-655">Total Cost Value:</span>
                <span className="text-base text-textPrimary dark:text-white">₹{parseFloat(selectedPurchase.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
