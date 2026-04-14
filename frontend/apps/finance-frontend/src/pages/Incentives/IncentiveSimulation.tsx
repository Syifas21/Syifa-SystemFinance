import React, { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface SimulationInput {
  employee_name?: string;
  role: string;
  metric: string;
  achieved_value: number;
  target_value: number;
  base_salary?: number;
  period: string;
}

interface SimulationResult {
  employee_name?: string;
  role: string;
  metric: string;
  achieved_value: number;
  target_value: number;
  achievement_percentage: number;
  incentive_amount: number;
  incentive_percentage: number;
  tier: string;
  calculation_details: {
    formula: string;
    breakdown: string;
  };
  period: string;
  simulated_at: string;
}

interface IncentivePlan {
  plan_name: string;
  applies_to_role: string;
  metric: string;
  tiers: Array<{ min: number; max: number | null; incentive: string }>;
  description: string;
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const IncentiveSimulation: React.FC = () => {
  const [formData, setFormData] = useState<SimulationInput>({
    employee_name: '',
    role: 'SALES',
    metric: 'REVENUE',
    achieved_value: 0,
    target_value: 0,
    base_salary: 0,
    period: new Date().toISOString().slice(0, 7),
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [plans, setPlans] = useState<IncentivePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const roles = [
    'SALES',
    'SALES_MANAGER',
    'PROJECT_MANAGER',
    'FINANCE_ADMIN',
    'CEO',
    'HR_ADMIN',
  ];

  const metrics = [
    { value: 'REVENUE', label: 'Revenue (Pendapatan)', unit: 'IDR' },
    { value: 'PROFIT_MARGIN', label: 'Profit Margin', unit: '%' },
    { value: 'PROJECTS_COMPLETED', label: 'Projects Completed', unit: 'projects' },
    { value: 'CUSTOMER_SATISFACTION', label: 'Customer Satisfaction', unit: 'score' },
    { value: 'COST_SAVINGS', label: 'Cost Savings', unit: 'IDR' },
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/incentives/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/incentives/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error simulating:', error);
      alert('❌ Gagal melakukan simulasi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Outstanding Performance':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Excellent Performance':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Good Performance':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Enhanced */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-300/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <CalculatorIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">🎯 Simulasi Insentif Karyawan</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              Hitung proyeksi insentif berdasarkan pencapaian KPI dan target
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                TSD FITUR 3.4.H - Incentive Simulator
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowPlans(!showPlans)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
          >
            <ChartBarIcon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
            {showPlans ? 'Tutup' : 'Lihat'} Incentive Plans
          </button>
        </div>
      </div>

      {/* Incentive Plans Panel */}
      {showPlans && (
        <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Incentive Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">{plan.plan_name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Tiers:</p>
                      {plan.tiers.map((tier, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-600">
                            {tier.min}% - {tier.max ? `${tier.max}%` : '∞'}
                          </span>
                          <span className="font-semibold text-purple-600">{tier.incentive}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CalculatorIcon className="w-6 h-6 text-purple-600" />
                Input Parameter Simulasi
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Karyawan (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.employee_name}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_name: e.target.value })
                    }
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KPI Metric <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    {metrics.map((metric) => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) =>
                      setFormData({ ...formData, target_value: parseFloat(e.target.value) })
                    }
                    placeholder="100000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achieved Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.achieved_value}
                    onChange={(e) =>
                      setFormData({ ...formData, achieved_value: parseFloat(e.target.value) })
                    }
                    placeholder="120000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Salary (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.base_salary}
                    onChange={(e) =>
                      setFormData({ ...formData, base_salary: parseFloat(e.target.value) })
                    }
                    placeholder="10000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Jika diisi, insentif dihitung dari salary. Jika kosong, dari achieved value.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Periode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  onClick={handleSimulate}
                  disabled={loading || !formData.target_value || !formData.achieved_value}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold shadow-lg hover:shadow-xl hover:from-accent-gold hover:to-primary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Menghitung...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Hitung Insentif
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Result Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CurrencyDollarIcon className="w-6 h-6 text-accent-gold" />
                Hasil Simulasi
              </h3>

              {!result ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <UserGroupIcon className="w-20 h-20 mb-4" />
                  <p className="text-center">
                    Isi form di sebelah kiri dan klik "Hitung Insentif" untuk melihat hasil
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Employee Info */}
                  {result.employee_name && (
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-600">Nama Karyawan</p>
                      <p className="text-lg font-bold text-gray-900">{result.employee_name}</p>
                    </div>
                  )}

                  {/* Achievement */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Achievement</span>
                      <span className="text-2xl font-bold text-accent-gold">
                        {result.achievement_percentage.toFixed(2)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-primary-light to-accent-gold h-4 rounded-full transition-all"
                        style={{ width: `${Math.min(result.achievement_percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Target: {formatCurrency(result.target_value)}</span>
                      <span>Achieved: {formatCurrency(result.achieved_value)}</span>
                    </div>
                  </div>

                  {/* Tier Badge */}
                  <div className="flex items-center justify-center">
                    <span
                      className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold border-2 ${getTierColor(
                        result.tier
                      )}`}
                    >
                      {result.tier}
                    </span>
                  </div>

                  {/* Incentive Amount */}
                  <div className="bg-gradient-to-r from-primary-dark/5 to-accent-gold/10 rounded-lg p-6 text-center border-2 border-accent-gold/30">
                    <p className="text-sm text-gray-600 mb-2">Total Insentif</p>
                    <p className="text-4xl font-bold text-accent-gold mb-2">
                      {formatCurrency(result.incentive_amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ({result.incentive_percentage}% dari{' '}
                      {formData.base_salary ? 'base salary' : 'achieved value'})
                    </p>
                  </div>

                  {/* Calculation Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Detail Perhitungan:
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Formula:</strong> {result.calculation_details.formula}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Breakdown:</strong> {result.calculation_details.breakdown}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      <strong>Role:</strong> {result.role}
                    </p>
                    <p>
                      <strong>Metric:</strong> {result.metric}
                    </p>
                    <p>
                      <strong>Periode:</strong> {result.period}
                    </p>
                    <p>
                      <strong>Disimulasikan:</strong>{' '}
                      {new Date(result.simulated_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-gray-900">0%</div>
              <div className="text-sm text-gray-600 mt-1">&lt; 80% Target</div>
              <div className="text-xs text-gray-500 mt-1">Below Threshold</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-md p-6 text-center border-2 border-blue-300">
              <div className="text-3xl font-bold text-blue-600">5%</div>
              <div className="text-sm text-gray-600 mt-1">80% - 100% Target</div>
              <div className="text-xs text-gray-500 mt-1">Good Performance</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-6 text-center border-2 border-green-300">
              <div className="text-3xl font-bold text-green-600">10%</div>
              <div className="text-sm text-gray-600 mt-1">100% - 120% Target</div>
              <div className="text-xs text-gray-500 mt-1">Excellent Performance</div>
            </div>
            <div className="bg-purple-50 rounded-lg shadow-md p-6 text-center border-2 border-purple-300">
              <div className="text-3xl font-bold text-purple-600">15%</div>
              <div className="text-sm text-gray-600 mt-1">&gt; 120% Target</div>
              <div className="text-xs text-gray-500 mt-1">Outstanding Performance</div>
            </div>
          </div>
    </div>
  );
};

export default IncentiveSimulation;
