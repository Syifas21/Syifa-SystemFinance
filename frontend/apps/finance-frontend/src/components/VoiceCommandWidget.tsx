import React, { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface VoiceCommand {
  command: string;
  timestamp: Date;
  action: string;
  confidence: number;
}

interface VoiceCommandWidgetProps {
  onCommand?: (command: string) => void;
}

const VoiceCommandWidget: React.FC<VoiceCommandWidgetProps> = ({ onCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [hasCheckedSupport, setHasCheckedSupport] = useState(false);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setIsSupported(supported);
    setHasCheckedSupport(true);
    
    // Only log once when component mounts
    if (!supported) {
      console.log('ℹ️ Voice Command tidak tersedia - Browser tidak mendukung Web Speech API. Gunakan Chrome/Edge terbaru untuk mengaktifkan fitur ini.');
    } else {
      console.log('✅ Voice Command tersedia');
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Browser Anda tidak mendukung Voice Recognition. Gunakan Chrome/Edge terbaru.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; // Bahasa Indonesia
    recognition.continuous = false;
    recognition.interimResults = true; // Show interim results
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Voice Recognition STARTED - Silakan bicara...');
      setIsListening(true);
      setTranscript('🎤 Mendengarkan... Silakan bicara sekarang!');
    };

    recognition.onresult = (event: any) => {
      console.log('📝 Speech detected:', event);
      const result = event.results[event.results.length - 1];
      const command = result[0].transcript.toLowerCase();
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;
      
      console.log('📝 Transcript:', command, '| Confidence:', confidence, '| Final:', isFinal);
      setTranscript(command);
      
      if (isFinal) {
        console.log('✅ FINAL result, processing command...');
        processVoiceCommand(command, confidence);
      }
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ Speech DETECTED!');
      setTranscript('🗣️ Suara terdeteksi... mendengarkan...');
    };

    recognition.onspeechend = () => {
      console.log('🛑 Speech ENDED');
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      let errorMsg = 'Error: ';
      
      switch(event.error) {
        case 'no-speech':
          errorMsg += 'Tidak ada suara terdeteksi. Bicara lebih keras!';
          break;
        case 'audio-capture':
          errorMsg += 'Microphone tidak ditemukan!';
          break;
        case 'not-allowed':
          errorMsg += 'Izin microphone ditolak! Allow microphone di browser settings.';
          break;
        default:
          errorMsg += event.error;
      }
      
      setTranscript(errorMsg);
      setIsListening(false);
      alert(errorMsg);
    };

    recognition.onend = () => {
      console.log('🏁 Recognition ENDED');
      setIsListening(false);
      
      // Auto-hide transcript after 5 seconds
      setTimeout(() => {
        if (!isListening) {
          setTranscript('');
        }
      }, 5000);
    };

    try {
      console.log('🚀 Starting recognition...');
      recognition.start();
    } catch (error) {
      console.error('❌ Failed to start:', error);
      alert('Gagal memulai voice recognition: ' + error);
    }
  };

  const processVoiceCommand = (command: string, confidence: number) => {
    console.log('🤖 Processing command:', command, '| Confidence:', confidence);
    
    // If parent component provided onCommand handler, use it
    if (onCommand) {
      onCommand(command);
      const newCommand: VoiceCommand = {
        command,
        timestamp: new Date(),
        action: 'Executed by parent',
        confidence,
      };
      setRecentCommands((prev) => [newCommand, ...prev].slice(0, 5));
      return;
    }

    // Default fallback behavior (if no onCommand provided)
    let action = 'Unknown';
    let executed = false;

    // Normalize command
    const cmd = command.toLowerCase().trim();

    // Parse commands in Indonesian
    if (cmd.includes('setuju') || cmd.includes('approve') || cmd.includes('oke') || cmd.includes('yes')) {
      action = 'Menyetujui permintaan';
      executed = true;
      console.log('✅ ACTION: APPROVE');
      
      // Dispatch custom event for approval pages to listen
      window.dispatchEvent(new CustomEvent('voice-approve', { 
        detail: { command, confidence } 
      }));
      
      alert('✅ VOICE COMMAND: SETUJUI\n\nPerintah terdeteksi dengan confidence ' + (confidence * 100).toFixed(0) + '%\n\nJika ada item yang dipilih, akan disetujui otomatis.');
    } else if (cmd.includes('tolak') || cmd.includes('reject') || cmd.includes('tidak') || cmd.includes('no')) {
      action = 'Menolak permintaan';
      executed = true;
      console.log('❌ ACTION: REJECT');
      
      // Dispatch custom event for approval pages to listen
      window.dispatchEvent(new CustomEvent('voice-reject', { 
        detail: { command, confidence } 
      }));
      
      alert('❌ VOICE COMMAND: TOLAK\n\nPerintah terdeteksi dengan confidence ' + (confidence * 100).toFixed(0) + '%\n\nJika ada item yang dipilih, akan ditolak otomatis.');
    }
    // Filter commands for monitoring pages
    else if (cmd.includes('filter') || cmd.includes('tampilkan')) {
      action = 'Mengubah filter';
      executed = true;
      console.log('🔍 ACTION: FILTER');
      window.dispatchEvent(new CustomEvent('voice-approve', { 
        detail: { command, confidence } 
      }));
      alert('🔍 VOICE COMMAND: FILTER\n\n"' + command + '"\n\nConfidence: ' + (confidence * 100).toFixed(0) + '%');
    }
    // Export command
    else if (cmd.includes('export') || cmd.includes('unduh') || cmd.includes('download')) {
      action = 'Export data';
      executed = true;
      console.log('📥 ACTION: EXPORT');
      window.dispatchEvent(new CustomEvent('voice-approve', { 
        detail: { command, confidence } 
      }));
      alert('📥 VOICE COMMAND: EXPORT\n\nMemproses export data...\n\nConfidence: ' + (confidence * 100).toFixed(0) + '%');
    }
    // View detail command
    else if (cmd.includes('lihat detail') || cmd.includes('view detail') || cmd.includes('detail')) {
      action = 'Lihat detail';
      executed = true;
      console.log('👁️ ACTION: VIEW DETAIL');
      window.dispatchEvent(new CustomEvent('voice-approve', { 
        detail: { command, confidence } 
      }));
      alert('👁️ VOICE COMMAND: LIHAT DETAIL\n\nMembuka detail item...\n\nConfidence: ' + (confidence * 100).toFixed(0) + '%');
    }
    // Refresh command
    else if (cmd.includes('refresh') || cmd.includes('muat ulang') || cmd.includes('reload')) {
      action = 'Refresh halaman';
      executed = true;
      console.log('🔄 ACTION: REFRESH');
      window.dispatchEvent(new CustomEvent('voice-approve', { 
        detail: { command, confidence } 
      }));
      alert('🔄 VOICE COMMAND: REFRESH\n\nMemuat ulang data...');
    }
    else if (cmd.includes('dashboard') || cmd.includes('home') || cmd.includes('beranda')) {
      action = 'Membuka Dashboard';
      console.log('🏠 ACTION: DASHBOARD');
      alert('🏠 VOICE COMMAND: DASHBOARD\n\nMembuka dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      executed = true;
    } else if (cmd.includes('laporan') || cmd.includes('report')) {
      action = 'Membuka Laporan';
      console.log('📊 ACTION: REPORTS');
      alert('📊 VOICE COMMAND: LAPORAN\n\nMembuka laporan...');
      setTimeout(() => {
        window.location.href = '/reports';
      }, 500);
      executed = true;
    } else if (cmd.includes('help') || cmd.includes('bantuan')) {
      action = 'Menampilkan bantuan';
      alert('🎤 PERINTAH SUARA YANG TERSEDIA:\n\n' +
        '✅ APPROVAL:\n' +
        '  • "Setujui" / "Oke"\n' +
        '  • "Tolak" / "Tidak"\n\n' +
        '🔍 MONITORING:\n' +
        '  • "Filter Paid/Pending/Overdue"\n' +
        '  • "Export" / "Unduh"\n' +
        '  • "Lihat Detail"\n' +
        '  • "Refresh"\n\n' +
        '🧭 NAVIGATION:\n' +
        '  • "Dashboard"\n' +
        '  • "Laporan"\n\n' +
        'Confidence: ' + (confidence * 100).toFixed(0) + '%');
      executed = true;
    } else {
      console.log('❓ Unknown command:', cmd);
      alert('❓ PERINTAH TIDAK DIKENALI\n\nAnda bilang: "' + command + '"\n\n' +
        'Coba perintah:\n' +
        '✓ "Setujui" / "Tolak"\n' +
        '✓ "Filter Paid/Pending"\n' +
        '✓ "Export"\n' +
        '✓ "Lihat Detail"\n' +
        '✓ "Refresh"\n' +
        '✓ "Dashboard" / "Laporan"\n' +
        '✓ "Bantuan"');
    }

    if (executed) {
      const newCommand: VoiceCommand = {
        command,
        timestamp: new Date(),
        action,
        confidence,
      };
      setRecentCommands((prev) => [newCommand, ...prev].slice(0, 5));
    }
  };

  // Don't render anything if browser support hasn't been checked yet
  if (!hasCheckedSupport) {
    return null;
  }

  // Don't render widget if not supported (cleaner UI)
  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <div className="relative">
        {/* Voice Command Button */}
        <button
          onClick={startListening}
          disabled={isListening}
          className={`
            w-16 h-16 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-300 transform hover:scale-110
            ${
              isListening
                ? 'bg-red-600 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
            }
          `}
          title="Klik untuk Voice Command"
        >
          {isListening ? (
            <div className="relative">
              <MicrophoneIcon className="h-8 w-8 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-300 rounded-full animate-ping"></div>
            </div>
          ) : (
            <MicrophoneIcon className="h-8 w-8 text-white" />
          )}
        </button>

        {/* Listening Animation */}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="absolute bottom-20 right-0 w-72 bg-white rounded-lg shadow-xl p-4 mb-2">
          <div className="flex items-start space-x-2">
            <MicrophoneIcon className="h-5 w-5 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Perintah Anda:</div>
              <div className="text-sm font-semibold text-gray-900">{transcript}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Commands List */}
      {recentCommands.length > 0 && (
        <div className="absolute bottom-20 right-20 w-80 bg-white rounded-lg shadow-xl p-4 mb-2 max-h-96 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            Perintah Terakhir
          </div>
          <div className="space-y-2">
            {recentCommands.map((cmd, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50 rounded">
                <div className="text-xs font-semibold text-purple-900">{cmd.action}</div>
                <div className="text-xs text-gray-600 mt-1">"{cmd.command}"</div>
                <div className="text-xs text-gray-400 mt-1">
                  Confidence: {(cmd.confidence * 100).toFixed(0)}% • {cmd.timestamp.toLocaleTimeString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandWidget;
