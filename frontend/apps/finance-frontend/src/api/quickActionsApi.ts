/**
 * Quick Actions API Client
 * For fetching and managing pending approvals
 */

const API_BASE_URL = 'http://localhost:3002/api';

interface QuickAction {
  id: string;
  milestoneId?: string;
  invoiceId?: string;
  type: 'milestone' | 'invoice';
  title: string;
  subtitle: string;
  amount: number;
  currency?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueTime: string;
  invoice?: {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
  };
}

/**
 * Get authorization token AND user role from Zustand store
 */
const getAuthInfo = (): { token: string | null; role: string | null } => {
  let token: string | null = null;
  let role: string | null = null;

  // Try to get from sessionStorage (where Zustand persists)
  const tabId = sessionStorage.getItem('tabId');
  if (tabId) {
    const stored = sessionStorage.getItem(`authStore_${tabId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        token = parsed.state?.token || null;
        role = parsed.state?.user?.role || null;
      } catch (e) {
        console.warn('Failed to parse auth store:', e);
      }
    }
  }
  
  // Fallback: check for any auth store item
  if (!token || !role) {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('authStore')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) || '{}');
          token = token || data.state?.token || null;
          role = role || data.state?.user?.role || null;
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  return { token, role };
};

/**
 * Fetch pending quick actions from backend
 * Combines pending milestones and pending invoices
 */
export const fetchPendingQuickActions = async (): Promise<QuickAction[]> => {
  try {
    const { token, role } = getAuthInfo();
    console.log(`🔑 Token available:`, !!token);
    console.log(`👤 User role:`, role);
    
    // For dev mode: pass role as query parameter
    const urlWithRole = `${API_BASE_URL}/quick-actions/pending${role ? `?role=${role}` : ''}`;
    
    const response = await fetch(urlWithRole, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch quick actions: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch quick actions');
    }

    console.log(' API Response:', {
      pending_milestones_count: result.data.pending_milestones?.length || 0,
      pending_invoices_count: result.data.pending_invoices_list?.length || 0,
      total_pending: result.data.total_pending,
      raw_milestones: result.data.pending_milestones,
      raw_invoices: result.data.pending_invoices_list,
    });

    // Format data into flat QuickAction array
    const quickActions: QuickAction[] = [];

    // Add pending milestones
    if (result.data.pending_milestones && Array.isArray(result.data.pending_milestones)) {
      console.log(`📝 Processing ${result.data.pending_milestones.length} milestones...`);
      result.data.pending_milestones.forEach((m: any, idx: number) => {
        console.log(`   [${idx}] Milestone: ${m.milestone_name || m.milestone_type}, invoice: ${m.invoice?.customer_name || 'NO INVOICE'}`);
        quickActions.push({
          id: m.id,
          milestoneId: m.id,
          type: 'milestone',
          title: `Approve Milestone - ${m.milestone_name || m.milestone_type}`,
          subtitle: m.invoice?.customer_name || 'N/A',
          amount: parseFloat(m.expected_amount) || 0,
          currency: 'IDR',
          status: m.status,
          priority: m.percentage > 70 ? 'urgent' : m.percentage > 50 ? 'high' : 'medium',
          dueTime: m.expected_date ? new Date(m.expected_date).toLocaleDateString('id-ID') : 'ASAP',
          invoice: m.invoice,
        });
      });
    }

    // Add pending invoices (DRAFT status)
    if (result.data.pending_invoices_list && Array.isArray(result.data.pending_invoices_list)) {
      console.log(`📄 Processing ${result.data.pending_invoices_list.length} invoices...`);
      result.data.pending_invoices_list.forEach((inv: any, idx: number) => {
        console.log(`   [${idx}] Invoice: ${inv.invoice_number}, customer: ${inv.customer_name}, amount: ${inv.total_amount}`);
        quickActions.push({
          id: inv.id,
          invoiceId: inv.id,
          type: 'invoice',
          title: `Send Invoice ${inv.invoice_number}`,
          subtitle: inv.customer_name,
          amount: parseFloat(inv.total_amount) || 0,
          currency: 'IDR',
          status: inv.status,
          priority: parseFloat(inv.total_amount) > 100000000 ? 'urgent' : 'high',
          dueTime: inv.due_date ? new Date(inv.due_date).toLocaleDateString('id-ID') : 'ASAP',
          invoice: {
            id: inv.id,
            invoice_number: inv.invoice_number,
            customer_name: inv.customer_name,
            total_amount: parseFloat(inv.total_amount),
          },
        });
      });
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    quickActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log(`✅ Formatted ${quickActions.length} total quick actions:`, quickActions.map(qa => ({ id: qa.id, title: qa.title, type: qa.type })));;
    return quickActions;
  } catch (error) {
    console.error('❌ Error fetching quick actions:', error);
    throw error;
  }
};

/**
 * Approve a pending milestone
 */
export const approveMilestone = async (
  milestoneId: string,
  status: string = 'Completed'
): Promise<any> => {
  try {
    const { token } = getAuthInfo();
    console.log(`🔑 Approving milestone ${milestoneId}, token available:`, !!token);
    
    const response = await fetch(`${API_BASE_URL}/quick-actions/approve/${milestoneId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    
    console.log(`📡 Approval response status:`, response.status);

    if (!response.ok) {
      throw new Error(`Failed to approve milestone: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to approve milestone');
    }

    console.log(`✅ Milestone approved:`, result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error approving milestone:', error);
    throw error;
  }
};

/**
 * Approve/Send an invoice (change status from DRAFT to SENT)
 */
export const approveInvoice = async (invoiceId: string): Promise<any> => {
  try {
    const { token } = getAuthInfo();
    console.log(`🔑 Approving invoice ${invoiceId}, token available:`, !!token);
    
    const response = await fetch(`${API_BASE_URL}/quick-actions/invoice/${invoiceId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log(`📡 Invoice approval response status:`, response.status);

    if (!response.ok) {
      throw new Error(`Failed to approve invoice: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to approve invoice');
    }

    console.log(`✅ Invoice approved:`, result.data);
    return result.data;
  } catch (error) {
    console.error('❌ Error approving invoice:', error);
    throw error;
  }
};
