import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, CheckCircle2, Copy } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#008069] text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Verify Security Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-gray-800 dark:text-gray-200 max-h-[80vh] overflow-y-auto">
          {/* Explanation */}
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-center">
            To verify that messages and calls with <span className="font-semibold text-gray-900 dark:text-white">{conversation.name}</span> are end-to-end encrypted, scan this code on their phone or compare the 60 digits.
          </p>

          {/* QR Code Graphic */}
          <div className="flex flex-col items-center justify-center p-5 bg-gray-50 dark:bg-[#111b21] rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="relative p-3 bg-white rounded-lg shadow-sm">
              {/* Authentic QR SVG Mockup */}
              <svg className="w-44 h-44" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" />
                {/* Top-left corner box */}
                <rect x="10" y="10" width="24" height="24" fill="#111b21" rx="2" />
                <rect x="14" y="14" width="16" height="16" fill="white" rx="1" />
                <rect x="18" y="18" width="8" height="8" fill="#111b21" />
                {/* Top-right corner box */}
                <rect x="66" y="10" width="24" height="24" fill="#111b21" rx="2" />
                <rect x="70" y="14" width="16" height="16" fill="white" rx="1" />
                <rect x="74" y="18" width="8" height="8" fill="#111b21" />
                {/* Bottom-left corner box */}
                <rect x="10" y="66" width="24" height="24" fill="#111b21" rx="2" />
                <rect x="14" y="70" width="16" height="16" fill="white" rx="1" />
                <rect x="18" y="74" width="8" height="8" fill="#111b21" />
                {/* Data blocks */}
                <rect x="42" y="10" width="16" height="6" fill="#111b21" />
                <rect x="42" y="24" width="8" height="10" fill="#111b21" />
                <rect x="56" y="20" width="4" height="14" fill="#111b21" />
                <rect x="10" y="42" width="20" height="6" fill="#111b21" />
                <rect x="36" y="42" width="28" height="16" fill="#008069" rx="2" />
                <rect x="70" y="42" width="20" height="6" fill="#111b21" />
                <rect x="10" y="54" width="10" height="6" fill="#111b21" />
                <rect x="26" y="54" width="6" height="6" fill="#111b21" />
                <rect x="42" y="66" width="12" height="12" fill="#111b21" />
                <rect x="60" y="66" width="8" height="24" fill="#111b21" />
                <rect x="74" y="66" width="16" height="8" fill="#111b21" />
                <rect x="74" y="80" width="16" height="10" fill="#111b21" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className="w-7 h-7 bg-[#00a884] rounded-full flex items-center justify-center text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-3 text-xs text-gray-500">
              <QrCode className="w-3.5 h-3.5" />
              <span>ECDH P-256 Curve / SHA-512 Fingerprint</span>
            </div>
          </div>

          {/* 60-digit safety blocks (12 blocks of 5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
              <span>60-DIGIT NUMERIC SAFETY CODE</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-[#00a884] hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy digits'}</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs tracking-wider bg-gray-50 dark:bg-[#111b21] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
              {digits.map((block, idx) => (
                <div
                  key={idx}
                  className="py-1 px-1.5 bg-white dark:bg-[#202c33] rounded text-gray-900 dark:text-gray-200 font-medium shadow-2xs border border-gray-100 dark:border-gray-700/50"
                >
                  {block}
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status Action */}
          <div className="pt-2">
            <button
              onClick={onToggleVerified}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all ${
                conversation.safetyNumberVerified
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                  : 'bg-[#00a884] text-white hover:bg-[#008f70] shadow-sm'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {conversation.safetyNumberVerified
                  ? 'Verified Contact (Tap to Unmark)'
                  : 'Mark as Verified'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
