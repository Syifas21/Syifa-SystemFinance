import React, { useState } from 'react';
import {
  ClockIcon,
  BellIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

interface FloatingActionMenuProps {
  onQuickActionClick: () => void;
  onNotificationClick: () => void;
  onAIClick: () => void;
  quickActionCount: number;
  notificationCount: number;
  isQuickActionOpen: boolean;
  isNotificationOpen: boolean;
  isAIOpen: boolean;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  onQuickActionClick,
  onNotificationClick,
  onAIClick,
  quickActionCount,
  notificationCount,
  isQuickActionOpen,
  isNotificationOpen,
  isAIOpen,
}) => {
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleQuickAction = () => {
    onQuickActionClick();
    setIsExpanded(false);
  };

  const handleNotification = () => {
    onNotificationClick();
    setIsExpanded(false);
  };

  const handleAI = () => {
    onAIClick();
    setIsExpanded(false);
  };

  const totalNotifications = quickActionCount + notificationCount;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Expanded Menu Items */}
      {isExpanded && (
        <div className="absolute top-0 right-0 flex flex-col gap-2 pr-20 animate-slideDown">
          {/* Quick Actions Button */}
          <button
            onClick={handleQuickAction}
            className={`
              group flex items-center gap-3 px-4 py-2.5 rounded-full font-bold text-sm
              transition-all duration-300 transform hover:scale-105 hover:-translate-x-1
              shadow-xl backdrop-blur-sm
              ${
                isQuickActionOpen
                  ? 'bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 text-white shadow-purple-300/60 ring-2 ring-purple-400'
                  : 'bg-white/95 text-purple-700 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 border-2 border-purple-300'
              }
            `}
          >
            <span className="whitespace-nowrap">⚡ Quick Actions</span>
            <div className="relative">
              <div className={`p-1.5 rounded-full ${isQuickActionOpen ? 'bg-white/20' : 'bg-purple-100'}`}>
                <ClockIcon className="h-5 w-5" />
              </div>
              {quickActionCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white">
                  {quickActionCount}
                </span>
              )}
            </div>
          </button>

          {/* Notification Button */}
          <button
            onClick={handleNotification}
            className={`
              group flex items-center gap-3 px-4 py-2.5 rounded-full font-bold text-sm
              transition-all duration-300 transform hover:scale-105 hover:-translate-x-1
              shadow-xl backdrop-blur-sm
              ${
                isNotificationOpen
                  ? 'bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 text-white shadow-orange-300/60 ring-2 ring-orange-400'
                  : 'bg-white/95 text-orange-700 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 border-2 border-orange-300'
              }
            `}
          >
            <span className="whitespace-nowrap">🔔 Notifikasi</span>
            <div className="relative">
              <div className={`p-1.5 rounded-full ${isNotificationOpen ? 'bg-white/20' : 'bg-orange-100'}`}>
                <BellIcon className={`h-5 w-5 ${notificationCount > 0 && !isNotificationOpen ? 'animate-wiggle' : ''}`} />
              </div>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white">
                  {notificationCount}
                </span>
              )}
            </div>
          </button>

          {/* AI Assistant Button */}
          <button
            onClick={handleAI}
            className={`
              group flex items-center gap-3 px-4 py-2.5 rounded-full font-bold text-sm
              transition-all duration-300 transform hover:scale-105 hover:-translate-x-1
              shadow-xl backdrop-blur-sm
              ${
                isAIOpen
                  ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-indigo-300/60 ring-2 ring-indigo-400'
                  : 'bg-white/95 text-indigo-700 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 border-2 border-indigo-300'
              }
            `}
          >
            <span className="whitespace-nowrap">🤖 AI Assistant</span>
            <div className="relative">
              <div className={`p-1.5 rounded-full ${isAIOpen ? 'bg-white/20' : 'bg-indigo-100'}`}>
                <SparklesIcon className={`h-5 w-5 ${!isAIOpen ? 'animate-pulse-slow' : ''}`} />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={handleMainClick}
        className={`
          relative w-16 h-16 rounded-full font-bold text-xl
          transition-all duration-500 transform
          shadow-2xl backdrop-blur-sm
          ${
            isExpanded
              ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white rotate-45 scale-110'
              : 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white hover:scale-110 hover:rotate-12 animate-float'
          }
        `}
      >
        {/* Ripple Effect */}
        {!isExpanded && totalNotifications > 0 && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-50"></div>
          </>
        )}

        {/* Icon */}
        <div className="relative z-10">
          {isExpanded ? (
            <XMarkIcon className="h-7 w-7 mx-auto" />
          ) : (
            <div className="flex items-center justify-center">
              <SparklesIcon className="h-7 w-7" />
            </div>
          )}
        </div>

        {/* Notification Badge */}
        {!isExpanded && totalNotifications > 0 && (
          <div className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-black rounded-full h-7 w-7 flex items-center justify-center animate-bounce shadow-lg ring-4 ring-white">
            {totalNotifications}
          </div>
        )}

        {/* Glow Effect */}
        {!isExpanded && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"></div>
        )}
      </button>

      {/* Floating Label */}
      {!isExpanded && (
        <div className="absolute -bottom-8 right-0 text-[10px] font-bold text-gray-600 whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
          🎯 Menu Cepat
        </div>
      )}
    </div>
  );
};

export default FloatingActionMenu;
