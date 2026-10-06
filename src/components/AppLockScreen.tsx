import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, KeyRound } from 'lucide-react';
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
        setErrorMsg('Passkey authentication was not completed.');
      }
    } catch {
      setErrorMsg('Biometric verification failed.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#efeae2] dark:bg-[#0b141a] p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center border border-gray-200 dark:border-gray-800 space-y-6">
        {/* Lock / Fingerprint Icon Animation */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-teal-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#00a884] ring-8 ring-[#00a884]/10 animate-pulse">
            <Fingerprint className="w-14 h-14" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 bg-[#00a884] rounded-full text-white shadow-md">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        {/* Texts */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            WhatsApp Locked
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {pinMode
              ? 'Enter your 6-digit security PIN to unlock your messages.'
              : 'Touch the fingerprint sensor or unlock using your device Passkey.'}
          </p>
        </div>

        {errorMsg && (
          <div className="w-full p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* PIN Form or Biometric Trigger */}
        {pinMode ? (
          <form onSubmit={handlePinUnlock} className="w-full space-y-4">
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
              className="w-full text-center tracking-widest text-2xl font-mono py-3 px-4 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-hidden focus:border-[#00a884]"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm shadow-sm transition-all"
            >
              Unlock WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                setPinMode(false);
                setErrorMsg(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Use Passkey / Biometrics instead
            </button>
          </form>
        ) : (
          <div className="w-full space-y-3">
            <button
              onClick={handleBiometricUnlock}
              disabled={isAuthenticating}
              className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
            >
              <Fingerprint className="w-5 h-5" />
              <span>{isAuthenticating ? 'Scanning...' : 'Unlock with Passkey'}</span>
            </button>

            {security.isTwoStepEnabled() && (
              <button
                type="button"
                onClick={() => {
                  setPinMode(true);
                  setErrorMsg(null);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Enter 6-Digit PIN instead</span>
              </button>
            )}
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center space-x-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
          <span>Protected with FIDO2 WebAuthn & AES-GCM</span>
        </div>
      </div>
    </div>
  );
};
