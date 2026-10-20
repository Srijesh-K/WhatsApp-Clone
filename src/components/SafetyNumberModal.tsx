import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, CheckCircle2, Copy, Terminal } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 font-mono">
      <div className="w-full max-w-md bg-[#0a1122] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border border-emerald-500/30">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#050b17] border-b border-emerald-500/20 text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              CRYPTOGRAPHIC SAFETY MATRIX // {conversation.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#0f1d3d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-gray-200 max-h-[80vh] overflow-y-auto">
          {/* Explanation */}
          <p className="text-[11px] text-gray-400 leading-relaxed text-center">
            Compare this 60-digit cryptographic fingerprint or scan the QR code to ratify that the end-to-end encryption key between your enclave and <span className="font-bold text-white">{conversation.name}</span> has not been intercepted.
          </p>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 bg-[#040813] rounded-2xl border border-emerald-500/25 relative group">
            {/* Tactical Corner Accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />

            <div className="relative p-3 bg-white rounded-xl shadow-md">
              {/* Authentic QR SVG Mockup */}
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="24" height="24" fill="#030712" rx="2" />
                <rect x="14" y="14" width="16" height="16" fill="white" rx="1" />
                <rect x="18" y="18" width="8" height="8" fill="#030712" />
                <rect x="66" y="10" width="24" height="24" fill="#030712" rx="2" />
                <rect x="70" y="14" width="16" height="16" fill="white" rx="1" />
                <rect x="74" y="18" width="8" height="8" fill="#030712" />
                <rect x="10" y="66" width="24" height="24" fill="#030712" rx="2" />
                <rect x="14" y="70" width="16" height="16" fill="white" rx="1" />
                <rect x="18" y="74" width="8" height="8" fill="#030712" />
                <rect x="42" y="10" width="16" height="6" fill="#030712" />
                <rect x="42" y="24" width="8" height="10" fill="#030712" />
                <rect x="56" y="20" width="4" height="14" fill="#030712" />
                <rect x="10" y="42" width="20" height="6" fill="#030712" />
                <rect x="36" y="42" width="28" height="16" fill="#00a884" rx="2" />
                <rect x="70" y="42" width="20" height="6" fill="#030712" />
                <rect x="10" y="54" width="10" height="6" fill="#030712" />
                <rect x="26" y="54" width="6" height="6" fill="#030712" />
                <rect x="42" y="66" width="12" height="12" fill="#030712" />
                <rect x="60" y="66" width="8" height="24" fill="#030712" />
                <rect x="74" y="66" width="16" height="8" fill="#030712" />
                <rect x="74" y="80" width="16" height="10" fill="#030712" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-gray-950 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-3 text-[10px] text-emerald-400">
              <QrCode className="w-3.5 h-3.5" />
              <span>ECDH P-256 CURVE // SHA-512 RATIFIED</span>
            </div>
          </div>

          {/* 60-digit safety blocks (12 blocks of 5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-emerald-500/15 pb-1">
              <span className="flex items-center space-x-1">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>60-DIGIT FINGERPRINT MATRIX</span>
              </span>
              <button
                onClick={handleCopy}
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-bold"
              >
                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '[COPIED]' : '[COPY ALL]'}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {digits.map((block, i) => (
                <div
                  key={i}
                  className="p-1.5 bg-[#040813] border border-emerald-500/20 rounded-lg text-emerald-300 font-bold hover:border-emerald-400 transition-colors"
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
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md ${
                conversation.safetyNumberVerified
                  ? 'bg-[#0f2d22] border border-emerald-400 text-emerald-300'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-[0_0_15px_rgba(0,245,160,0.3)]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {conversation.safetyNumberVerified
                  ? 'MARK AS UNVERIFIED'
                  : 'RATIFY ENCRYPTION AS VERIFIED'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
