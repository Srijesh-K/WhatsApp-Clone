import { useState, useRef, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  Lock,
  Clock,
  Check,
  CheckCheck,
  Play,
  Pause,
  Trash2,
  Reply,
  Image as ImageIcon,
  FileText,
  X,
  User,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Binary,
} from 'lucide-react';
import { supabaseData } from '../services/supabase';
import type { Conversation, ChatMessage, UserProfile } from '../services/supabase';

interface ChatAreaProps {
  conversation: Conversation;
  currentUser: UserProfile;
  messages: ChatMessage[];
  onOpenContactInfo: () => void;
  onOpenSafetyNumber: () => void;
  onStartCall: (isVideo: boolean) => void;
  onBackMobile?: () => void;
}

const EMOJIS = ['😀', '😂', '😍', '👍', '❤️', '🔥', '🎉', '👏', '🙏', '💯', '🚀', '✨', '😎', '🥳'];

export const ChatArea: FC<ChatAreaProps> = ({
  conversation,
  currentUser,
  messages,
  onOpenContactInfo,
  onOpenSafetyNumber,
  onStartCall,
  onBackMobile,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [showTelemetryHud, setShowTelemetryHud] = useState(false);
  const [inspectedMsgId, setInspectedMsgId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Voice playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');

  // Hover reaction popup
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside dropdowns & popups so clicking the other side closes them
  useEffect(() => {
    if (!chatMenuOpen && !showEmojiPicker && !showAttachMenu) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (chatMenuRef.current && !chatMenuRef.current.contains(target)) {
        setChatMenuOpen(false);
      }
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
      if (showAttachMenu && attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [chatMenuOpen, showEmojiPicker, showAttachMenu]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendTextMessage = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    supabaseData.sendMessage(
      conversation.id,
      inputText.trim(),
      'text',
      undefined,
      replyingTo
        ? {
            id: replyingTo.id,
            text: replyingTo.text,
            senderName: replyingTo.senderId === currentUser.id ? 'You' : conversation.name,
          }
        : undefined
    );

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    inputRef.current?.focus();
  };

  const handleSendVoiceNote = () => {
    setIsRecording(false);
    const mins = Math.floor(recordingSeconds / 60);
    const secs = (recordingSeconds % 60).toString().padStart(2, '0');
    const durStr = `${mins}:${secs}`;

    supabaseData.sendMessage(
      conversation.id,
      '🎤 Encrypted Voice Stream',
      'audio',
      { audioDuration: durStr }
    );
  };

  const handleSendMockImage = () => {
    supabaseData.sendMessage(
      conversation.id,
      'Security_Audit_Screenshot.png',
      'image',
      { mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600' }
    );
    setShowAttachMenu(false);
  };

  const handleSendMockDocument = () => {
    supabaseData.sendMessage(
      conversation.id,
      'Cryptographic_Audit_Report.pdf',
      'document',
      { mediaName: 'Cryptographic_Audit_Report.pdf', mediaSize: '2.4 MB' }
    );
    setShowAttachMenu(false);
  };

  const toggleAudioPlay = (msgId: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      setTimeout(() => {
        setPlayingAudioId((curr) => (curr === msgId ? null : curr));
      }, 3500);
    }
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    supabaseData.addReaction(conversation.id, msgId, emoji);
    setHoveredMsgId(null);
  };

  const keyFingerprint = `0x${conversation.id.slice(-6).toUpperCase()}`;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050811] overflow-hidden select-none relative font-sans">
      {/* 1. TOP CHAT HEADER */}
      <div className="h-16 px-4 bg-[#081022] border-b border-emerald-500/20 flex items-center justify-between z-10 shrink-0">
        <div
          onClick={onOpenContactInfo}
          className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0"
        >
          {onBackMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackMobile();
              }}
              className="md:hidden mr-1 text-gray-400 hover:text-emerald-400 font-mono"
            >
              [←]
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-10 h-10 rounded-xl object-cover border border-emerald-400/40 p-0.5 bg-[#040813] shadow-[0_0_10px_rgba(0,245,160,0.2)]"
            />
            {conversation.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#081022] radar-online" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold font-mono text-white truncate group-hover:text-emerald-300 transition-colors">
                {conversation.name}
              </h3>
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#061224] border border-emerald-500/25 rounded-md text-[9px] font-mono text-emerald-400">
                KEY: {keyFingerprint}
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-400 truncate flex items-center space-x-1.5">
              {conversation.typingStatus ? (
                <span className="text-emerald-400 font-medium animate-pulse">TRANSMITTING PACKETS...</span>
              ) : conversation.isOnline ? (
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>NODE ONLINE // LATENCY 19ms</span>
                </span>
              ) : (
                <span>STANDBY // LAST SEEN RECENTLY</span>
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1.5 text-gray-300">
          <button
            onClick={() => onStartCall(true)}
            className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-all"
            title="Secure Video Stream"
          >
            <Video className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={() => onStartCall(false)}
            className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-all"
            title="Encrypted Voice Call"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </button>
          <div className="h-5 w-px bg-emerald-500/20 mx-1 hidden sm:block" />
          <button
            onClick={onOpenSafetyNumber}
            className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-emerald-400 transition-all shadow-[0_0_10px_rgba(0,245,160,0.15)]"
            title="Verify E2EE Safety Matrix"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* 3-Dots Menu Dropdown */}
          <div className="relative" ref={chatMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChatMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-all"
              title="Channel Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {chatMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setChatMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-12 w-60 bg-[#0a1329] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] py-2 border border-emerald-500/30 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-mono text-gray-200 backdrop-blur-xl"
                  onClick={() => setChatMenuOpen(false)}
                >
                  <button
                    onClick={onOpenContactInfo}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-emerald-300"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Contact Telemetry Info</span>
                  </button>
                  <button
                    onClick={() => {
                      supabaseData.toggleMute(conversation.id);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-gray-300"
                  >
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <span>{conversation.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </button>
                  <button
                    onClick={onOpenSafetyNumber}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-emerald-300"
                  >
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Verify Safety Number</span>
                  </button>
                  <button
                    onClick={() => {
                      const next = conversation.disappearingDuration > 0 ? 0 : 86400;
                      supabaseData.setDisappearingDuration(conversation.id, next);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-amber-300"
                  >
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>
                      {conversation.disappearingDuration > 0
                        ? 'Disappearing: 24h Active'
                        : 'Disappearing: Off'}
                    </span>
                  </button>
                  <div className="my-1 border-t border-emerald-500/15" />
                  <button
                    onClick={() => {
                      if (window.confirm('Purge all encrypted buffers in this channel?')) {
                        supabaseData.clearChatMessages(conversation.id);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Purge Channel Buffers</span>
                  </button>
                  {onBackMobile && (
                    <button
                      onClick={onBackMobile}
                      className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-gray-400"
                    >
                      <X className="w-4 h-4" />
                      <span>Close Channel</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. COLLAPSIBLE CRYPTOGRAPHIC TELEMETRY HUD */}
      <div className="bg-[#040813] border-b border-emerald-500/15 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-gray-400 shrink-0 select-none">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-online" />
          <span className="text-emerald-400 font-bold">E2EE ACTIVE</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">CIPHER: AES-256-GCM</span>
          <span className="hidden sm:inline text-gray-500">// SHA-384 MAC</span>
        </div>

        <button
          onClick={() => setShowTelemetryHud(!showTelemetryHud)}
          className="flex items-center space-x-1 text-emerald-400 hover:underline"
        >
          <span>{showTelemetryHud ? '[COLLAPSE HUD]' : '[EXPAND TELEMETRY]'}</span>
          {showTelemetryHud ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded Telemetry HUD Drawer */}
      {showTelemetryHud && (
        <div className="bg-[#070e1f] border-b border-emerald-500/25 p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono animate-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="p-2 bg-[#040813] border border-emerald-500/20 rounded-lg">
            <span className="text-gray-500 block">KEY EXCHANGE</span>
            <span className="font-bold text-emerald-300">X25519 ECDH</span>
          </div>
          <div className="p-2 bg-[#040813] border border-emerald-500/20 rounded-lg">
            <span className="text-gray-500 block">FORWARD SECRECY</span>
            <span className="font-bold text-emerald-300">DOUBLE RATCHET</span>
          </div>
          <div className="p-2 bg-[#040813] border border-emerald-500/20 rounded-lg">
            <span className="text-gray-500 block">TAMPER DETECTION</span>
            <span className="font-bold text-emerald-300">0% TAMPER // OK</span>
          </div>
          <div className="p-2 bg-[#040813] border border-emerald-500/20 rounded-lg">
            <span className="text-gray-500 block">STORAGE MODE</span>
            <span className="font-bold text-cyan-300">ZERO-KNOWLEDGE RLS</span>
          </div>
        </div>
      )}

      {/* 3. CHAT CANVAS WITH HIGH-TECH WALLPAPER */}
      <div className="flex-1 overflow-y-auto px-4 md:px-10 py-4 space-y-3 wa-chat-bg-dark">
        {/* Disappearing Messages Notice */}
        {conversation.disappearingDuration > 0 && (
          <div className="mx-auto max-w-sm p-2 bg-[#071329] border border-amber-500/30 rounded-lg text-center text-[10px] font-mono text-amber-300 flex items-center justify-center space-x-1.5 shadow-sm">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>DISAPPEARING PROTOCOL ARMED (24h LIFESPAN)</span>
          </div>
        )}

        {/* Date separator */}
        <div className="flex justify-center my-3">
          <span className="px-3 py-1 bg-[#09142b] border border-emerald-500/20 rounded-md text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase">
            // SESSION ACTIVE // TODAY
          </span>
        </div>

        {/* Messages Stream */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id || msg.senderId === 'self';
          const isInspected = inspectedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md relative text-xs ${
                  isMe
                    ? 'bg-[#042823] border border-emerald-500/40 text-emerald-100 rounded-tr-xs shadow-[0_0_15px_rgba(0,245,160,0.08)]'
                    : 'bg-[#0a1630] border border-cyan-500/30 text-gray-100 rounded-tl-xs shadow-[0_0_15px_rgba(0,210,255,0.06)]'
                }`}
              >
                {/* Replying banner */}
                {msg.replyTo && (
                  <div className="mb-2 p-1.5 rounded-lg text-[11px] font-mono border-l-2 bg-black/40 border-emerald-400">
                    <div className="font-bold text-emerald-400">
                      RE: {msg.replyTo.senderName}
                    </div>
                    <div className="text-gray-400 truncate">
                      {msg.replyTo.text}
                    </div>
                  </div>
                )}

                {/* 1. Text Message */}
                {msg.messageType === 'text' && (
                  <div className="whitespace-pre-wrap break-words pr-12 text-[13px] leading-relaxed font-sans">
                    {msg.text}
                  </div>
                )}

                {/* 2. Photo Attachment */}
                {msg.messageType === 'image' && (
                  <div className="space-y-1.5">
                    <img
                      src={msg.mediaUrl}
                      alt="Encrypted attachment"
                      className="rounded-xl max-h-72 w-full object-cover border border-emerald-500/20 shadow-xs cursor-pointer hover:opacity-95"
                    />
                    {msg.text && (
                      <div className="text-xs whitespace-pre-wrap break-words pr-12 pt-1 font-mono text-gray-300">
                        {msg.text}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. High-Tech Voice Note Spectrum */}
                {msg.messageType === 'audio' && (
                  <div className="flex items-center space-x-3 pr-12 py-1">
                    <button
                      onClick={() => toggleAudioPlay(msg.id)}
                      className="w-9 h-9 rounded-xl bg-emerald-500 text-gray-950 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,245,160,0.4)] active:scale-95 transition-all"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-4 h-4 fill-gray-950" />
                      ) : (
                        <Play className="w-4 h-4 fill-gray-950 ml-0.5" />
                      )}
                    </button>
                    <div className="space-y-1">
                      {/* Animated audio wave spectrum */}
                      <div className="flex items-center space-x-0.5 h-6">
                        {[4, 14, 8, 20, 16, 24, 10, 18, 22, 12, 16, 8, 14, 18, 10, 6, 12].map(
                          (h, i) => (
                            <div
                              key={i}
                              className={`w-0.5 rounded-full transition-all ${
                                playingAudioId === msg.id
                                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(0,245,160,0.8)]'
                                  : 'bg-gray-600'
                              }`}
                              style={{ height: `${h}px` }}
                            />
                          )
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-gray-400 space-x-3">
                        <span>{msg.audioDuration || '0:15'} // 44.1kHz</span>
                        <button
                          onClick={() =>
                            setAudioSpeed((s) => (s === '1x' ? '1.5x' : s === '1.5x' ? '2x' : '1x'))
                          }
                          className="px-1.5 py-0.5 bg-black/40 rounded-md font-bold text-emerald-400 border border-emerald-500/20"
                        >
                          {audioSpeed}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Document */}
                {msg.messageType === 'document' && (
                  <div className="flex items-center space-x-3 pr-12 p-2 bg-black/40 border border-emerald-500/20 rounded-xl">
                    <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold truncate max-w-[150px] text-white">
                        {msg.mediaName || 'Encrypted_Doc.pdf'}
                      </div>
                      <div className="text-[9px] font-mono text-gray-400">{msg.mediaSize || '1.8 MB'} // E2EE VALIDATED</div>
                    </div>
                  </div>
                )}

                {/* Raw Ciphertext Inspector Drawer */}
                {isInspected && (
                  <div className="mt-2 p-2 bg-[#02050c] border border-emerald-500/30 rounded-lg font-mono text-[9px] text-emerald-400 space-y-1">
                    <div className="flex items-center justify-between text-gray-400 border-b border-emerald-500/10 pb-1">
                      <span>PACKET CIPHERTEXT INSPECTION</span>
                      <span className="text-cyan-400">AES-GCM-256</span>
                    </div>
                    <div className="text-gray-400">IV: 0x{msg.id.slice(0, 16)}...</div>
                    <div className="text-gray-400">MAC: SHA-384 AUTHENTICATED</div>
                    <div className="text-emerald-300 break-all">[BUFFER // 256-BIT ENCLAVE CIPHERTEXT DECRYPTED LOCALLY]</div>
                  </div>
                )}

                {/* Timestamp & Status Telemetry */}
                <div className="absolute bottom-1 right-2 flex items-center space-x-1 text-[9px] font-mono text-gray-400">
                  <button
                    onClick={() => setInspectedMsgId(isInspected ? null : msg.id)}
                    className="hover:text-emerald-400 underline mr-1"
                    title="Inspect Cryptographic Packet"
                  >
                    #PKT-{msg.id.slice(-4)}
                  </button>
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span className={msg.status === 'read' ? 'text-emerald-400' : 'text-gray-500'}>
                      {msg.status === 'sent' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Floating Action Menu (Reactions, Reply, Delete) */}
              {hoveredMsgId === msg.id && (
                <div
                  className={`absolute -top-7 flex items-center space-x-1 bg-[#091329] border border-emerald-500/30 rounded-full px-2 py-1 z-20 shadow-[0_0_15px_rgba(0,0,0,0.8)] ${
                    isMe ? 'right-2' : 'left-2'
                  }`}
                >
                  {['👍', '❤️', '🔥', '⚡'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(msg.id, emoji)}
                      className="hover:scale-125 transition-transform text-xs p-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:text-emerald-400 text-gray-400"
                    title="Reply"
                  >
                    <Reply className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setInspectedMsgId(isInspected ? null : msg.id)}
                    className="p-1 hover:text-cyan-400 text-gray-400"
                    title="Inspect Ciphertext"
                  >
                    <Binary className="w-3 h-3" />
                  </button>
                  {isMe && (
                    <button
                      onClick={() => supabaseData.deleteMessage(conversation.id, msg.id)}
                      className="p-1 hover:text-red-400 text-gray-400"
                      title="Purge message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Reactions Badges */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex items-center space-x-1 -mt-1.5 z-10 pl-2">
                  {msg.reactions.map((r, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-[#09142b] rounded-full border border-emerald-500/30 text-[10px] flex items-center space-x-0.5 font-mono text-emerald-300"
                    >
                      <span>{r.emoji}</span>
                      {r.count > 1 && <span className="font-bold text-[9px]">{r.count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. REPLY PREVIEW BAR */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#091329] border-t border-emerald-500/20 flex items-center justify-between z-10 shrink-0 font-mono text-xs">
          <div className="flex items-center space-x-2 border-l-2 border-emerald-400 pl-2">
            <span className="font-bold text-emerald-400">
              RE: {replyingTo.senderId === currentUser.id ? 'Self Node' : conversation.name}:
            </span>
            <span className="text-gray-400 truncate max-w-md">
              {replyingTo.text}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. ATTACHMENT POPUP */}
      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setShowAttachMenu(false)}
          />
          <div
            ref={attachMenuRef}
            className="absolute bottom-18 left-14 bg-[#0a1329] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] p-3 border border-emerald-500/30 z-30 flex flex-col space-y-2 animate-in fade-in zoom-in-95 duration-150 font-mono"
          >
            <button
              onClick={handleSendMockImage}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#0f1d3d] text-xs font-medium text-emerald-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>ENCRYPTED PHOTO // VIDEO</span>
            </button>
            <button
              onClick={handleSendMockDocument}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#0f1d3d] text-xs font-medium text-cyan-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-cyan-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span>ENCRYPTED DOCUMENT</span>
            </button>
          </div>
        </>
      )}

      {/* 6. EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div
            ref={emojiPickerRef}
            className="absolute bottom-18 left-4 bg-[#0a1329] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] p-3 border border-emerald-500/30 z-30 grid grid-cols-7 gap-2 animate-in fade-in zoom-in-95 duration-150"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  inputRef.current?.focus();
                }}
                className="text-xl p-1.5 hover:bg-[#0f1d3d] rounded-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 7. BOTTOM COMMAND INPUT / RECORDER DECK */}
      <div className="h-16 px-4 bg-[#081022] border-t border-emerald-500/20 flex items-center space-x-3 z-10 shrink-0">
        {isRecording ? (
          /* Live Cyber Voice Recording Deck */
          <div className="flex-1 flex items-center justify-between bg-[#040813] border border-red-500/40 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <div className="flex items-center space-x-3 font-mono">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-red-400">
                REC 0:{recordingSeconds.toString().padStart(2, '0')}
              </span>
              <span className="text-[11px] text-gray-400 hidden sm:inline">STREAMING ENCRYPTED AUDIO PACKETS...</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRecording(false)}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Abort"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendVoiceNote}
                className="p-2 bg-emerald-500 text-gray-950 font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_12px_rgba(0,245,160,0.4)]"
                title="Transmit Voice Note"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Tactical Command Input Deck */
          <>
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
              title="Tactical Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
              title="Attach Encrypted File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Form */}
            <form onSubmit={handleSendTextMessage} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="ENTER ENCRYPTED TRANSMISSION... [ENTER]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full py-2.5 px-4 bg-[#040813] border border-emerald-500/30 text-emerald-300 font-mono rounded-xl text-xs placeholder-gray-500 focus:outline-hidden focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(0,245,160,0.25)] transition-all"
              />
            </form>

            {/* Transmit / Record Mic */}
            {inputText.trim() ? (
              <button
                onClick={() => handleSendTextMessage()}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl shadow-[0_0_15px_rgba(0,245,160,0.4)] transition-all active:scale-95"
                title="Transmit"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(true)}
                className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
                title="Record Encrypted Voice Stream"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
