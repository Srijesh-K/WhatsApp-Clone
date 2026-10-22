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

const EMOJIS = ['😀', '😂', '😍', '👍', '❤️', '🔥', '🎉', '👏', '🙏', '💯', '✨', '😎', '🥳', '🙌'];

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

  // Hover reaction popup
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close menus
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
      '🎤 Voice message',
      'audio',
      { audioDuration: durStr }
    );
  };

  const handleSendMockImage = () => {
    supabaseData.sendMessage(
      conversation.id,
      'Photo.jpg',
      'image',
      { mediaUrl: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600' }
    );
    setShowAttachMenu(false);
  };

  const handleSendMockDoc = () => {
    supabaseData.sendMessage(
      conversation.id,
      'Project_Notes.pdf',
      'document',
      { mediaName: 'Project_Notes.pdf', mediaSize: '1.4 MB' }
    );
    setShowAttachMenu(false);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a] relative overflow-hidden select-text">
      {/* Top Chat Header */}
      <div className="h-15 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 z-20 select-none">
        {/* Contact info button */}
        <div
          onClick={onOpenContactInfo}
          className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
        >
          {onBackMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackMobile();
              }}
              className="md:hidden mr-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              ←
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
            />
            {conversation.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#202c33]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-normal text-gray-900 dark:text-gray-100 truncate">
              {conversation.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {conversation.typingStatus ? (
                <span className="text-[#00a884]">typing...</span>
              ) : conversation.isOnline ? (
                'online'
              ) : (
                conversation.lastSeen || 'offline'
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
          <button
            onClick={() => onStartCall(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => onStartCall(false)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1 hidden sm:block" />
          <button
            onClick={onOpenSafetyNumber}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
            title="Encryption info"
          >
            <Lock className="w-4 h-4 text-[#00a884]" />
          </button>

          {/* 3-Dots Menu Dropdown */}
          <div className="relative" ref={chatMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChatMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {chatMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setChatMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-11 w-52 bg-white dark:bg-[#233138] rounded-lg shadow-xl py-2 border border-gray-100 dark:border-gray-700/50 z-50 text-sm text-gray-800 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setChatMenuOpen(false)}
                >
                  <button
                    onClick={onOpenContactInfo}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Contact info</span>
                  </button>
                  <button
                    onClick={() => supabaseData.toggleMute(conversation.id)}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <VolumeX className="w-4 h-4 text-gray-500" />
                    <span>{conversation.isMuted ? 'Unmute' : 'Mute notifications'}</span>
                  </button>
                  <button
                    onClick={onOpenSafetyNumber}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span>Verify security code</span>
                  </button>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => supabaseData.clearChatMessages(conversation.id)}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear chat</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-4 space-y-2 wa-chat-bg-light dark:wa-chat-bg-dark">
        {/* End-to-end encrypted notification banner */}
        <div className="flex justify-center my-3">
          <div className="bg-[#ffeecd] dark:bg-[#182229] text-[#54656f] dark:text-[#8696a0] text-xs px-3 py-1.5 rounded-lg shadow-2xs max-w-md text-center flex items-center justify-center space-x-1.5 select-none">
            <Lock className="w-3 h-3 shrink-0" />
            <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
          </div>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} relative`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-1.5 shadow-xs relative text-sm leading-relaxed ${
                  isMe
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100'
                    : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100'
                }`}
              >
                {/* Reply quote preview */}
                {msg.replyTo && (
                  <div className="mb-1.5 p-2 bg-black/5 dark:bg-black/20 rounded-md border-l-4 border-[#00a884] text-xs">
                    <span className="font-semibold block text-[#00a884]">
                      {msg.replyTo.senderName}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 truncate block">
                      {msg.replyTo.text}
                    </span>
                  </div>
                )}

                {/* Media Image */}
                {msg.messageType === 'image' && msg.mediaUrl && (
                  <div className="mb-1.5 rounded-lg overflow-hidden">
                    <img
                      src={msg.mediaUrl}
                      alt="Shared media"
                      className="max-h-60 w-auto rounded-lg object-cover"
                    />
                  </div>
                )}

                {/* Audio voice note */}
                {msg.messageType === 'audio' && (
                  <div className="flex items-center space-x-3 py-1 min-w-[200px]">
                    <button
                      onClick={() =>
                        setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                      }
                      className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-[#00a884] transition-all duration-300 ${
                            playingAudioId === msg.id ? 'w-2/3' : 'w-0'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span>{msg.audioDuration || '0:05'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document file */}
                {msg.messageType === 'document' && (
                  <div className="flex items-center space-x-3 p-2 bg-black/5 dark:bg-black/20 rounded-lg mb-1">
                    <FileText className="w-8 h-8 text-[#00a884] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs truncate">{msg.mediaName}</div>
                      <div className="text-[10px] text-gray-500">{msg.mediaSize}</div>
                    </div>
                  </div>
                )}

                {/* Text content */}
                {msg.messageType === 'text' && (
                  <span className="break-words select-text">{msg.text}</span>
                )}

                {/* Timestamp & Status ticks */}
                <div className="float-right ml-3 mt-1 flex items-center space-x-1 text-[11px] text-gray-500 dark:text-gray-400 select-none">
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Check className="w-4 h-4 text-gray-400" />
                      )}
                    </span>
                  )}
                </div>

                {/* Reaction emojis under bubble */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="absolute -bottom-2.5 right-2 flex space-x-1 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-0.5 shadow-xs text-xs">
                    {msg.reactions.map((r, i) => (
                      <span key={i}>
                        {r.emoji} {r.count > 1 ? r.count : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover Quick Actions (Reply, React, Delete) */}
              {hoveredMsgId === msg.id && (
                <div
                  className={`absolute top-0 ${
                    isMe ? '-left-16' : '-right-16'
                  } bg-white dark:bg-[#233138] border border-gray-200 dark:border-gray-700 rounded-full shadow-md px-1.5 py-1 flex items-center space-x-1 z-30 select-none`}
                >
                  <button
                    onClick={() => supabaseData.addReaction(conversation.id, msg.id, '👍')}
                    className="hover:scale-125 transition-transform text-xs p-1 cursor-pointer"
                    title="React Thumbs Up"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => supabaseData.addReaction(conversation.id, msg.id, '❤️')}
                    className="hover:scale-125 transition-transform text-xs p-1 cursor-pointer"
                    title="React Heart"
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:text-[#00a884] transition-colors cursor-pointer"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  {isMe && (
                    <button
                      onClick={() => supabaseData.deleteMessage(conversation.id, msg.id)}
                      className="p-1 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply quote banner above input */}
      {replyingTo && (
        <div className="p-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-700 flex items-center justify-between z-20">
          <div className="border-l-4 border-[#00a884] pl-3 text-xs min-w-0">
            <span className="font-semibold text-[#00a884] block">
              Replying to {replyingTo.senderId === currentUser.id ? 'yourself' : conversation.name}
            </span>
            <span className="text-gray-600 dark:text-gray-300 truncate block">
              {replyingTo.text}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800 flex items-center space-x-2 shrink-0 z-20 select-none">
        {/* Emoji Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Emojis"
          >
            <Smile className="w-6 h-6" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 bg-white dark:bg-[#233138] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 grid grid-cols-7 gap-2 z-50 text-xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  className="hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attachment Button */}
        <div className="relative" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Attach"
          >
            <Paperclip className="w-6 h-6" />
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 bg-white dark:bg-[#233138] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 px-1 z-50 w-48 text-sm">
              <button
                type="button"
                onClick={handleSendMockImage}
                className="w-full px-3 py-2 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-200"
              >
                <ImageIcon className="w-5 h-5 text-purple-500" />
                <span>Photos & videos</span>
              </button>
              <button
                type="button"
                onClick={handleSendMockDoc}
                className="w-full px-3 py-2 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] rounded-lg transition-colors cursor-pointer text-gray-700 dark:text-gray-200"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSendTextMessage} className="flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            placeholder={isRecording ? 'Recording audio message...' : 'Type a message'}
            disabled={isRecording}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full py-2.5 px-4 bg-white dark:bg-[#2a3942] text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-hidden placeholder-gray-500"
          />
        </form>

        {/* Send or Voice Note button */}
        {inputText.trim() ? (
          <button
            type="button"
            onClick={() => handleSendTextMessage()}
            className="p-2.5 bg-[#00a884] hover:bg-[#008f70] text-white rounded-full transition-all cursor-pointer shadow-xs"
            title="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : isRecording ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-red-500 animate-pulse">
              {Math.floor(recordingSeconds / 60)}:
              {(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setIsRecording(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f70] text-white rounded-full transition-all cursor-pointer shadow-xs"
              title="Send audio"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsRecording(true)}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Voice message"
          >
            <Mic className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};
