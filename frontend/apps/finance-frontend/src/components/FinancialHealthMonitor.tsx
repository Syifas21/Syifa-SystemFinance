import React, { useState, useEffect } from 'react';
import {
  HeartIcon,
  BoltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface HealthMetric {
  name: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'danger' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

const FinancialHealthMonitor: React.FC = () => {
  const [healthScore, setHealthScore] = useState(0);
  const [heartbeat, setHeartbeat] = useState(false);
  const [metrics, setMetrics] = useState<HealthMetric[]>([
    { name: 'Cash Flow', value: 75, status: 'good', trend: 'up' },
    { name: 'Likuiditas', value: 45, status: 'warning', trend: 'down' },
    { name: 'Profitabilitas', value: 88, status: 'excellent', trend: 'up' },
    { name: 'Debt Ratio', value: 35, status: 'danger', trend: 'stable' },
    { name: 'Efisiensi Operasional', value: 92, status: 'excellent', trend: 'up' },
  ]);

  useEffect(() => {
    console.log('💊 Financial Health Monitor loaded');
    // Calculate overall health score
    const avgScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    setHealthScore(Math.round(avgScore));

    // Heartbeat animation
    const interval = setInterval(() => {
      setHeartbeat((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, [metrics]);

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'Sangat Sehat', color: 'green', icon: ShieldCheckIcon };
    if (score >= 60) return { status: 'Sehat', color: 'blue', icon: BoltIcon };
    if (score >= 40) return { status: 'Perlu Perhatian', color: 'yellow', icon: ExclamationTriangleIcon };
    if (score >= 20) return { status: 'Bahaya', color: 'orange', icon: ExclamationTriangleIcon };
    return { status: 'Kritis', color: 'red', icon: XCircleIcon };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const health = getHealthStatus(healthScore);
  const HealthIcon = health.icon;

  // Define color classes statically for Tailwind
  const colorClasses = {
    green: {
      text: 'text-green-600',
      bgFrom: 'from-green-500',
      bgTo: 'to-green-700',
    },
    blue: {
      text: 'text-blue-600',
      bgFrom: 'from-blue-500',
      bgTo: 'to-blue-700',
    },
    yellow: {
      text: 'text-yellow-600',
      bgFrom: 'from-yellow-500',
      bgTo: 'to-yellow-700',
    },
    orange: {
      text: 'text-orange-600',
      bgFrom: 'from-orange-500',
      bgTo: 'to-orange-700',
    },
    red: {
      text: 'text-red-600',
      bgFrom: 'from-red-500',
      bgTo: 'to-red-700',
    },
  };

  const currentColors = colorClasses[health.color as keyof typeof colorClasses];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <HeartIcon 
            className={`h-8 w-8 ${currentColors.text} transition-transform duration-300 ${
              heartbeat ? 'scale-125' : 'scale-100'
            }`} 
          />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Monitor Kesehatan Finansial</h2>
            <p className="text-sm text-gray-500">Real-time health tracking</p>
          </div>
        </div>
        <HealthIcon className={`h-12 w-12 ${currentColors.text}`} />
      </div>

      {/* Overall Health Score - BIG */}
      <div className={`relative bg-gradient-to-br ${currentColors.bgFrom} ${currentColors.bgTo} rounded-2xl p-8 mb-6 overflow-hidden`}>
        <div className="relative z-10 text-center">
          <div className="text-white text-6xl font-black mb-2">{healthScore}</div>
          <div className="text-white text-xl font-semibold">{health.status}</div>
          <div className="text-white/80 text-sm mt-2">Skor Kesehatan Keseluruhan</div>
        </div>
        
        {/* Animated Background Pulse */}
        <div className={`absolute inset-0 bg-white/10 animate-pulse`}></div>
        
        {/* ECG-like line animation */}
        <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path
              d="M0,50 L200,50 L250,20 L280,80 L310,50 L500,50 L550,30 L580,70 L610,50 L1000,50"
              fill="none"
              stroke="white"
              strokeWidth="3"
              opacity="0.3"
            >
              <animate
                attributeName="d"
                dur="2s"
                repeatCount="indefinite"
                values="
                  M0,50 L200,50 L250,20 L280,80 L310,50 L500,50 L550,30 L580,70 L610,50 L1000,50;
                  M0,50 L200,50 L250,30 L280,70 L310,50 L500,50 L550,20 L580,80 L610,50 L1000,50;
                  M0,50 L200,50 L250,20 L280,80 L310,50 L500,50 L550,30 L580,70 L610,50 L1000,50
                "
              />
            </path>
          </svg>
        </div>
      </div>

      {/* Individual Metrics */}
      <div className="space-y-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{metric.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  metric.trend === 'up' ? 'bg-green-100 text-green-700' :
                  metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900">{metric.value}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${getStatusColor(metric.status)} transition-all duration-500 rounded-full`}
                style={{ width: `${metric.value}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-orange-500 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-1">⚠️ Peringatan Aktif</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Likuiditas di bawah threshold (45% vs 60% minimum)</li>
              <li>• Debt ratio tinggi - pertimbangkan restrukturisasi</li>
              <li>• Cash flow 7 hari ke depan perlu monitoring ketat</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="font-semibold text-gray-900 mb-2">💡 Rekomendasi AI:</div>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Percepat collection dari customer dengan outstanding &gt;30 hari</li>
          <li>• Tunda pengeluaran non-urgent hingga cash flow membaik</li>
          <li>• Review dan renegosiasi terms dengan vendor untuk payment terms lebih panjang</li>
        </ul>
      </div>

      {/* Footer - Update Time */}
      <div className="mt-4 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live • Update terakhir: {new Date().toLocaleTimeString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthMonitor;
