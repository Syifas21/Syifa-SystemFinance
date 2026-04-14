import React, { useState } from 'react';
import {
  ClockIcon,
  BellIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import THEME from '../config/theme';

interface ActionBarProps {
  onQuickActionClick: () => void;
  onNotificationClick: () => void;
  onAIClick: () => void;
  quickActionCount: number;
  notificationCount: number;
  isQuickActionOpen: boolean;
  isNotificationOpen: boolean;
  isAIOpen: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b-2 border-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 shadow-lg backdrop-blur-sm">
      <div className="px-3 py-1.5 lg:pl-[300px]">
        <div className="flex items-center justify-center gap-2">
          {/* Center - Action Buttons (Always visible, compact) */}
          <div className="flex items-center gap-2">
            {/* Quick Actions Button */}
            <button
              onClick={onQuickActionClick}
              className={`
                group relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs
                transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5
                ${
                  isQuickActionOpen
                    ? 'bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 text-white shadow-xl shadow-purple-300/50 ring-2 ring-purple-400'
                    : 'bg-gradient-to-br from-purple-100 via-purple-50 to-blue-100 text-purple-700 hover:shadow-lg hover:shadow-purple-200/50 border border-purple-300'
                }
              `}
            >
              <div className="relative">
                <div className={`p-1 rounded-lg ${isQuickActionOpen ? 'bg-white/20' : 'bg-purple-200/50'}`}>
                  <ClockIcon className="h-4 w-4" />
                </div>
                {quickActionCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white">
                    {quickActionCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">⚡ Quick Actions</span>
              {!isQuickActionOpen && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl animate-shimmer"></div>
              )}
            </button>

            {/* Notification Button */}
            <button
              onClick={onNotificationClick}
              className={`
                group relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs
                transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5
                ${
                  isNotificationOpen
                    ? 'bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 text-white shadow-xl shadow-orange-300/50 ring-2 ring-orange-400'
                    : 'bg-gradient-to-br from-orange-100 via-orange-50 to-red-100 text-orange-700 hover:shadow-lg hover:shadow-orange-200/50 border border-orange-300'
                }
              `}
            >
              <div className="relative">
                <div className={`p-1 rounded-lg ${isNotificationOpen ? 'bg-white/20' : 'bg-orange-200/50'}`}>
                  <BellIcon className={`h-4 w-4 ${notificationCount > 0 && !isNotificationOpen ? 'animate-wiggle' : ''}`} />
                </div>
                {notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center animate-pulse shadow-lg ring-2 ring-white">
                    {notificationCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">🔔 Notifikasi</span>
              {!isNotificationOpen && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
              )}
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={onAIClick}
              className={`
                group relative flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs
                transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5
                ${
                  isAIOpen
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-300/50 ring-2 ring-indigo-400'
                    : 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 text-indigo-700 hover:shadow-lg hover:shadow-indigo-200/50 border border-indigo-300'
                }
              `}
            >
              <div className="relative">
                <div className={`p-1 rounded-lg ${isAIOpen ? 'bg-white/20' : 'bg-indigo-200/50'}`}>
                  <SparklesIcon className={`h-4 w-4 ${!isAIOpen ? 'animate-pulse-slow' : ''}`} />
                </div>
              </div>
              <span className="hidden sm:inline">🤖 AI Assistant</span>
              {!isAIOpen && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
