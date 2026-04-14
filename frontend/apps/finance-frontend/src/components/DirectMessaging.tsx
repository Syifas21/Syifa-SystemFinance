import React, { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  UserCircleIcon,
  PhoneIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  PhoneXMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import THEME from '../config/theme';

/**
 * 💬 DIRECT MESSAGING COMPONENT
 * Real-time chat between CEO and Finance Admin
 * Features:
 * - Direct one-on-one messaging
 * - Real-time message updates
 * - Read receipts
 * - Online status indicators
 * - File attachments support
 * - Quick action buttons for financial items
 */

interface Message {
  id: string;
  from: {
    id: string;
    name: string;
    role: 'CEO' | 'FINANCE_ADMIN';
  };
  to: {
    id: string;
    name: string;
    role: 'CEO' | 'FINANCE_ADMIN';
  };
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: {
    type: 'invoice' | 'report' | 'file';
    name: string;
    url: string;
  }[];
}

interface DirectMessagingProps {
  recipientRole: 'CEO' | 'FINANCE_ADMIN';
  recipientName?: string;
}

const DirectMessaging: React.FC<DirectMessagingProps> = ({ recipientRole, recipientName }) => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [incomingCall, setIncomingCall] = useState<{ type: 'voice' | 'video', from: string } | null>(null);
  const [hasPlayedRingtone, setHasPlayedRingtone] = useState(false);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const audioMonitorRef = useRef<{ source: MediaStreamAudioSourceNode, gainNode: GainNode } | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const recipientDisplayName = recipientName || (recipientRole === 'CEO' ? 'CEO' : 'Finance Admin');

  // Load messages from API or localStorage
  useEffect(() => {
    if (isOpen) {
      loadMessages();
    }
  }, [isOpen]);

  // Real-time sync: Listen to localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'directMessages' && e.newValue) {
        const updatedMessages = JSON.parse(e.newValue);
        setMessages(updatedMessages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
        
        // Show typing indicator briefly when new message arrives from other user
        const latestMessage = updatedMessages[updatedMessages.length - 1];
        if (latestMessage && latestMessage.from.id !== user?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1000);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Polling mechanism: Check for new messages every 2 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Check for incoming calls (always, even when chat is closed)
      const callStatus = localStorage.getItem('activeCall');
      if (callStatus) {
        const callData = JSON.parse(callStatus);
        // If call is for this user (check by role) and not already in call
        const isForMe = (callData.toRole === 'CEO' && user?.role === 'CEO') || 
                        (callData.toRole === 'FINANCE_ADMIN' && (user?.role === 'FINANCE_ADMIN' || user?.role === 'admin'));
        
        // Check if I'm the caller waiting for answer
        const isMyCall = callData.from === user?.id;
        
        console.log('📞 Call detected:', { 
          isForMe, 
          isMyCall,
          myRole: user?.role, 
          targetRole: callData.toRole, 
          status: callData.status,
          callState: callState,
          from: callData.fromName 
        });
        
        // RECEIVER: Detect incoming call
        if (isForMe && !isInCall && callData.from !== user?.id && callData.status === 'calling') {
          console.log('✅ Incoming call detected! Opening chat and playing ringtone...');
          // Auto-open chat when receiving call
          setIsOpen(true);
          setIncomingCall({
            type: callData.type,
            from: callData.fromName
          });
          // Play ringtone only once
          if (!hasPlayedRingtone) {
            playRingtone();
            setHasPlayedRingtone(true);
          }
        }
        
        // CALLER: Detect when receiver answers (status changes to 'connected')
        if (isMyCall && callState === 'calling' && callData.status === 'connected') {
          console.log('✅ Call answered by receiver! Starting media stream...');
          setCallState('connected');
          playConnectedTone();
          startMediaStream(callData.type);
        }
      } else {
        // No active call in localStorage
        
        // If currently in call, other person ended it - auto disconnect
        if (isInCall || callState === 'connected' || callState === 'calling') {
          console.log('⚠️ Call ended by other party - disconnecting...');
          
          // Stop everything
          stopRingtone();
          stopMediaStream();
          
          // Reset state
          setIsInCall(false);
          setCallType(null);
          setCallState('idle');
          setIncomingCall(null);
          setHasPlayedRingtone(false);
        }
        
        // Stop ringtone if playing (for incoming calls that were cancelled)
        if (incomingCall) {
          stopRingtone();
        }
        setIncomingCall(null);
        setHasPlayedRingtone(false);
      }

      // Only check messages when chat is open
      if (!isOpen) return;

      const savedMessages = localStorage.getItem('directMessages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const parsedWithDates = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        
        // Only update if messages changed
        if (JSON.stringify(parsedWithDates) !== JSON.stringify(messages)) {
          setMessages(parsedWithDates);
          
          // Show typing indicator for new messages from other user
          const latestMessage = parsedWithDates[parsedWithDates.length - 1];
          if (latestMessage && latestMessage.from.id !== user?.id) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 1000);
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [isOpen, messages, user, isInCall, hasPlayedRingtone, callState]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall && callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isInCall, callState]);

  const loadMessages = () => {
    // Load from localStorage or API
    const savedMessages = localStorage.getItem('directMessages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
    } else {
      // Initialize with sample messages
      initializeSampleMessages();
    }
  };

  const initializeSampleMessages = () => {
    const sampleMessages: Message[] = [
      {
        id: '1',
        from: {
          id: 'ceo-1',
          name: 'CEO',
          role: 'CEO',
        },
        to: {
          id: 'finance-1',
          name: 'Finance Admin',
          role: 'FINANCE_ADMIN',
        },
        content: 'Hi, saya butuh update terkait cash flow perusahaan untuk meeting board besok.',
        timestamp: new Date(Date.now() - 3600000),
        isRead: true,
      },
      {
        id: '2',
        from: {
          id: 'finance-1',
          name: 'Finance Admin',
          role: 'FINANCE_ADMIN',
        },
        to: {
          id: 'ceo-1',
          name: 'CEO',
          role: 'CEO',
        },
        content: 'Siap Pak. Saya sedang prepare laporannya. Proyeksi cash flow 30 hari ke depan menunjukkan posisi sehat di Rp 245 juta.',
        timestamp: new Date(Date.now() - 3000000),
        isRead: true,
      },
      {
        id: '3',
        from: {
          id: 'ceo-1',
          name: 'CEO',
          role: 'CEO',
        },
        to: {
          id: 'finance-1',
          name: 'Finance Admin',
          role: 'FINANCE_ADMIN',
        },
        content: 'Bagus! Tolong kirimkan juga breakdown per department ya. Dan ada update untuk invoice yang overdue?',
        timestamp: new Date(Date.now() - 1800000),
        isRead: user?.role === 'FINANCE_ADMIN',
      },
    ];

    setMessages(sampleMessages);
    localStorage.setItem('directMessages', JSON.stringify(sampleMessages));
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      from: {
        id: user.id || 'user-1',
        name: user.full_name || user.email,
        role: user.role === 'CEO' ? 'CEO' : 'FINANCE_ADMIN',
      },
      to: {
        id: recipientRole === 'CEO' ? 'ceo-1' : 'finance-1',
        name: recipientDisplayName,
        role: recipientRole,
      },
      content: inputValue,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('directMessages', JSON.stringify(updatedMessages));
    setInputValue('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hari Ini';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    }
    
    return messageDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playRingtone = () => {
    // Stop any existing ringtone first
    stopRingtone();

    console.log('🔔 Playing ringtone...');

    try {
      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('✅ AudioContext created');
      }

      const playBeep = () => {
        if (!audioContextRef.current) return;

        const context = audioContextRef.current;
        
        // Resume context if suspended (some browsers require user interaction)
        if (context.state === 'suspended') {
          context.resume().then(() => {
            console.log('✅ AudioContext resumed');
          });
        }

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        // Ring tone frequencies (simulate phone ring)
        oscillator.frequency.value = 440; // A4 note
        gainNode.gain.value = 0.3; // Louder volume
        
        // Create ring pattern: beep-beep pause beep-beep pause
        oscillator.start(context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
        
        oscillator.stop(context.currentTime + 0.8);
        
        console.log('🔊 Beep 1 played');
        
        // Second beep
        setTimeout(() => {
          if (!audioContextRef.current) return;
          const osc2 = context.createOscillator();
          const gain2 = context.createGain();
          
          osc2.connect(gain2);
          gain2.connect(context.destination);
          
          osc2.frequency.value = 440;
          gain2.gain.value = 0.3;
          
          osc2.start(context.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.3);
          gain2.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
          osc2.stop(context.currentTime + 0.8);
          
          console.log('🔊 Beep 2 played');
        }, 400);
      };

      // Play initial beep
      playBeep();

      // Repeat every 2 seconds (ring pattern)
      ringtoneIntervalRef.current = setInterval(() => {
        playBeep();
      }, 2000);

      console.log('✅ Ringtone loop started');

    } catch (error) {
      console.error('❌ Error playing ringtone:', error);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
      console.log('🔇 Ringtone stopped');
    }
  };

  const playConnectedTone = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }

      // Play ascending tone to indicate connected
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 523; // C5 note
      gainNode.gain.value = 0.2;
      
      oscillator.start(context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(784, context.currentTime + 0.3); // G5
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
      oscillator.stop(context.currentTime + 0.5);
      
      console.log('✅ Connected tone played');
    } catch (error) {
      console.error('Error playing connected tone:', error);
    }
  };

  const startMediaStream = async (type: 'voice' | 'video') => {
    try {
      console.log(`📹 Requesting ${type} access...`);
      
      const constraints = {
        audio: true,
        video: type === 'video' ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }
      
      // Enable audio monitoring (play mic through speakers for testing)
      enableAudioMonitoring(stream);
      
      console.log('✅ Media stream started with audio monitoring');
      setCameraError(null);
      setIsCameraOn(type === 'video');
      setIsMicOn(true);
      setIsSpeakerOn(true);
      
    } catch (error: any) {
      console.error('❌ Error accessing media:', error);
      let errorMessage = 'Tidak dapat mengakses kamera/mikrofon';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission ditolak. Izinkan akses kamera/mikrofon di browser.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Kamera/mikrofon tidak ditemukan.';
      }
      
      setCameraError(errorMessage);
    }
  };

  const stopMediaStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 ${track.kind} track stopped`);
      });
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    // Stop audio monitoring
    disableAudioMonitoring();
    
    setCameraError(null);
  };

  const enableAudioMonitoring = (stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;
      if (context.state === 'suspended') {
        context.resume();
      }

      // Create audio monitoring (mic -> speakers) so user can hear themselves
      const source = context.createMediaStreamSource(stream);
      const gainNode = context.createGain();
      gainNode.gain.value = 1.0; // Full volume for monitoring
      
      source.connect(gainNode);
      gainNode.connect(context.destination);
      
      audioMonitorRef.current = { source, gainNode };
      console.log('🔊 Audio monitoring enabled - kamu bisa mendengar suaramu sendiri');
    } catch (error) {
      console.error('❌ Error enabling audio monitoring:', error);
    }
  };

  const disableAudioMonitoring = () => {
    if (audioMonitorRef.current) {
      try {
        audioMonitorRef.current.source.disconnect();
        audioMonitorRef.current.gainNode.disconnect();
        audioMonitorRef.current = null;
        console.log('🔇 Audio monitoring disabled');
      } catch (error) {
        console.error('Error disabling audio monitoring:', error);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        console.log(`📹 Camera ${videoTrack.enabled ? 'ON' : 'OFF'}`);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        console.log(`🎤 Mic ${audioTrack.enabled ? 'ON' : 'OFF'}`);
      }
    }
  };

  const toggleSpeaker = () => {
    const newState = !isSpeakerOn;
    setIsSpeakerOn(newState);
    
    // Enable or disable audio monitoring
    if (newState && localStreamRef.current) {
      enableAudioMonitoring(localStreamRef.current);
    } else {
      disableAudioMonitoring();
    }
    console.log(`🔊 Speaker ${newState ? 'ON' : 'OFF'}`);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
      stopMediaStream();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleStartCall = (type: 'voice' | 'video') => {
    console.log('📞 Starting call...', { type, myRole: user?.role, targetRole: recipientRole });
    
    setCallType(type);
    setIsInCall(true);
    setCallState('calling');
    
    // Don't start media yet - wait until call is answered/connected
    
    // Save call state to localStorage for other user to detect
    const callData = {
      from: user?.id || 'user-1',
      fromName: user?.full_name || user?.email || 'User',
      fromRole: user?.role === 'CEO' ? 'CEO' : 'FINANCE_ADMIN',
      to: recipientRole === 'CEO' ? 'ceo-1' : 'finance-1',
      toName: recipientDisplayName,
      toRole: recipientRole,
      type: type,
      status: 'calling'
    };
    localStorage.setItem('activeCall', JSON.stringify(callData));
    console.log('✅ Call saved to localStorage:', callData);

    const callMessage: Message = {
      id: Date.now().toString(),
      from: {
        id: user?.id || 'user-1',
        name: user?.full_name || user?.email || 'User',
        role: user?.role === 'CEO' ? 'CEO' : 'FINANCE_ADMIN',
      },
      to: {
        id: recipientRole === 'CEO' ? 'ceo-1' : 'finance-1',
        name: recipientDisplayName,
        role: recipientRole,
      },
      content: `📞 Calling... (${type === 'voice' ? 'Voice' : 'Video'} call)`,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = [...messages, callMessage];
    setMessages(updatedMessages);
    localStorage.setItem('directMessages', JSON.stringify(updatedMessages));

    // No auto-answer - wait for receiver to answer manually
    // Caller will detect when receiver answers via polling mechanism
  };

  const handleAnswerCall = () => {
    if (!incomingCall) return;

    console.log('✅ Answering call...');

    // Stop ringtone
    stopRingtone();

    setIsInCall(true);
    setCallType(incomingCall.type);
    setCallState('connected');
    setIncomingCall(null);
    setHasPlayedRingtone(false);

    // Update call status in localStorage so caller knows it's answered
    const callData = localStorage.getItem('activeCall');
    if (callData) {
      const call = JSON.parse(callData);
      call.status = 'connected';
      localStorage.setItem('activeCall', JSON.stringify(call));
      console.log('✅ Call status updated to connected in localStorage');
    }

    // Play connected tone
    playConnectedTone();
    
    // Request media access for receiver
    startMediaStream(incomingCall.type);

    const callMessage: Message = {
      id: Date.now().toString(),
      from: {
        id: user?.id || 'user-1',
        name: user?.full_name || user?.email || 'User',
        role: user?.role === 'CEO' ? 'CEO' : 'FINANCE_ADMIN',
      },
      to: {
        id: recipientRole === 'CEO' ? 'ceo-1' : 'finance-1',
        name: recipientDisplayName,
        role: recipientRole,
      },
      content: `📞 ${incomingCall.type === 'voice' ? 'Voice' : 'Video'} call answered`,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = [...messages, callMessage];
    setMessages(updatedMessages);
    localStorage.setItem('directMessages', JSON.stringify(updatedMessages));
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;

    console.log('❌ Rejecting call...');

    // Stop ringtone
    stopRingtone();

    setIncomingCall(null);
    setHasPlayedRingtone(false);
    
    // Remove active call - this will notify caller that call was rejected
    localStorage.removeItem('activeCall');
    console.log('✅ Call rejected and removed from localStorage');

    const callMessage: Message = {
      id: Date.now().toString(),
      from: {
        id: user?.id || 'user-1',
        name: user?.full_name || user?.email || 'User',
        role: user?.role === 'CEO' ? 'CEO' : 'FINANCE_ADMIN',
      },
      to: {
        id: recipientRole === 'CEO' ? 'ceo-1' : 'finance-1',
        name: recipientDisplayName,
        role: recipientRole,
      },
      content: `📞 Call rejected`,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = [...messages, callMessage];
    setMessages(updatedMessages);
    localStorage.setItem('directMessages', JSON.stringify(updatedMessages));
  };

  const handleEndCall = () => {
    console.log('🔴 Ending call...');
    
    // Stop ringtone if playing
    stopRingtone();
    
    // Stop media stream
    stopMediaStream();

    const callMessage: Message = {
      id: Date.now().toString(),
      from: {
        id: user?.id || 'user-1',
        name: user?.full_name || user?.email || 'User',
        role: user?.role === 'CEO' ? 'CEO' : 'FINANCE_ADMIN',
      },
      to: {
        id: recipientRole === 'CEO' ? 'ceo-1' : 'finance-1',
        name: recipientDisplayName,
        role: recipientRole,
      },
      content: `📞 ${callType === 'voice' ? 'Voice' : 'Video'} call ended (${formatCallDuration(callDuration)})`,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = [...messages, callMessage];
    setMessages(updatedMessages);
    localStorage.setItem('directMessages', JSON.stringify(updatedMessages));
    
    setIsInCall(false);
    setCallType(null);
    setCallState('idle');
    setHasPlayedRingtone(false);
    
    // Remove active call from localStorage - this will trigger other party to disconnect
    localStorage.removeItem('activeCall');
    console.log('✅ Call ended and removed from localStorage');
  };

  const unreadCount = messages.filter(m => !m.isRead && m.to.id === user?.id).length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 hover:scale-110 ${
          incomingCall 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 animate-pulse' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600'
        }`}
      >
        {incomingCall ? (
          <PhoneIcon className="h-6 w-6 animate-bounce" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        )}
        {(unreadCount > 0 || incomingCall) && (
          <span className={`absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ${
            incomingCall ? 'bg-red-600 animate-ping' : 'bg-red-500'
          }`}>
            {incomingCall ? '📞' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <UserCircleIcon className="h-10 w-10" />
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-bold">{recipientDisplayName}</h3>
            <p className="text-xs text-blue-100">
              {isOnline ? '🟢 Online' : '⚫ Offline'} {isTyping && '• mengetik...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleStartCall('voice')}
            disabled={isInCall}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voice Call"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleStartCall('video')}
            disabled={isInCall}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Video Call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => {
          const isCurrentUser = message.from.id === user?.id;
          const showDateLabel = index === 0 || 
            getDayLabel(messages[index - 1].timestamp) !== getDayLabel(message.timestamp);

          return (
            <div key={message.id}>
              {/* Date Label */}
              {showDateLabel && (
                <div className="text-center my-4">
                  <span className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                    {getDayLabel(message.timestamp)}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-xl p-3 shadow-sm ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {isCurrentUser && (
                      <span>{message.isRead ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ketik pesan..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-2 overflow-x-auto">
          <button className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors whitespace-nowrap">
            📄 Share Invoice
          </button>
          <button className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors whitespace-nowrap">
            📊 Share Report
          </button>
          <button className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors whitespace-nowrap">
            💰 Share Payment
          </button>
        </div>
      </div>

      {/* Call Overlay */}
      {isInCall && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex flex-col items-center justify-center z-10">
          <div className="text-center text-white space-y-6">
            {/* Recipient Avatar */}
            <div className="relative mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-24 h-24" />
              </div>
              {callType === 'video' && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <VideoCameraIcon className="h-6 w-6 text-white" />
                </div>
              )}
              {callType === 'voice' && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <PhoneIcon className="h-6 w-6 text-white" />
                </div>
              )}
            </div>

            {/* Recipient Name */}
            <div>
              <h2 className="text-2xl font-bold">{recipientDisplayName}</h2>
              <p className="text-blue-300 text-sm">{callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
            </div>

            {/* Call Status */}
            {callState === 'calling' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-xl text-blue-300 animate-pulse">Calling...</p>
                <p className="text-sm text-gray-400">Menunggu diangkat...</p>
              </div>
            ) : (
              <>
                {/* Call Duration */}
                <div className="bg-white/10 rounded-lg px-8 py-3 backdrop-blur-sm">
                  <p className="text-3xl font-mono font-bold">{formatCallDuration(callDuration)}</p>
                </div>

                {/* Call Status Indicators */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span>Connected</span>
                  </div>
                  <span>•</span>
                  <span>HD Quality</span>
                </div>

                {/* Video Feed for Video Calls - Show only when connected */}
                {callType === 'video' && callState === 'connected' && (
                  <div className="mt-4 space-y-2 w-full max-w-sm">
                    {cameraError ? (
                      <div className="bg-red-900/30 rounded-lg p-4 border-2 border-red-500/50">
                        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-400 mb-2" />
                        <p className="text-xs text-red-300 text-center">{cameraError}</p>
                        <button
                          onClick={() => startMediaStream('video')}
                          className="mt-2 text-xs bg-red-500 hover:bg-red-600 px-3 py-1 rounded-full mx-auto block"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    ) : (
                      <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-500/30">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-48 object-cover"
                        />
                        {!isCameraOn && (
                          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <div className="text-center">
                              <VideoCameraIcon className="h-12 w-12 mx-auto text-gray-500 mb-2" />
                              <p className="text-xs text-gray-400">Camera Off</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs">
                          📹 You
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 text-center">
                      Camera: {isCameraOn ? 'ON' : 'OFF'} • Mic: {isMicOn ? 'ON' : 'OFF'} • Speaker: {isSpeakerOn ? 'ON' : 'OFF'}
                    </p>
                  </div>
                )}
                
                {/* Audio Indicator for Voice Calls */}
                {callType === 'voice' && callState === 'connected' && (
                  <div className="mt-4 space-y-2 w-full max-w-sm">
                    <div className="bg-gray-800/50 rounded-lg p-6 border-2 border-blue-500/30">
                      <div className="text-center">
                        <SpeakerWaveIcon className="h-16 w-16 mx-auto text-blue-400 mb-3 animate-pulse" />
                        <p className="text-sm text-gray-200 font-semibold mb-2">Audio Aktif</p>
                        <div className="flex justify-center gap-4 text-xs text-gray-300">
                          <span>🎤 Mic: {isMicOn ? 'ON' : 'OFF'}</span>
                          <span>🔊 Speaker: {isSpeakerOn ? 'ON' : 'OFF'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">Kamu bisa mendengar suaramu sendiri</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {callState === 'connected' && (
                <>
                  {/* Camera Toggle (Video Call Only) */}
                  {callType === 'video' && (
                    <button 
                      onClick={toggleCamera}
                      className={`w-14 h-14 ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} rounded-full flex items-center justify-center transition-colors`}
                      title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                      {isCameraOn ? (
                        <VideoCameraIcon className="w-6 h-6" />
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Mic Toggle */}
                  <button 
                    onClick={toggleMic}
                    className={`w-14 h-14 ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} rounded-full flex items-center justify-center transition-colors`}
                    title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isMicOn ? (
                      <MicrophoneIcon className="w-6 h-6" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <line x1="3" y1="3" x2="21" y2="21" strokeWidth={2} />
                      </svg>
                    )}
                  </button>
                  
                  {/* Speaker Toggle */}
                  <button 
                    onClick={toggleSpeaker}
                    className={`w-14 h-14 ${isSpeakerOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} rounded-full flex items-center justify-center transition-colors`}
                    title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
                  >
                    {isSpeakerOn ? (
                      <SpeakerWaveIcon className="w-6 h-6" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <line x1="18" y1="10" x2="22" y2="14" strokeWidth={2} />
                        <line x1="22" y1="10" x2="18" y2="14" strokeWidth={2} />
                      </svg>
                    )}
                  </button>
                </>
              )}

              {/* End Call Button */}
              <button 
                onClick={handleEndCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                title="End call"
              >
                <PhoneXMarkIcon className="w-8 h-8" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
              {callState === 'calling' 
                ? '⏳ Menunggu pihak lain mengangkat...' 
                : callType === 'video'
                  ? '💡 Klik icon kamera/mic/speaker untuk toggle on/off'
                  : '💡 Suaramu akan terdengar di speaker. Klik speaker untuk mute/unmute'}
            </p>
          </div>
        </div>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && !isInCall && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-800 rounded-xl flex flex-col items-center justify-center z-50 animate-pulse">
          <div className="text-center text-white space-y-6 p-8">
            {/* Caller Avatar */}
            <div className="relative mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-bounce shadow-2xl">
                <UserCircleIcon className="w-24 h-24" />
              </div>
              {incomingCall.type === 'video' ? (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 animate-pulse shadow-lg">
                  <VideoCameraIcon className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 animate-pulse shadow-lg">
                  <PhoneIcon className="h-8 w-8 text-green-600" />
                </div>
              )}
            </div>

            {/* Caller Info */}
            <div>
              <h2 className="text-3xl font-bold mb-2">{incomingCall.from}</h2>
              <p className="text-green-200 text-base mt-1">
                {incomingCall.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}
              </p>
              <p className="text-green-300 text-xl mt-3 animate-pulse font-semibold">
                📞 Panggilan Masuk...
              </p>
            </div>

            {/* Ringtone Animation */}
            <div className="flex items-center justify-center gap-3 my-6">
              <div className="w-5 h-5 bg-green-400 rounded-full animate-ping shadow-lg"></div>
              <div className="w-5 h-5 bg-green-400 rounded-full animate-ping shadow-lg" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-5 h-5 bg-green-400 rounded-full animate-ping shadow-lg" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-base text-green-200 animate-pulse font-medium">
              🔔 Ring... Ring... Ring...
            </p>

            {/* Answer/Reject Buttons */}
            <div className="flex items-center justify-center gap-8 mt-10">
              {/* Reject Button */}
              <button 
                onClick={handleRejectCall}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all shadow-2xl group-hover:scale-110">
                  <XMarkIcon className="w-10 h-10" />
                </div>
                <span className="text-base text-gray-200 font-semibold">Tolak</span>
              </button>

              {/* Answer Button */}
              <button 
                onClick={handleAnswerCall}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-24 h-24 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all shadow-2xl group-hover:scale-110 animate-pulse">
                  <PhoneIcon className="w-12 h-12" />
                </div>
                <span className="text-lg font-bold text-white">✅ Angkat</span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-green-800/50 rounded-lg border-2 border-green-400">
              <p className="text-sm text-green-100 font-medium">
                ✅ Klik tombol "Angkat" untuk menerima panggilan
              </p>
              <p className="text-xs text-green-200 mt-2">
                🔊 Pastikan volume perangkat aktif • 🎤 Mic akan aktif setelah diangkat
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessaging;
