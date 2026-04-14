import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ImpactPrediction {
  category: string;
  currentValue: number;
  projectedValue: number;
  change: number;
  changePercent: number;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface ImpactAnalysisProps {
  type: 'expense' | 'margin' | 'invoice';
  amount: number;
  metadata?: {
    projectName?: string;
    margin?: number;
    category?: string;
  };
}

const ImpactPredictionDashboard: React.FC<ImpactAnalysisProps> = ({
  type,
  amount,
  metadata,
}) => {
  // Simulate AI prediction calculations
  const [predictions] = useState<ImpactPrediction[]>([
    {
      category: 'Cash Flow (Next 30 Days)',
      currentValue: 250000000,
      projectedValue: 250000000 - amount,
      change: -amount,
      changePercent: -(amount / 250000000) * 100,
      risk: amount > 20000000 ? 'medium' : 'low',
      recommendation:
        amount > 20000000
          ? 'Monitor AR collection closely to maintain positive cash flow'
          : 'No significant impact expected',
    },
    {
      category: 'Q1 Budget Utilization',
      currentValue: 65,
      projectedValue: 65 + (amount / 500000000) * 100,
      change: (amount / 500000000) * 100,
      changePercent: ((amount / 500000000) * 100 / 65) * 100,
      risk: amount > 30000000 ? 'high' : 'medium',
      recommendation:
        amount > 30000000
          ? 'Approaching budget limit. Consider deferring non-critical expenses.'
          : 'Still within acceptable budget range',
    },
    {
      category: 'Operating Margin',
      currentValue: 32.5,
      projectedValue: 32.5 - (amount / 1000000000) * 5,
      change: -(amount / 1000000000) * 5,
      changePercent: -((amount / 1000000000) * 5 / 32.5) * 100,
      risk: 'low',
      recommendation: 'Minimal impact on overall operating margin',
    },
    {
      category: 'Liquidity Ratio',
      currentValue: 2.8,
      projectedValue: 2.8 - (amount / 500000000) * 0.5,
      change: -(amount / 500000000) * 0.5,
      changePercent: -((amount / 500000000) * 0.5 / 2.8) * 100,
      risk: amount > 40000000 ? 'medium' : 'low',
      recommendation:
        amount > 40000000
          ? 'Maintain minimum liquidity ratio of 2.0'
          : 'Liquidity remains healthy',
    },
  ]);

  const overallRiskScore = predictions.reduce((score, p) => {
    if (p.risk === 'high') return score + 3;
    if (p.risk === 'medium') return score + 2;
    return score + 1;
  }, 0) / predictions.length;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high':
        return '🔴 High Risk';
      case 'medium':
        return '🟡 Medium Risk';
      default:
        return '🟢 Low Risk';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-purple-600" />
            AI Impact Analysis
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Predicted financial impact of this {type} approval
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-purple-600">
            {overallRiskScore.toFixed(1)}/3
          </div>
          <div className="text-xs text-gray-600">Risk Score</div>
        </div>
      </div>

      {/* Amount Summary */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Approval Amount</div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</div>
          </div>
          {metadata?.projectName && (
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Project</div>
              <div className="text-lg font-semibold text-gray-900">{metadata.projectName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="space-y-4 mb-6">
        {predictions.map((prediction, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-lg p-4 border-l-4 ${
              prediction.risk === 'high'
                ? 'border-red-500'
                : prediction.risk === 'medium'
                ? 'border-orange-500'
                : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{prediction.category}</h4>
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getRiskColor(
                    prediction.risk
                  )}`}
                >
                  {getRiskBadge(prediction.risk)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Current</div>
                <div className="text-lg font-bold text-gray-900">
                  {prediction.category.includes('Cash') || prediction.category.includes('Budget')
                    ? prediction.category.includes('Budget')
                      ? `${prediction.currentValue.toFixed(1)}%`
                      : formatCurrency(prediction.currentValue)
                    : prediction.currentValue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Projected</div>
                <div className="text-lg font-bold text-purple-600">
                  {prediction.category.includes('Cash') || prediction.category.includes('Budget')
                    ? prediction.category.includes('Budget')
                      ? `${prediction.projectedValue.toFixed(1)}%`
                      : formatCurrency(prediction.projectedValue)
                    : prediction.projectedValue.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Change</div>
                <div
                  className={`text-lg font-bold flex items-center ${
                    prediction.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {prediction.change >= 0 ? (
                    <ArrowTrendingUpIcon className="h-5 w-5 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-5 w-5 mr-1" />
                  )}
                  {formatPercent(prediction.changePercent)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-3 border border-gray-200">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 mr-2" />
                <div>
                  <div className="text-xs font-semibold text-gray-900 mb-1">
                    AI Recommendation:
                  </div>
                  <div className="text-xs text-gray-700">{prediction.recommendation}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Recommendation */}
      <div
        className={`rounded-lg p-4 border-2 ${
          overallRiskScore >= 2.5
            ? 'bg-red-50 border-red-300'
            : overallRiskScore >= 1.5
            ? 'bg-orange-50 border-orange-300'
            : 'bg-green-50 border-green-300'
        }`}
      >
        <div className="flex items-start space-x-3">
          {overallRiskScore >= 2.5 ? (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
          ) : overallRiskScore >= 1.5 ? (
            <ClockIcon className="h-6 w-6 text-orange-600 flex-shrink-0" />
          ) : (
            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 mb-2">Overall Assessment</h4>
            <p className="text-sm text-gray-700">
              {overallRiskScore >= 2.5
                ? '⚠️ High-risk approval. Consider requesting additional justification or deferring to next quarter. Monitor cash flow closely if approved.'
                : overallRiskScore >= 1.5
                ? '⚡ Moderate impact expected. Approval recommended with monitoring of key metrics over next 30 days.'
                : '✅ Low-risk approval. Financial impact is within acceptable parameters. Safe to proceed.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <button className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          Approve with Conditions
        </button>
        <button className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
          <XCircleIcon className="h-5 w-5 mr-2" />
          Request More Info
        </button>
      </div>
    </div>
  );
};

export default ImpactPredictionDashboard;
