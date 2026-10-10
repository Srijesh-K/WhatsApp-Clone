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
      if (chatMenuOpen && chatMenuRef.current && !chatMenuRef.current.contains(target)) {
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
      '🎤 Voice note',
      'audio',
      { audioDuration: durStr }
    );
  };

  const handleSendMockImage = () => {
    supabaseData.sendMessage(
      conversation.id,
      'Here is the screenshot from earlier!',
      'image',
      { mediaUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600' }
    );
    setShowAttachMenu(false);
  };

  const handleSendMockDocument = () => {
    supabaseData.sendMessage(
      conversation.id,
      'Security_Audit_Report.pdf',
      'document',
      { mediaName: 'Security_Audit_Report.pdf', mediaSize: '2.4 MB' }
    );
    setShowAttachMenu(false);
  };

  const toggleAudioPlay = (msgId: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(msgId);
      // Auto pause after 3 seconds for mock playback
      setTimeout(() => {
        setPlayingAudioId((curr) => (curr === msgId ? null : curr));
      }, 3500);
    }
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    supabaseData.addReaction(conversation.id, msgId, emoji);
    setHoveredMsgId(null);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a] overflow-hidden select-none relative">
      {/* 1. TOP CHAT HEADER */}
      <div className="h-15 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-10 shrink-0">
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
              className="md:hidden mr-1 text-gray-600 dark:text-gray-300"
            >
              ←
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#202c33]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:underline">
              {conversation.name}
            </h3>
            <p className="text-[11px] text-gray-500 truncate">
              {conversation.typingStatus ? (
                <span className="text-[#00a884] font-medium animate-pulse">typing...</span>
              ) : conversation.isOnline ? (
                <span className="text-[#00a884] font-medium">online</span>
              ) : (
                conversation.lastSeen || 'last seen recently'
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 sm:space-x-3 text-gray-600 dark:text-gray-300">
          <button
            onClick={() => onStartCall(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => onStartCall(false)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block" />
          <button
            onClick={onOpenSafetyNumber}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-emerald-600 dark:text-[#00a884]"
            title="Verify E2EE Encryption Code"
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
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {chatMenuOpen && (
              <>
                {/* Transparent backdrop so clicking the other side closes the menu immediately */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setChatMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-11 w-56 bg-white dark:bg-[#233138] rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100 text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => setChatMenuOpen(false)}
                >
                  <button
                    onClick={onOpenContactInfo}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Contact info</span>
                  </button>
                  <button
                    onClick={() => {
                      supabaseData.toggleMute(conversation.id);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <VolumeX className="w-4 h-4 text-gray-500" />
                    <span>{conversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
                  </button>
                  <button
                    onClick={onOpenSafetyNumber}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <Lock className="w-4 h-4 text-[#00a884]" />
                    <span>Verify encryption code</span>
                  </button>
                  <button
                    onClick={() => {
                      const next = conversation.disappearingDuration > 0 ? 0 : 86400;
                      supabaseData.setDisappearingDuration(conversation.id, next);
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>
                      {conversation.disappearingDuration > 0
                        ? 'Disappearing messages: On'
                        : 'Disappearing messages: Off'}
                    </span>
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      if (window.confirm('Clear all messages in this chat?')) {
                        supabaseData.clearChatMessages(conversation.id);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear chat messages</span>
                  </button>
                  {onBackMobile && (
                    <button
                      onClick={onBackMobile}
                      className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                      <span>Close chat</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. CHAT CANVAS WITH DOODLE WALLPAPER */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4 space-y-3 wa-chat-bg-light dark:wa-chat-bg-dark">
        {/* End-to-End Encryption Notice Banner */}
        <div
          onClick={onOpenSafetyNumber}
          className="mx-auto max-w-lg p-2.5 bg-[#ffeecd] dark:bg-[#182229] border border-[#ffdb99]/60 dark:border-gray-800 rounded-xl shadow-2xs flex items-center justify-center space-x-2 text-center text-[11px] text-[#54656f] dark:text-[#8696a0] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-[#00a884] shrink-0" />
          <span>
            Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. <span className="underline font-semibold text-gray-800 dark:text-gray-200">Tap to verify.</span>
          </span>
        </div>

        {/* Disappearing Messages Banner */}
        {conversation.disappearingDuration > 0 && (
          <div className="mx-auto max-w-sm p-2 bg-gray-100 dark:bg-[#182229] border border-gray-200 dark:border-gray-800 rounded-lg text-center text-[11px] text-gray-500 flex items-center justify-center space-x-1.5">
            <Clock className="w-3 h-3 text-[#00a884]" />
            <span>Disappearing messages enabled for this chat.</span>
          </div>
        )}

        {/* Date separator */}
        <div className="flex justify-center my-3">
          <span className="px-3 py-1 bg-white dark:bg-[#182229] rounded-lg shadow-2xs text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Today
          </span>
        </div>

        {/* Messages Stream */}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id || msg.senderId === 'self';

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              className={`flex flex-col relative group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-2.5 shadow-2xs relative text-sm ${
                  isMe
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-xs'
                    : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs'
                }`}
              >
                {/* Replying banner */}
                {msg.replyTo && (
                  <div
                    className={`mb-1.5 p-1.5 rounded-lg text-xs border-l-4 ${
                      isMe
                        ? 'bg-black/5 dark:bg-black/20 border-[#00a884]'
                        : 'bg-gray-100 dark:bg-black/20 border-emerald-500'
                    }`}
                  >
                    <div className="font-semibold text-[11px] text-[#00a884]">
                      {msg.replyTo.senderName}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 truncate">
                      {msg.replyTo.text}
                    </div>
                  </div>
                )}

                {/* 1. Text Message */}
                {msg.messageType === 'text' && (
                  <div className="whitespace-pre-wrap break-words pr-12 text-[13.5px] leading-relaxed">
                    {msg.text}
                  </div>
                )}

                {/* 2. Photo Attachment */}
                {msg.messageType === 'image' && (
                  <div className="space-y-1.5">
                    <img
                      src={msg.mediaUrl}
                      alt="Attachment"
                      className="rounded-xl max-h-72 w-full object-cover shadow-2xs cursor-pointer hover:opacity-95"
                    />
                    {msg.text && (
                      <div className="text-xs whitespace-pre-wrap break-words pr-12 pt-1">
                        {msg.text}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Voice Note */}
                {msg.messageType === 'audio' && (
                  <div className="flex items-center space-x-3 pr-12 py-1">
                    <button
                      onClick={() => toggleAudioPlay(msg.id)}
                      className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 shadow-sm"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                    <div className="space-y-1">
                      {/* Waveform graphic */}
                      <div className="flex items-center space-x-0.5 h-6">
                        {[4, 12, 8, 16, 22, 14, 8, 18, 24, 10, 16, 12, 6, 14, 20, 10, 4].map(
                          (h, i) => (
                            <div
                              key={i}
                              className={`w-0.5 rounded-full transition-all ${
                                playingAudioId === msg.id ? 'bg-[#00a884]' : 'bg-gray-400'
                              }`}
                              style={{ height: `${h}px` }}
                            />
                          )
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>{msg.audioDuration || '0:15'}</span>
                        <button
                          onClick={() =>
                            setAudioSpeed((s) => (s === '1x' ? '1.5x' : s === '1.5x' ? '2x' : '1x'))
                          }
                          className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded-md font-bold"
                        >
                          {audioSpeed}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Document */}
                {msg.messageType === 'document' && (
                  <div className="flex items-center space-x-3 pr-12 p-1 bg-black/5 dark:bg-black/20 rounded-xl">
                    <div className="p-2.5 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold truncate max-w-[150px]">
                        {msg.mediaName || 'Document.pdf'}
                      </div>
                      <div className="text-[10px] text-gray-500">{msg.mediaSize || '1.5 MB'}</div>
                    </div>
                  </div>
                )}

                {/* Timestamp & Status ticks */}
                <div className="absolute bottom-1 right-2 flex items-center space-x-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span
                      className={
                        msg.status === 'read'
                          ? 'text-[#53bdeb]'
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    >
                      {msg.status === 'sent' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Floating Action Menu (Reactions, Reply, Delete) */}
              {hoveredMsgId === msg.id && (
                <div
                  className={`absolute -top-7 flex items-center space-x-1 bg-white dark:bg-[#202c33] rounded-full shadow-md border border-gray-200 dark:border-gray-700 px-2 py-1 z-20 ${
                    isMe ? 'right-2' : 'left-2'
                  }`}
                >
                  {['👍', '❤️', '😂', '🔥'].map((emoji) => (
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
                    className="p-1 hover:text-[#00a884] text-gray-500"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  {isMe && (
                    <button
                      onClick={() => supabaseData.deleteMessage(conversation.id, msg.id)}
                      className="p-1 hover:text-red-500 text-gray-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Reactions Badges */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex items-center space-x-1 -mt-2 z-10 pl-2">
                  {msg.reactions.map((r, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 bg-white dark:bg-[#202c33] rounded-full shadow-2xs border border-gray-200 dark:border-gray-700 text-[11px] flex items-center space-x-0.5"
                    >
                      <span>{r.emoji}</span>
                      {r.count > 1 && <span className="text-[9px] font-bold">{r.count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. REPLY PREVIEW BAR */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-[#182229] border-t border-gray-200 dark:border-gray-800 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-2 border-l-4 border-[#00a884] pl-2 text-xs">
            <span className="font-semibold text-[#00a884]">
              Replying to {replyingTo.senderId === currentUser.id ? 'yourself' : conversation.name}:
            </span>
            <span className="text-gray-600 dark:text-gray-300 truncate max-w-md">
              {replyingTo.text}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. ATTACHMENT POPUP */}
      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setShowAttachMenu(false)}
          />
          <div
            ref={attachMenuRef}
            className="absolute bottom-18 left-14 bg-white dark:bg-[#233138] rounded-2xl shadow-xl p-3 border border-gray-200 dark:border-gray-700 z-30 flex flex-col space-y-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={handleSendMockImage}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182229] text-xs font-medium text-gray-800 dark:text-gray-200"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>Photos & Videos</span>
            </button>
            <button
              onClick={handleSendMockDocument}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#182229] text-xs font-medium text-gray-800 dark:text-gray-200"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span>Document</span>
            </button>
          </div>
        </>
      )}

      {/* 5. EMOJI PICKER POPUP */}
      {showEmojiPicker && (
        <>
          <div
            className="fixed inset-0 z-20 bg-transparent"
            onClick={() => setShowEmojiPicker(false)}
          />
          <div
            ref={emojiPickerRef}
            className="absolute bottom-18 left-4 bg-white dark:bg-[#233138] rounded-2xl shadow-xl p-3 border border-gray-200 dark:border-gray-700 z-30 grid grid-cols-7 gap-2 animate-in fade-in zoom-in-95 duration-150"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  inputRef.current?.focus();
                }}
                className="text-xl p-1.5 hover:bg-gray-100 dark:hover:bg-[#182229] rounded-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 6. BOTTOM INPUT / VOICE RECORDER BAR */}
      <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800 flex items-center space-x-3 z-10 shrink-0">
        {isRecording ? (
          /* Live Voice Recorder Bar */
          <div className="flex-1 flex items-center justify-between bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-red-500">
                0:{recordingSeconds.toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-500">Recording voice note...</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRecording(false)}
                className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                title="Cancel"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendVoiceNote}
                className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#008f70] transition-colors shadow-sm"
                title="Send Voice Note"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <>
            {/* Emoji Trigger */}
            <button
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Emojis"
            >
              <Smile className="w-6 h-6" />
            </button>

            {/* Paperclip Attachment Trigger */}
            <button
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Attach"
            >
              <Paperclip className="w-6 h-6" />
            </button>

            {/* Message Input Field */}
            <form onSubmit={handleSendTextMessage} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full py-2.5 px-4 bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white rounded-xl text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-hidden border border-transparent focus:border-[#00a884] transition-all"
              />
            </form>

            {/* Send or Mic Button */}
            {inputText.trim() ? (
              <button
                onClick={() => handleSendTextMessage()}
                className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-[#008f70] transition-all shadow-md active:scale-95"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#00a884] transition-colors"
                title="Hold to record voice message"
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
