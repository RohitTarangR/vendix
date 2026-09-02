import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Store, Search, User, Trash2, Tag, ShoppingCart, Percent, DollarSign, Check, X, Printer, ChevronDown, Plus, Package } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import CustomSelect from '../../components/common/CustomSelect';

export default function POS() {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(5); // 5% default tax
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // Checkout & Receipt State
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Held Orders State
  const [heldOrderId, setHeldOrderId] = useState(null);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);

  // New Customer State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [shakeId, setShakeId] = useState(null);

  // Custom Dropdown State
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const searchInputRef = useRef(null);
  const customerDropdownRef = useRef(null);

  // Focus search input on load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle click outside for customer dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch all products
  const { data: productsData } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data.products;
    }
  });
  const products = productsData || [];

  // Fetch Held Orders
  const { data: heldOrdersData } = useQuery({
    queryKey: ['held-orders'],
    queryFn: async () => {
      const res = await api.get('/orders?status=HELD&limit=50');
      return res.data.data.orders;
    }
  });
  const heldOrders = heldOrdersData || [];

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    }
  });
  const categories = categoriesData || [];

  // Fetch customers
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=100');
      return res.data.data.customers;
    }
  });
  const customers = customersData || [];

  const createCustomerMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      setCustomerId(res.data.data.id);
      setIsCustomerModalOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      addToast('Customer created successfully', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create customer', 'error');
    }
  });

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    createCustomerMutation.mutate(newCustomer);
  };

  const filteredCustomerList = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  );

  const selectedCustomer = customers.find(c => c.id === customerId);

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory && p.status === 'ACTIVE';
  });

  const handleProductClick = (product) => {
    const cartItem = cart.find(item => item.id === product.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;

    if (product.currentStock - inCartQty <= 0) {
      setShakeId(product.id);
      setTimeout(() => setShakeId(null), 300);
      addToast(`${product.name} is out of stock!`, 'error');
      return;
    }

    addToCart(product);
  };

  const addToCart = (product) => {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.currentStock) {
        addToast(`Cannot add more. Only ${product.currentStock} items in stock.`, 'error');
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    addToast(`${product.name} added to cart`, 'success');
  };

  const updateQuantity = (productId, change) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.currentStock) {
      addToast(`Cannot add more. Only ${item.currentStock} items in stock.`, 'error');
      return;
    }

    setCart(cart.map(i => i.id === productId ? { ...i, quantity: newQty } : i));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.sellingPrice) * item.quantity), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal - parseFloat(discount || 0) + taxAmount;

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: (orderPayload) => api.post('/orders', orderPayload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['pos-products']);
      setReceiptOrder(res.data.data);
      setIsReceiptOpen(true);
      addToast('Order completed successfully!', 'success');
      // Reset POS state
      setCart([]);
      setCustomerId('');
      setCustomerSearch('');
      setCustomerPhone('');
      setDiscount(0);
      setNotes('');
      setHeldOrderId(null);
      queryClient.invalidateQueries(['held-orders']);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Checkout failed', 'error');
    }
  });

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty!', 'error');
      return;
    }

    let finalCustomerId = customerId;

    if (!finalCustomerId && !customerSearch.trim()) {
      addToast('Please enter or select a customer name before checking out', 'error');
      return;
    }

    // Create new customer on the fly if name is entered but no existing customer is selected
    if (!finalCustomerId && customerSearch.trim()) {
      try {
        const res = await api.post('/customers', {
          name: customerSearch.trim(),
          phone: customerPhone.trim()
        });
        finalCustomerId = res.data.data.id;
        queryClient.invalidateQueries(['customers']);
      } catch (err) {
        addToast(err.response?.data?.message || 'Failed to create new customer', 'error');
        return;
      }
    }

    const payload = {
      customerId: finalCustomerId || null,
      paymentMethod,
      discount: parseFloat(discount),
      tax: taxAmount,
      notes,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: parseFloat(item.sellingPrice)
      }))
    };

    if (heldOrderId) {
      try {
        await api.put(`/orders/${heldOrderId}/hold`, payload);
        const res = await api.post(`/orders/${heldOrderId}/complete`, payload);

        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['pos-products']);
        queryClient.invalidateQueries(['held-orders']);
        setReceiptOrder(res.data.data);
        setIsReceiptOpen(true);
        addToast('Held order completed!', 'success');
        setCart([]);
        setCustomerId('');
        setCustomerSearch('');
        setCustomerPhone('');
        setDiscount(0);
        setNotes('');
        setHeldOrderId(null);
      } catch (err) {
        addToast(err.response?.data?.message || 'Checkout failed', 'error');
      }
    } else {
      checkoutMutation.mutate(payload);
    }
  };

  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty!', 'error');
      return;
    }

    let finalCustomerId = customerId;
    if (!finalCustomerId && !customerSearch.trim()) {
      addToast('Please select a customer to hold the order', 'error');
      return;
    }

    if (!finalCustomerId && customerSearch.trim()) {
      try {
        const res = await api.post('/customers', {
          name: customerSearch.trim(),
          phone: customerPhone.trim()
        });
        finalCustomerId = res.data.data.id;
        queryClient.invalidateQueries(['customers']);
      } catch (err) {
        addToast('Failed to create customer for held order', 'error');
        return;
      }
    }

    const payload = {
      customerId: finalCustomerId || null,
      status: 'HELD',
      discount: parseFloat(discount),
      tax: taxAmount,
      notes,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: parseFloat(item.sellingPrice)
      }))
    };

    try {
      if (heldOrderId) {
        await api.put(`/orders/${heldOrderId}/hold`, payload);
        addToast('Held order updated successfully', 'success');
      } else {
        await api.post('/orders', payload);
        addToast('Order held successfully', 'success');
      }
      queryClient.invalidateQueries(['held-orders']);

      // Clear POS
      setCart([]);
      setCustomerId('');
      setCustomerSearch('');
      setCustomerPhone('');
      setDiscount(0);
      setNotes('');
      setHeldOrderId(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to hold order', 'error');
    }
  };

  const loadHeldOrder = (order) => {
    setHeldOrderId(order.id);
    setCustomerId(order.customerId || '');
    if (order.customer) {
      setCustomerSearch(order.customer.name);
      setCustomerPhone(order.customer.phone || '');
    }
    setDiscount(order.discount);
    setNotes(order.notes || '');

    // Load cart
    const loadedCart = order.items.map(item => ({
      id: item.productId,
      name: item.product.name,
      sku: item.product.sku,
      sellingPrice: item.price,
      quantity: item.quantity,
      currentStock: item.product.currentStock
    }));
    setCart(loadedCart);
    setIsHeldOrdersOpen(false);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Product Selection area */}
      <div className="flex-1 bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 p-6 flex flex-col overflow-hidden">
        {/* Header Actions & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          {heldOrders.length > 0 && (
            <button
              onClick={() => setIsHeldOrdersOpen(true)}
              className="flex items-center gap-2 bg-surfaceSolid dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-textPrimary dark:text-white px-4 py-2 rounded-mac-btn font-bold text-sm border border-separator dark:border-white/10 transition whitespace-nowrap"
            >
              Active Orders
              <span className="bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs">
                {heldOrders.length}
              </span>
            </button>
          )}

          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by SKU, name..."
              className="pl-10 pr-4 py-2 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-48 z-[60]">
            <CustomSelect
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-2 auto-rows-max">
          {filteredProducts.map(p => {
            const cartItem = cart.find(item => item.id === p.id);
            const inCartQty = cartItem ? cartItem.quantity : 0;
            const availableStock = p.currentStock - inCartQty;
            const isOutOfStock = availableStock <= 0;
            const isLowStock = !isOutOfStock && availableStock <= p.minStock;
            const isShaking = shakeId === p.id;

            let stockStatusText = 'In Stock';
            let stockStatusColor = 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 border border-green-200';
            if (isOutOfStock) {
              stockStatusText = 'Out of Stock';
              stockStatusColor = 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 border border-red-200';
            } else if (isLowStock) {
              stockStatusText = 'Low Stock';
              stockStatusColor = 'bg-orange-50 text-orange-700 border border-orange-200';
            }

            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => handleProductClick(p)}
                className={`group shadow-mac-subtle dark:shadow-none rounded-2xl p-4 text-left flex flex-col justify-between transition-all relative overflow-hidden active:scale-[0.98]
                  ${isOutOfStock ? 'opacity-60 bg-slate-50 dark:bg-white/5 border-separator dark:border-white/10 cursor-not-allowed' : 'bg-white dark:bg-[#282828] backdrop-blur hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/10 hover:border-primary/50 hover:shadow-mac-card dark:shadow-none'}
                  ${inCartQty > 0 && !isOutOfStock ? 'border-primary/50 ring-1 ring-primary/20' : 'border border-separator dark:border-white/10'}
                  ${isShaking ? 'animate-shake' : ''}
                `}
              >
                {inCartQty > 0 && (
                  <span className="absolute top-0 right-0 bg-primary text-white text-xs font-bold w-7 h-7 flex items-center justify-center rounded-bl-2xl shadow-mac-subtle dark:shadow-none animate-in zoom-in-50 duration-200">
                    {inCartQty}
                  </span>
                )}
                <div>
                  <h4 className="font-semibold text-textPrimary dark:text-white text-sm group-hover:text-primary transition pr-4">{p.name}</h4>
                  <p className="text-xs text-textSecondary dark:text-gray-400 mt-1">SKU: {p.sku}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-sm font-bold text-textPrimary dark:text-white">₹{parseFloat(p.sellingPrice).toFixed(2)}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${stockStatusColor}`}>
                      {stockStatusText} <span className="opacity-70">({availableStock})</span>
                    </span>
                  </div>
                  {isOutOfStock && (
                    <Link
                      to="/suppliers"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-center py-1.5 mt-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition"
                    >
                      Contact Supplier
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-textSecondary dark:text-gray-400">
              No matching products found.
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Section */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-separator dark:border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-textPrimary dark:text-white flex items-center gap-2">
            <ShoppingCart className="text-primary" /> Active Cart
          </h3>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
          </span>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-separator dark:divide-white/10">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-start pt-3 first:pt-0">
              <div className="space-y-1 pr-2">
                <h4 className="text-sm font-medium text-textPrimary dark:text-white">{item.name}</h4>
                <p className="text-xs text-textSecondary dark:text-gray-400">₹{parseFloat(item.sellingPrice).toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-separator dark:border-white/10 rounded-mac-btn overflow-hidden h-8">
                  <button onClick={() => updateQuantity(item.id, -1)} className="px-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/10 text-textSecondary dark:text-gray-400 font-bold">-</button>
                  <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="px-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 dark:bg-white/10 text-textSecondary dark:text-gray-400 font-bold">+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-textSecondary dark:text-gray-400 hover:text-red-500 transition p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-textSecondary dark:text-gray-400 py-12">
              <ShoppingCart size={40} className="mb-2 text-slate-300" />
              <span>Cart is empty</span>
            </div>
          )}
        </div>

        {/* Customer & Discounts Setup */}
        <div className="p-4 border-t border-separator dark:border-white/10  dark:bg-white/ space-y-3">
          <div className="relative">
            <label className="block text-[11px] font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Customer</label>

            {customerId ? (
              <div className="w-full rounded-mac-card border border-primary bg-primary/5 text-sm px-3 py-2 h-10 flex justify-between items-center shadow-inner">
                <span className="text-primary font-medium truncate pr-2">
                  {selectedCustomer?.name} {selectedCustomer?.phone ? `(${selectedCustomer.phone})` : ''}
                </span>
                <button
                  onClick={() => {
                    setCustomerId('');
                    setCustomerSearch('');
                    setCustomerPhone('');
                  }}
                  className="text-primary hover:bg-primary/10 p-1 rounded transition-colors flex-shrink-0"
                  title="Remove customer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-2 relative" ref={customerDropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search or enter new name..."
                    className="w-full rounded-mac-card border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none pl-9 pr-3 py-2 h-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                  />
                </div>

                {isCustomerDropdownOpen && customerSearch && filteredCustomerList.length > 0 && (
                  <div className="absolute top-9 left-0 right-0 mt-1 bg-surfaceSolid dark:bg-white/10 border border-separator dark:border-white/10 rounded-mac-btn shadow-mac-popover z-20 max-h-48 overflow-y-auto">
                    {filteredCustomerList.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomerId(c.id);
                          setIsCustomerDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:bg-white/5 flex flex-col border-b border-slate-50 last:border-0"
                      >
                        <span className="font-medium text-textSecondary dark:text-gray-400">{c.name}</span>
                        <span className="text-xs text-textSecondary dark:text-gray-400">{c.phone || 'No phone'}</span>
                      </button>
                    ))}
                  </div>
                )}

                {customerSearch && !customerId && (
                  <input
                    type="text"
                    placeholder="Phone Number (for new customer)"
                    className="w-full rounded-mac-btn border border-separator dark:border-white/10 px-3 py-2 h-9 text-sm outline-none focus:border-primary transition-colors"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Flat Discount (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-mac-card border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none text-sm px-3 py-1 outline-none h-10 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                className="w-full rounded-mac-card border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none text-sm px-3 py-1 outline-none h-10 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider mb-1">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'UPI', 'CARD'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 px-3 rounded-mac-btn text-xs font-bold border transition ${paymentMethod === method
                    ? 'bg-primary text-white border-primary shadow-mac-subtle dark:shadow-none'
                    : 'bg-surfaceSolid dark:bg-white/10 text-textSecondary dark:text-gray-400 border-separator dark:border-white/10 hover:bg-slate-50 dark:bg-white/5'
                    }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculations and Checkout Action */}
        <div className="p-4 border-t border-separator dark:border-white/10 space-y-4">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-textSecondary dark:text-gray-400">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-500 font-medium">
                <span>Discount</span>
                <span>-₹{parseFloat(discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-textSecondary dark:text-gray-400">
              <span>Tax ({taxRate}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-textPrimary dark:text-white font-bold text-lg pt-1 border-t border-separator dark:border-white/10">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="w-full py-3 bg-orange-100/50 hover:bg-orange-100 text-orange-600 rounded-mac-card text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {heldOrderId ? '⏸️ Update Held Order' : '⏸️ Hold Order'}
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutMutation.isLoading}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-mac-card text-sm font-bold shadow-[0_4px_14px_0_rgb(0,122,255,0.39)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkoutMutation.isLoading ? 'Processing...' : (heldOrderId ? 'Pay Held Order' : 'Pay & Complete Order')}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {isReceiptOpen && receiptOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white dark:bg-[#1C1C1E] print:relative h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none">
            {/* Modal Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10 print:hidden">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">Receipt</h3>
              <div className="flex gap-2">
                <button onClick={printReceipt} className="p-2 border rounded-mac-btn hover:bg-slate-50 dark:bg-white/5 transition text-slate-650">
                  <Printer size={18} />
                </button>
                <button onClick={() => setIsReceiptOpen(false)} className="p-2 border rounded-mac-btn hover:bg-slate-50 dark:bg-white/5 transition text-textSecondary dark:text-gray-400">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-6 text-textPrimary dark:text-white text-sm font-sans" id="receipt-print-area">
              <div className="text-center space-y-1">
                <Store className="mx-auto h-8 w-8 text-primary" />
                <h2 className="text-lg font-bold text-textPrimary dark:text-white uppercase tracking-wide">Vendix Shop</h2>
                <p className="text-xs text-textSecondary dark:text-gray-400">Order {receiptOrder.orderNumber}</p>
                <p className="text-xs text-textSecondary dark:text-gray-400">{new Date(receiptOrder.createdAt).toLocaleString()}</p>
              </div>

              <div className="border-t border-b border-dashed border-separator dark:border-white/10 py-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{receiptOrder.cashier?.name}</span>
                </div>
                {receiptOrder.customer && (
                  <>
                    <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{receiptOrder.customer.name}</span>
                    </div>
                    {receiptOrder.customer.phone && (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{receiptOrder.customer.phone}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>{receiptOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 font-bold text-xs border-b pb-1 text-textSecondary dark:text-gray-400">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price</span>
                </div>
                {receiptOrder.items.map(item => (
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
                  <span>₹{parseFloat(receiptOrder.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(receiptOrder.discount) > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Discount:</span>
                    <span>-₹{parseFloat(receiptOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-textSecondary dark:text-gray-400">Tax:</span>
                  <span>₹{parseFloat(receiptOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-textPrimary dark:text-white border-t border-dashed pt-2 mt-1">
                  <span>Total Paid:</span>
                  <span>₹{parseFloat(receiptOrder.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-textSecondary dark:text-gray-400 pt-6 border-t border-separator dark:border-white/10">
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-float shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-separator dark:border-white/10">
              <h3 className="font-bold text-textPrimary dark:text-white">Add New Customer</h3>
              <button
                onClick={() => { setIsCustomerModalOpen(false); setCustomerId(''); }}
                className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition p-1"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Full Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary sm:text-sm px-3 py-2 outline-none"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Phone Number *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary sm:text-sm px-3 py-2 outline-none"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Email Address (Optional)</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary sm:text-sm px-3 py-2 outline-none"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-separator dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsCustomerModalOpen(false); setCustomerId(''); }}
                  className="py-2 px-4 border border-separator dark:border-white/10 rounded-mac-btn hover:bg-slate-50 dark:bg-white/5 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  className="py-2 px-4 bg-primary text-white rounded-mac-btn hover:bg-primary/90 transition text-sm font-medium"
                >
                  {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Held Orders Modal */}
      {isHeldOrdersOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/50 backdrop-blur-sm h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl shadow-mac-popover border-l border-separator dark:border-white/10 w-full max-w-md h-full flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-separator dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white flex items-center gap-2">
                Active Orders
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">{heldOrders.length}</span>
              </h3>
              <button onClick={() => setIsHeldOrdersOpen(false)} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:hover:bg-white/5">
              {heldOrders.length === 0 ? (
                <div className="text-center py-12 text-textSecondary dark:text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-50" />
                  <p>No active held orders.</p>
                </div>
              ) : (
                heldOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => loadHeldOrder(order)}
                    className="bg-surfaceSolid dark:bg-white/10 border border-separator dark:border-white/10 rounded-mac-card p-4 hover:border-primary hover:shadow-mac-card dark:shadow-none transition cursor-pointer flex flex-col gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-textPrimary dark:text-white text-base group-hover:text-primary transition">
                          {order.customer ? order.customer.name : 'Walk-in Customer'}
                        </h4>
                        <p className="text-xs text-textSecondary dark:text-gray-400 mt-0.5">{order.orderNumber}</p>
                      </div>
                      <span className="font-bold text-textPrimary dark:text-white bg-surfaceSolid dark:bg-white/10 px-2.5 py-1 rounded-mac-btn text-sm">₹{parseFloat(order.total).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-textSecondary dark:text-gray-400 flex items-center gap-2">
                      <ShoppingCart size={12} /> {order.items?.length || 0} items
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
