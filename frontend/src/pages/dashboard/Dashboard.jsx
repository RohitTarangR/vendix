import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { DollarSign, ShoppingCart, Package, AlertTriangle, ArrowUpRight, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import CustomSelect from '../../components/common/CustomSelect';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [datePreset, setDatePreset] = useState('total');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const getActiveDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (datePreset === 'total') return { startDate: null, endDate: null };

    if (datePreset === 'today') {
      // already set
    } else if (datePreset === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (datePreset === 'last_week') {
      start.setDate(start.getDate() - 7);
    } else if (datePreset === 'last_month') {
      start.setMonth(start.getMonth() - 1);
    } else if (datePreset === 'custom') {
      return {
        startDate: customStartDate ? new Date(customStartDate).toISOString() : null,
        endDate: customEndDate ? new Date(customEndDate).toISOString() : null
      };
    }

    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const { startDate, endDate } = getActiveDateRange();

  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats', startDate, endDate],
    queryFn: async () => {
      let url = '/tenant/stats';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      return res.data.data;
    }
  });


  const summary = statsData?.summary || {
    totalSales: 0,
    totalOrders: 0,
    totalCategories: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockCount: 0
  };

  const recentOrders = statsData?.recentOrders || [];

  const cards = [
    {
      name: 'Total Revenue',
      value: `₹${parseFloat(summary.totalSales).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-150',
    },
    {
      name: 'Total Sales Count',
      value: summary.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50 border-blue-150',
    },
    {
      name: 'Products catalog',
      value: summary.totalProducts,
      icon: Package,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-150',
    },
    {
      name: 'Low Stock Alerts',
      value: summary.lowStockCount,
      icon: AlertTriangle,
      color: summary.lowStockCount > 0
        ? 'text-red-655 bg-red-50 border-red-150 animate-pulse'
        : 'text-textSecondary dark:text-gray-400 bg-slate-50 dark:bg-white/5 border-separator dark:border-white/10',
    }
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white">Dashboard</h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Here is a quick snapshot of your business operations today.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/pos"
            className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
          >
            <ShoppingCart size={16} /> Open POS
          </Link>
          <Link
            to="/products"
            className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-white dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-textSecondary dark:text-gray-400 hover:bg-slate-50 dark:bg-white/5 transition text-sm font-medium shadow-mac-subtle dark:shadow-none"
          >
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-mac-card shadow-mac-subtle dark:shadow-none border border-separator dark:border-white/10 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 z-[60]">
          <label className="text-sm font-medium text-textSecondary dark:text-gray-400">Date Range:</label>
          <div className="w-56">
            <CustomSelect
              value={datePreset}
              onChange={val => setDatePreset(val)}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'last_week', label: 'Last Week' },
                { value: 'last_month', label: 'Last Month' },
                { value: 'total', label: 'Total (All Time)' },
                { value: 'custom', label: 'Custom Range / Specific Date' }
              ]}
            />
          </div>
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <input
              type="date"
              max={todayStr}
              className="rounded-mac-btn border border-separator dark:border-white/10 text-sm px-3 py-1.5 outline-none focus:border-primary"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
            />
            <span className="text-textSecondary dark:text-gray-400 text-sm">to</span>
            <input
              type="date"
              max={todayStr}
              className="rounded-mac-btn border border-separator dark:border-white/10 text-sm px-3 py-1.5 outline-none focus:border-primary"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/10 flex items-center justify-between transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col h-full justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-gray-400 capitalize mb-4">{card.name}</p>
                <div>
                  <p className="text-[28px] font-bold text-slate-900 dark:text-white leading-none">{card.value}</p>
                  <p className="text-xs font-semibold text-emerald-500 mt-2">+2.5%</p>
                </div>
              </div>
              <div className="relative h-16 w-24">
                <svg viewBox="0 0 100 40" className="w-full h-full stroke-primary fill-none overflow-visible" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M0,30 L20,10 L40,25 L60,5 L80,15 L100,0" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>



      {/* Detailed overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Latest Activity</h3>
            <Link to="/orders" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-white/5 flex-1 px-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-2 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/5 transition rounded-xl mx-2 my-1">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {order.customer?.name ? order.customer.name.charAt(0) : 'W'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.customer?.name || 'Walk-in Customer'}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-sm dark:shadow-none shadow-emerald-200' : 'bg-rose-500 text-white shadow-sm dark:shadow-none shadow-rose-200'
                    }`}>
                    {order.status === 'COMPLETED' ? 'Stable' : 'Down'}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="p-8 text-center text-textSecondary dark:text-gray-400">
                No orders recorded yet. Open POS terminal to register sales.
              </div>
            )}
          </div>
        </div>

        {/* Quick Audits / Business Info */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-white/10 p-6 space-y-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Chart Summary</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Fixed Servers</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{summary.totalCustomers}</span>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Down Servers</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{summary.totalCategories}</span>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Running</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">2,452</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
