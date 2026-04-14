import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import FloatingActionMenu from './FloatingActionMenu';
import ActionPanels from './ActionPanels';
import DirectMessaging from './DirectMessaging';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQuickActionStore } from '../store/quickActionStore';
import { fetchPendingQuickActions } from '../api/quickActionsApi';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'quick' | 'notification' | 'ai' | null>(null);
  const { user } = useAuthStore();
  const { getUnreadCount } = useNotificationStore();
  const { getCount, setActions } = useQuickActionStore();

  // Fetch quick actions from API on mount
  useEffect(() => {
    const loadQuickActions = async () => {
      try {
        const data = await fetchPendingQuickActions();
        setActions(data);
      } catch (err) {
        console.error('Failed to load quick actions in Layout:', err);
      }
    };

    loadQuickActions();
    // Refetch every 30 seconds
    const interval = setInterval(loadQuickActions, 30000);
    return () => clearInterval(interval);
  }, [setActions]);

  // Get quick action count from store (actual data from API)
  const getQuickActionCount = () => {
    return getCount();
  };

  const handleTogglePanel = (panel: 'quick' | 'notification' | 'ai') => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)', fontFamily: 'var(--font-family)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Floating Action Menu - Top Right */}
      <FloatingActionMenu
        onQuickActionClick={() => handleTogglePanel('quick')}
        onNotificationClick={() => handleTogglePanel('notification')}
        onAIClick={() => handleTogglePanel('ai')}
        quickActionCount={getQuickActionCount()}
        notificationCount={getUnreadCount()}
        isQuickActionOpen={activePanel === 'quick'}
        isNotificationOpen={activePanel === 'notification'}
        isAIOpen={activePanel === 'ai'}
      />

      {/* Action Panels - Displayed when active */}
      <ActionPanels activePanel={activePanel} onClose={handleClosePanel} />

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Page Content */}
        <main className="p-4 md:p-6 min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p className="font-medium">&copy; 2026 Sistem Keuangan. Hak cipta dilindungi.</p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a href="#" className="hover:text-blue-600 transition-colors font-medium">Privasi</a>
              <a href="#" className="hover:text-purple-400 transition-colors font-medium">Terms</a>
              <a href="#" className="hover:text-purple-400 transition-colors font-medium">Support</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Direct Messaging Component - Always Available */}
      <DirectMessaging 
        recipientRole={user?.role === 'CEO' ? 'FINANCE_ADMIN' : 'CEO'}
        recipientName={user?.role === 'CEO' ? 'Finance Admin' : 'CEO'}
      />
    </div>
  );
};

export default Layout;
