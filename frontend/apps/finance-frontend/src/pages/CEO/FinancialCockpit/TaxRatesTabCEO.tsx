import React, { useState, useEffect } from 'react';
import { taxRatesAPI, TaxRate } from '../../../api';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const TaxRatesTabCEO: React.FC = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      console.log('🔍 CEO TaxRatesTab: Fetching tax rates...');
      const response = await taxRatesAPI.getAll();
      console.log('📡 CEO TaxRatesTab: Response received:', response);
      
      if (response.success && response.data) {
        setTaxRates(response.data);
        console.log('✅ CEO TaxRatesTab: Loaded', response.data.length, 'tax rates');
      } else {
        console.warn('⚠️ CEO TaxRatesTab: Invalid response format:', response);
      }
    } catch (error) {
      console.error('❌ CEO TaxRatesTab: Error fetching tax rates:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      // Set empty array on error to prevent UI crashes
      setTaxRates([]);
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
          <span className="text-2xl">👁️</span>
          <div>
            <h3 className="font-semibold text-amber-900">Mode Tampilan CEO</h3>
            <p className="text-sm text-amber-700">
              Anda dapat melihat semua tarif pajak. Perubahan hanya dapat dilakukan oleh Finance Admin.
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
                Nama Pajak
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Kode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Rate (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-amber-900 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {taxRates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">Belum ada tarif pajak</p>
                  <p className="text-sm">Hubungi Finance Admin untuk menambahkan</p>
                </td>
              </tr>
            ) : (
              taxRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-amber-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{rate.tax_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {rate.tax_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{rate.rate}%</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {rate.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {rate.is_active ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        Tidak Aktif
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-700">Total Tarif</p>
          <p className="text-2xl font-bold text-amber-900">{taxRates.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Aktif</p>
          <p className="text-2xl font-bold text-green-900">
            {taxRates.filter(r => r.is_active).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">Tidak Aktif</p>
          <p className="text-2xl font-bold text-gray-900">
            {taxRates.filter(r => !r.is_active).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxRatesTabCEO;
