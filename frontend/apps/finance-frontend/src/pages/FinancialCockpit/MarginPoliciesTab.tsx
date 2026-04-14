import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface MarginPolicy {
  id: string;
  sbu: string;
  category: string;
  system: string | null;
  sub_system: string | null;
  component: string | null;
  min_gross_margin: number;
  max_gross_margin: number;
  default_markup?: number | null;
  is_active?: boolean;
  notes?: string | null;
  valid_from: string;
  valid_to: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const MarginPoliciesTab: React.FC = () => {
  const [policies, setPolicies] = useState<MarginPolicy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<MarginPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<MarginPolicy | null>(null);

  // Filter states
  const [filterSbu, setFilterSbu] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSystem, setFilterSystem] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    sbu: '',
    category: '',
    system: '',
    sub_system: '',
    component: '',
    min_gross_margin: '',
    max_gross_margin: '',
    is_active: true,
    notes: '',
    valid_from: '2025-01-01',
    valid_to: '2026-12-31',
  });

  // Hierarchical options
  const [sbuOptions, setSbuOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [systemOptions, setSystemOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = policies;

    if (filterSbu) {
      filtered = filtered.filter((p) => p.sbu === filterSbu);
    }
    if (filterCategory) {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }
    if (filterSystem) {
      filtered = filtered.filter((p) => p.system === filterSystem);
    }

    setFilteredPolicies(filtered);
  }, [filterSbu, filterCategory, filterSystem, policies]);

  useEffect(() => {
    // Extract unique values for filters
    const uniqueSbu = [...new Set(policies.map((p) => p.sbu))].sort();
    setSbuOptions(uniqueSbu);

    const uniqueCategory = [...new Set(policies.map((p) => p.category))].sort();
    setCategoryOptions(uniqueCategory);

    const uniqueSystem = [...new Set(policies.map((p) => p.system).filter((s) => s))].sort() as string[];
    setSystemOptions(uniqueSystem);
  }, [policies]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/margin-policies`);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        console.warn('⚠️ Backend not ready. Please ensure:');
        console.warn('   1. Finance service is running on port 3001');
        console.warn('   2. Database migration has been executed');
        console.warn('   3. Run: cd services/finance-service && npm run dev');
        
        // Use empty array if backend not ready
        setPolicies([]);
        return;
      }

      const result = await response.json();
      if (result.success) {
        console.log('✅ Loaded', result.count || result.data.length, 'margin policies');
        setPolicies(result.data);
      } else {
        console.error('❌ API returned error:', result.message);
        setPolicies([]);
      }
    } catch (error) {
      console.error('❌ Network error fetching margin policies:', error);
      console.warn('⚠️ Backend unreachable. Check if finance-service is running.');
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate margins
    const minMargin = parseFloat(formData.min_gross_margin);
    const maxMargin = parseFloat(formData.max_gross_margin);

    if (minMargin < 0 || minMargin > 100 || maxMargin < 0 || maxMargin > 100) {
      alert('❌ Margin must be between 0% and 100%');
      return;
    }

    if (maxMargin < minMargin) {
      alert('❌ Maximum margin must be >= minimum margin');
      return;
    }

    try {
      const url = editingPolicy
        ? `${API_BASE}/margin-policies/${editingPolicy.id}`
        : `${API_BASE}/margin-policies`;

      const method = editingPolicy ? 'PUT' : 'POST';

      const payload: any = {
        sbu: formData.sbu,
        category: formData.category,
        min_gross_margin: minMargin / 100, // Convert 31% to 0.31
        max_gross_margin: maxMargin / 100, // Convert 45% to 0.45
        is_active: formData.is_active,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
      };

      if (formData.system) payload.system = formData.system;
      if (formData.sub_system) payload.sub_system = formData.sub_system;
      if (formData.component) payload.component = formData.component;
      if (formData.notes) payload.notes = formData.notes;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message || response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert(
          editingPolicy
            ? '✅ Margin policy updated successfully!'
            : '✅ Margin policy added successfully!'
        );
        fetchPolicies();
        closeModal();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving margin policy:', error);
      alert('❌ Failed to save margin policy');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this margin policy?')) return;

    try {
      const response = await fetch(`${API_BASE}/margin-policies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert(`❌ Error: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Margin policy deleted successfully!');
        fetchPolicies();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting margin policy:', error);
      alert('❌ Failed to delete margin policy');
    }
  };

  const openModal = (policy?: MarginPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        sbu: policy.sbu,
        category: policy.category,
        system: policy.system || '',
        sub_system: policy.sub_system || '',
        component: policy.component || '',
        min_gross_margin: policy.min_gross_margin.toString(),
        max_gross_margin: policy.max_gross_margin.toString(),
        is_active: policy.is_active !== false,
        notes: policy.notes || '',
        valid_from: policy.valid_from.split('T')[0],
        valid_to: policy.valid_to.split('T')[0],
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        sbu: '',
        category: '',
        system: '',
        sub_system: '',
        component: '',
        min_gross_margin: '',
        max_gross_margin: '',
        is_active: true,
        notes: '',
        valid_from: '2025-01-01',
        valid_to: '2026-12-31',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPolicy(null);
  };

  const clearFilters = () => {
    setFilterSbu('');
    setFilterCategory('');
    setFilterSystem('');
  };

  const calculateDefaultMarkup = (minMargin: number): number => {
    if (minMargin >= 100 || minMargin <= 0) return 0;
    return (minMargin / (100 - minMargin)) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Margin Policies</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage minimum and maximum margins based on hierarchy: SBU → Category → System → Sub-System
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Policy
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-700">Hierarchy Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SBU</label>
            <select
              value={filterSbu}
              onChange={(e) => setFilterSbu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All SBUs</option>
              {sbuOptions.map((sbu) => (
                <option key={sbu} value={sbu}>
                  {sbu}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System</label>
            <select
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Systems</option>
              {systemOptions.map((sys) => (
                <option key={sys} value={sys}>
                  {sys}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredPolicies.length} of {policies.length} policies
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SBU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  System
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sub-System
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Min Margin (%)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Max Margin (%)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Default Markup (%)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Valid Period
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPolicies.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">
                      {policies.length === 0
                        ? 'No margin policies yet'
                        : 'No policies match the current filters'}
                    </p>
                    <p className="text-sm">
                      {policies.length === 0
                        ? 'Click "Add Policy" to create one'
                        : 'Try changing your filter criteria'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {policy.is_active !== false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {policy.sbu}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{policy.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {policy.system || <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {policy.sub_system || <span className="text-gray-400 italic">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-sm font-semibold bg-green-100 text-green-800">
                        {(policy.min_gross_margin * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-800">
                        {(policy.max_gross_margin * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {policy.default_markup ? (policy.default_markup * 100).toFixed(2) : calculateDefaultMarkup(policy.min_gross_margin * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      <div>{new Date(policy.valid_from).toLocaleDateString('id-ID')}</div>
                      <div className="text-gray-400">s/d</div>
                      <div>{new Date(policy.valid_to).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(policy)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPolicy ? 'Edit Margin Policy' : 'Add Margin Policy'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SBU <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sbu}
                    onChange={(e) => setFormData({ ...formData, sbu: e.target.value })}
                    required
                    disabled={!!editingPolicy}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select SBU</option>
                    <option value="INF">INF - Infrastructure</option>
                    <option value="MEP">MEP - Mechanical, Electrical, Plumbing</option>
                    <option value="CSW">CSW - Civil Structure Work</option>
                    <option value="IOT">IOT - Internet of Things</option>
                    <option value="EC">EC - Energy & Control</option>
                    <option value="ALL">ALL - General Fallback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    disabled={!!editingPolicy}
                    placeholder="e.g., Electrical, HVAC, ICT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.system}
                    onChange={(e) => setFormData({ ...formData, system: e.target.value })}
                    disabled={!!editingPolicy}
                    placeholder="e.g., Panel, Lighting"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub-System <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sub_system}
                    onChange={(e) => setFormData({ ...formData, sub_system: e.target.value })}
                    disabled={!!editingPolicy}
                    placeholder="e.g., LVMDP, SDP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.component}
                    onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                    disabled={!!editingPolicy}
                    placeholder="e.g., Main Panel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Gross Margin (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.min_gross_margin}
                    onChange={(e) =>
                      setFormData({ ...formData, min_gross_margin: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Gross Margin (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.max_gross_margin}
                    onChange={(e) =>
                      setFormData({ ...formData, max_gross_margin: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.min_gross_margin && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Default Markup:</strong>{' '}
                    {calculateDefaultMarkup(parseFloat(formData.min_gross_margin)).toFixed(2)}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Formula: Markup = (Margin / (100 - Margin)) × 100
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid To <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active Policy</span>
                </label>
                <span className="text-xs text-gray-500">
                  (Only active policies are used in margin calculations)
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes about this policy (e.g., exceptions, special conditions, approved by CEO)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPolicy ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarginPoliciesTab;
