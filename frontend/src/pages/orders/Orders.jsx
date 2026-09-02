import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { ShoppingCart, Search, Eye, RefreshCw, X, Printer, Store } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

export default function Orders() {
  const queryClient = useQueryClient();
  const { addToast, showConfirm } = useUiStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch orders list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: async () => {
      const res = await api.get(`/orders?page=${page}&limit=8`);
      return res.data.data;
    }
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 8, pages: 1 };

  // Fetch single order details when opened
  const openDetails = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.data);
      setIsDetailOpen(true);
    } catch (err) {
      addToast('Failed to load order details', 'error');
    }
  };

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: (orderId) => api.post(`/orders/${orderId}/refund`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['orders']);
      // Refresh details panel if it's currently open
      if (selectedOrder?.id === res.data.data.id) {
        openDetails(selectedOrder.id);
      }
      addToast('Order has been refunded successfully', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Refund failed', 'error');
    }
  });

  const handleRefund = (orderId) => {
    showConfirm({
      title: 'Refund Order',
      message: 'Are you sure you want to refund this order? This will revert payments and return stock levels.',
      onConfirm: () => refundMutation.mutate(orderId)
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
          <ShoppingCart className="text-primary" /> Orders & Transactions
        </h1>
        <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Review historical store sales, print invoices, and process refunds.</p>
      </div>

      {/* Orders List Table */}
      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading orders...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Failed to load orders.</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-textSecondary dark:text-gray-400">
            No sales orders recorded yet. Complete transactions in the POS to see them here.
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Order No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textPrimary dark:text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary dark:text-gray-400">
                      {order.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-textPrimary dark:text-white">
                      ₹{parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openDetails(order.id)}
                        className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                      >
                        <Eye size={16} /> View Details
                      </button>
                      {order.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleRefund(order.id)}
                          className="text-red-650 hover:text-red-550 transition inline-flex items-center gap-1"
                        >
                          <RefreshCw size={14} /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Details Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white dark:bg-[#1C1C1E] print:relative h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none">
            {/* Modal Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10 print:hidden">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">Order Invoice Details</h3>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="p-2 border rounded-mac-btn hover:bg-slate-50 dark:bg-white/5 transition text-slate-650">
                  <Printer size={18} />
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 border rounded-mac-btn hover:bg-slate-50 dark:bg-white/5 transition text-textSecondary dark:text-gray-400">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Invoice Contents */}
            <div className="p-6 space-y-6 text-textPrimary dark:text-white text-sm font-sans" id="receipt-print-area">
              <div className="text-center space-y-1">
                <Store className="mx-auto h-8 w-8 text-primary" />
                <h2 className="text-lg font-bold text-textPrimary dark:text-white uppercase tracking-wide">Vendix invoice</h2>
                <p className="text-xs text-textSecondary dark:text-gray-400">Order {selectedOrder.orderNumber}</p>
                <p className="text-xs text-textSecondary dark:text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-t border-b border-dashed border-separator dark:border-white/10 py-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Store Outlet:</span>
                  <span>{selectedOrder.store?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier Personnel:</span>
                  <span>{selectedOrder.cashier?.name}</span>
                </div>
                {selectedOrder.customer && (
                  <div className="flex justify-between">
                    <span>Customer Details:</span>
                    <span>{selectedOrder.customer.name} ({selectedOrder.customer.phone})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment Gateway / Method:</span>
                  <span>{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold">{selectedOrder.status}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 font-bold text-xs border-b pb-1 text-textSecondary dark:text-gray-400">
                  <span className="col-span-6">Item Description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price Total</span>
                </div>
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 text-xs">
                    <span className="col-span-6 font-medium">{item.product?.name}</span>
                    <span className="col-span-2 text-center">{item.quantity}</span>
                    <span className="col-span-4 text-right">₹{parseFloat(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="border-t border-separator dark:border-white/10 pt-3 space-y-1.5 text-xs text-right">
                <div className="flex justify-between">
                  <span className="text-textSecondary dark:text-gray-400">Subtotal:</span>
                  <span>₹{parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Discountflat:</span>
                    <span>-₹{parseFloat(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-textSecondary dark:text-gray-400">Tax applied:</span>
                  <span>₹{parseFloat(selectedOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-textPrimary dark:text-white border-t border-dashed pt-2 mt-1">
                  <span>Total Amount Paid:</span>
                  <span>₹{parseFloat(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
