import React, { useState } from 'react';
import THEME from '../config/theme';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ChevronDownIcon,
  FolderIcon,
  ScaleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['finance']);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define menu items based on role
  const getMenuItems = (): MenuItem[] => {
    const isCEO = user?.role === 'CEO';

    if (isCEO) {
      // CEO - Executive View (Red theme)
      return [
        {
          name: 'Dashboard Eksekutif',
          path: '/dashboard',
          icon: HomeIcon,
        },
        {
          name: 'Monitoring Finansial',
          path: '/finance',
          icon: ChartBarIcon,
          children: [
            {
              name: 'Kokpit Finansial',
              path: '/financial-cockpit',
              icon: ChartBarIcon,
            },
            {
              name: 'Laporan Keuangan',
              path: '/reports',
              icon: DocumentTextIcon,
            },
            {
              name: 'Bank Reconciliation',
              path: '/bank-reconciliation',
              icon: BanknotesIcon,
            },
            {
              name: 'Invoice & Piutang',
              path: '/invoices',
              icon: DocumentTextIcon,
            },
            {
              name: 'Utang Usaha',
              path: '/ap',
              icon: DocumentTextIcon,
            },
          ],
        },
        {
          name: 'Persetujuan & Kebijakan',
          path: '/approvals',
          icon: DocumentTextIcon,
          children: [
            {
              name: 'Approve Margin Violation',
              path: '/approvals/margin',
              icon: DocumentTextIcon,
            },
            // Expense approval disabled - model not in schema
            // {
            //   name: 'Approve Expense >20M',
            //   path: '/approvals/expense',
            //   icon: DocumentTextIcon,
            // },
          ],
        },
        {
          name: 'Settings',
          path: '/settings',
          icon: Cog6ToothIcon,
        },
      ];
    } else {
      // FINANCE_ADMIN - Operational View (Blue theme)
      return [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: HomeIcon,
        },
        {
          name: 'Finance',
          path: '/finance',
          icon: BanknotesIcon,
          children: [
            {
              name: 'Akuntansi (COA)',
              path: '/coa',
              icon: DocumentTextIcon,
            },
            {
              name: 'Invoice & Piutang (AR)',
              path: '/invoices',
              icon: DocumentTextIcon,
            },
            {
              name: 'Bank Reconciliation',
              path: '/bank-reconciliation',
              icon: BanknotesIcon,
            },
            {
              name: 'Utang Usaha (AP)',
              path: '/ap',
              icon: DocumentTextIcon,
            },
            {
              name: 'Kokpit Finansial',
              path: '/financial-cockpit',
              icon: Cog6ToothIcon,
            },
            {
              name: 'Laporan Keuangan',
              path: '/reports',
              icon: ChartBarIcon,
            },
            // Assets disabled - model not in schema
            // {
            //   name: 'Aset Tetap',
            //   path: '/assets',
            //   icon: DocumentTextIcon,
            // },
            // Document Repository already removed
            // {
            //   name: 'Dokumen Repository',
            //   path: '/documents',
            //   icon: FolderIcon,
            // },
            // Budget vs Actual already removed
            // {
            //   name: 'Budget vs Actual',
            //   path: '/budget-vs-actual',
            //   icon: ScaleIcon,
            // },
          ],
        },
        {
          name: 'Settings',
          path: '/settings',
          icon: Cog6ToothIcon,
        },
      ];
    }
  };

  const menuItems = getMenuItems();
  
  // Color scheme based on role - use shared THEME for Finance
  const isCEO = user?.role === 'CEO';
  const themeColors = isCEO
    ? {
        primary: '#7C2D12',
        primaryDark: '#5B1A0A',
        accent: '#D97706',
        accentLight: '#FCD34D',
        background: '#2B1E16',
      }
    : {
        primary: THEME.primary, // navy
        primaryDark: '#071834',
        accent: THEME.accent, // vibrant blue
        accentLight: THEME.accentSoft,
        background: '#0F172A',
      };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const isParentActive = (children?: MenuItem[]) => {
    return children?.some((child) => location.pathname === child.path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72 text-white shadow-2xl`}
        style={{ backgroundColor: themeColors.background }}
      >
        {/* Header - Clean & Professional */}
        <div 
          className="flex-shrink-0 flex flex-col items-center justify-center py-6 border-b-2"
          style={{ 
            backgroundColor: themeColors.primary,
            borderBottomColor: themeColors.accent
          }}
        >
          {/* Logo Image - FOTO LOGO DIPERBESAR */}
          <div className="w-24 h-24 flex items-center justify-center mb-2 overflow-visible">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain drop-shadow-2xl brightness-110 scale-125"
              style={{ transform: 'scale(1.25)' }}
            />
          </div>
          <p className="text-sm font-bold text-white tracking-wide">
            {isCEO ? '🎩 Dashboard Eksekutif' : '💼 Modul Keuangan'}
          </p>
          {/* Accent underline */}
          <div className="mt-2.5 w-12 h-1 rounded-full" style={{ backgroundColor: themeColors.accent }} />
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-white hover:text-gray-200 transition-colors absolute top-2 right-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav 
          className="flex-1 overflow-y-auto py-6 px-3 scroll-smooth" 
          style={{
            backgroundColor: themeColors.background,
            scrollbarWidth: 'thin',
            scrollbarColor: `${themeColors.accent} rgba(255, 255, 255, 0.1)`,
            minHeight: 0
          }}
        >
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  // Menu with submenu
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name.toLowerCase())}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                        isParentActive(item.children)
                          ? 'bg-white/10 text-white shadow-md'
                          : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                      style={isParentActive(item.children) ? { borderLeft: `4px solid ${themeColors.accent}`, paddingLeft: '0.875rem' } : {}}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shadow-sm">
                          <item.icon
                            className={`h-5 w-5 transition-all duration-200 text-white`}
                          />
                        </div>
                        <span className="font-bold text-sm">{item.name}</span>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 transition-transform duration-200 text-white/90 ${
                          expandedMenus.includes(item.name.toLowerCase()) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Submenu */}
                    {expandedMenus.includes(item.name.toLowerCase()) && (
                      <div className="ml-3 mt-2 space-y-1.5">
                          {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsOpen(false)}
                            className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                              isActive(child.path)
                                ? 'bg-white/10 text-white shadow-md font-bold'
                                : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }`}
                            style={isActive(child.path) ? { borderLeft: `3px solid ${themeColors.accent}`, paddingLeft: '0.875rem' } : {} }
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                              <child.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold">{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular menu item
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/90 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shadow-sm">
                      <item.icon
                        className="h-5 w-5 transition-all duration-300"
                      />
                    </div>
                    <span className="font-bold text-sm">{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-2 border-white/20 space-y-3" style={{ backgroundColor: themeColors.background }}>
          {/* User Info */}
          <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-white/10 shadow-md">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: themeColors.accent }}
            >
              <span className="text-base font-bold text-white">{user?.full_name?.charAt(0) || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs truncate text-white/80 font-semibold">
                {user?.role === 'CEO' ? '👔 Chief Executive Officer' : '💼 Administrator Keuangan'}
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group text-white font-bold hover:bg-red-500/30 hover:text-white shadow-md hover:shadow-lg"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 transition-all duration-300" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
