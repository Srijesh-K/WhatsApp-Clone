import React, { useState } from 'react';
import { X, UserPlus, Phone, ShieldCheck } from 'lucide-react';
import { supabaseData } from '../services/supabase';
import type { Conversation } from '../services/supabase';

interface NewChatModalProps {
  onClose: () => void;
  onSelectChat: (conv: Conversation) => void;
}

const FREQUENT_CONTACTS = [
  { name: 'Emma Watson', phone: '+1 (555) 782-9912', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', about: 'Hey there! I am using WhatsApp.' },
  { name: 'David Miller', phone: '+1 (555) 432-8871', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', about: 'Available for calls' },
  { name: 'Dr. Evelyn Reed', phone: '+1 (555) 912-3344', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', about: 'Working remotely' },
];

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onSelectChat }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    const conv = supabaseData.createConversation(phoneNumber, contactName);
    onSelectChat(conv);
    onClose();
  };

  const handleQuickSelect = (c: typeof FREQUENT_CONTACTS[0]) => {
    const conv = supabaseData.createConversation(c.phone, c.name);
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
          {/* Form */}
          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number (with Country Code)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
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

          {/* Frequent Contacts */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Frequent Contacts
            </div>
            <div className="space-y-2">
              {FREQUENT_CONTACTS.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => handleQuickSelect(c)}
                  className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                >
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{c.about}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center space-x-1 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
            <span>Encrypted with Web Crypto AES-GCM (256-bit)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
