import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useQuickActionStore } from '../store/quickActionStore';
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

const QuickActionList: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userRole = user?.role || 'finance';
  const { toasts, showToast, hideToast, success, error } = useToast();
  const { setActions: updateStore } = useQuickActionStore();

  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Fetch real quick actions from API
  const loadQuickActions = async () => {
    try {
      setLoading(true);
      setApprovalError(null);
      const data = await fetchPendingQuickActions();
      setActions(data);
      updateStore(data); // Update global store for Layout
      console.log(`📊 Loaded ${data.length} pending actions`);
    } catch (err) {
      console.error('Failed to fetch quick actions:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load quick actions';
      setApprovalError(errorMsg);
      error(errorMsg);
      setActions([]);
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

  // Refetch when role changes
  useEffect(() => {
    loadQuickActions();
  }, [userRole]);

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
      
      // Show success notification with details
      if (action.type === 'milestone') {
        success(`✅ Milestone approved: ${action.subtitle}`);
      } else {
        success(`✅ Invoice sent to ${action.subtitle}`);
      }
      
      // Remove from local state immediately
      setActions((prev) => prev.filter((a) => a.id !== id));
      console.log(`✅ Removed item ${id} from list`);
      
      // Refetch all actions after a delay to ensure DB is updated
      setTimeout(() => {
        console.log('🔄 Refetching quick actions...');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
            URGENT
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
            HIGH
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin mb-3 flex justify-center">
          <ClockIcon className="h-12 w-12 text-purple-600" />
        </div>
        <p className="font-semibold text-gray-700">Loading actions...</p>
      </div>
    );
  }

  if (approvalError) {
    return (
      <div className="p-8 text-center">
        <XCircleIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <p className="font-bold text-lg text-red-600">{approvalError}</p>
        <button 
          onClick={loadQuickActions}
          className="mt-4 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="p-8 text-center">
        <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <p className="font-bold text-lg text-gray-700">All caught up!</p>
        <p className="text-sm text-gray-500 mt-2">🎉 No pending actions</p>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="bg-gradient-to-br from-white via-gray-50 to-white p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-xl group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-base text-gray-800 group-hover:text-purple-700 transition-colors">{action.title}</h4>
                  {getPriorityBadge(action.priority)}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{action.subtitle}</p>
              </div>
            </div>

            {action.amount && (
              <div className="flex items-center gap-2 mb-3 py-2.5 px-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <BanknotesIcon className="h-5 w-5 text-green-600" />
                <span className="text-base font-bold text-green-700">
                  {formatCurrency(action.amount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span className="font-semibold">{action.dueTime}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(action.id, action)}
                  disabled={approvingId === action.id}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-xs font-bold transition-all hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approvingId === action.id ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                  <span>{approvingId === action.id ? 'Processing...' : 'Approve'}</span>
                </button>
                <button
                  onClick={() => handleReject(action.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-xs font-bold transition-all hover:shadow-lg transform hover:scale-105"
                >
                  <XCircleIcon className="h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default QuickActionList;
