import React from 'react';
import { X, Lock, Bell, Star, Clock, ShieldAlert, Phone, Image, FileText } from 'lucide-react';
import { supabaseData } from '../services/supabase';
import type { Conversation } from '../services/supabase';

interface ContactInfoDrawerProps {
  conversation: Conversation;
  onClose: () => void;
  onOpenSafetyNumber: () => void;
  onStartCall: (isVideo: boolean) => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  conversation,
  onClose,
  onOpenSafetyNumber,
  onStartCall,
}) => {
  const handleDisappearingChange = (seconds: number) => {
    supabaseData.setDisappearingDuration(conversation.id, seconds);
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-[#f0f2f5] dark:bg-[#111b21] border-l border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto select-none animate-in slide-in-from-right-10 duration-200">
      {/* Drawer Header */}
      <div className="h-15 px-6 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Contact Info</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-gray-500 hover:text-gray-800 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {/* Profile Card */}
        <div className="p-6 bg-white dark:bg-[#111b21] flex flex-col items-center text-center shadow-xs">
          <img
            src={conversation.avatarUrl}
            alt={conversation.name}
            className="w-36 h-36 rounded-full object-cover shadow-md border-2 border-gray-100 dark:border-gray-800"
          />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
            {conversation.name}
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5">
            {conversation.phoneNumber || 'WhatsApp Contact'}
          </p>

          {/* Call shortcut buttons */}
          <div className="flex items-center space-x-6 mt-4">
            <button
              onClick={() => onStartCall(false)}
              className="flex flex-col items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-[#00a884] dark:hover:text-[#00a884] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-1">Audio</span>
            </button>
            <button
              onClick={() => onStartCall(true)}
              className="flex flex-col items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-[#00a884] dark:hover:text-[#00a884] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Image className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-1">Video</span>
            </button>
          </div>
        </div>

        {/* About section */}
        <div className="p-5 bg-white dark:bg-[#111b21] shadow-xs space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">About</div>
          <div className="text-sm text-gray-800 dark:text-gray-200">
            {conversation.aboutStatus || 'Hey there! I am using WhatsApp.'}
          </div>
        </div>

        {/* Media, links and docs */}
        <div className="p-5 bg-white dark:bg-[#111b21] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Media, links and docs</span>
            <span className="text-gray-400">12</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <img
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120"
              alt="Media item"
              className="w-full h-20 object-cover rounded-lg"
            />
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120"
              alt="Media item"
              className="w-full h-20 object-cover rounded-lg"
            />
            <div className="w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center text-gray-400 text-xs">
              <FileText className="w-5 h-5 mb-1" />
              <span>Specs.pdf</span>
            </div>
          </div>
        </div>

        {/* Encryption & Safety Number Card */}
        <div
          onClick={onOpenSafetyNumber}
          className="p-5 bg-white dark:bg-[#111b21] shadow-xs flex items-start space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="text-[#00a884] mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center justify-between">
              <span>Encryption</span>
              {conversation.safetyNumberVerified && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-[#00a884] px-2 py-0.5 rounded-full font-bold">
                  VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Messages and calls are end-to-end encrypted. Tap to verify the 60-digit security code.
            </p>
          </div>
        </div>

        {/* Disappearing Messages */}
        <div className="p-5 bg-white dark:bg-[#111b21] shadow-xs space-y-3">
          <div className="flex items-start space-x-4">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Disappearing Messages
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Make new messages disappear from this chat after a set duration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { label: 'Off', sec: 0 },
              { label: '24 hrs', sec: 86400 },
              { label: '7 days', sec: 604800 },
              { label: '90 days', sec: 7776000 },
            ].map((opt) => (
              <button
                key={opt.sec}
                onClick={() => handleDisappearingChange(opt.sec)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  conversation.disappearingDuration === opt.sec
                    ? 'border-[#00a884] bg-emerald-50 dark:bg-emerald-950/50 text-[#00a884]'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications & Stars */}
        <div className="bg-white dark:bg-[#111b21] shadow-xs divide-y divide-gray-100 dark:divide-gray-800">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-800 dark:text-gray-200">
              <Bell className="w-5 h-5 text-gray-400" />
              <span>Mute notifications</span>
            </div>
            <input type="checkbox" className="accent-[#00a884] w-4 h-4 cursor-pointer" />
          </div>
          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40">
            <div className="flex items-center space-x-3 text-sm text-gray-800 dark:text-gray-200">
              <Star className="w-5 h-5 text-gray-400" />
              <span>Starred messages</span>
            </div>
            <span className="text-xs text-gray-400">None</span>
          </div>
        </div>

        {/* Block / Report */}
        <div className="bg-white dark:bg-[#111b21] shadow-xs divide-y divide-gray-100 dark:divide-gray-800">
          <button className="w-full p-4 flex items-center space-x-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors">
            <ShieldAlert className="w-5 h-5" />
            <span>Block {conversation.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
