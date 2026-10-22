import React, { useState, useEffect } from 'react';
import { X, Fingerprint, Lock, ShieldCheck, Trash2, CheckCircle2, Plus, KeyRound } from 'lucide-react';
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
      setSuccessMsg(`Passkey "${pk.name}" created successfully.`);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to register passkey.');
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
      setErrorMsg('PIN must be exactly 6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('PINs do not match.');
      return;
    }

    security.setTwoStepPin(newPin);
    setTwoStepEnabled(true);
    setNewPin('');
    setConfirmPin('');
    setSuccessMsg('Two-step verification has been turned on.');
  };

  const handleDisableTwoStep = () => {
    security.disableTwoStepPin();
    setTwoStepEnabled(false);
    setSuccessMsg('Two-step verification has been turned off.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#202c33] border-b border-[#222e35] text-[#e9edef]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e9edef]">Privacy & Security</h2>
              <p className="text-xs text-[#8696a0]">Passkeys, Two-step verification & App lock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222e35] bg-[#202c33]/50 px-6 text-xs">
          <button
            onClick={() => { setActiveTab('passkeys'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'passkeys'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Passkeys</span>
          </button>
          <button
            onClick={() => { setActiveTab('twostep'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'twostep'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Two-step verification</span>
          </button>
          <button
            onClick={() => { setActiveTab('applock'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'applock'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>App lock</span>
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center space-x-2">
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00a884]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-[#e9edef]">
          {/* TAB 1: PASSKEYS */}
          {activeTab === 'passkeys' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-[#00a884]/15 flex items-center justify-center text-[#00a884] shrink-0 mt-0.5">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#e9edef]">
                    Sign in with passkeys
                  </h4>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    Passkeys let you log in securely using your fingerprint, face, or screen lock (Windows Hello, Touch ID, Face ID).
                  </p>
                </div>
              </div>

              {/* Registered passkeys list */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-[#8696a0]">
                  SAVED PASSKEYS ({passkeys.length})
                </div>

                {passkeys.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[#2a3942] rounded-xl text-[#8696a0] text-xs">
                    No passkeys created yet. Add one to sign in with biometric authentication.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {passkeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between p-3.5 bg-[#202c33] rounded-xl border border-[#2a3942]"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#111b21] rounded-full flex items-center justify-center text-[#00a884]">
                            <Fingerprint className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#e9edef]">
                              {pk.name}
                            </div>
                            <div className="text-xs text-[#8696a0]">
                              Created {new Date(pk.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePasskey(pk.id)}
                          className="p-1.5 text-[#8696a0] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove passkey"
                        >
                          <Trash2 className="w-4 h-4" />
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
                className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-xs rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isRegistering ? 'Registering with device...' : 'Create passkey'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: TWO-STEP VERIFICATION PIN */}
          {activeTab === 'twostep' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-[#00a884]/15 flex items-center justify-center text-[#00a884] shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#e9edef]">
                    Two-step verification
                  </h4>
                  <p className="text-xs text-[#8696a0] leading-relaxed">
                    For extra security, require a 6-digit PIN when registering your phone number with WhatsApp again.
                  </p>
                </div>
              </div>

              {twoStepEnabled ? (
                <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] space-y-3">
                  <div className="flex items-center space-x-2 text-[#00a884] text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#00a884]" />
                    <span>Two-step verification is enabled</span>
                  </div>
                  <p className="text-xs text-[#8696a0]">
                    You will be asked to enter your PIN periodically and whenever you register a new device.
                  </p>
                  <button
                    onClick={handleDisableTwoStep}
                    className="py-2 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    Turn off PIN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveTwoStepPin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                      Create 6-digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.5em] text-lg py-2.5 px-3 bg-[#202c33] border border-[#2a3942] text-[#e9edef] rounded-lg focus:outline-hidden focus:border-[#00a884]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-[0.5em] text-lg py-2.5 px-3 bg-[#202c33] border border-[#2a3942] text-[#e9edef] rounded-lg focus:outline-hidden focus:border-[#00a884]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-xs rounded-lg transition-all cursor-pointer shadow-sm"
                  >
                    Turn on
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: APP LOCK */}
          {activeTab === 'applock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#202c33] rounded-xl border border-[#2a3942]">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-[#e9edef]">
                    Unlock with biometric or screen lock
                  </div>
                  <p className="text-xs text-[#8696a0]">
                    When enabled, you'll need to use your fingerprint or face to open WhatsApp Web.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appLockEnabled}
                    onChange={(e) => handleToggleAppLock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#374248] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                </label>
              </div>

              {appLockEnabled && (
                <div className="space-y-2 p-4 bg-[#202c33] rounded-xl border border-[#2a3942] text-xs">
                  <div className="text-xs font-semibold text-[#8696a0] mb-2">
                    AUTOMATICALLY LOCK
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: 'immediately', label: 'Immediately' },
                      { id: '1min', label: 'After 1 minute' },
                      { id: '15min', label: 'After 15 minutes' },
                      { id: '1hour', label: 'After 1 hour' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#111b21] cursor-pointer transition-colors"
                      >
                        <span className="text-xs text-[#e9edef]">{opt.label}</span>
                        <input
                          type="radio"
                          name="lock_timeout"
                          value={opt.id}
                          checked={lockTimeout === opt.id}
                          onChange={() => handleChangeTimeout(opt.id)}
                          className="accent-[#00a884] w-4 h-4 cursor-pointer"
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
                className="w-full py-2.5 px-4 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-[#2a3942] rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#8696a0]" />
                <span>Lock WhatsApp now</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#202c33] border-t border-[#222e35] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
