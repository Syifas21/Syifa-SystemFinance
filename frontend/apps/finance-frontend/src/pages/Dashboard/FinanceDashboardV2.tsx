import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { designSystem, Card, Badge, Button } from '../../components/UI';
import DynamicQuickActions from '../../components/UI/DynamicQuickActions';
import FloatingChat from '../../components/Chat/FloatingChat';

interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface ProfitabilityData {
  period: string;
  revenue: number;
  expenses: number;
  net_income: number;
}

interface ARAPSummary {
  total_receivable: number;
  total_payable: number;
  net_position: number;
  overdue_receivable: number;
  overdue_payable: number;
}

interface QuickStat {
  label: string;
  value: number;
  change_percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DashboardData {
  cash_flow: CashFlowData[];
  profitability: ProfitabilityData[];
  ar_ap_summary: ARAPSummary;
  quick_stats: QuickStat[];
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const FinanceDashboardV2: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}Jt`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toFixed(0);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/dashboards/finance?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demo
  const mockData: DashboardData = {
    cash_flow: [
      { period: 'Week 1', inflow: 500000000, outflow: 300000000, net: 200000000 },
      { period: 'Week 2', inflow: 600000000, outflow: 350000000, net: 250000000 },
      { period: 'Week 3', inflow: 550000000, outflow: 320000000, net: 230000000 },
      { period: 'Week 4', inflow: 700000000, outflow: 400000000, net: 300000000 },
    ],
    profitability: [
      { period: 'Jan', revenue: 2000000000, expenses: 1200000000, net_income: 800000000 },
      { period: 'Feb', revenue: 2400000000, expenses: 1240000000, net_income: 1160000000 },
      { period: 'Mar', revenue: 2200000000, expenses: 1100000000, net_income: 1100000000 },
    ],
    ar_ap_summary: {
      total_receivable: 5000000000,
      total_payable: 3000000000,
      net_position: 2000000000,
      overdue_receivable: 500000000,
      overdue_payable: 200000000,
    },
    quick_stats: [
      { label: 'Quick Ratio', value: 1.8, trend: 'up' },
      { label: 'Debt to Equity', value: 0.6, trend: 'down' },
      { label: 'ROA', value: 12.5, trend: 'up' },
      { label: 'Gross Margin', value: 32.1, trend: 'stable' },
    ],
  };

  const data = dashboardData || mockData;

  return (
    <div
      style={{
        backgroundColor: designSystem.colors.bg.primary,
        padding: '2rem',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: designSystem.typography.fontSize['3xl'],
            fontWeight: designSystem.typography.fontWeight.bold,
            color: designSystem.colors.text.primary,
            marginBottom: '0.5rem',
          }}
        >
          📊 Finance Dashboard
        </h1>
        <p
          style={{
            fontSize: designSystem.typography.fontSize.base,
            color: designSystem.colors.text.secondary,
          }}
        >
          Financial Performance Overview & Analytics
        </p>
      </div>

      {/* Period Selector Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        {['month', 'quarter', 'year'].map((p) => (
          <Button
            key={p}
            variant={period === (p as typeof period) ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p as typeof period)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* Quick Stats - 4 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {data.quick_stats.map((stat, index) => (
          <Card
            key={index}
            variant="default"
            style={{
              borderTop: `4px solid ${designSystem.colors.primary.DEFAULT}`,
            }}
          >
            <p
              style={{
                fontSize: designSystem.typography.fontSize.sm,
                color: designSystem.colors.text.secondary,
                marginBottom: '0.5rem',
              }}
            >
              {stat.label}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: designSystem.typography.fontSize['2xl'],
                  fontWeight: designSystem.typography.fontWeight.bold,
                  color: designSystem.colors.text.primary,
                }}
              >
                {stat.value}
              </span>
              {stat.trend && (
                <Badge
                  variant={
                    stat.trend === 'up'
                      ? 'success'
                      : stat.trend === 'down'
                        ? 'error'
                        : 'info'
                  }
                  size="sm"
                >
                  {stat.trend === 'up' && '↑'}
                  {stat.trend === 'down' && '↓'}
                  {stat.trend === 'stable' && '→'}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Approvals - Dynamic Quick Actions */}
      <DynamicQuickActions />

      {/* Charts - 2 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Cash Flow Chart */}
        <Card variant="elevated">
          <h3
            style={{
              fontSize: designSystem.typography.fontSize.lg,
              fontWeight: designSystem.typography.fontWeight.bold,
              color: designSystem.colors.text.primary,
              marginBottom: '1rem',
            }}
          >
            💰 Cash Flow Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.cash_flow}>
              <CartesianGrid strokeDasharray="3 3" stroke={designSystem.colors.border.light} />
              <XAxis dataKey="period" stroke={designSystem.colors.text.secondary} />
              <YAxis stroke={designSystem.colors.text.secondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: designSystem.colors.bg.secondary,
                  border: `1px solid ${designSystem.colors.border.DEFAULT}`,
                }}
              />
              <Legend />
              <Bar dataKey="inflow" fill={designSystem.colors.success.DEFAULT} name="Inflow" />
              <Bar dataKey="outflow" fill={designSystem.colors.error.DEFAULT} name="Outflow" />
              <Bar dataKey="net" fill={designSystem.colors.primary.DEFAULT} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Profitability Chart */}
        <Card variant="elevated">
          <h3
            style={{
              fontSize: designSystem.typography.fontSize.lg,
              fontWeight: designSystem.typography.fontWeight.bold,
              color: designSystem.colors.text.primary,
              marginBottom: '1rem',
            }}
          >
            📈 Profitability Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.profitability}>
              <CartesianGrid strokeDasharray="3 3" stroke={designSystem.colors.border.light} />
              <XAxis dataKey="period" stroke={designSystem.colors.text.secondary} />
              <YAxis stroke={designSystem.colors.text.secondary} />
              <Tooltip
                contentStyle={{
                  backgroundColor: designSystem.colors.bg.secondary,
                  border: `1px solid ${designSystem.colors.border.DEFAULT}`,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                fill={`${designSystem.colors.secondary.DEFAULT}30`}
                stroke={designSystem.colors.secondary.DEFAULT}
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                fill={`${designSystem.colors.error.DEFAULT}30`}
                stroke={designSystem.colors.error.DEFAULT}
                name="Expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* AR/AP Summary - 2 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Receivables */}
        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CurrencyDollarIcon
              style={{
                width: '1.5rem',
                height: '1.5rem',
                color: designSystem.colors.success.DEFAULT,
              }}
            />
            <h3
              style={{
                fontSize: designSystem.typography.fontSize.lg,
                fontWeight: designSystem.typography.fontWeight.bold,
                color: designSystem.colors.text.primary,
              }}
            >
              Account Receivable
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.success.DEFAULT}10`,
                borderRadius: designSystem.borderRadius.md,
              }}
            >
              <p
                style={{
                  fontSize: designSystem.typography.fontSize.sm,
                  color: designSystem.colors.text.secondary,
                }}
              >
                Total Receivable
              </p>
              <p
                style={{
                  fontSize: designSystem.typography.fontSize['2xl'],
                  fontWeight: designSystem.typography.fontWeight.bold,
                  color: designSystem.colors.success.DEFAULT,
                }}
              >
                {formatCompact(data.ar_ap_summary.total_receivable)}
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.warning.DEFAULT}10`,
                borderRadius: designSystem.borderRadius.md,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ExclamationTriangleIcon
                  style={{
                    width: '1rem',
                    height: '1rem',
                    color: designSystem.colors.warning.DEFAULT,
                  }}
                />
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.sm,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Overdue
                </p>
              </div>
              <p
                style={{
                  fontSize: designSystem.typography.fontSize.xl,
                  fontWeight: designSystem.typography.fontWeight.bold,
                  color: designSystem.colors.warning.DEFAULT,
                }}
              >
                {formatCompact(data.ar_ap_summary.overdue_receivable)}
              </p>
            </div>
          </div>
        </Card>

        {/* Payables */}
        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <BanknotesIcon
              style={{
                width: '1.5rem',
                height: '1.5rem',
                color: designSystem.colors.error.DEFAULT,
              }}
            />
            <h3
              style={{
                fontSize: designSystem.typography.fontSize.lg,
                fontWeight: designSystem.typography.fontWeight.bold,
                color: designSystem.colors.text.primary,
              }}
            >
              Account Payable
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.error.DEFAULT}10`,
                borderRadius: designSystem.borderRadius.md,
              }}
            >
              <p
                style={{
                  fontSize: designSystem.typography.fontSize.sm,
                  color: designSystem.colors.text.secondary,
                }}
              >
                Total Payable
              </p>
              <p
                style={{
                  fontSize: designSystem.typography.fontSize['2xl'],
                  fontWeight: designSystem.typography.fontWeight.bold,
                  color: designSystem.colors.error.DEFAULT,
                }}
              >
                {formatCompact(data.ar_ap_summary.total_payable)}
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.info.DEFAULT}10`,
                borderRadius: designSystem.borderRadius.md,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircleIcon
                  style={{
                    width: '1rem',
                    height: '1rem',
                    color: designSystem.colors.info.DEFAULT,
                  }}
                />
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.sm,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Net Position
                </p>
              </div>
              <p
                style={{
                  fontSize: designSystem.typography.fontSize.xl,
                  fontWeight: designSystem.typography.fontWeight.bold,
                  color: designSystem.colors.info.DEFAULT,
                }}
              >
                {formatCompact(data.ar_ap_summary.net_position)}
              </p>
            </div>
          </div>
        </Card>
      </div>
      {/* Floating Chat Widget */}
      <FloatingChat role="finance" />
    </div>
  );
};

export default FinanceDashboardV2;
