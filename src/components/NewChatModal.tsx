import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, ShieldCheck, Terminal, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0d1418] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[85vh] cyber-grid-dark">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0f12] border-b border-cyan-500/20 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-wider text-slate-100 font-mono">
                  PEER_PROVISIONING
                </h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  ECDH_TUNNEL
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400/60 mt-0.5">
                DISCOVER OR PROVISION NEW ENDPOINT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Toggle Email / Phone */}
          <div className="flex bg-[#090d10] p-1 rounded-xl border border-cyan-500/20 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIdentifierType('email')}
              className={`flex-1 py-2 rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                identifierType === 'email'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>[EMAIL ADDR]</span>
            </button>
            <button
              type="button"
              onClick={() => setIdentifierType('phone')}
              className={`flex-1 py-2 rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all ${
                identifierType === 'phone'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>[MSISDN PHONE]</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                {identifierType === 'email' ? 'PEER EMAIL IDENTITY' : 'PEER MSISDN NUMBER (+E.164)'}
              </label>
              <div className="relative">
                <input
                  type={identifierType === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={identifierType === 'email' ? 'agent.node@domain.corp' : '+1 (555) 019-2834'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0a0f12] border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-400"
                />
                {identifierType === 'email' ? (
                  <Mail className="w-4 h-4 text-cyan-500/50 absolute left-3 top-3" />
                ) : (
                  <Phone className="w-4 h-4 text-cyan-500/50 absolute left-3 top-3" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                PEER CALLSIGN / NAME (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. Commander Sarah Miller"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0a0f12] border border-cyan-500/30 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-950/40 flex items-center justify-center space-x-2 transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>INITIALIZE ENCRYPTED TUNNEL</span>
            </button>
          </form>

          <div className="p-3 bg-[#0a1014] border border-cyan-500/20 rounded-xl text-[11px] font-mono text-slate-400 leading-relaxed">
            <span className="text-cyan-400 font-bold">[TUNNEL SPECS]:</span> Browser derives ephemeral pair keys via Web Crypto AES-256-GCM. Plaintext is never emitted across unauthenticated relays.
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[10px] font-mono text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>FIPS-COMPLIANT AES-256-GCM + SUPABASE RLS</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 bg-[#0a0f12] border-t border-cyan-500/20 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>TUNNEL_ENGINE: READY</span>
          </span>
          <span className="text-slate-500">ESC TO ABORT</span>
        </div>
      </div>
    </div>
  );
};

