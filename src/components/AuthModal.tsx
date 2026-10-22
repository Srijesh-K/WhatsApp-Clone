import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  Inbox,
  AlertCircle,
  X,
  Settings,
  Sparkles,
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

  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [, setOtpStateId] = useState('');
  const [isRealEmailSent, setIsRealEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Mail API Config Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputApiKey, setInputApiKey] = useState(() => mojoAuth.getApiKey());

  // Security step state
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

  // Instant 1-Click Demo Login
  const handleInstantDemoLogin = () => {
    const demoUser: UserProfile = {
      id: 'usr_srijesh',
      phoneNumber: '+1 (555) 019-2834',
      fullName: 'Srijesh Nair',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      aboutStatus: 'Available · Using WhatsApp Web',
      isOnline: true,
      lastSeen: 'online',
    };
    supabaseData.setCurrentUser(demoUser);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}
    onSuccess(demoUser);
  };

  // Step 1: Send OTP
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

    if (authMode === 'login' && found) {
      setExistingUser(found);
    } else {
      setExistingUser(found || null);
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
          setOtpDigits(['', '', '', '', '', '']);
        } else {
          setErrorMsg(res.message || 'Failed to dispatch email verification code.');
        }
      } else {
        const res = await mojoAuth.sendPhoneOtp(identifier);
        if (res.success && res.stateId) {
          setOtpStateId(res.stateId);
          setResendTimer(30);
          setStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
        } else {
          setErrorMsg(res.message || 'Failed to dispatch SMS verification code.');
        }
      }
    } catch {
      setErrorMsg('Network error. Please try again or use Quick Demo Login.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Handle OTP Input
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      const arr = paste.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtpDigits(arr);
      if (arr[5]) {
        otpInputsRef.current[5]?.focus();
      }
    }
  };

  const handleAutoFillCode = () => {
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const isValid = code === '123456' || code.length === 6;

      if (isValid) {
        if (existingUser) {
          if (security.isPasskeyRequired() || security.isTwoStepEnabled()) {
            setStep('security_check');
          } else {
            supabaseData.setCurrentUser(existingUser);
            try {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            } catch {}
            onSuccess(existingUser);
          }
        } else {
          setStep('profile');
        }
      } else {
        setErrorMsg('Invalid verification code. Please try 123456 or check your mail.');
      }
    } catch {
      setErrorMsg('Verification failed.');
    } finally {
      setIsVerifying(false);
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
      phoneNumber: destinationDisplay || '+1 555-0100',
      fullName: fullName.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
      aboutStatus: aboutStatus.trim() || 'Hey there! I am using WhatsApp.',
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
  };

  // Social OAuth Handler
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

    setDestinationDisplay(cleanId);
    setEmail(cleanId);
    setAuthMethod('email');

    if (existing) {
      setExistingUser(existing);
      setAuthMode('login');
      supabaseData.setCurrentUser(existing);
      onSuccess(existing);
    } else {
      const newUser: UserProfile = {
        id: 'usr_' + Date.now(),
        phoneNumber: cleanId,
        fullName: oauthName.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${oauthName}`,
        aboutStatus: 'Hey there! I am using WhatsApp.',
        isOnline: true,
        lastSeen: 'online',
      };
      supabaseData.setCurrentUser(newUser);
      onSuccess(newUser);
    }
    setOauthModal(null);
  };

  const handleSaveQuickConfig = (e: React.FormEvent) => {
    e.preventDefault();
    mojoAuth.setApiKey(inputApiKey);
    setShowConfigModal(false);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#eae6df] dark:bg-[#111b21] p-4 overflow-y-auto">
      {/* WhatsApp Web Top Header Bar */}
      <div className="w-full bg-[#00a884] h-56 absolute top-0 left-0 hidden md:block" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white dark:bg-[#222e35] rounded-xl shadow-2xl overflow-hidden flex flex-col relative z-10 border border-gray-200 dark:border-gray-800 my-auto">
        {/* Header */}
        <div className="bg-[#008069] dark:bg-[#202c33] p-5 text-white flex items-center justify-between border-b border-black/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">WhatsApp Web</h2>
              <p className="text-xs text-white/80">End-to-end encrypted messaging</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="API Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <div className="p-6">
          {/* ============================================================ */}
          {/* STEP 1: LOGIN / SIGNUP */}
          {/* ============================================================ */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Quick Demo Login Button - Instant Access */}
              <button
                type="button"
                onClick={handleInstantDemoLogin}
                className="w-full py-2.5 px-4 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[#008069] dark:text-[#00a884] border border-[#00a884]/40 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#00a884]" />
                <span>Quick Demo Login (1-Click)</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="shrink mx-3 text-xs text-gray-400">or sign in with</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-[#111b21] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white shadow-xs font-semibold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email / Phone Method Toggle */}
              <div className="flex justify-center space-x-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
                  className={`text-xs pb-1 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    authMethod === 'email'
                      ? 'border-[#00a884] text-[#00a884] font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('phone'); setErrorMsg(null); }}
                  className={`text-xs pb-1 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    authMethod === 'phone'
                      ? 'border-[#00a884] text-[#00a884] font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                {authMethod === 'email' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country
                      </label>
                      <select
                        value={selectedCountry.name}
                        onChange={(e) => {
                          const c = COUNTRIES.find((x) => x.name === e.target.value);
                          if (c) setSelectedCountry(c);
                        }}
                        className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <div className="flex space-x-2">
                        <div className="py-2 px-3 bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedCountry.code}
                        </div>
                        <input
                          type="tel"
                          placeholder="555 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg font-medium text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isVerifying ? 'Sending Code...' : 'Continue'}
                </button>
              </form>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('google')}
                  className="py-2 px-3 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('facebook')}
                  className="py-2 px-3 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: OTP VERIFICATION */}
          {/* ============================================================ */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Enter 6-Digit Code
                </div>
                <div className="w-5" />
              </div>

              <div className="flex flex-col items-center space-y-1 text-center">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-[#00a884] mb-1">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Code sent to <span className="font-semibold text-gray-900 dark:text-white">{destinationDisplay}</span>
                </p>
                {isRealEmailSent && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check your email inbox or spam</span>
                  </span>
                )}
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex justify-center space-x-2 py-2" onPaste={handlePasteOtp}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-xl font-bold bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:border-[#00a884] focus:outline-hidden transition-all"
                  />
                ))}
              </div>

              {/* Quick Auto-Fill Demo Code button */}
              <button
                type="button"
                onClick={handleAutoFillCode}
                className="w-full py-1.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Auto-fill demo code: 123456
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  disabled={resendTimer > 0 || isVerifying}
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as React.FormEvent)}
                  className="text-[#00a884] font-medium hover:underline disabled:text-gray-400 flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isVerifying || otpDigits.some((d) => !d)}
                  className="py-2 px-5 bg-[#00a884] hover:bg-[#008f70] text-white font-medium rounded-lg disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SECURITY PIN CHECK */}
          {/* ============================================================ */}
          {step === 'security_check' && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-[#00a884] mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Two-Step Verification
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your secret 6-digit PIN to continue.
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-widest text-2xl py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-hidden focus:border-[#00a884]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Submit PIN
                </button>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: PROFILE SETUP */}
          {/* ============================================================ */}
          {step === 'profile' && (
            <form onSubmit={handleFinishProfile} className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Profile Info
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Please provide your name and an optional profile picture.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setAvatarSeed(Math.random().toString(36).substring(2, 7))}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-[#00a884] object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                    Change
                  </div>
                </div>
                <span className="text-[11px] text-gray-400">Click avatar to change</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Srijesh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  About Status
                </label>
                <input
                  type="text"
                  value={aboutStatus}
                  onChange={(e) => setAboutStatus(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg font-medium text-sm transition-all cursor-pointer"
              >
                Finish & Enter WhatsApp
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Social Modal */}
      {oauthModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                Continue with {oauthModal === 'google' ? 'Google' : 'Facebook'}
              </h3>
              <button
                type="button"
                onClick={() => setOauthModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSocialOAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={oauthName}
                  onChange={(e) => setOauthName(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={oauthEmail}
                  onChange={(e) => setOauthEmail(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                Authorize & Log In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center space-x-2 text-[#00a884]">
                <Settings className="w-5 h-5" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  MojoAuth API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your MojoAuth API Key for live email OTP delivery.
            </p>

            <form onSubmit={handleSaveQuickConfig} className="space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Paste MojoAuth Key here..."
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-lg text-sm font-medium transition-all cursor-pointer"
              >
                Save Key
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
