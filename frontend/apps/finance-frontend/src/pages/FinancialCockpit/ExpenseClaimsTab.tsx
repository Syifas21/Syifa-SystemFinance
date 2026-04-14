/**
 * TDD-013: Expense Claims Tab - Employee Submission
 * Multi-item expense submission with validation, receipt upload, project assignment
 */

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

// Types
interface ExpenseItem {
  id: string;
  category_id: string;
  category_name: string;
  expense_date: string;
  merchant: string;
  description: string;
  amount: number;
  receipt_url?: string;
  receipt_filename?: string;
  has_receipt: boolean;
  is_within_90_days: boolean;
  validation_warnings: string[];
}

interface ExpenseClaim {
  id?: string;
  claim_number?: string;
  employee_id: string;
  employee_name: string;
  department?: string;
  project_id?: string;
  project_name?: string;
  cost_center?: string;
  total_amount: number;
  description: string;
  items: ExpenseItem[];
  status?: string;
  submit_date?: string;
}

interface ExpenseCategory {
  id: string;
  category_code: string;
  category_name: string;
  max_amount_limit: number | null;
  requires_receipt: boolean;
  is_active: boolean;
}

const ExpenseClaimsTab: React.FC = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ExpenseClaim>({
    employee_id: 'EMP-001', // TODO: Get from auth context
    employee_name: 'John Doe', // TODO: Get from auth context
    department: 'Engineering',
    project_id: '',
    project_name: '',
    cost_center: '',
    total_amount: 0,
    description: '',
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<Partial<ExpenseItem>>({
    id: '',
    category_id: '',
    category_name: '',
    expense_date: new Date().toISOString().split('T')[0],
    merchant: '',
    description: '',
    amount: 0,
    has_receipt: false,
    is_within_90_days: true,
    validation_warnings: [],
  });

  useEffect(() => {
    fetchCategories();
    fetchMyClaims();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/expense-categories?is_active=true');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMyClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expense-claims/my-claims?employee_id=EMP-001`); // TODO: Use auth
      const data = await response.json();
      if (data.success) {
        setClaims(data.data);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const validate90DayRule = (expenseDate: string): boolean => {
    const today = new Date();
    const expense = new Date(expenseDate);
    const diffTime = Math.abs(today.getTime() - expense.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
  };

  const validateAmount = (categoryId: string, amount: number): string | null => {
    const category = categories.find((c) => c.id === categoryId);
    if (category && category.max_amount_limit && amount > category.max_amount_limit) {
      return `Amount exceeds category limit of Rp ${category.max_amount_limit.toLocaleString('id-ID')}`;
    }
    return null;
  };

  const handleAddItem = () => {
    if (!currentItem.category_id || !currentItem.expense_date || !currentItem.description || !currentItem.amount) {
      alert('❌ Please fill all required fields');
      return;
    }

    const category = categories.find((c) => c.id === currentItem.category_id);
    if (!category) {
      alert('❌ Invalid category');
      return;
    }

    const warnings: string[] = [];

    // Validate 90-day rule
    const within90Days = validate90DayRule(currentItem.expense_date);
    if (!within90Days) {
      warnings.push('Expense date is more than 90 days old - may be rejected');
    }

    // Validate amount limit
    const amountError = validateAmount(currentItem.category_id, currentItem.amount || 0);
    if (amountError) {
      warnings.push(amountError);
    }

    // Validate receipt requirement
    if (category.requires_receipt && !currentItem.has_receipt) {
      warnings.push('Receipt is required for this category');
    }

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      category_id: currentItem.category_id!,
      category_name: category.category_name,
      expense_date: currentItem.expense_date!,
      merchant: currentItem.merchant || '',
      description: currentItem.description!,
      amount: Number(currentItem.amount) || 0,
      receipt_url: currentItem.receipt_url,
      receipt_filename: currentItem.receipt_filename,
      has_receipt: !!currentItem.receipt_url,
      is_within_90_days: within90Days,
      validation_warnings: warnings,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
      total_amount: formData.total_amount + newItem.amount,
    });

    // Reset current item
    setCurrentItem({
      id: '',
      category_id: '',
      category_name: '',
      expense_date: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      amount: 0,
      has_receipt: false,
      is_within_90_days: true,
      validation_warnings: [],
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const item = formData.items.find((i) => i.id === itemId);
    if (!item) return;

    setFormData({
      ...formData,
      items: formData.items.filter((i) => i.id !== itemId),
      total_amount: formData.total_amount - item.amount,
    });
  };

  const handleSubmitClaim = async () => {
    if (formData.items.length === 0) {
      alert('❌ Please add at least one expense item');
      return;
    }

    // Check for missing receipts
    const missingReceipts = formData.items.filter(
      (item) => {
        const category = categories.find((c) => c.id === item.category_id);
        return category?.requires_receipt && !item.has_receipt;
      }
    );

    if (missingReceipts.length > 0) {
      const proceed = confirm(
        `⚠️ ${missingReceipts.length} item(s) missing required receipts. Submit anyway?`
      );
      if (!proceed) return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/expense-claims/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Expense claim submitted successfully! Claim#: ${data.data.claim_number}`);
        setShowSubmitForm(false);
        fetchMyClaims();
        // Reset form
        setFormData({
          employee_id: 'EMP-001',
          employee_name: 'John Doe',
          department: 'Engineering',
          project_id: '',
          project_name: '',
          cost_center: '',
          total_amount: 0,
          description: '',
          items: [],
        });
      } else {
        alert(`❌ Failed to submit claim: ${data.message}`);
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('❌ Error submitting claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('❌ File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('❌ Only JPG, PNG, and PDF files are allowed');
      return;
    }

    // TODO: Upload to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // For now, use local file URL
    const fileUrl = URL.createObjectURL(file);

    setCurrentItem({
      ...currentItem,
      receipt_url: fileUrl,
      receipt_filename: file.name,
      has_receipt: true,
    });

    alert('✅ Receipt uploaded successfully');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      LEVEL1_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending L1' },
      LEVEL2_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending L2' },
      LEVEL3_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending L3' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      IN_PAYSLIP: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Payslip' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getApprovalLevelText = (totalAmount: number) => {
    if (totalAmount <= 5000000) {
      return 'Level 1 (PM/Dept Head) - Fast approval';
    } else if (totalAmount <= 25000000) {
      return 'Level 2 (PM + Finance Manager)';
    } else {
      return 'Level 3 (PM + Finance + CEO) - May take longer';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Expense Claims</h2>
          <p className="text-sm text-gray-600 mt-1">Submit and track your reimbursement requests</p>
        </div>
        <button
          onClick={() => setShowSubmitForm(!showSubmitForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          {showSubmitForm ? (
            <>
              <XMarkIcon className="h-5 w-5" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              <span>New Claim</span>
            </>
          )}
        </button>
      </div>

      {/* Submit Form */}
      {showSubmitForm && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Submit New Expense Claim</h3>

          {/* Project Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project (Optional)
              </label>
              <input
                type="text"
                placeholder="Select project..."
                value={formData.project_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                placeholder="Purpose of expenses..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Add Expense Items</h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={currentItem.category_id}
                  onChange={(e) => {
                    const category = categories.find((c) => c.id === e.target.value);
                    setCurrentItem({
                      ...currentItem,
                      category_id: e.target.value,
                      category_name: category?.category_name || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                      {cat.max_amount_limit
                        ? ` (max ${formatCurrency(cat.max_amount_limit)})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Date *
                </label>
                <input
                  type="date"
                  value={currentItem.expense_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, expense_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant/Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g., Grab, Tokopedia, Hotel XYZ"
                  value={currentItem.merchant}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, merchant: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Rp) *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={currentItem.amount || ''}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  placeholder="Describe the expense..."
                  value={currentItem.description}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Upload
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 cursor-pointer transition-colors">
                    <DocumentArrowUpIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">Choose file...</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {currentItem.receipt_filename && (
                    <span className="flex items-center space-x-2 text-sm text-green-600">
                      <PaperClipIcon className="h-4 w-4" />
                      <span>{currentItem.receipt_filename}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddItem}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Items ({formData.items.length})
              </h4>

              <div className="space-y-3">
                {formData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900">{item.category_name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{item.expense_date}</span>
                        {item.has_receipt && (
                          <span className="flex items-center text-green-600 text-sm">
                            <PaperClipIcon className="h-4 w-4 mr-1" />
                            Receipt attached
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                      {item.merchant && (
                        <p className="text-xs text-gray-500">Merchant: {item.merchant}</p>
                      )}
                      {item.validation_warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.validation_warnings.map((warning, idx) => (
                            <p key={idx} className="flex items-center text-xs text-orange-600">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Approval Level Info */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(formData.total_amount)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  <span>{getApprovalLevelText(formData.total_amount)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClaim}
                  disabled={submitting}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Submit Claim</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claims List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claim #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No expense claims yet. Click "New Claim" to submit your first expense.
                </td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {claim.claim_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {claim.submit_date
                      ? new Date(claim.submit_date).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {claim.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {claim.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(claim.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(claim.status || 'DRAFT')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseClaimsTab;
