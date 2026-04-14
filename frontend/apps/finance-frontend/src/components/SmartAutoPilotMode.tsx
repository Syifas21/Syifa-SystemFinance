import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  BoltIcon,
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AutoPilotDecision {
  id: string;
  type: 'approval' | 'rejection';
  item: string;
  amount: number;
  confidence: number;
  reasoning: string[];
  status: 'pending' | 'executed' | 'overridden';
  timestamp: Date;
}

const SmartAutoPilotMode: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [threshold, setThreshold] = useState(85); // Confidence threshold %
  const [decisions, setDecisions] = useState<AutoPilotDecision[]>([
    {
      id: '1',
      type: 'approval',
      item: 'Pengeluaran Marketing - Iklan Digital',
      amount: 15000000,
      confidence: 92,
      reasoning: [
        '✓ Amount di bawah limit otomatis (Rp 20jt)',
        '✓ Kategori yang sering disetujui CEO (95% approval rate)',
        '✓ Budget masih tersedia (48% dari alokasi bulan ini)',
        '✓ ROI historis kategori ini: 320%',
      ],
      status: 'executed',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'approval',
      item: 'Pembelian Software License - Development Tools',
      amount: 18500000,
      confidence: 88,
      reasoning: [
        '✓ Vendor terpercaya (10x transaksi sebelumnya approved)',
        '✓ Kategori essential untuk operasional',
        '✓ Pattern matching: CEO selalu approve kategori ini',
        '⚠️ Amount mendekati upper limit',
      ],
      status: 'executed',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'rejection',
      item: 'Klaim Entertainment - Client Dinner',
      amount: 28000000,
      confidence: 76,
      reasoning: [
        '⚠️ Amount di atas threshold CEO (Rp 25jt)',
        '⚠️ Kategori entertainment memiliki rejection rate tinggi (35%)',
        '⚠️ Tidak ada supporting document purchase order',
        '? Confidence di bawah threshold - MEMERLUKAN REVIEW MANUAL',
      ],
      status: 'pending',
      timestamp: new Date(),
    },
  ]);

  const [stats, setStats] = useState({
    totalProcessed: 47,
    autoApproved: 38,
    autoRejected: 5,
    flaggedForReview: 4,
    accuracyRate: 96.2,
    timeSaved: 3.5, // hours
  });

  useEffect(() => {
    console.log('🤖 Smart Auto-Pilot Mode loaded');
  }, []);

  const toggleAutoPilot = () => {
    setIsEnabled(!isEnabled);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 75) return 'text-blue-600 bg-blue-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with Toggle */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-full p-3">
              <CpuChipIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                Smart Auto-Pilot Mode
                <SparklesIcon className="h-6 w-6 ml-2 animate-pulse" />
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                AI belajar dari keputusan Anda & otomatis approve/reject
              </p>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={toggleAutoPilot}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-white text-sm font-semibold">
              {isEnabled ? '✓ Aktif' : '○ Nonaktif'}
            </span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/80 text-xs mb-1">Total Diproses</div>
            <div className="text-white text-2xl font-bold">{stats.totalProcessed}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/80 text-xs mb-1">Auto-Approved</div>
            <div className="text-green-300 text-2xl font-bold">{stats.autoApproved}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/80 text-xs mb-1">Akurasi AI</div>
            <div className="text-yellow-300 text-2xl font-bold">{stats.accuracyRate}%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-white/80 text-xs mb-1">Waktu Hemat</div>
            <div className="text-blue-300 text-2xl font-bold">{stats.timeSaved}h</div>
          </div>
        </div>
      </div>

      {/* Confidence Threshold Slider */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-gray-900">Confidence Threshold</div>
            <div className="text-sm text-gray-600">AI hanya execute jika confidence &gt; threshold ini</div>
          </div>
          <div className="text-3xl font-bold text-purple-600">{threshold}%</div>
        </div>
        <input
          type="range"
          min="50"
          max="99"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>50% (Agresif)</span>
          <span>75% (Balanced)</span>
          <span>99% (Konservatif)</span>
        </div>
      </div>

      {/* Recent AI Decisions */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BoltIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Keputusan AI Terbaru
        </h3>

        <div className="space-y-4">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className={`border-2 rounded-lg p-4 ${
                decision.status === 'executed'
                  ? 'border-green-200 bg-green-50'
                  : decision.status === 'pending'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {decision.type === 'approval' ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900">{decision.item}</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {formatCurrency(decision.amount)}
                  </div>
                </div>
                
                {/* Confidence Badge */}
                <div className={`px-3 py-1 rounded-full font-bold text-sm ${getConfidenceColor(decision.confidence)}`}>
                  {decision.confidence}% Confidence
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-white rounded-lg p-3 mb-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">🤖 Alasan AI:</div>
                <ul className="space-y-1">
                  {decision.reasoning.map((reason, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start">
                      <span className="mr-2">{reason.startsWith('✓') ? '✓' : reason.startsWith('⚠️') ? '⚠️' : '?'}</span>
                      <span>{reason.replace(/^[✓⚠️?]\s/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>{decision.timestamp.toLocaleString('id-ID')}</span>
                </div>
                
                {decision.status === 'executed' ? (
                  <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                    ✓ Executed by AI
                  </span>
                ) : decision.status === 'pending' ? (
                  <span className="px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded-full">
                    ⏳ Menunggu Review Manual
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-full">
                    Override by User
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Status */}
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-t">
        <div className="flex items-start space-x-3">
          <SparklesIcon className="h-6 w-6 text-purple-600 flex-shrink-0" />
          <div>
            <div className="font-semibold text-gray-900 mb-1">🧠 Status Learning AI</div>
            <div className="text-sm text-gray-700 space-y-1">
              <p>• AI telah mempelajari <strong>478 keputusan</strong> Anda sebelumnya</p>
              <p>• Pattern recognition: <strong>12 kategori</strong> dengan 95%+ accuracy</p>
              <p>• Prediksi makin akurat seiring waktu - <strong>learning rate: 2.3%/minggu</strong></p>
              <p>• Next improvement in: <strong>24 hours</strong> (scheduled re-training)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartAutoPilotMode;
