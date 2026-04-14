import React, { useState } from 'react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ChatWidget from './ChatWidget';

interface FloatingChatProps {
  role?: 'finance' | 'ceo';
}

const FloatingChat: React.FC<FloatingChatProps> = ({ role = 'finance' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const themeConfig = {
    finance: {
      buttonBg: 'from-blue-600 to-blue-700',
      buttonBorder: 'ring-blue-300',
      buttonColor: '#2563EB',
    },
    ceo: {
      buttonBg: 'from-red-700 to-red-900',
      buttonBorder: 'ring-red-300',
      buttonColor: '#DC2626',
    },
  };

  const theme = themeConfig[role] || themeConfig.finance;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center text-white z-40 ring-4 bg-gradient-to-r ${theme.buttonBg} ${theme.buttonBorder}`}
        title={isOpen ? 'Tutup Chat' : 'Buka Chat'}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <SparklesIcon className="w-6 h-6 animate-pulse" />
        )}
      </button>

      {/* Chat Widget Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-96 md:h-[500px] z-50 rounded-2xl overflow-hidden shadow-2xl">
          <ChatWidget role={role} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
};

export default FloatingChat;
