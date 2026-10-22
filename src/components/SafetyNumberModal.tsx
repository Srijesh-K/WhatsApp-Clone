import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';
import type { Conversation } from '../services/supabase';
import { security } from '../services/security';

interface SafetyNumberModalProps {
  conversation: Conversation;
  userPhone: string;
  onClose: () => void;
  onToggleVerified: () => void;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({
  conversation,
  userPhone,
  onClose,
  onToggleVerified,
}) => {
  const [copied, setCopied] = useState(false);
  const contactPhone = conversation.phoneNumber || '+1 555 000 0000';
  const digits = security.generateSafetyNumber(userPhone, contactPhone);

  const handleCopy = () => {
    navigator.clipboard.writeText(digits.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#111b21] rounded-2xl shadow-2xl overflow-hidden border border-[#222e35]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#202c33] border-b border-[#222e35] text-[#e9edef]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e9edef]">Verify security code</h2>
              <p className="text-xs text-[#8696a0]">{conversation.name}</p>
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
        <div className="p-6 space-y-5 text-[#e9edef] max-h-[80vh] overflow-y-auto">
          {/* Explanation */}
          <p className="text-xs text-[#8696a0] leading-relaxed text-center">
            To verify that messages and calls with <span className="font-semibold text-[#e9edef]">{conversation.name}</span> are end-to-end encrypted, scan this code or compare the 60-digit number.
          </p>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#202c33] rounded-2xl border border-[#2a3942]">
            <div className="relative p-3 bg-white rounded-xl shadow-md">
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="24" height="24" fill="#111b21" rx="2" />
                <rect x="14" y="14" width="16" height="16" fill="white" rx="1" />
                <rect x="18" y="18" width="8" height="8" fill="#111b21" />
                <rect x="66" y="10" width="24" height="24" fill="#111b21" rx="2" />
                <rect x="70" y="14" width="16" height="16" fill="white" rx="1" />
                <rect x="74" y="18" width="8" height="8" fill="#111b21" />
                <rect x="10" y="66" width="24" height="24" fill="#111b21" rx="2" />
                <rect x="14" y="70" width="16" height="16" fill="white" rx="1" />
                <rect x="18" y="74" width="8" height="8" fill="#111b21" />
                <rect x="42" y="10" width="16" height="6" fill="#111b21" />
                <rect x="42" y="24" width="8" height="10" fill="#111b21" />
                <rect x="56" y="20" width="4" height="14" fill="#111b21" />
                <rect x="10" y="42" width="20" height="6" fill="#111b21" />
                <rect x="36" y="42" width="28" height="16" fill="#00a884" rx="2" />
                <rect x="70" y="42" width="20" height="6" fill="#111b21" />
                <rect x="10" y="54" width="10" height="6" fill="#111b21" />
                <rect x="26" y="54" width="6" height="6" fill="#111b21" />
                <rect x="42" y="66" width="12" height="12" fill="#111b21" />
                <rect x="60" y="66" width="8" height="24" fill="#111b21" />
                <rect x="74" y="66" width="16" height="8" fill="#111b21" />
                <rect x="74" y="80" width="16" height="10" fill="#111b21" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className="w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center text-white font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 60-digit safety blocks (12 blocks of 5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8696a0] pb-1">
              <span>60-digit security code</span>
              <button
                onClick={handleCopy}
                className="text-[#00a884] hover:text-[#008f6f] flex items-center space-x-1 font-medium transition-colors cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy code'}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
              {digits.map((block, i) => (
                <div
                  key={i}
                  className="p-2 bg-[#202c33] border border-[#2a3942] rounded-lg text-[#e9edef] font-medium"
                >
                  {block}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status Action Toggle */}
          <div className="pt-2">
            <button
              onClick={onToggleVerified}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm ${
                conversation.safetyNumberVerified
                  ? 'bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] text-[#8696a0]'
                  : 'bg-[#00a884] hover:bg-[#008f6f] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {conversation.safetyNumberVerified
                  ? 'Mark as unverified'
                  : 'Mark as verified'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
