import React, { useState, useEffect, useRef } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatWidgetProps {
  role?: 'finance' | 'ceo';
  onClose?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ role = 'finance', onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Halo! 👋 Saya siap membantu Anda dengan pertanyaan finansial. Apa yang ingin Anda tanyakan?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Theme colors based on role
  const themeConfig = {
    finance: {
      bg: 'bg-blue-50',
      headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
      userMessageBg: 'bg-blue-600',
      userMessageText: 'text-white',
      userTimestampText: 'text-blue-100',
      botMessageBg: 'bg-white border border-blue-300',
      botMessageText: 'text-gray-800',
      botTimestampText: 'text-blue-500',
      buttonHover: 'hover:bg-blue-700',
      accentColor: '#2563EB',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-300',
    },
    ceo: {
      bg: 'bg-amber-50',
      headerBg: 'bg-gradient-to-r from-red-700 to-red-900',
      userMessageBg: 'bg-red-700',
      userMessageText: 'text-white',
      userTimestampText: 'text-red-100',
      botMessageBg: 'bg-white border border-red-300',
      botMessageText: 'text-gray-800',
      botTimestampText: 'text-red-600',
      buttonHover: 'hover:bg-red-800',
      accentColor: '#DC2626',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
    },
  };

  const theme = themeConfig[role] || themeConfig.finance;

  const commonQuestions = [
    '💰 Berapa total hutang kami?',
    '📊 Bagaimana performa bulan ini?',
    '⏰ Invoice apa yang belum dibayar?',
    '📈 Prediksi cash flow',
    '❓ Bantuan umum',
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue, role);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  };

  const generateBotResponse = (userInput: string, userRole: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('hutang') || input.includes('payable')) {
      return `📊 Total Hutang Perusahaan:\n\n• Total: Rp 170.909.999,95\n• Pending: Rp 170.809.999,95\n• Overdue: Rp 0\n\nAnda dapat melihat detail selengkapnya di menu Utang (Payables).`;
    }

    if (input.includes('invoice') || input.includes('piutang')) {
      return `📄 Status Invoice Terkini:\n\n• Total Invoice: Rp 2.4M\n• Sudah Dibayar: Rp 250K\n• Pending: Rp 2.15M\n• Overdue: Rp 0\n\nBuka menu "Manajemen Invoice" untuk detail lebih lanjut.`;
    }

    if (input.includes('cash flow') || input.includes('aliran kas')) {
      return `💸 Proyeksi Cash Flow:\n\n• Inflow Bulan Ini: Rp 500M\n• Outflow Bulan Ini: Rp 350M\n• Net Cash Flow: Rp 150M ✅\n\nTren positif bulan ini. Lihat dashboard untuk chart lengkap.`;
    }

    if (input.includes('margin') || input.includes('profit')) {
      return `📈 Analisis Margin Kotor:\n\n${
        userRole === 'ceo'
          ? '• Target Margin: 26-65%\n• Margin Aktual: 42%\n• Status: ✅ On Track\n\nSemua project sedang mencapai target margin yang ditetapkan.'
          : '• Rata-rata Margin: 42%\n• Range: 26-65%\n• Kelompok Margin Tertinggi: Project B (58%)\n\nLihat detail di Kokpit Kebijakan > Kebijakan Margin.'
      }`;
    }

    if (input.includes('bantuan') || input.includes('help')) {
      return `💡 Fitur Chat Tersedia:\n\n✨ Anda bisa bertanya tentang:\n• Hutang & Piutang\n• Invoice & Pembayaran\n• Cash Flow & Proyeksi\n• Margin & Profit\n• Status Dokumen\n• Dan pertanyaan finansial lainnya\n\nKetik pertanyaan Anda dalam bahasa Indonesia! 🇮🇩`;
    }

    return `Terima kasih atas pertanyaan Anda! ${
      userRole === 'ceo'
        ? 'Sebagai CEO, Anda dapat melihat kesimpulan strategis di CEO Dashboard. '
        : 'Sebagai Finance Admin, Anda dapat mengakses detail operasional lengkap di halaman Finance. '
    }\n\nNamun, saya masih belajar merespons query kompleks. Silakan periksa dashboard atau kokpit kebijakan untuk informasi terperinci.`;
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl shadow-2xl overflow-hidden ${theme.bg}`}>
      {/* Header */}
      <div className={`${theme.headerBg} px-6 py-4 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <SparklesIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {role === 'ceo' ? '💡 CEO Assistant' : '💼 Finance Assistant'}
            </h3>
            <p className="text-xs opacity-75">Powered by AI</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-xl ${
                message.sender === 'user'
                  ? `${theme.userMessageBg} ${theme.userMessageText} rounded-br-none`
                  : `${theme.botMessageBg} ${theme.botMessageText} rounded-bl-none`
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <div
                className={`text-xs mt-2 ${
                  message.sender === 'user' ? theme.userTimestampText : theme.botTimestampText
                } flex items-center gap-1`}
              >
                {message.sender === 'bot' && <CheckIcon className="w-3 h-3" />}
                {message.timestamp.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`${theme.botMessageBg} px-4 py-3 rounded-xl rounded-bl-none`}>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions (if no conversation yet) */}
      {messages.length === 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs font-semibold mb-2 text-gray-600">Pertanyaan Cepat:</p>
          <div className="grid grid-cols-2 gap-2">
            {commonQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(question)}
                className={`text-xs px-3 py-2 rounded-lg border ${theme.textColor} border-current/30 hover:bg-white/50 transition-colors`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={`border-t ${theme.borderColor} p-4 bg-white`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Tanyakan sesuatu..."
            className={`flex-1 px-4 py-2 rounded-lg border-2 focus:outline-none transition-colors ${theme.textColor}`}
            style={{
              borderColor: theme.accentColor + '40',
              '--focus-border-color': theme.accentColor,
            } as React.CSSProperties & { '--focus-border-color': string }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className={`p-2 rounded-lg text-white transition-colors ${theme.buttonHover}`}
            style={{ backgroundColor: theme.accentColor }}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Ketik pertanyaan tentang finansial perusahaan
        </p>
      </div>
    </div>
  );
};

export default ChatWidget;
