import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import { fetchPendingQuickActions, approveMilestone, approveInvoice } from '../api/quickActionsApi';

interface QuickAction {
  id: string;
  type: 'approval' | 'review' | 'urgent';
  title: string;
  subtitle: string;
  amount?: number;
  dueTime: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  invoiceId?: string;
  milestoneId?: string;
}

const QuickActionWidget: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userRole = user?.role || 'finance';
  
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const { toasts, showToast, hideToast, success, error } = useToast();

  // Fetch real quick actions from API
  const loadQuickActions = async () => {
    try {
      setLoading(true);
      setApprovalError(null);
      const data = await fetchPendingQuickActions();
      setActions(data);
      console.log(`📊 Widget loaded ${data.length} pending actions`);
    } catch (err) {
      console.error('Failed to fetch quick actions:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load quick actions';
      setApprovalError(errorMsg);
      error(errorMsg);
      setActions([]); // Show empty state on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    loadQuickActions();
    // Refetch every 30 seconds to keep data fresh
    const interval = setInterval(loadQuickActions, 30000);
    return () => clearInterval(interval);
  }, []);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleApprove = async (id: string, action: QuickAction) => {
    try {
      console.log('⏳ Approving:', action.title);
      setApprovingId(id);
      setApprovalError(null);
      
      let result: any;
      // Call appropriate API based on action type
      if (action.milestoneId) {
        console.log(`📝 Calling approveMilestone for ${action.milestoneId}`);
        result = await approveMilestone(action.milestoneId, 'Completed');
      } else if (action.invoiceId) {
        console.log(`📄 Calling approveInvoice for ${action.invoiceId}`);
        result = await approveInvoice(action.invoiceId);
      }
      
      console.log('✅ API response:', result);
      
      // Show success notification
      if (action.type === 'milestone') {
        success(`✅ Milestone approved!`);
      } else {
        success(`✅ Invoice sent!`);
      }
      
      // Remove from local state immediately
      setActions((prev) => prev.filter((a) => a.id !== id));
      console.log(`✅ Removed item ${id} from list`);
      
      // Refetch all actions after a delay
      setTimeout(() => {
        console.log('🔄 Refetching actions...');
        loadQuickActions();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve';
      console.error('❌ Approval failed:', err);
      setApprovalError(errorMsg);
      error(`❌ ${errorMsg}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
    showToast('Action rejected', 'info');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-content')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);
  
  // Update actions when role changes
  useEffect(() => {
    loadQuickActions();
  }, [userRole]);

  const urgentCount = actions.filter((a) => a.priority === 'urgent').length;
  const highCount = actions.filter((a) => a.priority === 'high').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <>
      {toasts.map((toast) => (
        <Toast 
          key={toast.id}
          message={toast.message} 
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
      <div
        className="select-none"
        style={{
          position: 'relative',
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Collapsed State - Compact */}
      {!isExpanded && (
        <div className="relative group">
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 hover:scale-105 border border-white/30 backdrop-blur-lg"
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <ClockIcon className="h-7 w-7 drop-shadow-lg" />
                {urgentCount + highCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 text-[10px] font-bold text-white bg-gradient-to-br from-red-600 to-red-500 rounded-full animate-bounce shadow-md ring-1 ring-white">
                    {urgentCount + highCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold mt-1.5 drop-shadow-md">Quick</span>
            </div>
          </button>
          {/* Tooltip */}
          {isHovered && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 animate-fade-in">
              🚀 {actions.length} pending
            </div>
          )}
        </div>
      )}

      {/* Expanded State - Compact */}
      {isExpanded && (
        <div className="bg-white rounded-2xl shadow-2xl w-[350px] overflow-hidden border-2 border-purple-300 action-content animate-slide-in">
          {/* Header - Compact */}
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white p-4 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold drop-shadow-md">⚡ Quick Actions</h3>
                  <p className="text-xs text-purple-100 font-semibold">{actions.length} pending</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200 hover:rotate-180"
              >
                <ChevronDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Actions List - Compact */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin mb-3 flex justify-center">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
                <p className="font-semibold text-gray-700">Loading actions...</p>
              </div>
            ) : approvalError ? (
              <div className="p-8 text-center text-gray-500">
                <XCircleIcon className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <p className="font-bold text-red-600">{approvalError}</p>
                <button 
                  onClick={loadQuickActions}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : actions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="font-bold text-base text-gray-700">All caught up!</p>
                <p className="text-sm mt-1">🎉 No pending actions</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {actions.map((action) => (
                  <div key={action.id} className="p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-200">
                    {/* Action Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 mb-1">{action.title}</h4>
                        <p className="text-xs text-gray-600">{action.subtitle}</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm ${getPriorityColor(
                          action.priority
                        )}`}
                      >
                        {action.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Amount & Time */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      {action.amount && (
                        <span className="font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                          {formatCurrency(action.amount)}
                        </span>
                      )}
                      <span
                        className={`flex items-center font-semibold ${
                          action.dueTime === 'URGENT' ? 'text-red-600 animate-pulse' : 'text-gray-600'
                        }`}
                      >
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {action.dueTime}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(action.id, action)}
                        disabled={approvingId === action.id}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-xs font-bold rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approvingId === action.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                        )}
                        {approvingId === action.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(action.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-xs font-bold rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t-2 border-purple-200">
            <button className="w-full text-center text-sm font-bold text-purple-600 hover:text-purple-700 transition-all hover:scale-105 py-2 px-4 rounded-xl hover:bg-white hover:shadow-md">
              📄 View All Actions →
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default QuickActionWidget;
