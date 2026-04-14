import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import THEME from '../config/theme';

interface HeaderProps {
  toggleSidebar: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'CEO' 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold" style={{ color: THEME.primary }}>{title || 'Sistem Keuangan'}</h1>
            <p className="text-sm text-gray-600">Sistem Manajemen Keuangan</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex items-center space-x-2 bg-gray-50 rounded-lg px-4 py-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari..."
              className="bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder-gray-400 w-64"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <BellIcon className="h-6 w-6 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-600" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Pengguna'}</p>
                <p className="text-xs text-gray-500">{user?.role === 'CEO' ? 'CEO' : 'Admin Keuangan'}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role || '')}`}>
                    {user?.role === 'CEO' ? '👔 CEO' : '💼 Admin Keuangan'}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/settings');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Cog6ToothIcon className="h-5 w-5 mr-3 text-gray-400" />
                    Pengaturan
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
