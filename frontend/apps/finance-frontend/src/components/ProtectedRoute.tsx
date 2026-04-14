// ============================================
// PROJECT FINANCE - Protected Route Component
// ============================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Jika belum login, redirect ke login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada pembatasan role dan user tidak punya akses
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 mb-6">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Role Anda: <span className="font-semibold">{user.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
