import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  LightBulbIcon,
  BanknotesIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: {
    label: string;
    action: () => void;
  }[];
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionable: boolean;
  category: 'cashflow' | 'revenue' | 'expense' | 'risk' | 'opportunity';
}

const AIAssistantPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCEO = user?.role === 'CEO';

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg: Message = {
        id: '0',
        type: 'ai',
        content:
          '👋 Halo! Saya AI Financial Assistant Anda.\n\n' +
          'Saya dapat membantu Anda dengan:\n' +
          '• 📊 Analisis Cash Flow\n' +
          '• 📄 Rekomendasi Invoice\n' +
          '• 💰 Optimasi Biaya\n' +
          '• ⚠️ Deteksi Risiko\n\n' +
          'Tanya apa saja tentang keuangan Anda!',
        timestamp: new Date(),
        suggestions: [
          { label: '💰 Cash Flow?', action: () => handleQuickQuestion('Bagaimana cash flow saya?') },
          { label: '📄 Invoice?', action: () => handleQuickQuestion('Ada invoice yang perlu ditindaklanjuti?') },
          { label: '💡 Hemat?', action: () => handleQuickQuestion('Ada peluang hemat biaya?') },
        ],
      };
      setMessages([welcomeMsg]);
      generateInsights();
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateInsights = () => {
    const demoInsights: AIInsight[] = [
      {
        id: '1',
        title: 'Pola Keterlambatan Pembayaran',
        description:
          '68% invoice dari PT Maju Jaya terlambat rata-rata 4 hari. Rekomendasi: Kirim reminder H-3 dan tawarkan diskon 2% untuk pembayaran tepat waktu.',
        impact: 'negative',
        confidence: 89,
        actionable: true,
        category: 'cashflow',
      },
      {
        id: '2',
        title: 'Peluang Penghematan Biaya',
        description:
          'Analisis menunjukkan potensi penghematan Rp 12jt/bulan dengan mengoptimalkan vendor IT services. 3 vendor alternatif ditemukan dengan harga 15-20% lebih rendah.',
        impact: 'positive',
        confidence: 92,
        actionable: true,
        category: 'expense',
      },
      {
        id: '3',
        title: 'Proyeksi Cash Flow Positif',
        description:
          'Berdasarkan trend pembayaran, cash flow diproyeksikan meningkat 18% dalam 60 hari ke depan. Pertimbangkan investasi atau percepatan proyek strategis.',
        impact: 'positive',
        confidence: 85,
        actionable: true,
        category: 'opportunity',
      },
    ];
    setInsights(demoInsights);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const aiResponse = generateAIResponse(currentInput);
    setIsTyping(false);
    addAIMessage(aiResponse.content, aiResponse.suggestions);
  };

  const addAIMessage = (content: string, suggestions?: any[]) => {
    const msg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      suggestions,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const generateAIResponse = (userInput: string): { content: string; suggestions?: any[] } => {
    const input = userInput.toLowerCase();

    if (input.includes('cash flow') || input.includes('arus kas')) {
      return {
        content:
          '📊 Analisis Cash Flow:\n\n' +
          '✅ Posisi saat ini: Rp 245jt (Sehat)\n' +
          '📈 Proyeksi 30 hari: Rp 198jt (Perlu perhatian)\n' +
          '📉 Proyeksi 60 hari: Rp 156jt (Kritis)\n\n' +
          '⚠️ Rekomendasi:\n' +
          '1. Percepat penagihan 5 invoice outstanding (Total: Rp 125jt)\n' +
          '2. Tunda pembayaran non-urgent hingga 15 hari\n' +
          '3. Pertimbangkan short-term credit facility Rp 50jt',
        suggestions: [
          { label: '📋 Lihat Invoice', action: () => navigate('/invoices') },
          { label: '📊 Dashboard', action: () => navigate('/dashboard') },
        ],
      };
    }

    if (input.includes('invoice')) {
      return {
        content:
          '📄 Status Invoice:\n\n' +
          '⚠️ 5 invoice jatuh tempo dalam 7 hari (Total: Rp 125jt)\n' +
          '🔴 2 invoice overdue (Total: Rp 45jt)\n' +
          '✅ 12 invoice paid this month\n\n' +
          'Rekomendasi: Fokus pada 2 invoice overdue untuk menghindari late payment penalty.',
        suggestions: [{ label: '📋 Lihat Detail', action: () => navigate('/invoices') }],
      };
    }

    if (input.includes('hemat') || input.includes('biaya')) {
      return {
        content:
          '💡 Peluang Penghematan:\n\n' +
          '1. Vendor IT Services: Hemat Rp 12jt/bulan (15-20% lebih murah)\n' +
          '2. Office Supplies: Bulk purchase bisa hemat 10%\n' +
          '3. Utilities: Peak hours usage bisa dioptimalkan\n\n' +
          'Total potensi penghematan: Rp 18jt/bulan atau Rp 216jt/tahun',
        suggestions: [{ label: '💰 Analisis Detail', action: () => navigate('/budget-vs-actual') }],
      };
    }

    return {
      content:
        '🤖 Saya dapat membantu Anda dengan:\n\n' +
        '1. 📊 Analisis Cash Flow dan Prediksi\n' +
        '2. 📄 Rekomendasi Invoice & Penagihan\n' +
        '3. 💼 Monitoring Budget & Alert\n' +
        '4. 💰 Optimasi Biaya & Penghematan\n' +
        '5. ⚠️ Analisis Risiko Keuangan\n\n' +
        'Coba tanya: "Bagaimana cash flow saya?" atau "Ada peluang hemat biaya?"',
      suggestions: [
        { label: '📊 Cash Flow', action: () => handleQuickQuestion('Bagaimana cash flow saya?') },
        { label: '💰 Hemat Biaya', action: () => handleQuickQuestion('Ada peluang hemat biaya?') },
      ],
    };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return '✅';
      case 'negative':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  // Voice Input Handler (CEO Feature)
  const handleVoiceInput = () => {
    setIsListening(!isListening);
    
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        const voiceQuestions = [
          'Bagaimana performa keuangan bulan ini?',
          'Ada risiko yang perlu saya ketahui?',
          'Berapa cash flow kita saat ini?',
        ];
        const randomQuestion = voiceQuestions[Math.floor(Math.random() * voiceQuestions.length)];
        setInputValue(randomQuestion);
        setIsListening(false);
      }, 2000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* CEO Badge */}
      {isCEO && (
        <div className="mb-3 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <div>
              <p className="text-xs font-bold text-amber-900">CEO Premium Features</p>
              <p className="text-[10px] text-amber-700">Voice Command & Advanced AI Analysis</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💬 Chat {isCEO && '🎤'}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'insights'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💡 Insights
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[400px]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-xl ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 border-2 border-purple-200'
                  }`}
                >
                  {msg.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                      <SparklesIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-600">🤖 AI Assistant</span>
                    </div>
                  )}
                  <p className="text-xs whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-purple-200">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={sug.action}
                          className="px-3 py-1.5 bg-white hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 rounded-lg text-xs font-bold transition-all hover:shadow-md border border-purple-200 text-gray-700"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">🤖 Berpikir...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-2 border-gray-200 pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isListening ? '🎤 Mendengarkan...' : 'Tanya sesuatu tentang keuangan...'}
                className="flex-1 px-4 py-2 border-2 border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isListening}
              />
              {/* Voice Input Button (CEO Only) */}
              {isCEO && (
                <button
                  onClick={handleVoiceInput}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    isListening
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white animate-pulse'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg'
                  }`}
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isListening}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{getImpactIcon(insight.impact)}</span>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm mb-1 ${getImpactColor(insight.impact)}`}>
                    {insight.title}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">{insight.description}</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="font-semibold">Confidence Level</span>
                  <span className="font-bold">{insight.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${insight.confidence}%`,
                      backgroundColor:
                        insight.confidence > 80 ? '#10B981' : insight.confidence > 60 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
              </div>

              {insight.actionable && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-all"
                >
                  🚀 Terapkan Rekomendasi
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;
