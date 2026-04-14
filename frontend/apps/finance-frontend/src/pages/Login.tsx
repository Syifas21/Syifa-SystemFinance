// ============================================
// PROJECT FINANCE - Login Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LockClosedIcon, 
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import PrimaryButton from '../components/PrimaryButton';
import THEME from '../config/theme';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email dan password harus diisi');
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login gagal. Silakan coba lagi.');
    }
  };

  const handleQuickLogin = (role: 'CEO' | 'FINANCE_ADMIN') => {
    // User dapat klik tombol role untuk pre-fill email field
    // Tapi masih harus input password secara manual untuk security
    if (role === 'CEO') {
      setFormData({ ...formData, email: 'ceo@projectfinance.com' });
    } else {
      setFormData({ ...formData, email: 'finance@projectfinance.com' });
    }
    // Focus ke password field
    document.getElementById('password')?.focus();
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gray-50">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(209 213 219) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ backgroundColor: THEME.accent }}>
              <ChartBarIcon className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Project Finance
          </h2>
          <p className="text-sm text-gray-600">
            Sistem Manajemen Keuangan
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ingat saya
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Lupa password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <PrimaryButton type="submit" disabled={isLoading} style={{ width: '100%' }}>
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </div>
              ) : (
                'Masuk'
              )}
            </PrimaryButton>

            {/* Quick Role Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Atau masuk sebagai</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('CEO')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-blue-300 rounded-lg shadow-sm bg-white text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                >
                  👔 CEO
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('FINANCE_ADMIN')}
                  className="w-full inline-flex justify-center py-2 px-4 border border-green-300 rounded-lg shadow-sm bg-white text-sm font-medium text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200"
                >
                  💼 Admin Keuangan
                </button>
              </div>
              
              <p className="mt-3 text-center text-xs text-gray-500">
                Klik untuk pre-fill email, lalu masukkan password Anda
              </p>
            </div>
          </form>


        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          © 2026 Sistem Keuangan. Hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}
