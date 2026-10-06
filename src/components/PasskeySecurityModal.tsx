import React, { useState, useEffect } from 'react';
import { X, KeyRound, Fingerprint, ShieldAlert, Lock, Trash2, CheckCircle2, Plus } from 'lucide-react';
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
      setSuccessMsg(`Passkey "${pk.name}" registered successfully! Your account cannot be taken over without this device's biometrics.`);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMsg(e.message || 'Failed to create passkey authenticator.');
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
      setErrorMsg('Please enter a 6-digit numeric PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('PINs do not match. Please re-enter.');
      return;
    }

    security.setTwoStepPin(newPin);
    setTwoStepEnabled(true);
    setNewPin('');
    setConfirmPin('');
    setSuccessMsg('Two-step verification PIN enabled! This PIN will be required when registering your number again.');
  };

  const handleDisableTwoStep = () => {
    security.disableTwoStepPin();
    setTwoStepEnabled(false);
    setSuccessMsg('Two-step verification disabled.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#008069] text-white">
          <div className="flex items-center space-x-2.5">
            <KeyRound className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Account Security & Passkeys</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111b21] px-4">
          <button
            onClick={() => { setActiveTab('passkeys'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'passkeys'
                ? 'border-[#00a884] text-[#00a884] dark:text-[#00a884]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Passkeys</span>
          </button>
          <button
            onClick={() => { setActiveTab('twostep'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'twostep'
                ? 'border-[#00a884] text-[#00a884] dark:text-[#00a884]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Two-Step PIN</span>
          </button>
          <button
            onClick={() => { setActiveTab('applock'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'applock'
                ? 'border-[#00a884] text-[#00a884] dark:text-[#00a884]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>App Lock</span>
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 dark:text-gray-200">
          {/* TAB 1: PASSKEYS */}
          {activeTab === 'passkeys' && (
            <div className="space-y-5">
              <div className="flex items-start space-x-3 p-4 bg-teal-50 dark:bg-[#111b21] rounded-xl border border-teal-100 dark:border-gray-800">
                <Fingerprint className="w-7 h-7 text-[#00a884] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Passwordless Biometric Passkeys (FIDO2 / WebAuthn)
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Passkeys verify your identity using your device's fingerprint, Face ID, or Windows Hello. Even if someone intercepts an SMS OTP or performs a SIM swap, they <span className="font-semibold text-gray-900 dark:text-gray-100">cannot</span> log into your WhatsApp without your physical hardware passkey.
                  </p>
                </div>
              </div>

              {/* Registered passkeys list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Registered Passkeys ({passkeys.length})</span>
                </div>

                {passkeys.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-400 text-xs">
                    No passkeys registered yet. Add your device's biometric sensor below to protect your account.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {passkeys.map((pk) => (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#111b21] rounded-xl border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-[#00a884]">
                            <Fingerprint className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {pk.name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Added {new Date(pk.createdAt).toLocaleDateString()} · {pk.type}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemovePasskey(pk.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
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
                className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isRegistering ? 'Prompting Biometrics...' : 'Register Device Passkey'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: TWO-STEP VERIFICATION PIN */}
          {activeTab === 'twostep' && (
            <div className="space-y-5">
              <div className="flex items-start space-x-3 p-4 bg-teal-50 dark:bg-[#111b21] rounded-xl border border-teal-100 dark:border-gray-800">
                <ShieldAlert className="w-7 h-7 text-[#00a884] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Two-Step Verification (6-Digit PIN)
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    For added security, enable a 6-digit PIN that must be entered whenever your phone number is registered with WhatsApp again.
                  </p>
                </div>
              </div>

              {twoStepEnabled ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Two-step verification is active</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your account is shielded with a secret 6-digit PIN.
                  </p>
                  <button
                    onClick={handleDisableTwoStep}
                    className="py-2 px-4 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 rounded-lg text-xs font-medium transition-colors"
                  >
                    Disable Two-Step PIN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveTwoStepPin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Create 6-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-widest text-xl font-mono py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-hidden focus:border-[#00a884]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm 6-Digit PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full text-center tracking-widest text-xl font-mono py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-hidden focus:border-[#00a884]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm shadow-sm transition-all"
                  >
                    Enable Two-Step Verification
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: APP LOCK */}
          {activeTab === 'applock' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111b21] rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Unlock with Biometrics / Passkey
                  </div>
                  <p className="text-xs text-gray-500">
                    When enabled, you will need to use your Passkey or PIN to unlock WhatsApp.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={appLockEnabled}
                    onChange={(e) => handleToggleAppLock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
                </label>
              </div>

              {appLockEnabled && (
                <div className="space-y-3 p-4 bg-gray-50 dark:bg-[#111b21] rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Automatically lock
                  </div>
                  <div className="space-y-2">
                    {[
                      { id: 'immediately', label: 'Immediately' },
                      { id: '1min', label: 'After 1 minute' },
                      { id: '15min', label: 'After 15 minutes' },
                      { id: '1hour', label: 'After 1 hour' },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer"
                      >
                        <span className="text-sm">{opt.label}</span>
                        <input
                          type="radio"
                          name="lock_timeout"
                          value={opt.id}
                          checked={lockTimeout === opt.id}
                          onChange={() => handleChangeTimeout(opt.id)}
                          className="accent-[#00a884] w-4 h-4"
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
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Lock WhatsApp Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
