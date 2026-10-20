import React from 'react';
import { X, Lock, Bell, Star, Clock, ShieldAlert, Phone, Video, FileText, ShieldCheck, Terminal, Cpu, Radio } from 'lucide-react';
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
    <div className="w-80 sm:w-96 h-full bg-[#0a0f12] border-l border-cyan-500/20 flex flex-col overflow-y-auto select-none animate-in slide-in-from-right-10 duration-200 cyber-grid-dark text-slate-300">
      {/* Drawer Header */}
      <div className="h-14 px-6 flex items-center justify-between bg-[#070b0e] border-b border-cyan-500/20 shrink-0">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
            PEER_IDENTITY_DOSSIER
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 hover:bg-cyan-500/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {/* Profile Card */}
        <div className="p-6 bg-[#0d1418] border-b border-cyan-500/20 flex flex-col items-center text-center relative overflow-hidden">
          <div className="relative">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-cyan-500/30 shadow-lg shadow-cyan-950/50"
            />
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>

          <h2 className="text-base font-bold font-mono text-slate-100 mt-4 tracking-wider uppercase">
            {conversation.name}
          </h2>
          <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
            NODE_ADDR: {conversation.phoneNumber || 'PEER_EPHEMERAL_NODE'}
          </p>

          <div className="flex items-center space-x-2 mt-2">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-sm bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              CHANNEL: AES-256-GCM
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              HANDSHAKE: ACTIVE
            </span>
          </div>

          {/* Call shortcut buttons */}
          <div className="flex items-center space-x-4 mt-5">
            <button
              onClick={() => onStartCall(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#111a20] hover:bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>VOIP [SRTP]</span>
            </button>
            <button
              onClick={() => onStartCall(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#111a20] hover:bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono uppercase tracking-wider transition-all"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>VIDEO [VP9]</span>
            </button>
          </div>
        </div>

        {/* Status / Telemetry */}
        <div className="p-4 bg-[#0d1418] border-y border-cyan-500/20 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            STATUS_METRIC
          </div>
          <div className="text-xs text-slate-200 font-sans">
            {conversation.aboutStatus || 'Hey there! I am using WhatsApp.'}
          </div>
        </div>

        {/* Media, links and docs */}
        <div className="p-4 bg-[#0d1418] border-y border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            <span>PACKET PAYLOAD ARCHIVE</span>
            <span className="text-cyan-400">12 ITEMS</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <img
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=120"
              alt="Media item"
              className="w-full h-16 object-cover rounded-lg border border-cyan-500/20"
            />
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=120"
              alt="Media item"
              className="w-full h-16 object-cover rounded-lg border border-cyan-500/20"
            />
            <div className="w-full h-16 bg-[#111a20] border border-cyan-500/20 rounded-lg flex flex-col items-center justify-center text-cyan-400 text-[10px] font-mono">
              <FileText className="w-4 h-4 mb-1" />
              <span>KEY_DOC.PDF</span>
            </div>
          </div>
        </div>

        {/* Encryption & Safety Number Card */}
        <div
          onClick={onOpenSafetyNumber}
          className="p-4 bg-[#0d1418] border-y border-cyan-500/20 flex items-start space-x-3.5 cursor-pointer hover:bg-cyan-500/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="text-xs font-mono font-bold text-slate-100 flex items-center justify-between">
              <span className="uppercase">END-TO-END CIPHER</span>
              {conversation.safetyNumberVerified ? (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  RATIFIED
                </span>
              ) : (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                  UNVERIFIED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Payloads encrypted with 256-bit pairwise keys. Tap to inspect 60-digit fingerprint matrix.
            </p>
          </div>
        </div>

        {/* Ephemeral Packet TTL (Disappearing Messages) */}
        <div className="p-4 bg-[#0d1418] border-y border-cyan-500/20 space-y-3">
          <div className="flex items-start space-x-3">
            <Clock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                EPHEMERAL PACKET TTL
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Autonomous payload wipe after expiration window.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1 font-mono text-[10px]">
            {[
              { label: 'OFF', sec: 0 },
              { label: '24 HRS', sec: 86400 },
              { label: '7 DAYS', sec: 604800 },
              { label: '90 DAYS', sec: 7776000 },
            ].map((opt) => (
              <button
                key={opt.sec}
                onClick={() => handleDisappearingChange(opt.sec)}
                className={`py-1.5 rounded-lg border transition-all ${
                  conversation.disappearingDuration === opt.sec
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-xs'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Telemetry / Mute */}
        <div className="bg-[#0d1418] border-y border-cyan-500/20 divide-y divide-cyan-500/10 font-mono text-xs">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-slate-300">
              <Bell className="w-4 h-4 text-slate-500" />
              <span>SILENCE_NOTIFICATIONS</span>
            </div>
            <input type="checkbox" className="accent-cyan-400 w-3.5 h-3.5 cursor-pointer" />
          </div>
          <div className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-cyan-500/5">
            <div className="flex items-center space-x-3 text-slate-300">
              <Star className="w-4 h-4 text-slate-500" />
              <span>STARRED_PACKETS</span>
            </div>
            <span className="text-[10px] text-slate-500">0 RECORDED</span>
          </div>
        </div>

        {/* Danger zone: Block */}
        <div className="p-4 bg-[#0d1418] border-y border-red-500/20">
          <button className="w-full py-2.5 px-3 flex items-center justify-center space-x-2 text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 rounded-xl transition-colors">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>TERMINATE ROUTING // BLOCK PEER</span>
          </button>
        </div>

        {/* Enclave badge */}
        <div className="px-6 text-center text-[10px] font-mono text-slate-500 flex items-center justify-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PEER_KEY_VERIFIED • DOUBLE_RATCHET_V3</span>
        </div>
      </div>
    </div>
  );
};

