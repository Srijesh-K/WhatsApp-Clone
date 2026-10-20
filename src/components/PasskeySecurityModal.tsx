import React, { useState, useEffect } from 'react';
import { X, KeyRound, Fingerprint, ShieldAlert, Lock, Trash2, CheckCircle2, Plus, Terminal, Cpu, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { security } from '../services/security';
import type { PasskeyCredential } from '../services/security';
import type { UserProfile } from '../services/supabase';

interface PasskeySecurityModalProps {
  user: UserProfile;
  onClose: () => void;
  onLockAppNow: () => void;
}

export const PasskeySecurityModal: React.FC<PasskeySecurityModalProps> = ({
  user,
  onClose,
  onLockAppNow,
}) => {
  const [activeTab, setActiveTab] = useState<'passkeys' | 'twostep' | 'applock'>('passkeys');
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Two-Step PIN state
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // App Lock state
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [lockTimeout, setLockTimeout] = useState('immediately');

  useEffect(() => {
    setPasskeys(security.getStoredPasskeys());
    setTwoStepEnabled(security.isTwoStepEnabled());
    setAppLockEnabled(security.isAppLockEnabled());
    setLockTimeout(security.getLockTimeout());
  }, []);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const pk = await security.registerPasskey(user.fullName, user.phoneNumber);
      setPasskeys(security.getStoredPasskeys());
      setSuccessMsg(`FIDO2 Passkey "${pk.name}" ratified & stored in Secure Enclave.`);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to initialize biometric hardware handshake.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRemovePasskey = (id: string) => {
    security.removePasskey(id);
    setPasskeys(security.getStoredPasskeys());
  };

  const handleSaveTwoStepPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setErrorMsg('Input must be exactly 6 decimal digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Cryptographic PIN mismatch. Verification failed.');
      return;
    }

    security.setTwoStepPin(newPin);
    setTwoStepEnabled(true);
    setNewPin('');
    setConfirmPin('');
    setSuccessMsg('Two-step verification PIN ratified. Enclave hash updated.');
  };

  const handleDisableTwoStep = () => {
    security.disableTwoStepPin();
    setTwoStepEnabled(false);
    setSuccessMsg('Two-step verification offline.');
  };

  const handleToggleAppLock = (checked: boolean) => {
    setAppLockEnabled(checked);
    security.setAppLockEnabled(checked);
  };

  const handleChangeTimeout = (val: string) => {
    setLockTimeout(val);
    security.setLockTimeout(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d1418] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh] cyber-grid-dark">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0f12] border-b border-cyan-500/20 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-wider text-slate-100 font-mono">
                  HARDWARE_ENCLAVE // SECURITY
                </h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  FIDO2-ACTIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400/60 mt-0.5">
                BIO-KEYS • TWO-STEP HASH • AUTONOMOUS LOCK
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

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/20 bg-[#090d10] px-4 font-mono text-xs">
          <button
            onClick={() => { setActiveTab('passkeys'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'passkeys'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-cyan-400" />
            <span>[PASSKEYS]</span>
          </button>
          <button
            onClick={() => { setActiveTab('twostep'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'twostep'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>[TWO-STEP PIN]</span>
          </button>
          <button
            onClick={() => { setActiveTab('applock'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'applock'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>[APP LOCK]</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-500/40 text-red-400 text-xs font-mono rounded-lg flex items-center space-x-2">
            <span className="text-red-500 font-bold">[ERR]</span>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-300 font-sans">
          {/* TAB 1: PASSKEYS */}
          {activeTab === 'passkeys' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0a1014] rounded-xl border border-cyan-500/20 relative overflow-hidden">
                <div className="flex items-start space-x-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                        FIDO2 / WebAuthn Biometric Enclave
                      </h4>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30">
                        SECP256R1
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Biometric passkeys leverage on-chip TPM / Secure Enclave hardware (Windows Hello, TouchID, FaceID). Even during SIM swaps or phishing vectors, adversaries cannot compromise your session without physical biometric authorization.
                    </p>
                  </div>
                </div>
              </div>

              {/* Registered passkeys list */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>BOUND ENCLAVE TOKENS ({passkeys.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">HARDWARE-BOUND</span>
                </div>

                {passkeys.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-cyan-500/20 rounded-xl text-slate-500 text-xs font-mono bg-cyan-950/10">
                    NO HARDWARE TOKENS DETECTED. INITIALIZE BIOMETRIC HANDSHAKE BELOW.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {passkeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between p-3 bg-[#0a1014] rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-cyan-400">
                            <Fingerprint className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-mono font-medium text-slate-100 flex items-center space-x-2">
                              <span>{pk.name}</span>
                              <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-cyan-400 rounded font-mono">
                                {pk.type}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              BOUND: {new Date(pk.createdAt).toLocaleDateString()} • ID: {pk.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePasskey(pk.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-colors"
                          title="Revoke passkey token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Passkey button */}
              <button
                onClick={handleRegisterPasskey}
                disabled={isRegistering}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isRegistering ? 'INITIALIZING HARDWARE PROMPT...' : 'REGISTER ENCLAVE PASSKEY'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: TWO-STEP VERIFICATION PIN */}
          {activeTab === 'twostep' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0a1014] rounded-xl border border-emerald-500/20">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                        Two-Step Cryptographic PIN
                      </h4>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        PBKDF2-HASH
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Requires a 6-digit cryptographic PIN whenever your node is provisioned or re-registered across devices.
                    </p>
                  </div>
                </div>
              </div>

              {twoStepEnabled ? (
                <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-300 font-mono text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>STATUS: TWO-STEP PIN RATIFIED & ARMED</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Account provision requires secondary hardware authorization.
                  </p>
                  <button
                    onClick={handleDisableTwoStep}
                    className="py-2 px-3 bg-red-950/40 border border-red-500/30 hover:border-red-500/60 text-red-400 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
                  >
                    DISABLE TWO-STEP PIN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveTwoStepPin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      INITIALIZE 6-DIGIT ENCLAVE PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 px-3 bg-[#0a0f12] border border-cyan-500/30 text-cyan-300 rounded-lg focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      CONFIRM PIN HASH
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 px-3 bg-[#0a0f12] border border-cyan-500/30 text-cyan-300 rounded-lg focus:outline-hidden focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  >
                    RATIFY TWO-STEP PIN
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: APP LOCK */}
          {activeTab === 'applock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0a1014] rounded-xl border border-amber-500/20">
                <div className="space-y-1 pr-4">
                  <div className="text-xs font-mono font-bold text-slate-100 flex items-center space-x-2 uppercase">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>IDLE LOCKOUT ENFORCEMENT</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Requires biometric verification or PIN to resume terminal session after inactivity.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appLockEnabled}
                    onChange={(e) => handleToggleAppLock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {appLockEnabled && (
                <div className="space-y-2 p-4 bg-[#0a1014] rounded-xl border border-amber-500/20 font-mono text-xs">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                    LOCKOUT LATENCY TIMEOUT
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: 'immediately', label: 'IMMEDIATELY (0ms)' },
                      { id: '1min', label: '1 MINUTE (60,000ms)' },
                      { id: '15min', label: '15 MINUTES' },
                      { id: '1hour', label: '1 HOUR' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer border border-transparent hover:border-slate-700 transition-colors"
                      >
                        <span className="text-xs text-slate-300">{opt.label}</span>
                        <input
                          type="radio"
                          name="lock_timeout"
                          value={opt.id}
                          checked={lockTimeout === opt.id}
                          onChange={() => handleChangeTimeout(opt.id)}
                          className="accent-amber-400 w-3.5 h-3.5"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  onLockAppNow();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-[#111a20] hover:bg-[#16232b] text-amber-300 border border-amber-500/30 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>TERMINATE ACTIVE SESSION & LOCK ENCLAVE</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0a0f12] border-t border-cyan-500/20 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>FIDO2-LEVEL-3 // ENCLAVE-SECURE</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg uppercase tracking-wider transition-colors"
          >
            DISMISS [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};

