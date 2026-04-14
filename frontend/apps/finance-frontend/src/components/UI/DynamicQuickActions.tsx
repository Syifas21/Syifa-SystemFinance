import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { designSystem, Card, Button } from '../UI';
import { useNotification } from '../../contexts/NotificationContext';

interface PendingMilestone {
  id: string;
  milestone_type: string;
  milestone_name?: string;
  percentage: number;
  expected_amount: number;
  created_at: string;
  invoice?: {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
  };
}

interface PendingInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}

interface QuickActionData {
  pending_approvals: number;
  pending_invoices: number;
  pending_milestones: PendingMilestone[];
  pending_invoices_list: PendingInvoice[];
  total_pending: number;
  summary?: {
    total_milestone_value: number;
    total_invoice_value: number;
  };
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

// Get auth token from sessionStorage
const getAuthToken = (): string | null => {
  try {
    // Try to find any authStore in sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('authStore')) {
        const data = JSON.parse(sessionStorage.getItem(key) || '{}');
        const token = data.state?.token;
        if (token) return token;
      }
    }
  } catch (e) {
    console.warn('Failed to get auth token:', e);
  }
  return null;
};

export const DynamicQuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [data, setData] = useState<QuickActionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchQuickActions();
    const interval = setInterval(fetchQuickActions, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQuickActions = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/quick-actions/pending`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        console.log('📋 Quick actions loaded:', result.data);
      }
    } catch (error) {
      console.error('❌ Error fetching quick actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMilestone = async (milestone: PendingMilestone) => {
    try {
      setApproving(milestone.id);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE}/quick-actions/approve/${milestone.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: 'Completed' }),
      });

      const result = await response.json();

      if (result.success) {
        const milestoneData = result.data;
        const milestoneName = milestoneData.milestone_name || milestoneData.milestone_type;
        const invoiceInfo = milestone.invoice
          ? ` (${milestone.invoice.invoice_number})`
          : '';

        addNotification({
          type: 'success',
          title: '✅ Milestone Approved',
          message: `${milestoneName}${invoiceInfo} marked as completed`,
          duration: 5000,
        });

        console.log(`📊 Approval Response:`, result.data);

        // Refresh quick actions immediately
        await fetchQuickActions();
      } else {
        addNotification({
          type: 'error',
          title: '❌ Approval Failed',
          message: result.message || 'Failed to approve milestone',
          duration: 4000,
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '❌ Error',
        message: error.message || 'Failed to approve milestone',
        duration: 4000,
      });
    } finally {
      setApproving(null);
    }
  };

  const handleApproveInvoice = async (invoice: PendingInvoice) => {
    try {
      setApproving(invoice.id);
      const token = getAuthToken();

      const response = await fetch(`${API_BASE}/quick-actions/invoice/${invoice.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const result = await response.json();

      if (result.success) {
        const invoiceData = result.data;
        addNotification({
          type: 'success',
          title: '✅ Invoice Sent',
          message: `${invoiceData.invoice_number} to ${invoiceData.customer_name}`,
          duration: 5000,
        });

        console.log(`📊 Invoice Approval Response:`, result.data);

        // Refresh quick actions immediately
        await fetchQuickActions();
      } else {
        addNotification({
          type: 'error',
          title: '❌ Failed to Send',
          message: result.message || 'Failed to send invoice',
          duration: 4000,
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '❌ Error',
        message: error.message || 'Failed to send invoice',
        duration: 4000,
      });
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <Card variant="default">
        <p style={{ color: designSystem.colors.text.secondary }}>Loading pending items...</p>
      </Card>
    );
  }

  if (!data || data.total_pending === 0) {
    return (
      <Card variant="default">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircleIcon
            style={{
              width: '1.5rem',
              height: '1.5rem',
              color: designSystem.colors.success.DEFAULT,
            }}
          />
          <p style={{ margin: 0, color: designSystem.colors.success.DEFAULT, fontWeight: 'bold' }}>
            ✅ All items are up to date!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default">
      <div style={{ marginBottom: '1rem' }}>
        <h3
          style={{
            fontSize: designSystem.typography.fontSize.lg,
            fontWeight: designSystem.typography.fontWeight.bold,
            color: designSystem.colors.text.primary,
            margin: '0 0 0.5rem 0',
          }}
        >
          ⚡ Pending Approvals
        </h3>
        <p
          style={{
            fontSize: designSystem.typography.fontSize.sm,
            color: designSystem.colors.text.secondary,
            margin: 0,
          }}
        >
          {data.total_pending} items waiting • Rp{(data.summary?.total_milestone_value || 0) / 1000000}M + Rp{(data.summary?.total_invoice_value || 0) / 1000000}M
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Pending Milestones */}
        {data.pending_milestones.length > 0 && (
          <div>
            <p
              style={{
                fontSize: designSystem.typography.fontSize.sm,
                fontWeight: designSystem.typography.fontWeight.semibold,
                color: designSystem.colors.text.secondary,
                marginBottom: '0.5rem',
                margin: '0 0 0.75rem 0',
              }}
            >
              📋 Milestone Approvals • {data.pending_milestones.length} pending
            </p>
            {data.pending_milestones.map((milestone) => (
              <div
                key={milestone.id}
                style={{
                  padding: '0.75rem',
                  backgroundColor: `${designSystem.colors.warning.DEFAULT}10`,
                  border: `1px solid ${designSystem.colors.warning.DEFAULT}20`,
                  borderRadius: designSystem.borderRadius.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: designSystem.typography.fontSize.sm,
                      fontWeight: designSystem.typography.fontWeight.semibold,
                      color: designSystem.colors.text.primary,
                    }}
                  >
                    {milestone.milestone_name || milestone.milestone_type}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      margin: '0.3rem 0 0 0',
                      flexWrap: 'wrap',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: designSystem.typography.fontSize.xs,
                        color: designSystem.colors.text.secondary,
                      }}
                    >
                      Rp {((milestone.expected_amount as any) / 1000000).toFixed(2)}M • {milestone.percentage * 100}%
                    </p>
                    {milestone.invoice && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: designSystem.typography.fontSize.xs,
                          backgroundColor: `${designSystem.colors.info.DEFAULT}20`,
                          color: designSystem.colors.info.DEFAULT,
                          padding: '0.2rem 0.4rem',
                          borderRadius: designSystem.borderRadius.sm,
                        }}
                      >
                        {milestone.invoice.invoice_number}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="success"
                  size="xs"
                  onClick={() => handleApproveMilestone(milestone)}
                  disabled={approving === milestone.id}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {approving === milestone.id ? '⏳...' : '✅ Approve'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Pending Invoices */}
        {data.pending_invoices_list.length > 0 && (
          <div>
            <p
              style={{
                fontSize: designSystem.typography.fontSize.sm,
                fontWeight: designSystem.typography.fontWeight.semibold,
                color: designSystem.colors.text.secondary,
                margin: data.pending_milestones.length > 0 ? '1rem 0 0.75rem 0' : '0 0 0.75rem 0',
              }}
            >
              📄 Invoices to Send • {data.pending_invoices_list.length} pending
            </p>
            {data.pending_invoices_list.slice(0, 3).map((invoice) => (
              <div
                key={invoice.id}
                style={{
                  padding: '0.75rem',
                  backgroundColor: `${designSystem.colors.info.DEFAULT}10`,
                  border: `1px solid ${designSystem.colors.info.DEFAULT}20`,
                  borderRadius: designSystem.borderRadius.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: designSystem.typography.fontSize.sm,
                      fontWeight: designSystem.typography.fontWeight.semibold,
                      color: designSystem.colors.text.primary,
                    }}
                  >
                    {invoice.invoice_number}
                  </p>
                  <p
                    style={{
                      margin: '0.3rem 0 0 0',
                      fontSize: designSystem.typography.fontSize.xs,
                      color: designSystem.colors.text.secondary,
                    }}
                  >
                    {invoice.customer_name} • Rp {(invoice.total_amount / 1000000).toFixed(2)}M
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => handleApproveInvoice(invoice)}
                  disabled={approving === invoice.id}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {approving === invoice.id ? '⏳...' : '📤 Send'}
                </Button>
              </div>
            ))}
            {data.pending_invoices_list.length > 3 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/invoices')}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                📄 View all {data.pending_invoices_list.length} invoices →
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DynamicQuickActions;
