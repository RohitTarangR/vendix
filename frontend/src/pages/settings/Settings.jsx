import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Settings as SettingsIcon, Briefcase, Phone, Mail, MapPin } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import CustomSelect from '../../components/common/CustomSelect';

export default function Settings() {
  const { showConfirm } = useUiStore();
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/tenant/settings');
      return res.data.data;
    }
  });

  const [businessType, setBusinessType] = useState('Retail');

  useEffect(() => {
    if (tenant?.businessType) {
      setBusinessType(tenant.businessType);
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: (updatedSettings) => api.put('/tenant/settings', updatedSettings),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data.data.data);
      // Update local storage business name if user state contains it
      const userData = JSON.parse(localStorage.getItem('vendix_user'));
      if (userData?.tenant) {
        userData.tenant = data.data.data;
        localStorage.setItem('vendix_user', JSON.stringify(userData));
      }
      setSuccessMsg('Business settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    showConfirm({
      title: 'Update Business Settings',
      message: 'Are you sure you want to save these changes to your business profile?',
      onConfirm: () => updateMutation.mutate(data)
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
          <SettingsIcon className="text-primary" /> Settings
        </h1>
        <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Configure your business settings, details and contact information.</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 p-4 rounded-mac-btn text-sm border border-green-250">
          {successMsg}
        </div>
      )}

      <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-separator dark:divide-white/10">
          <div className="p-6 space-y-6">
            <h2 className="text-base font-semibold text-textPrimary dark:text-white">Business Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-300">Business Name</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-500">
                    <Briefcase size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Vendix Retail"
                    defaultValue={tenant?.name || ''}
                    className="pl-10 block w-full rounded-mac-btn border border-separator dark:border-white/10 bg-transparent dark:bg-black/50 dark:text-white shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-300 mb-1">Business Type</label>
                <input type="hidden" name="businessType" value={businessType} />
                <div className="relative z-[70]">
                  <CustomSelect
                    value={businessType}
                    onChange={(val) => setBusinessType(val)}
                    options={[
                      { value: 'Retail', label: 'Retail' },
                      { value: 'Restaurant', label: 'Restaurant' },
                      { value: 'Grocery', label: 'Grocery' },
                      { value: 'Electronics', label: 'Electronics' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-300">Contact Phone</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-500">
                    <Phone size={18} />
                  </div>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. +1 234 567 8900"
                    defaultValue={tenant?.phone || ''}
                    className="pl-10 block w-full rounded-mac-btn border border-separator dark:border-white/10 bg-transparent dark:bg-black/50 dark:text-white shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-300">Contact Email</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. contact@business.com"
                    defaultValue={tenant?.email || ''}
                    className="pl-10 block w-full rounded-mac-btn border border-separator dark:border-white/10 bg-transparent dark:bg-black/50 dark:text-white shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary dark:text-gray-300">Address / Head Office</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-textSecondary dark:text-gray-500">
                  <MapPin size={18} />
                </div>
                <textarea
                  name="address"
                  rows={3}
                  placeholder="Enter your complete business address..."
                  defaultValue={tenant?.address || ''}
                  className="pl-10 block w-full rounded-mac-btn border border-separator dark:border-white/10 bg-transparent dark:bg-black/50 dark:text-white shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-black/40 flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="py-2.5 px-6 border border-transparent rounded-mac-btn shadow-mac-subtle dark:shadow-none text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50"
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
