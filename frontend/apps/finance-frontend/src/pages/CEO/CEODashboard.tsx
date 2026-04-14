// CEO Executive Dashboard
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: any;
}

export default function CEODashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricCard[]>([
    {
      title: 'Total Revenue',
      value: 'Rp 2.4M',
      change: 12.5,
      trend: 'up',
      icon: CurrencyDollarIcon
    },
    {
      title: 'Net Profit',
      value: 'Rp 680K',
      change: 8.2,
      trend: 'up',
      icon: ArrowTrendingUpIcon
    },
    {
      title: 'Operating Expenses',
      value: 'Rp 1.2M',
      change: -3.1,
      trend: 'down',
      icon: ChartBarIcon
    },
    {
      title: 'Cash Flow',
      value: 'Rp 450K',
      change: 15.8,
      trend: 'up',
      icon: BanknotesIcon
    }
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      // TODO: Fetch real data from API
      // const response = await dashboardAPI.getCEOMetrics();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ CEO Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CEO Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Company Financial Overview & Performance</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <metric.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">{metric.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Project Revenue</span>
              <span className="font-semibold text-gray-900">Rp 1.8M (75%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service Revenue</span>
              <span className="font-semibold text-gray-900">Rp 400K (17%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '17%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Other Revenue</span>
              <span className="font-semibold text-gray-900">Rp 200K (8%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '8%' }}></div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expense Breakdown</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operational</span>
              <span className="font-semibold text-gray-900">Rp 650K (54%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '54%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Personnel</span>
              <span className="font-semibold text-gray-900">Rp 400K (33%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{ width: '33%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Other Expenses</span>
              <span className="font-semibold text-gray-900">Rp 150K (13%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-gray-600 h-2 rounded-full" style={{ width: '13%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            Financial Alerts
          </h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/invoices')}
              className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-900">3 invoices overdue</p>
                  <p className="text-xs text-yellow-700 mt-1">Total: Rp 450K</p>
                </div>
                <EyeIcon className="h-5 w-5 text-yellow-600" />
              </div>
            </button>
            <button 
              onClick={() => navigate('/ap')}
              className="w-full p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">10 payments pending</p>
                  <p className="text-xs text-blue-700 mt-1">Total: Rp 900K</p>
                </div>
                <EyeIcon className="h-5 w-5 text-blue-600" />
              </div>
            </button>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">Profit margin above target</p>
              <p className="text-xs text-green-700 mt-1">Current: 28.3% (Target: 25%)</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Reports</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/reports')}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-lg transition-all"
            >
              <DocumentChartBarIcon className="h-6 w-6 text-blue-600" />
              <div className="text-left flex-1">
                <p className="font-semibold text-blue-900">Financial Summary Report</p>
                <p className="text-xs text-blue-700">Last 30 days overview</p>
              </div>
              <EyeIcon className="h-5 w-5 text-blue-600" />
            </button>
            
            <button 
              onClick={() => navigate('/financial-cockpit')}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-lg transition-all"
            >
              <ChartBarIcon className="h-6 w-6 text-green-600" />
              <div className="text-left flex-1">
                <p className="font-semibold text-green-900">Financial Cockpit</p>
                <p className="text-xs text-green-700">Policies & configurations</p>
              </div>
              <EyeIcon className="h-5 w-5 text-green-600" />
            </button>
            
            <button 
              onClick={() => navigate('/bank-reconciliation')}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 rounded-lg transition-all"
            >
              <BanknotesIcon className="h-6 w-6 text-purple-600" />
              <div className="text-left flex-1">
                <p className="font-semibold text-purple-900">Bank Reconciliation</p>
                <p className="text-xs text-purple-700">Cash position monitoring</p>
              </div>
              <EyeIcon className="h-5 w-5 text-purple-600" />
            </button>

            <button 
              onClick={() => navigate('/journals')}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-200 rounded-lg transition-all"
            >
              <DocumentTextIcon className="h-6 w-6 text-amber-600" />
              <div className="text-left flex-1">
                <p className="font-semibold text-amber-900">Journal Monitor</p>
                <p className="text-xs text-amber-700">Real-time accounting entries</p>
              </div>
              <EyeIcon className="h-5 w-5 text-amber-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Financial Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">Jan 24, 2026</td>
                <td className="py-3 px-4 text-sm text-gray-900">Invoice</td>
                <td className="py-3 px-4 text-sm text-gray-600">Project ABC - Payment</td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">+Rp 250K</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">Jan 23, 2026</td>
                <td className="py-3 px-4 text-sm text-gray-900">Expense</td>
                <td className="py-3 px-4 text-sm text-gray-600">Office Supplies</td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-red-600">-Rp 45K</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Completed</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">Jan 22, 2026</td>
                <td className="py-3 px-4 text-sm text-gray-900">Invoice</td>
                <td className="py-3 px-4 text-sm text-gray-600">Service Fee - Client XYZ</td>
                <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">+Rp 180K</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
