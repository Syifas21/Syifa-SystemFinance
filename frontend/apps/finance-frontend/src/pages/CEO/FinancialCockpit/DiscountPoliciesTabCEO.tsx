import React, { useState, useEffect } from 'react';
import { discountPoliciesAPI, DiscountPolicy } from '../../../api';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const DiscountPoliciesTabCEO: React.FC = () => {
  const [policies, setPolicies] = useState<DiscountPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      console.log('🔍 CEO DiscountPoliciesTab: Fetching policies...');
      const response = await discountPoliciesAPI.getAll();
      console.log('📡 CEO DiscountPoliciesTab: Response received:', response);
      
      if (response.success && response.data) {
        setPolicies(response.data);
        console.log('✅ CEO DiscountPoliciesTab: Loaded', response.data.length, 'policies');
      } else {
        console.warn('⚠️ CEO DiscountPoliciesTab: Invalid response format:', response);
      }
    } catch (error) {
      console.error('❌ CEO DiscountPoliciesTab: Error fetching discount policies:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      // Set empty array on error to prevent UI crashes
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CEO Info Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <div>
            <h3 className="font-semibold text-amber-900">Mode Tampilan CEO</h3>
            <p className="text-sm text-amber-700">
              Kebijakan diskon per role. Perubahan memerlukan persetujuan Finance Admin.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-amber-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Max Diskon (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Batas Approval (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Deskripsi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">Belum ada kebijakan diskon</p>
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        {policy.user_role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800">
                      {policy.max_discount_percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-800">
                      {policy.requires_approval_above}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {policy.description || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3">📊 Ringkasan Kebijakan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-amber-700">Total Role</p>
            <p className="text-2xl font-bold text-amber-900">{policies.length}</p>
          </div>
          <div>
            <p className="text-sm text-amber-700">Max Diskon Tertinggi</p>
            <p className="text-2xl font-bold text-amber-900">
              {policies.length > 0 
                ? Math.max(...policies.map(p => Number(p.max_discount_percentage))) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-amber-700">Rata-rata Diskon</p>
            <p className="text-2xl font-bold text-amber-900">
              {policies.length > 0
                ? (policies.reduce((sum, p) => sum + Number(p.max_discount_percentage), 0) / policies.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-amber-700">Dengan Approval</p>
            <p className="text-2xl font-bold text-amber-900">
              {policies.filter(p => Number(p.requires_approval_above) > 0).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountPoliciesTabCEO;
