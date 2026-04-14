import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import ImpactPredictionDashboard from '../../components/ImpactPredictionDashboard';
import CollaborativeActivityFeed from '../../components/CollaborativeActivityFeed';
import VoiceCommandWidget from '../../components/VoiceCommandWidget';
import FinancialHealthMonitor from '../../components/FinancialHealthMonitor';
import SmartAutoPilotMode from '../../components/SmartAutoPilotMode';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useActivityStore } from '../../store/activityStore';

interface MarginViolation {
  id: string;
  sbu: string;
  category: string;
  system?: string;
  sub_system?: string;
  component?: string;
  cost_price: number;
  selling_price: number;
  applied_margin: number;
  policy_min_margin: number;
  policy_max_margin: number;
  deviation_from_min: number;
  deviation_from_max: number;
  exception_type?: string;
  exception_reason?: string;
  approved_by?: string;
  approved_at?: string;
  violated_at: string;
  estimation_id?: string;
  created_by: string;
  created_at: string;
}

interface DisplayViolation extends MarginViolation {
  displayStatus: 'pending' | 'approved' | 'rejected';
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const MarginApproval: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { addActivity } = useActivityStore();

  const [violations, setViolations] = useState<DisplayViolation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<DisplayViolation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch violations on mount
  useEffect(() => {
    fetchViolations();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchViolations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchViolations = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/margin-policies/violations?limit=100`);

      if (!response.ok) {
        throw new Error(`Failed to fetch violations: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const transformedData = result.data.map((violation: MarginViolation) => ({
          ...violation,
          displayStatus: violation.approved_by
            ? violation.approved_by.startsWith('REJECTED_BY_')
              ? 'rejected'
              : 'approved'
            : 'pending',
        })) as DisplayViolation[];

        setViolations(transformedData);
      }
    } catch (err: any) {
      console.error('Error fetching violations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, comment?: string) => {
    if (!user) return;

    try {
      setProcessingId(id);
      const response = await fetch(`${API_BASE}/margin-policies/violations/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id || user.email || 'UNKNOWN_CEO',
        },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve violation');
      }

      const result = await response.json();

      // Update local state
      setViolations((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                approved_by: user.full_name || user.email,
                approved_at: new Date().toISOString(),
                displayStatus: 'approved',
              }
            : v
        )
      );

      setSelectedViolation(null);

      // Add activity
      const violation = violations.find((v) => v.id === id);
      if (violation) {
        addActivity({
          type: 'approval',
          actor: {
            name: user.full_name || user.email,
            role: 'Chief Executive Officer',
          },
          action: 'approved',
          target: `Margin Violation ${violation.category}`,
          details: `Approved ${violation.applied_margin.toFixed(2)}% margin (${violation.deviation_from_min.toFixed(2)}% below policy).`,
          metadata: {
            amount: violation.selling_price,
            tags: ['margin', 'approved'],
          },
        });
      }

      // Send notification
      addNotification({
        type: 'approved',
        priority: 'high',
        title: 'Margin Violation Approved',
        message: `${violation?.category} approved with ${violation?.applied_margin.toFixed(2)}% margin. Finance team can proceed.`,
        from: { name: user.full_name || user.email, role: 'CEO' },
        actionUrl: '/approvals/margin',
        recipientRole: 'FINANCE_ADMIN',
        isRead: false,
      });
    } catch (err: any) {
      console.error('Error approving violation:', err);
      addNotification({
        type: 'error',
        priority: 'high',
        title: 'Approval Failed',
        message: err.message,
        from: { name: 'System', role: 'System' },
        actionUrl: '/approvals/margin',
        recipientRole: 'CEO',
        isRead: false,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!user || !reason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      setProcessingId(id);
      const response = await fetch(`${API_BASE}/margin-policies/violations/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id || user.email || 'UNKNOWN_CEO',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject violation');
      }

      // Update local state
      setViolations((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                approved_by: `REJECTED_BY_${user.full_name || user.email}`,
                approved_at: new Date().toISOString(),
                exception_reason: reason,
                displayStatus: 'rejected',
              }
            : v
        )
      );

      setSelectedViolation(null);

      // Add activity
      const violation = violations.find((v) => v.id === id);
      if (violation) {
        addActivity({
          type: 'rejection',
          actor: { name: user.full_name || user.email, role: 'Chief Executive Officer' },
          action: 'rejected',
          target: `Margin Violation ${violation.category}`,
          details: `Rejected ${violation.applied_margin.toFixed(2)}% margin. Reason: ${reason}`,
          metadata: {
            amount: violation.selling_price,
            tags: ['margin', 'rejected'],
          },
        });
      }

      // Send notification
      addNotification({
        type: 'rejected',
        priority: 'high',
        title: 'Margin Violation Rejected',
        message: `${violation?.category} rejected. Reason: ${reason}. Finance team must renegotiate.`,
        from: { name: user.full_name || user.email, role: 'CEO' },
        actionUrl: '/approvals/margin',
        recipientRole: 'FINANCE_ADMIN',
        isRead: false,
      });
    } catch (err: any) {
      console.error('Error rejecting violation:', err);
      addNotification({
        type: 'error',
        priority: 'high',
        title: 'Rejection Failed',
        message: err.message,
        from: { name: 'System', role: 'System' },
        actionUrl: '/approvals/margin',
        recipientRole: 'CEO',
        isRead: false,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = violations.filter((v) => v.displayStatus === 'pending').length;
  const approvedCount = violations.filter((v) => v.displayStatus === 'approved').length;

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceApprove = (event: any) => {
      if (selectedViolation && selectedViolation.displayStatus === 'pending') {
        handleApprove(selectedViolation.id);
      }
    };

    const handleVoiceReject = (event: any) => {
      if (selectedViolation && selectedViolation.displayStatus === 'pending') {
        const reason = prompt('Enter rejection reason:');
        if (reason) handleReject(selectedViolation.id, reason);
      }
    };

    window.addEventListener('voice-approve', handleVoiceApprove);
    window.addEventListener('voice-reject', handleVoiceReject);

    return () => {
      window.removeEventListener('voice-approve', handleVoiceApprove);
      window.removeEventListener('voice-reject', handleVoiceReject);
    };
  }, [selectedViolation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading margin violations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
              Persetujuan Pelanggaran Margin
            </h1>
            <p className="mt-2 text-red-100">
              Monitor dan setujui/tolak pelanggaran margin dari Finance transactions
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <div className="text-3xl font-bold">{pendingCount}</div>
              <div className="text-sm text-red-100">Menunggu</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-100">{approvedCount}</div>
              <div className="text-sm text-red-100">Approved</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Violations List */}
        <div className="lg:col-span-2 space-y-4">
          {violations.map((violation) => (
            <div
              key={violation.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                violation.displayStatus === 'pending'
                  ? 'border-orange-500'
                  : violation.displayStatus === 'approved'
                  ? 'border-green-500'
                  : 'border-red-500'
              } ${selectedViolation?.id === violation.id ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => setSelectedViolation(violation)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {violation.category}
                      </h3>
                      {violation.system && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {violation.system}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Estimation: {violation.estimation_id} | Created: {new Date(violation.violated_at).toLocaleDateString()}
                    </p>
                  </div>
                  {violation.displayStatus !== 'pending' && (
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        violation.displayStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {violation.displayStatus === 'approved' ? '✓ Approved' : '✗ Rejected'}
                    </span>
                  )}
                </div>

                {/* Margin Details */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Item Value</div>
                    <div className="text-lg font-bold text-gray-900">
                      Rp {violation.selling_price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600">Min Policy</div>
                    <div className="text-lg font-bold text-blue-900">{violation.policy_min_margin.toFixed(2)}%</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600">Applied Margin</div>
                    <div className="text-lg font-bold text-orange-900">{violation.applied_margin.toFixed(2)}%</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600">Below Min</div>
                    <div className="text-lg font-bold text-red-900">{violation.deviation_from_min.toFixed(2)}%</div>
                  </div>
                </div>

                {/* Reason */}
                {violation.exception_reason && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-yellow-900 mb-1">
                          Reason:
                        </div>
                        <div className="text-sm text-yellow-800">{violation.exception_reason}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {violation.displayStatus === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleApprove(violation.id)}
                      disabled={processingId === violation.id}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      {processingId === violation.id ? 'Approving...' : 'Approve Exception'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleReject(violation.id, reason);
                      }}
                      disabled={processingId === violation.id}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-lg transition-colors duration-200"
                    >
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      {processingId === violation.id ? 'Rejecting...' : 'Reject Request'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {violations.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak Ada Pelanggaran Ditemukan
              </h3>
              <p className="text-gray-600">
                Semua pricing dari Finance berada dalam rentang margin yang dapat diterima.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Innovative Features */}
        <div className="lg:col-span-1 space-y-6">
          {/* Smart Auto-Pilot Mode */}
          <SmartAutoPilotMode />

          {/* AI Impact Analysis */}
          {selectedViolation && selectedViolation.displayStatus === 'pending' && (
            <ImpactPredictionDashboard
              type="margin"
              amount={selectedViolation.selling_price}
              metadata={{
                projectName: selectedViolation.category,
                margin: selectedViolation.applied_margin,
              }}
            />
          )}

          {/* Collaborative Activity Feed */}
          <CollaborativeActivityFeed />
        </div>
      </div>

      {/* Voice Command Widget - Floating */}
      <VoiceCommandWidget />
    </div>
  );
};

export default MarginApproval;
