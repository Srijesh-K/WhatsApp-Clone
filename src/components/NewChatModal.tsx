import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, ShieldCheck } from 'lucide-react';
import { supabaseData } from '../services/supabase';
import type { Conversation } from '../services/supabase';

interface NewChatModalProps {
  onClose: () => void;
  onSelectChat: (conv: Conversation) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onSelectChat }) => {
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [contactName, setContactName] = useState('');

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    const conv = supabaseData.createConversation(identifier.trim(), contactName);
    onSelectChat(conv);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#008069] text-white">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-semibold">New Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Toggle Email / Phone */}
          <div className="flex bg-gray-100 dark:bg-[#111b21] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIdentifierType('email')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                identifierType === 'email'
                  ? 'bg-white dark:bg-[#202c33] text-[#00a884] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setIdentifierType('phone')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                identifierType === 'phone'
                  ? 'bg-white dark:bg-[#202c33] text-[#00a884] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {identifierType === 'email' ? 'Contact Email Address' : 'Phone Number (with Country Code)'}
              </label>
              <div className="relative">
                <input
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={identifierType === 'email' ? 'colleague@example.com' : '+1 (555) 000-0000'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
                {identifierType === 'email' ? (
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                ) : (
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Miller"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition-all"
            >
              <span>Start Encrypted Chat</span>
            </button>
          </form>

          <div className="p-3 bg-teal-50 dark:bg-[#111b21] border border-teal-100 dark:border-gray-800 rounded-xl text-xs text-gray-500 leading-relaxed">
            Enter the email or phone number of any contact. All messages sent between you and this contact will be encrypted using browser Web Crypto AES-GCM (256-bit).
          </div>

          <div className="flex items-center justify-center space-x-1 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
            <span>Protected with Web Crypto & Supabase RLS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
