import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { Store, User, Lock, Briefcase, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import CustomSelect from '../../components/common/CustomSelect';

export default function Register() {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Retail',
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/register', formData);
      setAuth(res.data.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-white/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary mb-6">
          <Store className="w-12 h-12" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-textPrimary dark:text-white">
          Create your business
        </h2>
        <p className="mt-2 text-center text-sm text-textSecondary dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-[#1C1C1E] py-8 px-4 shadow-mac-subtle dark:shadow-none sm:rounded-mac-card sm:px-10 border border-separator dark:border-white/10/60">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-mac-btn text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Business Name</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                    <Briefcase size={18} />
                  </div>
                  <input
                    type="text"
                    name="businessName"
                    required
                    placeholder="e.g. Vendix Retail"
                    className="pl-10 block w-full rounded-mac-btn border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm h-11 border outline-none px-3"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Business Type</label>
                <div className="mt-1 relative z-[70]">
                  <CustomSelect
                    value={formData.businessType}
                    onChange={(val) => setFormData({ ...formData, businessType: val })}
                    options={[
                      { value: 'Retail', label: 'Retail' },
                      { value: 'Restaurant', label: 'Restaurant' },
                      { value: 'Grocery', label: 'Grocery' },
                      { value: 'Electronics', label: 'Electronics' }
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-separator dark:border-white/10 pt-6">
              <h3 className="text-sm font-medium text-textPrimary dark:text-white mb-4">Owner Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Full Name</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      className="pl-10 block w-full rounded-mac-btn border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm h-11 border outline-none px-3"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Email Address</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="name@company.com"
                      className="pl-10 block w-full rounded-mac-btn border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm h-11 border outline-none px-3"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Password</label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10 block w-full rounded-mac-btn border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm h-11 border outline-none px-3"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-mac-btn shadow-mac-subtle dark:shadow-none text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
