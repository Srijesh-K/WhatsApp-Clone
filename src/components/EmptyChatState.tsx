import React from 'react';
import { ShieldCheck, Terminal, Cpu, Radio, KeyRound } from 'lucide-react';

export const EmptyChatState: React.FC = () => {
  return (
    <div className="flex-1 h-full hidden md:flex flex-col items-center justify-center bg-[#030712] p-8 select-none text-center cyber-grid-dark cyber-scanlines relative overflow-hidden">
      {/* Ambient Cyber Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md space-y-6 flex flex-col items-center relative z-10 font-mono">
        {/* Holographic Radar Terminal Graphic */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl bg-[#081226] border border-emerald-500/30 flex items-center justify-center text-[#00f5a0] shadow-[0_0_40px_rgba(0,245,160,0.15)] backdrop-blur-xl">
            <Radio className="w-14 h-14 text-emerald-400 animate-pulse" />
          </div>
          {/* Tactical Corner Accents */}
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

          {/* Verification Badge */}
          <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-xl text-gray-950 shadow-[0_0_15px_rgba(0,245,160,0.4)]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Title & Telemetry */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#08142b] border border-emerald-500/30 text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-online" />
            <span>ENCLAVE // SECURE STANDBY</span>
          </div>
          <h2 className="text-2xl font-bold tracking-wider text-white">
            WHATSAPP // CYBER TERMINAL
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Decentralized end-to-end cryptographic workspace. Quantum-resistant cipher suites, biometric hardware passkeys, and zero-knowledge storage.
          </p>
        </div>

        {/* Tactical Telemetry Specifications Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full pt-2 text-[10px] text-left">
          <div className="p-2.5 bg-[#060e20] border border-emerald-500/20 rounded-xl space-y-0.5">
            <div className="text-gray-500 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>CIPHER ALGORITHM</span>
            </div>
            <div className="font-bold text-emerald-300">AES-256-GCM / SHA-384</div>
          </div>

          <div className="p-2.5 bg-[#060e20] border border-cyan-500/20 rounded-xl space-y-0.5">
            <div className="text-gray-500 flex items-center space-x-1">
              <KeyRound className="w-3 h-3 text-cyan-400" />
              <span>KEY EXCHANGE</span>
            </div>
            <div className="font-bold text-cyan-300">X25519 ECDH RATCHET</div>
          </div>
        </div>

        {/* Bottom Lock Banner */}
        <div className="pt-4 flex items-center justify-center space-x-2 text-[10px] text-gray-500 border-t border-emerald-500/15 w-full">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>SELECT A SECURE CHANNEL FROM THE NODE MATRIX TO COMMENCE TRANSMISSION</span>
        </div>
      </div>
    </div>
  );
};
