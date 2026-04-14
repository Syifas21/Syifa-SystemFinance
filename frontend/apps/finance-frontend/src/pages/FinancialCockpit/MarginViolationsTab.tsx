import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  FunnelIcon,
  CheckBadgeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface MarginViolation {
  id: string;
  policy_id: string | null;
  estimation_id: string | null;
  boq_item_id: string | null;
  violated_at: string;
  sbu: string;
  category: string;
  system: string | null;
  sub_system: string | null;
  component: string | null;
  cost_price: number;
  selling_price: number;
  applied_margin: number;
  policy_min_margin: number;
  policy_max_margin: number;
  deviation_from_min: number;
  deviation_from_max: number;
  exception_type: string | null;
  exception_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  policy?: {
    id: string;
    sbu: string;
    category: string;
  };
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const MarginViolationsTab: React.FC = () => {
  const [violations, setViolations] = useState<MarginViolation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<MarginViolation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSbu, setFilterSbu] = useState('');
  const [filterApproved, setFilterApproved] = useState('all'); // 'all', 'approved', 'pending'
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchViolations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterSbu, filterApproved, filterDateFrom, filterDateTo, violations]);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/margin-policies/violations?limit=100`);

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setViolations([]);
        return;
      }

      const result = await response.json();
      if (result.success) {
        setViolations(result.data);
      } else {
        setViolations([]);
      }
    } catch (error) {
      console.error('Error fetching violations:', error);
      setViolations([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...violations];

    if (filterSbu) {
      filtered = filtered.filter((v) => v.sbu === filterSbu);
    }

    if (filterApproved === 'approved') {
      filtered = filtered.filter((v) => v.approved_by !== null);
    } else if (filterApproved === 'pending') {
      filtered = filtered.filter((v) => v.approved_by === null);
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter((v) => new Date(v.violated_at) >= fromDate);
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v) => new Date(v.violated_at) <= toDate);
    }

    setFilteredViolations(filtered);
  };

  const clearFilters = () => {
    setFilterSbu('');
    setFilterApproved('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (deviation: number): string => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation < 2) return 'bg-yellow-100 text-yellow-800';
    if (absDeviation < 5) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getExceptionBadge = (exceptionType: string | null) => {
    if (!exceptionType) return null;

    const badges: Record<string, { color: string; label: string }> = {
      TENDER: { color: 'bg-blue-100 text-blue-800', label: 'Tender' },
      STRATEGIC_CUSTOMER: { color: 'bg-purple-100 text-purple-800', label: 'Strategic' },
      BULK_ORDER: { color: 'bg-green-100 text-green-800', label: 'Bulk Order' },
      MANUAL_OVERRIDE: { color: 'bg-gray-100 text-gray-800', label: 'Manual Override' },
    };

    const badge = badges[exceptionType] || { color: 'bg-gray-100 text-gray-800', label: exceptionType };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const uniqueSbus = [...new Set(violations.map((v) => v.sbu))].sort();

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
      <div>
        <h3 className="text-xl font-bold text-gray-900">Audit Trail - Margin Violations</h3>
        <p className="text-sm text-gray-600 mt-1">
          Riwayat penyimpangan dari kebijakan margin dan pengecualian yang diterapkan
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Total Violations</p>
              <p className="text-2xl font-bold text-gray-900">{violations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <CheckBadgeIcon className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {violations.filter((v) => v.approved_by).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {violations.filter((v) => !v.approved_by).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Critical ({'>'}5%)</p>
              <p className="text-2xl font-bold text-red-600">
                {violations.filter((v) => Math.abs(v.deviation_from_min) > 5).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-700">Filter</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SBU</label>
            <select
              value={filterSbu}
              onChange={(e) => setFilterSbu(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua SBU</option>
              {uniqueSbus.map((sbu) => (
                <option key={sbu} value={sbu}>
                  {sbu}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Menampilkan {filteredViolations.length} dari {violations.length} pelanggaran
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Waktu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hierarki
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Cost Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Selling Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Applied Margin
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Policy Range
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Deviation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Exception
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Approval
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">
                      {violations.length === 0
                        ? 'Belum ada violation tercatat'
                        : 'Tidak ada violation yang sesuai filter'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                      {formatDateTime(violation.violated_at)}
                      <div className="text-gray-400">by {violation.created_by}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {violation.sbu}
                        </span>
                        <div className="text-xs text-gray-600 mt-1">{violation.category}</div>
                        {violation.system && (
                          <div className="text-xs text-gray-500">{violation.system}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(violation.cost_price)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(violation.selling_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-800">
                        {violation.applied_margin.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      <div>{violation.policy_min_margin.toFixed(1)}%</div>
                      <div className="text-gray-400">to</div>
                      <div>{violation.policy_max_margin.toFixed(1)}%</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(
                          violation.deviation_from_min
                        )}`}
                      >
                        {violation.deviation_from_min.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getExceptionBadge(violation.exception_type)}
                      {violation.exception_reason && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {violation.exception_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {violation.approved_by ? (
                        <div className="text-xs">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span className="font-semibold">Approved</span>
                          </div>
                          <div className="text-gray-600">by {violation.approved_by}</div>
                          {violation.approved_at && (
                            <div className="text-gray-400">
                              {formatDateTime(violation.approved_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarginViolationsTab;
