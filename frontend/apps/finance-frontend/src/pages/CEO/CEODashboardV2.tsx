import React, { useState, useEffect } from 'react';
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
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { designSystem, Button, Card, Badge, QuickActionButton } from '../../components/UI';
import DynamicQuickActions from '../../components/UI/DynamicQuickActions';
import FloatingChat from '../../components/Chat/FloatingChat';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: any;
}

const CEODashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<MetricCard[]>([
    {
      title: 'Total Revenue',
      value: 'Rp 2.4M',
      change: 12.5,
      trend: 'up',
      icon: CurrencyDollarIcon,
    },
    {
      title: 'Net Profit',
      value: 'Rp 680K',
      change: 8.2,
      trend: 'up',
      icon: ArrowTrendingUpIcon,
    },
    {
      title: 'Operating Expenses',
      value: 'Rp 1.2M',
      change: -3.1,
      trend: 'down',
      icon: ChartBarIcon,
    },
    {
      title: 'Cash Flow',
      value: 'Rp 450K',
      change: 15.8,
      trend: 'up',
      icon: BanknotesIcon,
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('✅ CEO Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickReports = [
    {
      label: 'Financial Summary Report',
      description: 'Last 30 days overview',
      icon: DocumentChartBarIcon,
      path: '/reports',
      color: designSystem.colors.secondary.DEFAULT,
    },
    {
      label: 'Financial Cockpit',
      description: 'Policies & configurations',
      icon: ChartBarIcon,
      path: '/financial-cockpit',
      color: designSystem.colors.success.DEFAULT,
    },
    {
      label: 'Bank Reconciliation',
      description: 'Cash position monitoring',
      icon: BanknotesIcon,
      path: '/bank-reconciliation',
      color: designSystem.colors.info.DEFAULT,
    },
    {
      label: 'Journal Monitor',
      description: 'Real-time accounting entries',
      icon: DocumentTextIcon,
      path: '/journals',
      color: designSystem.colors.warning.DEFAULT,
    },
  ];

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: designSystem.typography.fontSize['3xl'],
                fontWeight: designSystem.typography.fontWeight.bold,
                color: designSystem.colors.text.primary,
                marginBottom: '0.5rem',
              }}
            >
              CEO Executive Dashboard
            </h1>
            <p
              style={{
                fontSize: designSystem.typography.fontSize.base,
                color: designSystem.colors.text.secondary,
              }}
            >
              Company Financial Overview & Performance
            </p>
          </div>
          <button
            onClick={refreshData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: designSystem.colors.secondary.DEFAULT,
              color: designSystem.colors.text.inverse,
              borderRadius: designSystem.borderRadius.md,
              border: 'none',
              fontWeight: designSystem.typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: designSystem.transitions.fast,
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                designSystem.colors.secondary.light;
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                designSystem.colors.secondary.DEFAULT;
            }}
          >
            <ArrowPathIcon
              style={{
                width: '1.25rem',
                height: '1.25rem',
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === 'up';

          return (
            <Card
              key={index}
              variant="elevated"
              style={{
                borderTop: `4px solid ${
                  isPositive
                    ? designSystem.colors.success.DEFAULT
                    : designSystem.colors.error.DEFAULT
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: `${designSystem.colors.secondary.DEFAULT}20`,
                    borderRadius: designSystem.borderRadius.lg,
                  }}
                >
                  <Icon
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: designSystem.colors.secondary.DEFAULT,
                    }}
                  />
                </div>
                <Badge
                  variant={isPositive ? 'success' : 'error'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {isPositive ? (
                    <ArrowTrendingUpIcon
                      style={{ width: '0.75rem', height: '0.75rem' }}
                    />
                  ) : (
                    <ArrowTrendingDownIcon
                      style={{ width: '0.75rem', height: '0.75rem' }}
                    />
                  )}
                  {Math.abs(metric.change)}%
                </Badge>
              </div>

              <p
                style={{
                  fontSize: designSystem.typography.fontSize.sm,
                  color: designSystem.colors.text.secondary,
                  marginBottom: '0.5rem',
                }}
              >
                {metric.title}
              </p>
              <p
                style={{
                  fontSize: designSystem.typography.fontSize['2xl'],
                  fontWeight: designSystem.typography.fontWeight.bold,
                  color: designSystem.colors.text.primary,
                }}
              >
                {metric.value}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Alerts & Quick Actions - 2 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Financial Alerts */}
        <Card variant="default">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <ExclamationTriangleIcon
              style={{
                width: '1.5rem',
                height: '1.5rem',
                color: designSystem.colors.warning.DEFAULT,
              }}
            />
            <h3
              style={{
                fontSize: designSystem.typography.fontSize.lg,
                fontWeight: designSystem.typography.fontWeight.bold,
                color: designSystem.colors.text.primary,
              }}
            >
              Financial Alerts
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Alert Item 1 */}
            <button
              onClick={() => navigate('/invoices')}
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.warning.DEFAULT}15`,
                border: `1px solid ${designSystem.colors.warning.lighter}`,
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                transition: designSystem.transitions.fast,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  `${designSystem.colors.warning.DEFAULT}25`;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  `${designSystem.colors.warning.DEFAULT}15`;
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.warning.dark,
                  }}
                >
                  3 invoices overdue
                </p>
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.xs,
                    color: designSystem.colors.warning.dark,
                    marginTop: '0.25rem',
                    opacity: 0.7,
                  }}
                >
                  Total: Rp 450K
                </p>
              </div>
              <EyeIcon
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: designSystem.colors.warning.dark,
                }}
              />
            </button>

            {/* Alert Item 2 */}
            <button
              onClick={() => navigate('/ap')}
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.info.DEFAULT}15`,
                border: `1px solid ${designSystem.colors.info.lighter}`,
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                transition: designSystem.transitions.fast,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  `${designSystem.colors.info.DEFAULT}25`;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  `${designSystem.colors.info.DEFAULT}15`;
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.info.dark,
                  }}
                >
                  10 payments pending
                </p>
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.xs,
                    color: designSystem.colors.info.dark,
                    marginTop: '0.25rem',
                    opacity: 0.7,
                  }}
                >
                  Total: Rp 900K
                </p>
              </div>
              <ClockIcon
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: designSystem.colors.info.dark,
                }}
              />
            </button>

            {/* Success Alert */}
            <div
              style={{
                padding: '1rem',
                backgroundColor: `${designSystem.colors.success.DEFAULT}15`,
                border: `1px solid ${designSystem.colors.success.lighter}`,
                borderRadius: designSystem.borderRadius.md,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <CheckCircleIcon
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: designSystem.colors.success.dark,
                  flexShrink: 0,
                }}
              />
              <div>
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.success.dark,
                  }}
                >
                  Profit margin above target
                </p>
                <p
                  style={{
                    fontSize: designSystem.typography.fontSize.xs,
                    color: designSystem.colors.success.dark,
                    marginTop: '0.25rem',
                    opacity: 0.7,
                  }}
                >
                  Current: 28.3% (Target: 25%)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Approvals - Dynamic Quick Actions */}
        <DynamicQuickActions />

        {/* Quick Reports */}
        <Card variant="default">
          <h3
            style={{
              fontSize: designSystem.typography.fontSize.lg,
              fontWeight: designSystem.typography.fontWeight.bold,
              color: designSystem.colors.text.primary,
              marginBottom: '1.5rem',
            }}
          >
            📊 Quick Reports
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {quickReports.map((report) => (
              <QuickActionButton
                key={report.path}
                label={report.label}
                description={report.description}
                icon={report.icon}
                path={report.path}
                color={report.color}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card variant="default">
        <h3
          style={{
            fontSize: designSystem.typography.fontSize.lg,
            fontWeight: designSystem.typography.fontWeight.bold,
            color: designSystem.colors.text.primary,
            marginBottom: '1.5rem',
          }}
        >
          📝 Recent Financial Activity
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${designSystem.colors.border.DEFAULT}`,
                }}
              >
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem',
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '0.75rem',
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    textAlign: 'center',
                    padding: '0.75rem',
                    fontSize: designSystem.typography.fontSize.sm,
                    fontWeight: designSystem.typography.fontWeight.semibold,
                    color: designSystem.colors.text.secondary,
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  date: 'Jan 24, 2026',
                  type: 'Invoice',
                  desc: 'Project ABC - Payment',
                  amount: '+Rp 250K',
                  status: 'Paid',
                  statusColor: designSystem.colors.success.DEFAULT,
                },
                {
                  date: 'Jan 23, 2026',
                  type: 'Expense',
                  desc: 'Office Supplies',
                  amount: '-Rp 45K',
                  status: 'Completed',
                  statusColor: designSystem.colors.neutral[400],
                },
                {
                  date: 'Jan 22, 2026',
                  type: 'Invoice',
                  desc: 'Service Revenue',
                  amount: '+Rp 180K',
                  status: 'Pending',
                  statusColor: designSystem.colors.warning.DEFAULT,
                },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: `1px solid ${designSystem.colors.border.light}`,
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      designSystem.colors.bg.tertiary;
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                      'transparent';
                  }}
                >
                  <td
                    style={{
                      padding: '0.75rem',
                      fontSize: designSystem.typography.fontSize.sm,
                      color: designSystem.colors.text.secondary,
                    }}
                  >
                    {row.date}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem',
                      fontSize: designSystem.typography.fontSize.sm,
                      color: designSystem.colors.text.primary,
                      fontWeight: designSystem.typography.fontWeight.medium,
                    }}
                  >
                    {row.type}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem',
                      fontSize: designSystem.typography.fontSize.sm,
                      color: designSystem.colors.text.secondary,
                    }}
                  >
                    {row.desc}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '0.75rem',
                      fontSize: designSystem.typography.fontSize.sm,
                      fontWeight: designSystem.typography.fontWeight.semibold,
                      color: row.amount.startsWith('+')
                        ? designSystem.colors.success.DEFAULT
                        : designSystem.colors.error.DEFAULT,
                    }}
                  >
                    {row.amount}
                  </td>
                  <td
                    style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                    }}
                  >
                    <Badge variant="info" style={{ backgroundColor: `${row.statusColor}20`, color: row.statusColor }}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      {/* Floating Chat Widget */}
      <FloatingChat role="ceo" />
    </div>
  );
};

export default CEODashboardV2;
