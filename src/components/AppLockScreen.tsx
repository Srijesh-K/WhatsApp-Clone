import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldAlert, KeyRound, Cpu } from 'lucide-react';
import { security } from '../services/security';

interface AppLockScreenProps {
  onUnlock: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  const [pinMode, setPinMode] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricUnlock = async () => {
    setIsAuthenticating(true);
    setErrorMsg(null);
    try {
      const ok = await security.authenticateWithPasskey();
      if (ok) {
        onUnlock();
      } else {
        setErrorMsg('Passkey authentication signature rejected.');
      }
    } catch {
      setErrorMsg('Biometric cryptographic handshake failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (security.verifyTwoStepPin(inputPin)) {
      onUnlock();
    } else {
      setErrorMsg('Access Denied: Invalid Security PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] p-4 select-none cyber-grid-dark cyber-scanlines">
      {/* Tactical Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-[#0b1329]/90 border border-emerald-500/30 rounded-2xl p-7 flex flex-col items-center text-center shadow-[0_0_50px_-10px_rgba(0,245,160,0.2)] backdrop-blur-xl relative overflow-hidden space-y-6">
        {/* Terminal Header Telemetry */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-emerald-400/80 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 radar-online" />
            <span className="tracking-wider">SECURITY ENCLAVE</span>
          </div>
          <span className="text-gray-400">STATUS: LOCKED</span>
        </div>

        {/* Biometric Scanner Visualizer */}
        <div className="relative group cursor-pointer" onClick={handleBiometricUnlock}>
          <div className="w-24 h-24 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-[#00f5a0] shadow-[0_0_30px_rgba(0,245,160,0.25)] transition-all group-hover:scale-105 group-hover:border-emerald-400">
            <Fingerprint className={`w-13 h-13 ${isAuthenticating ? 'animate-pulse text-cyan-400' : ''}`} />
          </div>
          {/* Corner HUD accents */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
        </div>

        {/* Title & Telemetry */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold font-mono tracking-wider text-white flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>SESSION ENCRYPTED</span>
          </h2>
          <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
            {pinMode
              ? 'ENTER 6-DIGIT HARDWARE ACCESS PIN'
              : 'AUTHENTICATE VIA BIOMETRIC PASSKEY HARDWARE'}
          </p>
        </div>

        {errorMsg && (
          <div className="w-full p-2.5 bg-red-950/60 border border-red-500/40 text-red-400 text-xs font-mono rounded-lg flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        {/* PIN Form or Biometric Trigger */}
        {pinMode ? (
          <form onSubmit={handlePinUnlock} className="w-full space-y-3">
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value.replace(/\D/g, ''));
                  setErrorMsg(null);
                }}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 px-4 bg-[#070d1a] border border-emerald-500/30 text-emerald-400 rounded-xl focus:outline-hidden focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(0,245,160,0.3)] transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl font-bold font-mono text-xs tracking-wider shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all active:scale-[0.98]"
            >
              [AUTHORIZE & DECRYPT]
            </button>
            <button
              type="button"
              onClick={() => {
                setPinMode(false);
                setErrorMsg(null);
              }}
              className="text-[11px] font-mono text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center space-x-1.5 mx-auto"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Use Biometric Passkey</span>
            </button>
          </form>
        ) : (
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isAuthenticating}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl font-bold font-mono text-xs tracking-wider shadow-[0_0_20px_rgba(0,245,160,0.3)] flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isAuthenticating ? 'SCANNING BIOMETRIC...' : 'VERIFY PASSKEY NOW'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPinMode(true);
                setErrorMsg(null);
              }}
              className="text-[11px] font-mono text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center space-x-1.5 mx-auto"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock with 6-Digit PIN</span>
            </button>
          </div>
        )}

        {/* Bottom Hardware Telemetry */}
        <div className="w-full pt-3 border-t border-emerald-500/10 flex items-center justify-between text-[9px] font-mono text-gray-500">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-emerald-400/60" />
            <span>FIDO2 / WEBAUTHN</span>
          </span>
          <span>AES-256 GCM SECURED</span>
        </div>
      </div>
    </div>
  );
};
