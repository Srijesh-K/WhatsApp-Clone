import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, ArrowRight, User } from 'lucide-react';
import { supabaseData } from '../services/supabase';
import type { Conversation } from '../services/supabase';

interface NewChatModalProps {
  onClose: () => void;
  onSelectChat: (conv: Conversation) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onSelectChat }) => {
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('phone');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#202c33] border-b border-[#222e35] text-[#e9edef]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e9edef]">New chat</h2>
              <p className="text-xs text-[#8696a0]">Start a conversation with a new contact</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Toggle Email / Phone */}
          <div className="flex bg-[#202c33] p-1 rounded-lg border border-[#2a3942] text-xs">
            <button
              type="button"
              onClick={() => setIdentifierType('phone')}
              className={`flex-1 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-all ${
                identifierType === 'phone'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone number</span>
            </button>
            <button
              type="button"
              onClick={() => setIdentifierType('email')}
              className={`flex-1 py-2 rounded-md font-medium flex items-center justify-center space-x-2 transition-all ${
                identifierType === 'email'
                  ? 'bg-[#00a884] text-white shadow-xs'
                  : 'text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email address</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                {identifierType === 'phone' ? 'Phone number (with country code)' : 'Email address'}
              </label>
              <div className="relative">
                <input
                  type={identifierType === 'phone' ? 'tel' : 'email'}
                  required
                  placeholder={identifierType === 'phone' ? '+1 (555) 019-2834' : 'friend@example.com'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-lg text-sm text-[#e9edef] placeholder:text-[#8696a0] focus:outline-hidden focus:border-[#00a884]"
                />
                {identifierType === 'phone' ? (
                  <Phone className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3" />
                ) : (
                  <Mail className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                Contact name (optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Alex Smith"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-[#202c33] border border-[#2a3942] rounded-lg text-sm text-[#e9edef] placeholder:text-[#8696a0] focus:outline-hidden focus:border-[#00a884]"
                />
                <User className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Start chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <p className="text-center text-[11px] text-[#8696a0]">
            Messages in this chat are end-to-end encrypted.
          </p>
        </div>
      </div>
    </div>
  );
};
