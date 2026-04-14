import React, { useState, useEffect } from 'react';
import {
  CalculatorIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface BOQItem {
  id: string;
  item_name: string;
  sbu: string;
  category: string;
  system?: string;
  sub_system?: string;
  component?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

interface MarginResult {
  min_margin: number;
  max_margin: number;
  default_markup: number;
  fallback_level?: string;
}

interface ValidationResult {
  is_valid: boolean;
  applied_margin: number;
  warnings: string[];
}

interface PricedItem extends BOQItem {
  suggested_selling_price: number;
  applied_selling_price: number;
  applied_margin: number;
  applied_discount: number;
  final_price: number;
  margin_policy: MarginResult | null;
  is_valid: boolean;
  warnings: string[];
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const BOQPricingTab: React.FC = () => {
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [pricedItems, setPricedItems] = useState<PricedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Exception flags
  const [isTender, setIsTender] = useState(false);
  const [isStrategicCustomer, setIsStrategicCustomer] = useState(false);
  const [isBulkOrder, setIsBulkOrder] = useState(false);

  // User role (simulated - should come from auth)
  const [userRole, setUserRole] = useState('SALES');

  // Sample BOQ data - in real implementation, this would come from BOQ API
  useEffect(() => {
    // Simulate loading BOQ items
    const sampleBOQ: BOQItem[] = [
      {
        id: '1',
        item_name: 'Main Distribution Panel',
        sbu: 'INF',
        category: 'Electrical',
        system: 'Panel',
        sub_system: 'LVMDP',
        component: 'Main Distribution Panel',
        quantity: 1,
        unit_cost: 50000000,
        total_cost: 50000000,
      },
      {
        id: '2',
        item_name: 'LED Panel Indoor',
        sbu: 'INF',
        category: 'Electrical',
        system: 'Lighting',
        sub_system: 'Indoor',
        component: 'LED Panel',
        quantity: 50,
        unit_cost: 500000,
        total_cost: 25000000,
      },
      {
        id: '3',
        item_name: 'Split AC 2 PK',
        sbu: 'INF',
        category: 'HVAC',
        system: 'Split Duct',
        sub_system: 'Residential',
        component: '2 PK',
        quantity: 10,
        unit_cost: 8000000,
        total_cost: 80000000,
      },
      {
        id: '4',
        item_name: 'Fire Alarm Addressable',
        sbu: 'CSW',
        category: 'Extra Low Voltage',
        system: 'Fire Alarm',
        sub_system: 'Addressable',
        component: 'Addressable Fire Alarm',
        quantity: 1,
        unit_cost: 75000000,
        total_cost: 75000000,
      },
      {
        id: '5',
        item_name: 'Solar Panel Monocrystalline 400W',
        sbu: 'EC',
        category: 'Solar PV',
        system: 'Panel',
        sub_system: 'Monocrystalline',
        component: 'Solar Panel Mono 400W',
        quantity: 100,
        unit_cost: 3000000,
        total_cost: 300000000,
      },
    ];

    setBoqItems(sampleBOQ);
  }, []);

  const calculatePricing = async () => {
    setLoading(true);
    const priced: PricedItem[] = [];

    for (const item of boqItems) {
      try {
        // Step 1: Find margin policy
        const marginResponse = await fetch(`${API_BASE}/margin-policies/find`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sbu: item.sbu,
            category: item.category,
            system: item.system,
            sub_system: item.sub_system,
            component: item.component,
          }),
        });

        const marginResult = await marginResponse.json();
        const marginPolicy: MarginResult = marginResult.success ? marginResult.data : null;

        // Step 2: Calculate suggested selling price using min_margin
        const minMargin = marginPolicy?.min_margin || 25.0;
        const suggestedPrice = item.unit_cost / (1 - minMargin / 100);

        // Step 3: Get user's discount policy
        const discountResponse = await fetch(`${API_BASE}/discount-policies`);
        const discountResult = await discountResponse.json();
        const userDiscountPolicy = discountResult.success
          ? discountResult.data.find((p: any) => p.user_role === userRole)
          : null;

        const maxDiscount = userDiscountPolicy?.max_discount_percentage || 0;

        // Step 4: Apply default discount (can be adjusted by user)
        const appliedDiscount = 0; // Start with no discount
        const appliedPrice = suggestedPrice * (1 - appliedDiscount / 100);

        // Step 5: Validate margin
        const appliedMargin = ((appliedPrice - item.unit_cost) / appliedPrice) * 100;

        const exceptions = {
          is_tender: isTender,
          is_strategic_customer: isStrategicCustomer,
          is_bulk_order: isBulkOrder,
          order_value: item.total_cost,
        };

        const validationResponse = await fetch(`${API_BASE}/margin-policies/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sbu: item.sbu,
            category: item.category,
            system: item.system,
            sub_system: item.sub_system,
            component: item.component,
            cost: item.unit_cost,
            selling_price: appliedPrice,
            exceptions,
          }),
        });

        const validationResult = await validationResponse.json();
        const validation: ValidationResult = validationResult.success
          ? validationResult.data
          : { is_valid: false, applied_margin: appliedMargin, warnings: [] };

        priced.push({
          ...item,
          suggested_selling_price: suggestedPrice,
          applied_selling_price: appliedPrice,
          applied_margin: appliedMargin,
          applied_discount: appliedDiscount,
          final_price: appliedPrice * item.quantity,
          margin_policy: marginPolicy,
          is_valid: validation.is_valid,
          warnings: validation.warnings || [],
        });
      } catch (error) {
        console.error('Error pricing item:', error);
        priced.push({
          ...item,
          suggested_selling_price: item.unit_cost * 1.33,
          applied_selling_price: item.unit_cost * 1.33,
          applied_margin: 25.0,
          applied_discount: 0,
          final_price: item.unit_cost * 1.33 * item.quantity,
          margin_policy: null,
          is_valid: false,
          warnings: ['Error calculating price'],
        });
      }
    }

    setPricedItems(priced);
    setLoading(false);
  };

  const updateItemDiscount = async (itemId: string, discount: number) => {
    const updatedItems = pricedItems.map((item) => {
      if (item.id === itemId) {
        const newPrice = item.suggested_selling_price * (1 - discount / 100);
        const newMargin = ((newPrice - item.unit_cost) / newPrice) * 100;
        const finalPrice = newPrice * item.quantity;

        return {
          ...item,
          applied_discount: discount,
          applied_selling_price: newPrice,
          applied_margin: newMargin,
          final_price: finalPrice,
          is_valid:
            newMargin >= (item.margin_policy?.min_margin || 25) &&
            newMargin <= (item.margin_policy?.max_margin || 35),
        };
      }
      return item;
    });

    setPricedItems(updatedItems);
  };

  const getTotalSummary = () => {
    const totalCost = pricedItems.reduce((sum, item) => sum + item.total_cost, 0);
    const totalRevenue = pricedItems.reduce((sum, item) => sum + item.final_price, 0);
    const totalProfit = totalRevenue - totalCost;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalCost, totalRevenue, totalProfit, averageMargin };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const summary = getTotalSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">BOQ Pricing Calculator</h3>
        <p className="text-sm text-gray-600 mt-1">
          Hitung harga jual berdasarkan Margin Policy dan terapkan Discount Policy
        </p>
      </div>

      {/* Exception Flags */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Pengecualian & Konteks</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tender"
              checked={isTender}
              onChange={(e) => setIsTender(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="tender" className="text-sm text-gray-700">
              Proyek Tender (-5% min margin)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="strategic"
              checked={isStrategicCustomer}
              onChange={(e) => setIsStrategicCustomer(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="strategic" className="text-sm text-gray-700">
              Customer Strategis (-4% max)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bulk"
              checked={isBulkOrder}
              onChange={(e) => setIsBulkOrder(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="bulk" className="text-sm text-gray-700">
              Bulk Order (+3% max margin)
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">User Role:</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="SALES">SALES</option>
              <option value="SALES_MANAGER">SALES_MANAGER</option>
              <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
              <option value="CEO">CEO</option>
            </select>
          </div>
        </div>

        <button
          onClick={calculatePricing}
          disabled={loading}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <CalculatorIcon className="w-5 h-5" />
          {loading ? 'Menghitung...' : 'Hitung Pricing'}
        </button>
      </div>

      {/* Summary */}
      {pricedItems.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
            Ringkasan Pricing
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(summary.totalProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Margin</p>
              <p className="text-xl font-bold text-purple-600">
                {summary.averageMargin.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Priced Items Table */}
      {pricedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Suggested Price
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Discount (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Final Unit Price
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Margin (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-500">
                          {item.sbu} → {item.category}
                          {item.system && ` → ${item.system}`}
                        </p>
                        {item.margin_policy && (
                          <p className="text-xs text-blue-600 mt-1">
                            Policy: {item.margin_policy.min_margin.toFixed(1)}% -{' '}
                            {item.margin_policy.max_margin.toFixed(1)}%{' '}
                            <span className="text-gray-400">
                              ({item.margin_policy.fallback_level})
                            </span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(item.unit_cost)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">
                      {formatCurrency(item.suggested_selling_price)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="50"
                        value={item.applied_discount}
                        onChange={(e) =>
                          updateItemDiscount(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">
                      {formatCurrency(item.applied_selling_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          item.is_valid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.applied_margin.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                      {formatCurrency(item.final_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.is_valid ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-600 inline" />
                      ) : (
                        <div className="group relative">
                          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 inline cursor-help" />
                          <div className="hidden group-hover:block absolute right-0 top-8 bg-red-50 border border-red-200 rounded-lg p-3 w-64 shadow-lg z-10">
                            {item.warnings.map((warning, idx) => (
                              <p key={idx} className="text-xs text-red-700 mb-1">
                                {warning}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">Cara Kerja Pricing:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Sistem mencari Margin Policy berdasarkan hierarki (SBU → Category → System)</li>
              <li>Harga jual disarankan = Cost / (1 - Min Margin)</li>
              <li>Diskon diterapkan sesuai Discount Policy (berdasarkan user role)</li>
              <li>Margin final divalidasi terhadap Min & Max Margin Policy</li>
              <li>Exception rules diterapkan (Tender, Strategic Customer, Bulk Order)</li>
              <li>
                Status hijau = margin valid, Status merah = margin di luar range (perlu approval)
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BOQPricingTab;
