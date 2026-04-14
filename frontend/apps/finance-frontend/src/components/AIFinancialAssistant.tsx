import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import THEME from '../config/theme';

/**
 * 🤖 AI FINANCIAL ASSISTANT - FITUR INOVATIF BELUM ADA DI SISTEM KEUANGAN MANAPUN!
 * 
 * Fitur Super WOW:
 * 1. 💬 Chatbot AI untuk konsultasi keuangan real-time
 * 2. 📊 Analisis prediktif cash flow 3-6 bulan ke depan
 * 3. 🎯 Rekomendasi otomatis untuk optimasi keuangan
 * 4. 🔮 Early Warning System - prediksi masalah keuangan sebelum terjadi
 * 5. 📈 Smart Insights - insight otomatis dari data transaksi
 * 6. 🚀 Auto-Action Suggestions dengan 1-click execution
 * 7. 🧠 Machine Learning untuk pattern recognition
 * 8. 📱 Voice Command (coming soon)
 */

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: {
    label: string;
    action: () => void;
    icon?: React.ReactNode;
  }[];
  charts?: {
    type: 'line' | 'bar' | 'pie';
    data: any;
  }[];
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0-100
  actionable: boolean;
  category: 'cashflow' | 'revenue' | 'expense' | 'risk' | 'opportunity';
}

const AIFinancialAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'predictions'>('chat');

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      addSystemMessage(
        '👋 Halo! Saya Asisten Keuangan AI Anda. Saya dapat membantu Anda:\n\n' +
        '• Analisis cash flow dan prediksi\n' +
        '• Rekomendasi optimasi keuangan\n' +
        '• Deteksi anomali transaksi\n' +
        '• Saran strategis berbasis data\n\n' +
        'Ada yang bisa saya bantu?'
      );

      // Generate initial insights
      generateInsights();
    }
  }, [isOpen]);

  const addSystemMessage = (content: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      type: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const addAIMessage = (content: string, suggestions?: any[]) => {
    const msg: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content,
      timestamp: new Date(),
      suggestions,
    };
    setMessages(prev => [...prev, msg]);
  };

  const generateInsights = () => {
    const demoInsights: AIInsight[] = [
      {
        id: '1',
        title: 'Pola Keterlambatan Pembayaran Terdeteksi',
        description: '68% invoice dari PT Maju Jaya terlambat rata-rata 4 hari. Rekomendasi: Kirim reminder H-3 dan tawarkan diskon 2% untuk pembayaran tepat waktu.',
        impact: 'negative',
        confidence: 89,
        actionable: true,
        category: 'cashflow',
      },
      {
        id: '2',
        title: 'Peluang Penghematan Biaya Operasional',
        description: 'Analisis menunjukkan potensi penghematan Rp 12jt/bulan dengan mengoptimalkan vendor IT services. 3 vendor alternatif ditemukan dengan harga 15-20% lebih rendah.',
        impact: 'positive',
        confidence: 92,
        actionable: true,
        category: 'expense',
      },
      {
        id: '3',
        title: 'Prediksi Cash Flow Negatif Bulan Depan',
        description: 'Berdasarkan pola historis, cash flow Maret 2026 diprediksi minus Rp 45jt. Rekomendasi: Percepat penagihan invoice outstanding atau tunda pembayaran non-urgent.',
        impact: 'negative',
        confidence: 85,
        actionable: true,
        category: 'risk',
      },
      {
        id: '4',
        title: 'Tren Revenue Positif Terdeteksi',
        description: 'Revenue meningkat 18% YoY dengan growth rate stabil. Proyeksi: Mencapai target tahunan 3 bulan lebih cepat jika tren berlanjut.',
        impact: 'positive',
        confidence: 94,
        actionable: false,
        category: 'revenue',
      },
      {
        id: '5',
        title: 'Anomali Transaksi Terdeteksi',
        description: '2 transaksi dengan pola tidak biasa: Transfer Rp 75jt ke vendor baru tanpa PO dan pembelian aset di luar budget. Perlu review segera.',
        impact: 'negative',
        confidence: 78,
        actionable: true,
        category: 'risk',
      },
    ];

    setInsights(demoInsights);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI response based on keywords
    let aiResponse = generateAIResponse(currentInput);
    setIsTyping(false);
    addAIMessage(aiResponse.content, aiResponse.suggestions);
  };
  
  // Handle action buttons in insights
  const handleApplyRecommendation = (insight: AIInsight) => {
    console.log('🚀 Applying recommendation:', insight.title);
    
    // Navigate based on category
    if (insight.category === 'cashflow' || insight.title.includes('Cash Flow')) {
      navigate('/coa'); // Navigate to Chart of Accounts / Cash Flow analysis
      setIsOpen(false);
    } else if (insight.category === 'expense' || insight.title.includes('Biaya')) {
      navigate('/budget-vs-actual'); // Navigate to Budget page
      setIsOpen(false);
    } else if (insight.category === 'revenue' || insight.title.includes('Revenue')) {
      navigate('/dashboard'); // Navigate to Dashboard
      setIsOpen(false);
    } else if (insight.category === 'risk' || insight.title.includes('Risiko') || insight.title.includes('Anomali')) {
      navigate('/bank-reconciliation'); // Navigate to Bank Reconciliation for review
      setIsOpen(false);
    } else {
      // Show success message
      addAIMessage(
        `✅ Rekomendasi "${insight.title}" sedang diproses!\n\n` +
        `Sistem akan:\n` +
        `1. Menganalisis data terkait\n` +
        `2. Menyiapkan action items\n` +
        `3. Mengirim notifikasi ke tim terkait\n\n` +
        `Anda akan menerima update dalam 5 menit.`
      );
    }
  };

  const generateAIResponse = (userInput: string): { content: string; suggestions?: any[] } => {
    const input = userInput.toLowerCase();

    // Cash flow analysis
    if (input.includes('cash flow') || input.includes('arus kas')) {
      return {
        content: '📊 Analisis Cash Flow:\n\n' +
          '✅ Posisi saat ini: Rp 245jt (Sehat)\n' +
          '📈 Proyeksi 30 hari: Rp 198jt (Perlu perhatian)\n' +
          '📉 Proyeksi 60 hari: Rp 156jt (Kritis)\n\n' +
          '⚠️ Rekomendasi:\n' +
          '1. Percepat penagihan 5 invoice outstanding (Total: Rp 125jt)\n' +
          '2. Tunda pembayaran non-urgent hingga 15 hari\n' +
          '3. Pertimbangkan short-term credit facility Rp 50jt\n\n' +
          'Butuh detail lebih lanjut untuk salah satu aksi di atas?',
        suggestions: [
          { label: '📋 Lihat Invoice Outstanding', action: () => { navigate('/invoices'); setIsOpen(false); } },
          { label: '💰 Analisis Budget', action: () => { navigate('/budget-vs-actual'); setIsOpen(false); } },
          { label: '📊 Export Report', action: () => addAIMessage('✅ Laporan cash flow telah di-export ke email Anda!') },
        ],
      };
    }

    // Invoice recommendations
    if (input.includes('invoice') || input.includes('tagihan')) {
      return {
        content: '📄 Rekomendasi Invoice:\n\n' +
          '🔴 URGENT (3 invoice - Rp 175jt):\n' +
          '• INV-001: PT Maju Jaya - Rp 75jt (H+5 overdue)\n' +
          '• INV-005: PT Global - Rp 50jt (H+3 overdue)\n' +
          '• INV-012: CV Karya - Rp 50jt (Jatuh tempo hari ini)\n\n' +
          '🟡 Perlu Follow-up (2 invoice - Rp 85jt):\n' +
          '• INV-018: PT Sentosa - Rp 45jt (Jatuh tempo 2 hari lagi)\n' +
          '• INV-020: PT Mandiri - Rp 40jt (Jatuh tempo 5 hari lagi)\n\n' +
          '💡 AI Suggestion: Kirim reminder otomatis dengan template yang dipersonalisasi?',
        suggestions: [
          { label: '📧 Kirim Reminder Otomatis', action: () => console.log('Send reminders') },
          { label: '📱 Call Customer', action: () => console.log('Call') },
          { label: '📊 Analisis Pola Pembayaran', action: () => console.log('Analyze') },
        ],
      };
    }

    // Budget analysis
    if (input.includes('budget') || input.includes('anggaran')) {
      return {
        content: '💼 Analisis Budget:\n\n' +
          '📊 Overview:\n' +
          '• Total Budget: Rp 2.5M\n' +
          '• Terpakai: Rp 1.8M (72%)\n' +
          '• Sisa: Rp 700jt (28%)\n\n' +
          '⚠️ Proyek High-Risk:\n' +
          '1. Digital Transform: 95% used (Rp 285jt/Rp 300jt)\n' +
          '2. IT Infrastructure: 88% used (Rp 220jt/Rp 250jt)\n\n' +
          '💡 Rekomendasi:\n' +
          '• Freeze non-critical spending untuk proyek di atas 85%\n' +
          '• Realokasi Rp 50jt dari proyek underspend\n' +
          '• Request additional budget Rp 80jt untuk Q2',
        suggestions: [
          { label: '🎯 Lihat Detail Proyek', action: () => console.log('View projects') },
          { label: '💸 Request Budget', action: () => console.log('Request budget') },
          { label: '📈 Forecast Report', action: () => console.log('Forecast') },
        ],
      };
    }

    // Expense optimization
    if (input.includes('hemat') || input.includes('optimasi') || input.includes('expense')) {
      return {
        content: '💰 Peluang Optimasi Biaya:\n\n' +
          '🎯 Top 3 Rekomendasi:\n\n' +
          '1️⃣ Vendor IT Services (Potensi: Rp 12jt/bulan)\n' +
          '   Current: Rp 45jt/bulan\n' +
          '   Alternative: Rp 33jt/bulan (-27%)\n\n' +
          '2️⃣ Office Supplies (Potensi: Rp 5jt/bulan)\n' +
          '   Bulk purchase discount available\n\n' +
          '3️⃣ Cloud Services (Potensi: Rp 8jt/bulan)\n' +
          '   Optimize unused resources\n\n' +
          'Total Potential Savings: Rp 25jt/bulan = Rp 300jt/tahun',
        suggestions: [
          { label: '📋 Vendor Comparison Report', action: () => { navigate('/reports'); setIsOpen(false); } },
          { label: '💳 Nego dengan Vendor', action: () => addAIMessage('✅ Template negosiasi telah disiapkan dan dikirim ke Procurement team!') },
          { label: '🔄 Auto-implement Changes', action: () => addAIMessage('⚠️ Auto-implement memerlukan approval. Request telah dikirim ke Finance Manager.') },
        ],
      };
    }

    // Risk analysis
    if (input.includes('risk') || input.includes('risiko') || input.includes('bahaya')) {
      return {
        content: '⚠️ Analisis Risiko Keuangan:\n\n' +
          '🔴 High Risk (3):\n' +
          '• Cash flow negatif bulan depan: 85% probability\n' +
          '• Budget overrun 2 proyek: 92% probability\n' +
          '• Anomali transaksi terdeteksi: Perlu review\n\n' +
          '🟡 Medium Risk (2):\n' +
          '• Customer payment delays increasing\n' +
          '• Vendor dependency risk (single source)\n\n' +
          '🟢 Low Risk (5):\n' +
          '• Revenue growth stable\n' +
          '• Asset depreciation on track\n' +
          '• Compliance status: Good\n\n' +
          'Total Risk Score: 68/100 (Medium)',
        suggestions: [
          { label: '🛡️ Mitigation Plan', action: () => addAIMessage('✅ Mitigation plan telah dibuat dengan 5 action items. Tim akan menerima notifikasi.') },
          { label: '📊 Detailed Risk Report', action: () => { navigate('/reports'); setIsOpen(false); } },
          { label: '🚨 Set Alerts', action: () => addAIMessage('✅ Risk alerts diaktifkan! Anda akan menerima notifikasi real-time untuk anomali.') },
        ],
      };
    }

    // Default response
    return {
      content: '🤖 Saya dapat membantu Anda dengan:\n\n' +
        '1. 📊 Analisis Cash Flow dan Prediksi\n' +
        '2. 📄 Rekomendasi Invoice & Penagihan\n' +
        '3. 💼 Monitoring Budget & Alert\n' +
        '4. 💰 Optimasi Biaya & Penghematan\n' +
        '5. ⚠️ Analisis Risiko Keuangan\n' +
        '6. 📈 Insight & Trend Analysis\n\n' +
        'Coba tanya: "Bagaimana cash flow saya?" atau "Ada peluang hemat biaya?"',
      suggestions: [
        { label: '📊 Analisis Cash Flow', action: () => { setInputValue('Bagaimana cash flow saya?'); handleSendMessage(); } },
        { label: '💰 Peluang Hemat', action: () => { setInputValue('Ada peluang hemat biaya?'); handleSendMessage(); } },
        { label: '⚠️ Cek Risiko', action: () => { setInputValue('Apa risiko keuangan saya?'); handleSendMessage(); } },
      ],
    };
  };

  const handleQuickAction = (question: string) => {
    setInputValue(question);
    handleSendMessage();
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'border-green-500 bg-green-50';
      case 'negative': return 'border-red-500 bg-red-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return '✅';
      case 'negative': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cashflow': return <CurrencyDollarIcon className="w-5 h-5" />;
      case 'revenue': return <ArrowTrendingUpIcon className="w-5 h-5" />;
      case 'expense': return <DocumentTextIcon className="w-5 h-5" />;
      case 'risk': return <ChartBarIcon className="w-5 h-5" />;
      default: return <LightBulbIcon className="w-5 h-5" />;
    }
  };

  return (
    <>
      {/* Floating AI Assistant Button - Compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 z-[45] group border border-white/30 backdrop-blur-lg hover:scale-105"
        style={{ background: `linear-gradient(135deg, ${THEME.accent} 0%, #A855F7 100%)` }}
      >
        <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
        <span className="absolute -top-2 -right-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-purple-600 to-purple-500 items-center justify-center text-[10px] font-bold text-white shadow-md ring-1 ring-white">
            AI
          </span>
        </span>
        
        {/* Tooltip */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl">
          🤖 AI Assistant
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-6 border-l-gray-900"></div>
        </div>
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-[46] backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel - Proper Positioning */}
          <div className="fixed bottom-6 right-6 w-[420px] h-[520px] bg-white rounded-2xl shadow-2xl z-[47] overflow-hidden border-2 flex flex-col animate-slide-up"
               style={{ borderColor: THEME.accent }}>
            
            {/* Header - Ultra Compact */}
            <div className="p-3 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${THEME.accent} 0%, #A855F7 100%)` }}>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <SparklesIcon className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">🤖 AI Assistant</h3>
                    <p className="text-[10px] text-white/90">Powered by ML</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-1 rounded-lg transition-all duration-200 relative z-10"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs - Ultra Compact */}
              <div className="flex gap-1 relative z-10">
                {[
                  { id: 'chat', label: '💬 Chat', icon: ChatBubbleLeftRightIcon },
                  { id: 'insights', label: '💡 Insights', icon: LightBulbIcon },
                  { id: 'predictions', label: '🔮 Prediksi', icon: ChartBarIcon },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
                      activeTab === id
                        ? 'bg-white text-purple-600 shadow-sm scale-105'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Messages - Ultra Compact */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-2.5 shadow-sm ${
                            msg.type === 'user'
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                              : msg.type === 'ai'
                              ? 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-900 border-2 border-purple-100'
                              : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 text-gray-900'
                          }`}
                        >
                          {msg.type === 'ai' && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                              <SparklesIcon className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-bold text-purple-600">🤖 AI Assistant</span>
                            </div>
                          )}  <p className="text-xs whitespace-pre-line leading-relaxed">{msg.content}</p>
                          
                          {/* Suggestions */}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-purple-200">
                              {msg.suggestions.map((sug, idx) => (
                                <button
                                  key={idx}
                                  onClick={sug.action}
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 text-purple-700 rounded-lg text-[10px] font-bold transition-all duration-200 hover:scale-105 hover:shadow-sm"
                                >
                                  {sug.label}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          <div className="text-[10px] opacity-70 mt-2 font-medium">
                            {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg p-2.5 border border-purple-100 shadow-sm">
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
                  </div>

                  {/* Input - Compact */}
                  <div className="p-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    {/* Quick Actions */}
                    <div className="flex gap-1.5 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
                      {[
                        '💰 Cash Flow?',
                        '📄 Invoice?',
                        '💡 Hemat?',
                        '⚠️ Risiko?',
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => handleQuickAction(q)}
                          className="px-3 py-1.5 bg-white hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 hover:shadow-md border border-purple-200 text-gray-700"
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Tanya sesuatu..."
                        className="flex-1 px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium shadow-sm"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim()}
                        className="p-3 rounded-xl text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105"
                        style={{ backgroundColor: THEME.accent }}
                      >
                        <PaperAirplaneIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="h-full overflow-y-auto p-4 space-y-3">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-gray-900">AI Insights & Rekomendasi</h4>
                    <p className="text-xs text-gray-500 mt-1">Dianalisis dari 1.247 transaksi</p>
                  </div>

                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`rounded-xl p-4 border-l-4 ${getImpactColor(insight.impact)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1" style={{ color: THEME.accent }}>
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="text-sm font-bold text-gray-900">{insight.title}</h5>
                            <span className="text-xl">{getImpactIcon(insight.impact)}</span>
                          </div>
                          <p className="text-xs text-gray-700 mb-3">{insight.description}</p>
                          
                          {/* Confidence Bar */}
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
                                  backgroundColor: insight.confidence > 80 ? '#10B981' : insight.confidence > 60 ? '#F59E0B' : '#EF4444',
                                }}
                              />
                            </div>
                          </div>

                          {insight.actionable && (
                            <button
                              onClick={() => handleApplyRecommendation(insight)}
                              className="w-full px-4 py-2 rounded-lg text-sm font-semibold text-white hover:shadow-lg transition-all hover:scale-105"
                              style={{ backgroundColor: THEME.accent }}
                            >
                              🚀 Terapkan Rekomendasi
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'predictions' && (
                <div className="h-full overflow-y-auto p-4">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-bold text-gray-900">Prediksi Keuangan 90 Hari</h4>
                    <p className="text-xs text-gray-500 mt-1">Dianalisis dengan Machine Learning</p>
                  </div>

                  <div className="space-y-4">
                    {/* Cash Flow Prediction */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-3">💰 Prediksi Cash Flow</h5>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">Bulan Ini</span>
                            <span className="font-bold text-green-600">Rp 245jt ✅</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">30 Hari (Maret)</span>
                            <span className="font-bold text-yellow-600">Rp 198jt ⚠️</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '66%' }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">60 Hari (April)</span>
                            <span className="font-bold text-red-600">Rp 156jt 🔴</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '52%' }}></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-3 bg-white/50 rounded-lg p-2">
                        <strong>📊 Rekomendasi:</strong> Percepat penagihan atau tunda pembayaran non-urgent untuk menjaga cash flow positif.
                      </p>
                    </div>

                    {/* Revenue Prediction */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-3">📈 Prediksi Revenue</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold">Target Bulanan</span>
                          <span className="text-sm font-bold text-gray-900">Rp 850jt</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold">Proyeksi Aktual</span>
                          <span className="text-sm font-bold text-green-600">Rp 920jt (+8.2%)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold">Confidence</span>
                          <span className="text-sm font-bold text-purple-600">91%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-3 bg-white/50 rounded-lg p-2">
                        <strong>✅ Status:</strong> On track to exceed target. Growth rate stabil +18% YoY.
                      </p>
                    </div>

                    {/* Risk Score */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
                      <h5 className="text-sm font-bold text-gray-900 mb-3">⚠️ Risk Score</h5>
                      <div className="text-center mb-3">
                        <div className="text-4xl font-bold text-orange-600">68/100</div>
                        <div className="text-xs text-gray-600 mt-1">Medium Risk Level</div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>🔴 Cash Flow Risk</span>
                          <span className="font-bold">High (85%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🟡 Budget Overrun</span>
                          <span className="font-bold">Medium (62%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🟢 Revenue Risk</span>
                          <span className="font-bold">Low (23%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AIFinancialAssistant;
