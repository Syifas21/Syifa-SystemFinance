import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// TDD-016: Invoice Otomatis dari Milestone + Kirim Email + Reminder Otomatis

interface InvoiceMilestone {
  id: string;
  invoice_id: string | null;
  project_id: string | null;
  milestone_type: 'Progress30' | 'Progress70' | 'Handover' | 'Retention' | 'Custom';
  milestone_name?: string;
  percentage: number;
  expected_amount: number;
  expected_date: string | null;
  actual_date: string | null;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Billed' | 'Cancelled';
  notes?: string;
  triggered_at: string | null;
  invoice_number?: string;
  created_at: string;
  updated_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
}

const InvoiceMilestonesTab: React.FC = () => {
  const [milestones, setMilestones] = useState<InvoiceMilestone[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Form state
  const [invoiceId, setInvoiceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneType, setMilestoneType] = useState<'Progress30' | 'Progress70' | 'Handover' | 'Retention' | 'Custom' | ''>('');
  const [percentage, setPercentage] = useState(30);
  const [expectedAmount, setExpectedAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

  useEffect(() => {
    fetchMilestones();
    fetchInvoices();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await fetch(`${API_BASE}/invoice-milestones`);
      if (!response.ok) {
        console.warn('⚠️ Invoice milestones API not ready yet');
        setMilestones([]);
        return;
      }
      const result = await response.json();
      setMilestones(result.data || []);
    } catch (error) {
      console.error('❌ Error fetching invoice milestones:', error);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/invoices`);
      if (!response.ok) return;
      const result = await response.json();
      setInvoices(result.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    
    if (!invoiceId.trim()) {
      errors.invoiceId = 'No. Invoice wajib dipilih';
    }

    if (!milestoneType || milestoneType.trim() === '') {
      errors.milestoneType = 'Milestone Type wajib dipilih';
    }

    if (percentage === undefined || percentage === null || isNaN(percentage)) {
      errors.percentage = 'Percentage wajib diisi';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors({});

    const payload = {
      invoice_id: invoiceId,
      project_id: projectId || null,
      milestone_type: milestoneType,
      milestone_name: milestoneName || milestoneType,
      percentage: percentage,
      expected_amount: expectedAmount !== '' ? Number(expectedAmount) : 0,
      expected_date: expectedDate || null,
      notes: notes || null,
    };

    console.log('📤 Sending payload:', payload);

    try {
      const url = editingId 
        ? `${API_BASE}/invoice-milestones/${editingId}`
        : `${API_BASE}/invoice-milestones`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('📥 Response:', result);

      if (response.ok && result.success) {
        alert('✅ ' + (result.message || 'Milestone saved successfully'));
        await fetchMilestones();
        resetForm();
      } else {
        const errorMsg = result.message || result.error || 'Failed to save milestone';
        console.error('❌ Server error:', result);
        alert(`❌ Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice milestone?')) return;

    try {
      const response = await fetch(`${API_BASE}/invoice-milestones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMilestones();
      } else {
        alert('Failed to delete milestone');
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  const handleEdit = (milestone: InvoiceMilestone) => {
    setEditingId(milestone.id);
    setInvoiceId(milestone.invoice_id || '');
    setProjectId(milestone.project_id || '');
    setMilestoneName(milestone.milestone_name || '');
    setMilestoneType(milestone.milestone_type);
    setPercentage(milestone.percentage);
    setExpectedAmount(milestone.expected_amount ? String(milestone.expected_amount) : '');
    setExpectedDate(milestone.expected_date || '');
    setNotes(milestone.notes || '');
    setShowForm(true);
  };

  const handleTrigger = async (id: string) => {
    if (!confirm('Trigger invoice generation for this milestone?')) return;

    try {
      const response = await fetch(`${API_BASE}/invoice-milestones/${id}/trigger`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchMilestones();
        alert('✅ Invoice triggered successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to trigger invoice'}`);
      }
    } catch (error) {
      console.error('Error triggering invoice:', error);
      alert('Network error. Please try again.');
    }
  };

  const resetForm = () => {
    setInvoiceId('');
    setProjectId('');
    setMilestoneName('');
    setMilestoneType('');
    setPercentage(30);
    setExpectedAmount('');
    setExpectedDate('');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
    setValidationErrors({});
  };

  const isMilestoneFormInvalid = !invoiceId.trim() || !milestoneType || milestoneType.trim() === '' || percentage === undefined || percentage === null || isNaN(percentage);

  const getMilestoneTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      Progress30: { color: 'bg-blue-100 text-blue-800', text: '30% Progress' },
      Progress70: { color: 'bg-purple-100 text-purple-800', text: '70% Progress' },
      Handover: { color: 'bg-green-100 text-green-800', text: 'Handover/PAC' },
      Retention: { color: 'bg-orange-100 text-orange-800', text: 'Retention' },
      Custom: { color: 'bg-gray-100 text-gray-800', text: 'Custom' },
    };
    return badges[type] || { color: 'bg-gray-100 text-gray-800', text: type };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'InProgress':
        return <DocumentCheckIcon className="w-5 h-5 text-blue-500" />;
      case 'Completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'Billed':
        return <CheckCircleIcon className="w-5 h-5 text-purple-500" />;
      case 'Cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredMilestones = milestones.filter(m => {
    const matchSearch = !searchTerm || 
      (m.project_id && m.project_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.milestone_name && m.milestone_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.invoice_number && m.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.invoice_id && m.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchType = filterType === 'all' || m.milestone_type === filterType;
    
    return matchSearch && matchStatus && matchType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📄 Invoice Milestones
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            TDD-016: Auto-generate invoices from project milestones (30%, 70%, Handover)
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
              Event-Driven
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
              Auto Email
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-semibold">
              Reminder Bot
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-light transition-colors font-semibold shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Add Milestone
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search project or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Billed">Billed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
          >
            <option value="all">All Milestones</option>
            <option value="Progress30">30% Progress</option>
            <option value="Progress70">70% Progress</option>
            <option value="Handover">Handover/PAC</option>
            <option value="Retention">Retention</option>
            <option value="Custom">Custom</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center justify-center">
            Showing {filteredMilestones.length} of {milestones.length} milestones
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Milestone' : 'Add New Milestone'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No. Invoice <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoiceId}
                  onChange={(e) => {
                    setInvoiceId(e.target.value);
                    if (e.target.value) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.invoiceId;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent ${
                    validationErrors.invoiceId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Pilih Invoice --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer_name} (Rp {inv.total_amount.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
                {validationErrors.invoiceId && (
                  <p className="text-sm text-red-600 font-semibold mt-1">❌ {validationErrors.invoiceId}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {invoices.length === 0 ? '⚠️ Tidak ada invoice. Buat invoice terlebih dahulu.' : 'Pilih invoice untuk attach milestone'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project ID (Optional)
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="PRJ-2025-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Milestone Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={milestoneType}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    setMilestoneType(type);
                    // Auto-set percentage
                    if (type === 'Progress30') setPercentage(30);
                    else if (type === 'Progress70') setPercentage(70);
                    else if (type === 'Handover') setPercentage(100);
                    else if (type === 'Retention') setPercentage(5);
                    else setPercentage(0);
                    
                    // Clear error when user selects
                    if (type && type.trim() !== '') {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.milestoneType;
                        return newErrors;
                      });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent ${
                    validationErrors.milestoneType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Pilih Milestone Type --</option>
                  <option value="Progress30">30% Progress</option>
                  <option value="Progress70">70% Progress</option>
                  <option value="Handover">Handover/PAC</option>
                  <option value="Retention">Retention</option>
                  <option value="Custom">Custom</option>
                </select>
                {validationErrors.milestoneType && (
                  <p className="text-sm text-red-600 font-semibold mt-1">❌ {validationErrors.milestoneType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Milestone Name
                </label>
                <input
                  type="text"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  placeholder="e.g., Phase 1 Completion"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Percentage (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  required
                  min="0"
                  max="100"
                  step="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent ${validationErrors.percentage ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {validationErrors.percentage && (
                  <p className="text-sm text-red-600 font-semibold mt-1">❌ {validationErrors.percentage}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Amount (Rp)
                </label>
                <input
                  type="number"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  min="0"
                  step="1000"
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Date
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isMilestoneFormInvalid}
                className={`px-6 py-2 rounded-lg transition-colors font-semibold ${isMilestoneFormInvalid ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary-dark text-white hover:bg-primary-light'}`}
              >
                {editingId ? 'Update' : 'Save'} Milestone
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Milestone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">%</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Triggered At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMilestones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {milestones.length === 0 
                      ? '📭 No invoice milestones yet. Add milestones to track project invoicing.'
                      : '🔍 No milestones match your filters.'}
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((milestone) => {
                  const typeBadge = getMilestoneTypeBadge(milestone.milestone_type);
                  return (
                    <tr key={milestone.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(milestone.status)}
                          <span className="text-sm font-medium text-gray-700">{milestone.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-gray-900">{milestone.project_id}</div>
                        {milestone.project_name && (
                          <div className="text-xs text-gray-500">{milestone.project_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeBadge.color}`}>
                          {typeBadge.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-gray-900">
                          {milestone.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {milestone.invoice_number ? (
                          <span className="text-sm font-semibold text-blue-600">{milestone.invoice_number}</span>
                        ) : milestone.invoice_id ? (
                          <span className="text-xs text-gray-500">{milestone.invoice_id}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {milestone.triggered_at ? (
                          <span className="text-xs text-gray-600">
                            {new Date(milestone.triggered_at).toLocaleString('id-ID')}
                          </span>
                        ) : milestone.expected_date ? (
                          <span className="text-xs text-gray-500">Target: {new Date(milestone.expected_date).toLocaleDateString('id-ID')}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {milestone.status === 'Pending' && (
                            <button
                              onClick={() => handleTrigger(milestone.id)}
                              className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                              title="Trigger invoice generation"
                            >
                              Trigger
                            </button>
                          )}
                          {milestone.status !== 'Billed' && (
                            <>
                              <button
                                onClick={() => handleEdit(milestone)}
                                className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(milestone.id)}
                                className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">💡 How it works:</h4>
        <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Progress 30%:</strong> Invoice auto-generated when project physical progress reaches 30%</li>
          <li><strong>Progress 70%:</strong> Second termin invoice triggered at 70% completion (40% of contract value)</li>
          <li><strong>Handover/PAC:</strong> Final payment invoice when project status = Handover (30% remaining)</li>
          <li><strong>Email:</strong> PDF + e-Faktur XML auto-sent to customer + CC finance team</li>
          <li><strong>Reminders:</strong> Automatic email sent H-7, due date, +7, +14, +30 days overdue</li>
        </ul>
      </div>
    </div>
  );
};

export default InvoiceMilestonesTab;
