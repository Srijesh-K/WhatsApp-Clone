import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  Inbox,
  UserPlus,
  LogIn,
  AlertCircle,
  X,
  Settings,
  Terminal,
  Fingerprint,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { mojoAuth } from '../services/mojoauth';
import { security } from '../services/security';
import { supabaseData } from '../services/supabase';
import type { UserProfile } from '../services/supabase';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
}

const COUNTRIES = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  // Mode: Sign In or Create Account
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'input' | 'otp' | 'security_check' | 'profile'>('input');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Input states
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [destinationDisplay, setDestinationDisplay] = useState('');

  // Target existing user if logging in
  const [existingUser, setExistingUser] = useState<UserProfile | null>(null);

  // Social OAuth states
  const [oauthModal, setOauthModal] = useState<'google' | 'facebook' | null>(null);
  const [oauthName, setOauthName] = useState('');
  const [oauthEmail, setOauthEmail] = useState('');
  const [pendingSocialAuth, setPendingSocialAuth] = useState<{
    provider: 'google' | 'facebook';
    name: string;
    email: string;
  } | null>(null);

  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpStateId, setOtpStateId] = useState('');
  const [isRealEmailSent, setIsRealEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Mail API Config Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputApiKey, setInputApiKey] = useState(() => mojoAuth.getApiKey());

  // Security step state
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Profile setup state (for new accounts)
  const [fullName, setFullName] = useState('');
  const [aboutStatus, setAboutStatus] = useState('Hey there! I am using WhatsApp.');
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(2, 7));

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const getCleanIdentifier = () => {
    if (authMethod === 'email') {
      return email.trim().toLowerCase();
    } else {
      const cleanNum = phoneNumber.replace(/\D/g, '');
      return cleanNum ? `${selectedCountry.code} ${cleanNum}` : '';
    }
  };

  // Step 1: Send OTP with Account Existence Detection
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const identifier = getCleanIdentifier();

    if (!identifier) {
      setErrorMsg(authMethod === 'email' ? 'Please enter a valid email address.' : 'Please enter a valid phone number.');
      return;
    }

    if (authMethod === 'email' && (!identifier.includes('@') || !identifier.includes('.'))) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Check account existence
    const found = supabaseData.findAccount(identifier);

    if (authMode === 'login') {
      if (!found) {
        setErrorMsg('No WhatsApp account found with this email. Please switch to "Create Account" to sign up.');
        return;
      }
      setExistingUser(found);
    } else {
      // signup mode
      if (found) {
        setErrorMsg('An account already exists for this email! Please switch to "Sign In" to log in.');
        return;
      }
      setExistingUser(null);
    }

    setDestinationDisplay(identifier);
    setIsVerifying(true);

    try {
      if (authMethod === 'email') {
        const res = await mojoAuth.sendEmailOtp(identifier);
        if (res.success && res.stateId) {
          setOtpStateId(res.stateId);
          setIsRealEmailSent(!!res.isRealEmailSent);
          setResendTimer(30);
          setStep('otp');
        } else {
          setErrorMsg(res.message || 'Failed to send OTP to email.');
        }
      } else {
        const res = await mojoAuth.sendPhoneOtp(identifier);
        if (res.success && res.stateId) {
          setOtpStateId(res.stateId);
          setIsRealEmailSent(!!res.isRealEmailSent);
          setResendTimer(30);
          setStep('otp');
        } else {
          setErrorMsg(res.message || 'Failed to send OTP to phone.');
        }
      }
    } catch {
      setErrorMsg('Unable to connect to MojoAuth service.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (digit && index === 5 && updated.every((d) => d !== '')) {
      handleVerifyOtp(updated.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const arr = pasted.split('');
      setOtpDigits(arr);
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) return;

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const isValid = await mojoAuth.verifyOtp(otpStateId, code);
      if (isValid) {
        if (authMode === 'login' && existingUser) {
          if (security.isPasskeyRequired() || security.isTwoStepEnabled()) {
            setStep('security_check');
          } else {
            supabaseData.setCurrentUser(existingUser);
            try {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            } catch {}
            onSuccess(existingUser);
          }
        } else if (pendingSocialAuth) {
          // If authenticated through Google/Facebook, create account with Google details immediately
          const pubKey = await security.initE2EEKeys();
          const newUser: UserProfile = {
            id: 'usr_' + Date.now(),
            phoneNumber: destinationDisplay,
            fullName: pendingSocialAuth.name || 'Google User',
            avatarUrl:
              pendingSocialAuth.provider === 'google'
                ? `https://api.dicebear.com/7.x/avataaars/svg?seed=google_${encodeURIComponent(pendingSocialAuth.name)}`
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=fb_${encodeURIComponent(pendingSocialAuth.name)}`,
            aboutStatus: 'Hey there! I am using WhatsApp.',
            isOnline: true,
            lastSeen: 'online',
            publicKey: pubKey,
            passkeyRegistered: false,
          };

          supabaseData.setCurrentUser(newUser);
          try {
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } catch {}
          onSuccess(newUser);
        } else {
          setStep('profile');
        }
      } else {
        setErrorMsg('Invalid verification code. Please check your mail or use 123456 and try again.');
      }
    } catch {
      setErrorMsg('Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Security Check (Passkey / PIN) for Existing Accounts
  const handleVerifyPasskey = async () => {
    setIsCheckingSecurity(true);
    setErrorMsg(null);
    try {
      const ok = await security.authenticateWithPasskey();
      if (ok && existingUser) {
        supabaseData.setCurrentUser(existingUser);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch {}
        onSuccess(existingUser);
      } else {
        setErrorMsg('Passkey authentication could not be completed.');
      }
    } catch {
      setErrorMsg('Biometric verification failed.');
    } finally {
      setIsCheckingSecurity(false);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (security.verifyTwoStepPin(pinInput) && existingUser) {
      supabaseData.setCurrentUser(existingUser);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
      onSuccess(existingUser);
    } else {
      setErrorMsg('Incorrect 6-digit PIN.');
    }
  };

  // Step 4: Finish Profile Setup & Register New Account
  const handleFinishProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    const pubKey = await security.initE2EEKeys();

    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      phoneNumber: destinationDisplay,
      fullName: fullName.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
      aboutStatus: aboutStatus.trim() || 'Hey there! I am using WhatsApp.',
      isOnline: true,
      lastSeen: 'online',
      publicKey: pubKey,
      passkeyRegistered: security.getStoredPasskeys().length > 0,
    };

    supabaseData.setCurrentUser(newUser);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}

    onSuccess(newUser);
  };

  // Social OAuth Handler (Google or Facebook)
  const handleOpenSocialModal = (provider: 'google' | 'facebook') => {
    setErrorMsg(null);
    if (provider === 'google') {
      setOauthName('Srijesh');
      setOauthEmail('srijeshnair5@gmail.com');
    } else {
      setOauthName('Srijesh Nair');
      setOauthEmail('srijesh.meta@facebook.com');
    }
    setOauthModal(provider);
  };

  const handleCompleteSocialOAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthEmail.trim() || !oauthName.trim()) return;

    const cleanId = oauthEmail.trim().toLowerCase();
    const existing = supabaseData.findAccount(cleanId);
    const provider = oauthModal || 'google';

    setPendingSocialAuth({
      provider,
      name: oauthName.trim(),
      email: cleanId,
    });
    setDestinationDisplay(cleanId);
    setEmail(cleanId);
    setAuthMethod('email');

    if (existing) {
      setExistingUser(existing);
      setAuthMode('login');
    } else {
      setExistingUser(null);
      setAuthMode('signup');
      setFullName(oauthName.trim());
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await mojoAuth.sendEmailOtp(cleanId);
      if (res.success && res.stateId) {
        setOtpStateId(res.stateId);
        setIsRealEmailSent(!!res.isRealEmailSent);
        setResendTimer(30);
        setOauthModal(null);
        setStep('otp');
      } else {
        setErrorMsg(res.message || `Failed to dispatch verification code to ${provider === 'google' ? 'Google' : 'Facebook'} email.`);
      }
    } catch {
      setErrorMsg(`Unable to dispatch verification code to ${provider === 'google' ? 'Google' : 'Facebook'} account.`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveQuickConfig = (e: React.FormEvent) => {
    e.preventDefault();
    mojoAuth.setApiKey(inputApiKey);
    setShowConfigModal(false);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] p-4 select-none cyber-grid-dark cyber-scanlines">
      {/* Ambient Cyber Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0a1122]/95 border border-emerald-500/30 rounded-2xl shadow-[0_0_60px_-10px_rgba(0,245,160,0.2)] overflow-hidden flex flex-col backdrop-blur-2xl relative z-10">
        {/* Top High-Tech Terminal Header */}
        <div className="bg-[#050c18] border-b border-emerald-500/20 p-5 flex flex-col items-center text-center space-y-2 relative">
          {/* Telemetry Strip */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-emerald-400/80 mb-1 border-b border-emerald-500/10 pb-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 radar-online" />
              <span className="tracking-wider">NODE: ONLINE // US-EAST</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400/80">E2EE: ACTIVE</span>
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="p-1 rounded-md bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-colors"
                title="Configure MojoAuth & Supabase Mail Delivery"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="w-13 h-13 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,160,0.2)]">
              <ShieldCheck className="w-7 h-7 text-[#00f5a0]" />
            </div>
            {/* Tactical Corner Accents */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t border-r border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b border-l border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r border-emerald-400" />
          </div>

          <h2 className="text-lg font-bold font-mono tracking-wider text-white flex items-center space-x-1.5">
            <span>WHATSAPP // CYBER ENCLAVE</span>
          </h2>
          <p className="text-[11px] font-mono text-emerald-400/80">
            ZERO-KNOWLEDGE AUTHENTICATION // MOJOAUTH PROTECTED
          </p>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <div className="p-6">
          {/* ============================================================ */}
          {/* STEP 1: LOGIN VS SIGNUP + MAIL / PHONE / GOOGLE / FACEBOOK */}
          {/* ============================================================ */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Tactical Mode Toggle */}
              <div className="flex bg-[#040813] p-1 rounded-xl border border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    authMode === 'login'
                      ? 'bg-emerald-500 text-gray-950 shadow-[0_0_15px_rgba(0,245,160,0.3)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>[01 // SIGN IN]</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    authMode === 'signup'
                      ? 'bg-emerald-500 text-gray-950 shadow-[0_0_15px_rgba(0,245,160,0.3)]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>[02 // CREATE ID]</span>
                </button>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-1">
                <h3 className="font-mono font-bold text-white text-sm tracking-wide">
                  {authMode === 'login' ? 'ACCESS CRYPTOGRAPHIC ACCOUNT' : 'INITIALIZE NEW HARDWARE IDENTITY'}
                </h3>
                <p className="text-[11px] font-mono text-gray-400 leading-relaxed">
                  {authMode === 'login'
                    ? 'Authenticate via Email OTP, Google, Meta, or Phone'
                    : 'Register your cryptographic public key on the secure network'}
                </p>
              </div>

              {/* Notice if no API key is connected */}
              {!mojoAuth.isConfigured() && (
                <div className="flex items-center justify-between p-2.5 bg-[#050f1d] border border-cyan-500/30 rounded-xl text-xs font-mono">
                  <div className="flex items-center space-x-2 text-cyan-300">
                    <Mail className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span className="text-[10px]">Add MojoAuth API key to enable live email delivery.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-lg text-[10px] font-bold shrink-0 shadow-sm"
                  >
                    Add Key
                  </button>
                </div>
              )}

              {/* Email / Phone Method Toggle */}
              <div className="flex justify-center space-x-4 border-b border-emerald-500/10 pb-2">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
                  className={`text-xs font-mono font-medium pb-1 border-b-2 flex items-center space-x-1.5 transition-colors ${
                    authMethod === 'email'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP Gateway</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('phone'); setErrorMsg(null); }}
                  className={`text-xs font-mono font-medium pb-1 border-b-2 flex items-center space-x-1.5 transition-colors ${
                    authMethod === 'phone'
                      ? 'border-emerald-400 text-emerald-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone SMS Gateway</span>
                </button>
              </div>

              {/* Mail / Phone Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                {authMethod === 'email' ? (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                      Email Address (Cryptographic Identifier)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="srijesh@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono font-medium text-emerald-300 focus:outline-hidden focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(0,245,160,0.3)] transition-all"
                      />
                      <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3.5 top-3" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                        Country Code
                      </label>
                      <select
                        value={selectedCountry.name}
                        onChange={(e) => {
                          const c = COUNTRIES.find((x) => x.name === e.target.value);
                          if (c) setSelectedCountry(c);
                        }}
                        className="w-full py-2 px-3 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400 transition-all"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <div className="flex space-x-2">
                        <div className="py-2.5 px-3 bg-[#070d1a] border border-emerald-500/30 rounded-xl text-xs font-mono font-semibold text-emerald-400">
                          {selectedCountry.code}
                        </div>
                        <input
                          type="tel"
                          placeholder="555 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 py-2.5 px-3 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl font-mono font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all active:scale-98 disabled:opacity-50"
                >
                  {authMethod === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span>{isVerifying ? 'DISPATCHING MOJOAUTH OTP...' : authMethod === 'email' ? '[TRANSMIT OTP TO MAIL]' : '[CONTINUE VIA PHONE]'}</span>
                </button>
              </form>

              {/* Social Login Options Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-emerald-500/20"></div>
                <span className="shrink mx-3 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                  OAUTH FEDERATION
                </span>
                <div className="flex-grow border-t border-emerald-500/20"></div>
              </div>

              {/* Google and Facebook Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('google')}
                  className="py-2.5 px-3 bg-[#070d1a] hover:bg-[#0c152a] border border-emerald-500/25 hover:border-emerald-400 rounded-xl text-xs font-mono text-gray-200 flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Google</span>
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('facebook')}
                  className="py-2.5 px-3 bg-[#070d1a] hover:bg-[#0c152a] border border-emerald-500/25 hover:border-emerald-400 rounded-xl text-xs font-mono text-gray-200 flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              {/* Bottom Quick Switch Link */}
              <div className="text-center pt-1">
                {authMode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    // No hardware account registered? Initialize one
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    // Account signature already present? Access terminal
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: MOJOAUTH OTP VERIFICATION */}
          {/* ============================================================ */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="p-1 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-[#070f20] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-white">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>// VERIFY CRYPTOGRAPHIC KEY</span>
                </div>
                <div className="w-4" />
              </div>

              <div className="flex flex-col items-center space-y-1">
                {pendingSocialAuth?.provider === 'google' ? (
                  <div className="w-12 h-12 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-1">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  </div>
                ) : authMethod === 'email' ? (
                  <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-[#00f5a0] mb-1 shadow-[0_0_20px_rgba(0,245,160,0.2)]">
                    <Inbox className="w-6 h-6" />
                  </div>
                ) : null}
                <p className="text-[11px] font-mono text-gray-400 text-center leading-relaxed">
                  ENTER 6-DIGIT PAYLOAD TRANSMITTED TO{' '}
                  <span className="font-bold text-emerald-400">{destinationDisplay}</span>
                </p>
              </div>

              {/* Delivery Status Card */}
              <div className="p-3 bg-[#040813] border border-emerald-500/20 rounded-xl text-center space-y-1.5 font-mono">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                  DISPATCH DESTINATION:
                </div>
                <div className="text-xs font-semibold text-white tracking-wider">
                  {destinationDisplay}
                </div>
                {isRealEmailSent ? (
                  <div className="text-[10px] text-emerald-400 font-medium flex items-center justify-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DISPATCH CONFIRMED // CHECK INBOX / SPAM</span>
                  </div>
                ) : (
                  <div className="p-2 bg-[#0d182e] border border-cyan-500/30 rounded-lg text-[10px] text-cyan-300 space-y-1">
                    <div className="font-semibold flex items-center justify-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>DEVELOPMENT TELEMETRY ACTIVE</span>
                    </div>
                    <div className="text-gray-400">
                      Live key unconfigured in environment. Use sandbox bypass or configure MojoAuth.
                    </div>
                    <div className="pt-0.5 flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowConfigModal(true)}
                        className="text-emerald-400 underline font-semibold hover:text-emerald-300"
                      >
                        [SET API KEY]
                      </button>
                      <span className="text-gray-500">|</span>
                      <span className="font-mono font-bold text-cyan-400">BYPASS CODE: 123456</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex justify-center space-x-2 on-paste" onPaste={handlePasteOtp}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono bg-[#040813] border border-emerald-500/30 text-emerald-300 rounded-xl focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(0,245,160,0.35)] focus:outline-hidden transition-all"
                  />
                ))}
              </div>

              {/* Resend button */}
              <div className="flex items-center justify-between pt-2 text-xs font-mono">
                <button
                  type="button"
                  disabled={resendTimer > 0 || isVerifying}
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as React.FormEvent)}
                  className="text-emerald-400 font-medium hover:underline disabled:text-gray-500 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {resendTimer > 0
                      ? `[RETRY: ${resendTimer}s]`
                      : authMethod === 'email'
                      ? '[RETRANSMIT EMAIL]'
                      : '[RETRANSMIT SMS]'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isVerifying || otpDigits.some((d) => !d)}
                  className="py-2 px-5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold font-mono rounded-xl tracking-wider disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)]"
                >
                  {isVerifying ? 'VERIFYING...' : '[VERIFY KEY]'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SECURITY CHECK (Passkey / PIN) */}
          {/* ============================================================ */}
          {step === 'security_check' && (
            <div className="space-y-5 text-center font-mono">
              <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-[#00f5a0] mx-auto shadow-[0_0_20px_rgba(0,245,160,0.25)]">
                <KeyRound className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm tracking-wider">
                  // HARDWARE VERIFICATION REQUIRED
                </h3>
                <p className="text-[11px] text-gray-400">
                  Account is protected by hardware security enclave. Provide biometric signature to proceed.
                </p>
              </div>

              {security.isPasskeyRequired() && (
                <button
                  onClick={handleVerifyPasskey}
                  disabled={isCheckingSecurity}
                  className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl font-bold font-mono text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all disabled:opacity-50"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{isCheckingSecurity ? 'SCANNING HARDWARE...' : '[AUTHENTICATE VIA PASSKEY]'}</span>
                </button>
              )}

              {security.isTwoStepEnabled() && (
                <form onSubmit={handleVerifyPin} className="space-y-3 pt-3 border-t border-emerald-500/10">
                  <label className="block text-[10px] uppercase text-gray-400">
                    OR ENTER 6-DIGIT SECURITY PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[0.4em] text-xl font-mono py-2.5 px-3 bg-[#040813] border border-emerald-500/30 text-emerald-300 rounded-xl focus:outline-hidden focus:border-emerald-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#0a152e] border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-mono font-bold transition-colors"
                  >
                    [SUBMIT PIN CODE]
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: PROFILE SETUP (ONLY FOR NEW ACCOUNTS) */}
          {/* ============================================================ */}
          {step === 'profile' && (
            <form onSubmit={handleFinishProfile} className="space-y-4 font-mono">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-white text-sm tracking-wider">
                  // INITIALIZE NODE PROFILE
                </h3>
                <p className="text-[11px] text-gray-400">
                  Establish public encryption alias and cryptographic identity.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative group cursor-pointer" onClick={() => setAvatarSeed(Math.random().toString(36).substring(2, 7))}>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-2xl bg-[#040813] border-2 border-emerald-400/60 p-1 shadow-[0_0_15px_rgba(0,245,160,0.25)]"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-emerald-400 text-[10px] font-bold transition-opacity">
                    [RANDOMIZE]
                  </div>
                </div>
                <span className="text-[10px] text-gray-500">Click avatar to regenerate seed</span>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-gray-400">
                  Display Alias / Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Srijesh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              {/* About Status */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-gray-400">
                  Broadcast Status
                </label>
                <input
                  type="text"
                  placeholder="E2EE active. Encrypted communications only."
                  value={aboutStatus}
                  onChange={(e) => setAboutStatus(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl font-bold font-mono text-xs tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(0,245,160,0.3)] transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>[DERIVE KEYS & COMPLETE REGISTRATION]</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SOCIAL OAUTH MODAL (GOOGLE / FACEBOOK) */}
      {/* ============================================================ */}
      {oauthModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a1122] border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  {oauthModal === 'google' ? 'GOOGLE OAUTH GATEWAY' : 'META OAUTH GATEWAY'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOauthModal(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-gray-400">
              Federate credentials via {oauthModal === 'google' ? 'Google Cloud' : 'Meta Graph'} OAuth proxy.
            </p>

            <form onSubmit={handleCompleteSocialOAuth} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">
                  Full Name / Alias
                </label>
                <input
                  type="text"
                  required
                  value={oauthName}
                  onChange={(e) => setOauthName(e.target.value)}
                  className="w-full py-2 px-3 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">
                  OAuth Account Email
                </label>
                <input
                  type="email"
                  required
                  value={oauthEmail}
                  onChange={(e) => setOauthEmail(e.target.value)}
                  className="w-full py-2 px-3 bg-[#040813] border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl text-xs font-bold font-mono tracking-wider transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)]"
              >
                [AUTHORIZE AS {oauthName || 'USER'}]
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK MAIL / MOJOAUTH / SUPABASE CONFIG MODAL */}
      {/* ============================================================ */}
      {showConfigModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a1122] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Settings className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  LIVE EMAIL API CONFIGURATION
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Configure your <span className="font-bold text-white">MojoAuth API Key</span> to transmit hardware-grade 6-digit OTP codes straight to your Gmail or Outlook.
            </p>

            <form onSubmit={handleSaveQuickConfig} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-gray-400 mb-1">
                  MojoAuth API Key
                </label>
                <input
                  type="password"
                  placeholder="Paste MojoAuth Key here..."
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  className="w-full py-2 px-3 bg-[#040813] border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-300 focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl text-xs font-bold font-mono tracking-wider transition-all shadow-[0_0_15px_rgba(0,210,255,0.3)]"
              >
                [COMMIT API CREDENTIALS]
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
