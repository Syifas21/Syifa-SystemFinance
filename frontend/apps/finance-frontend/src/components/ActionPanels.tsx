import React from 'react';
import QuickActionList from './QuickActionList';
import NotificationList from './NotificationList';
import AIAssistantPanel from './AIAssistantPanel';

interface ActionPanelsProps {
  activePanel: 'quick' | 'notification' | 'ai' | null;
  onClose: () => void;
}

const ActionPanels: React.FC<ActionPanelsProps> = ({ activePanel, onClose }) => {
  if (!activePanel) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Panel Container - Centered on screen, considering sidebar */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] animate-slide-down max-h-[90vh] overflow-hidden">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          {activePanel === 'quick' && (
            <div className="w-[850px] max-w-[90vw]">
              <QuickActionPanelContent onClose={onClose} />
            </div>
          )}
          {activePanel === 'notification' && (
            <div className="w-[750px] max-w-[90vw]">
              <NotificationPanelContent onClose={onClose} />
            </div>
          )}
          {activePanel === 'ai' && (
            <div className="w-[650px] max-w-[90vw]">
              <AIPanelContent onClose={onClose} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Quick Action Panel Content
const QuickActionPanelContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="relative">
      <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Quick Actions</h3>
            <p className="text-sm text-purple-100">Aksi cepat yang memerlukan perhatian Anda</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <QuickActionList />
      </div>
    </div>
  );
};

// Notification Panel Content
const NotificationPanelContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="relative">
      <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <span className="text-2xl">🔔</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Notifikasi</h3>
            <p className="text-sm text-orange-100">Pembaruan dan pengingat penting</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <NotificationList />
      </div>
    </div>
  );
};

// AI Panel Content
const AIPanelContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="relative">
      <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Assistant</h3>
            <p className="text-sm text-indigo-100">Asisten keuangan cerdas Anda</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        <AIAssistantPanel />
      </div>
    </div>
  );
};

export default ActionPanels;
