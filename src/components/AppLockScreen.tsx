import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldAlert, KeyRound } from 'lucide-react';
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
        setErrorMsg('Passkey authentication was cancelled or failed.');
      }
    } catch {
      setErrorMsg('Biometric authentication failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (security.verifyTwoStepPin(inputPin)) {
      onUnlock();
    } else {
      setErrorMsg('Incorrect PIN. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111b21] p-4">
      <div className="w-full max-w-sm bg-[#202c33] border border-[#2a3942] rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative space-y-6">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-[#00a884]/15 flex items-center justify-center text-[#00a884]">
          <Lock className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-[#e9edef]">
            WhatsApp is locked
          </h2>
          <p className="text-xs text-[#8696a0] leading-relaxed">
            {pinMode
              ? 'Enter your 6-digit PIN to unlock WhatsApp Web.'
              : 'Use your fingerprint, face, or passkey to unlock.'}
          </p>
        </div>

        {errorMsg && (
          <div className="w-full p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        {/* PIN Form or Biometric Trigger */}
        {pinMode ? (
          <form onSubmit={handlePinUnlock} className="w-full space-y-3">
            <div>
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
                className="w-full text-center tracking-[0.5em] text-2xl py-3 px-4 bg-[#111b21] border border-[#2a3942] text-[#e9edef] rounded-lg focus:outline-hidden focus:border-[#00a884] transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg font-medium text-xs transition-all cursor-pointer shadow-sm"
            >
              Unlock
            </button>
            <button
              type="button"
              onClick={() => {
                setPinMode(false);
                setErrorMsg(null);
              }}
              className="text-xs text-[#00a884] hover:underline transition-colors flex items-center justify-center space-x-1.5 mx-auto pt-2 cursor-pointer"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Use passkey / fingerprint</span>
            </button>
          </form>
        ) : (
          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-lg font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isAuthenticating ? 'Authenticating...' : 'Unlock with passkey'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPinMode(true);
                setErrorMsg(null);
              }}
              className="text-xs text-[#00a884] hover:underline transition-colors flex items-center justify-center space-x-1.5 mx-auto pt-2 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Enter 6-digit PIN</span>
            </button>
          </div>
        )}

        <div className="w-full pt-3 border-t border-[#2a3942] flex items-center justify-center text-[11px] text-[#8696a0]">
          End-to-end encrypted
        </div>
      </div>
    </div>
  );
};
