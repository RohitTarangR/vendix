import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useIsFetching, useIsMutating } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  LayoutDashboard,
  Store,
  Package,
  FolderOpen,
  ClipboardList,
  Users,
  Truck,
  Warehouse,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  Bell,
  ShoppingBag,
  Shield,
  Search,
  Clock,
  Moon,
  Sun
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { hasPermission } from '../../utils/rbac';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('vendix_theme') === 'dark' ||
      (!localStorage.getItem('vendix_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vendix_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vendix_theme', 'light');
    }
  }, [isDarkMode]);

  // Global loading states from react-query
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isGlobalLoading = isFetching > 0 || isMutating > 0;
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timer;
    if (isGlobalLoading) {
      setShowLoader(true);
    } else if (showLoader) {
      // Force the loader to stay on screen for an extra 400ms after completion to prevent flickering on fast connections
      timer = setTimeout(() => {
        setShowLoader(false);
      }, 400);
    }
    return () => clearTimeout(timer);
  }, [isGlobalLoading, showLoader]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'view_dashboard' },
    { name: 'POS', href: '/pos', icon: Store, permission: 'manage_pos' },
    { name: 'Products', href: '/products', icon: Package, permission: 'view_products' },
    { name: 'Categories', href: '/categories', icon: FolderOpen, permission: 'view_products' },
    { name: 'Inventory', href: '/inventory', icon: ClipboardList, permission: 'view_inventory' },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'view_orders' },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag, permission: 'view_purchases' },
    { name: 'Customers', href: '/customers', icon: Users, permission: 'view_customers' },
    { name: 'Suppliers', href: '/suppliers', icon: Truck, permission: 'view_suppliers' },
    { name: 'Staff & Roles', href: '/staff-roles', icon: Shield, permission: 'manage_users' },
    { name: 'Settings', href: '/settings', icon: Settings, permission: 'manage_settings' },
  ];

  const visibleNavigation = navigation.filter(item => {
    return hasPermission(user, item.permission);
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen overflow-hidden bg-background dark:bg-black flex p-3.5 lg:p-4 gap-4 relative font-sans">
      {/* Global Top Progress Loader */}
      <div className={`fixed top-0 left-0 right-0 h-1 z-[9999] pointer-events-none transition-opacity duration-300 ${showLoader ? 'opacity-100' : 'opacity-0'}`}>
        {showLoader && (
          <div className="h-full bg-primary animate-progress-indeterminate w-full"></div>
        )}
      </div>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Floating Capsule Style */}
      <div className={`flex flex-col z-50 w-[260px] shrink-0 bg-white dark:bg-[#1C1C1E] text-textPrimary dark:text-gray-200 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-200/80 dark:border-white/10 transform transition-transform duration-300 ease-in-out fixed inset-y-3 left-3 lg:relative lg:inset-auto lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="flex h-20 shrink-0 items-center px-8">
          <Store className="h-8 w-8 text-primary" />
          <span className="ml-3 text-2xl font-bold tracking-tight">Vendix</span>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="mb-6 px-2">
            <p className="text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Business</p>
            <p className="text-sm font-semibold text-textPrimary dark:text-gray-200 mt-1 truncate">{user?.tenant?.name || 'My Business'}</p>
          </div>

          <nav className="flex flex-col gap-1">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 rounded-mac-nav px-3 py-2 text-sm font-semibold transition-all ${isActive
                    ? 'bg-primary text-white shadow-mac-subtle dark:shadow-none scale-[0.98]'
                    : 'text-textSecondary dark:text-gray-300 hover:bg-separator dark:hover:bg-white/10 hover:text-textPrimary dark:hover:text-white active:scale-[0.98]'
                    }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-textSecondary dark:text-gray-400 group-hover:text-primary transition-colors'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 shrink-0 mb-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-mac-nav px-3 py-2 text-sm font-semibold text-textSecondary dark:text-gray-300 transition-colors hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 active:scale-[0.98]"
          >
            <LogOut className="h-5 w-5 text-textSecondary dark:text-gray-300 group-hover:text-red-500 transition-colors" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-transparent">
        {/* Top Header - Geex Style */}
        <header className="pb-5 flex shrink-0 items-center justify-between relative z-40 bg-transparent">
          <div className="flex items-center flex-1 gap-4 lg:gap-8">
            <button
              className="text-textSecondary dark:text-gray-300 hover:text-textPrimary dark:text-white lg:hidden shrink-0 bg-surfaceSolid dark:bg-[#1C1C1E] p-1.5 rounded-mac-nav border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search */}
            <div className="hidden lg:flex max-w-md w-full items-center relative group">
              <Search className="h-5 w-5 text-textSecondary dark:text-gray-400 absolute right-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search here..."
                className="w-full pl-6 pr-12 py-3 bg-white dark:bg-[#1C1C1E] border border-transparent dark:border-white/10 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-textSecondary dark:placeholder:text-gray-500 shadow-sm dark:shadow-none dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 sm:gap-6">
            {/* Live Clock & Shift Status */}
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-textSecondary dark:text-gray-400 font-medium text-sm">
                <Clock className="h-4 w-4 text-primary" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Till Open
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative p-2 text-textSecondary dark:text-gray-300 hover:text-textPrimary dark:hover:text-white hover:bg-separator dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <span className="sr-only">Toggle dark mode</span>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-textSecondary dark:text-gray-300 hover:text-textPrimary dark:hover:text-white hover:bg-separator dark:hover:bg-white/10 rounded-full transition-colors">
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-slate-200/80 dark:border-black"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 border-l border-separator dark:border-white/10 pl-4 sm:pl-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-textPrimary dark:text-gray-200">{user?.name}</p>
                  <p className="text-xs text-textSecondary dark:text-gray-400 capitalize">
                    {(user?.role?.name || user?.role || '').toLowerCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-textSecondary dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-2"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-transparent">
          <div className=" mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
