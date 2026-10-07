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
  const [otpStateId, setOtpStateId] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          setResendTimer(30);
          setStep('otp');
        } else {
          setErrorMsg(res.message || 'Failed to send OTP to email.');
        }
      } else {
        const res = await mojoAuth.sendPhoneOtp(identifier);
        if (res.success && res.stateId) {
          setOtpStateId(res.stateId);
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
        } else {
          setStep('profile');
        }
      } else {
        setErrorMsg('Invalid verification code. Please check your mail and try again.');
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

    // If account already exists -> Log in directly
    if (existing) {
      supabaseData.setCurrentUser(existing);
      setOauthModal(null);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch {}
      onSuccess(existing);
      return;
    }

    // If account does not exist -> Create account directly using Social identity
    const pubKey = await security.initE2EEKeys();
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      phoneNumber: cleanId,
      fullName: oauthName.trim(),
      avatarUrl:
        oauthModal === 'google'
          ? `https://api.dicebear.com/7.x/avataaars/svg?seed=google_${encodeURIComponent(oauthName)}`
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=fb_${encodeURIComponent(oauthName)}`,
      aboutStatus: 'Hey there! I am using WhatsApp.',
      isOnline: true,
      lastSeen: 'online',
      publicKey: pubKey,
      passkeyRegistered: false,
    };

    supabaseData.setCurrentUser(newUser);
    setOauthModal(null);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}

    onSuccess(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#efeae2] dark:bg-[#0b141a] p-4 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#202c33] rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Top Header */}
        <div className="bg-[#008069] text-white p-6 flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-xs">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">WhatsApp Web</h2>
          <p className="text-xs text-emerald-100">
            End-to-End Encrypted & MojoAuth Protected
          </p>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <div className="p-6">
          {/* ============================================================ */}
          {/* STEP 1: LOGIN VS SIGNUP + MAIL / PHONE / GOOGLE / FACEBOOK */}
          {/* ============================================================ */}
          {step === 'input' && (
            <div className="space-y-4">
              {/* Sign In vs Create Account Toggle */}
              <div className="flex bg-gray-100 dark:bg-[#111b21] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-[#202c33] text-[#00a884] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-[#202c33] text-[#00a884] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {authMode === 'login' ? 'Sign in to your account' : 'Create a new WhatsApp account'}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {authMode === 'login'
                    ? 'Log in using your Email, Google, Facebook, or Phone.'
                    : 'Register your account using Email, Google, Facebook, or Phone.'}
                </p>
              </div>

              {/* Email / Phone Method Toggle */}
              <div className="flex justify-center space-x-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setErrorMsg(null); }}
                  className={`text-xs font-medium pb-1 border-b-2 flex items-center space-x-1.5 transition-colors ${
                    authMethod === 'email'
                      ? 'border-[#00a884] text-[#00a884]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('phone'); setErrorMsg(null); }}
                  className={`text-xs font-medium pb-1 border-b-2 flex items-center space-x-1.5 transition-colors ${
                    authMethod === 'phone'
                      ? 'border-[#00a884] text-[#00a884]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone SMS</span>
                </button>
              </div>

              {/* Mail / Phone Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-3">
                {authMethod === 'email' ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="srijesh@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                      />
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Country
                      </label>
                      <select
                        value={selectedCountry.name}
                        onChange={(e) => {
                          const c = COUNTRIES.find((x) => x.name === e.target.value);
                          if (c) setSelectedCountry(c);
                        }}
                        className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <div className="flex space-x-2">
                        <div className="py-2.5 px-3 bg-gray-100 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {selectedCountry.code}
                        </div>
                        <input
                          type="tel"
                          placeholder="555 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
                >
                  {authMethod === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span>{isVerifying ? 'Sending MojoAuth OTP...' : authMethod === 'email' ? 'Send OTP to Mail' : 'Continue with Phone'}</span>
                </button>
              </form>

              {/* Social Login Options Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="shrink mx-3 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* Google and Facebook Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('google')}
                  className="py-2.5 px-3 bg-white dark:bg-[#111b21] hover:bg-gray-50 dark:hover:bg-[#202c33] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center space-x-2 shadow-2xs transition-all active:scale-98"
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
                  className="py-2.5 px-3 bg-white dark:bg-[#111b21] hover:bg-gray-50 dark:hover:bg-[#202c33] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center space-x-2 shadow-2xs transition-all active:scale-98"
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
                    className="text-xs text-[#00a884] hover:underline"
                  >
                    Don't have an account yet? Create one
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                    className="text-xs text-[#00a884] hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: MOJOAUTH OTP VERIFICATION */}
          {/* ============================================================ */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  {authMethod === 'email' ? 'Check your mail' : 'Verifying code'}
                </h3>
                <div className="w-5" />
              </div>

              <div className="flex flex-col items-center space-y-1">
                {authMethod === 'email' && (
                  <div className="w-12 h-12 bg-teal-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-[#00a884] mb-1">
                    <Inbox className="w-6 h-6" />
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  Enter the 6-digit verification code sent to{' '}
                  <span className="font-semibold text-gray-900 dark:text-white">{destinationDisplay}</span>.
                  {authMethod === 'email' && ' Please check your inbox and spam folder.'}
                </p>
              </div>

              {/* Destination Confirmation Card */}
              <div className="p-3 bg-gray-50 dark:bg-[#111b21] border border-gray-200 dark:border-gray-800 rounded-xl text-center space-y-1">
                <div className="text-xs text-gray-500">
                  Verification code delivered to
                </div>
                <div className="text-sm font-semibold font-mono text-gray-800 dark:text-gray-200">
                  {destinationDisplay}
                </div>
                <div className="text-[11px] text-gray-400">
                  Please open your mail app to view the 6-digit code
                </div>
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
                    className="w-11 h-13 text-center text-xl font-bold font-mono bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/20 focus:outline-hidden text-gray-900 dark:text-white transition-all"
                  />
                ))}
              </div>

              {/* Resend button */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  disabled={resendTimer > 0 || isVerifying}
                  onClick={() => handleSendOtp({ preventDefault: () => {} } as React.FormEvent)}
                  className="text-[#00a884] font-medium hover:underline disabled:text-gray-400 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : authMethod === 'email'
                      ? 'Resend Email'
                      : 'Resend SMS'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isVerifying || otpDigits.some((d) => !d)}
                  className="py-2 px-4 bg-[#00a884] text-white rounded-lg font-medium hover:bg-[#008f70] disabled:opacity-50 transition-colors"
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: SECURITY CHECK (Passkey / PIN) */}
          {/* ============================================================ */}
          {step === 'security_check' && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-teal-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-[#00a884] mx-auto">
                <KeyRound className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  Security Verification Required
                </h3>
                <p className="text-xs text-gray-500">
                  This account is protected with hardware Passkey / PIN. Verify your biometric identity to prevent unauthorized takeover.
                </p>
              </div>

              {security.isPasskeyRequired() && (
                <button
                  onClick={handleVerifyPasskey}
                  disabled={isCheckingSecurity}
                  className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isCheckingSecurity ? 'Scanning Biometrics...' : 'Authenticate with Device Passkey'}</span>
                </button>
              )}

              {security.isTwoStepEnabled() && (
                <form onSubmit={handleVerifyPin} className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Or Enter 6-Digit Two-Step PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-widest text-xl font-mono py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-hidden focus:border-[#00a884]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gray-800 text-white rounded-xl text-xs font-medium hover:bg-gray-700 transition-colors"
                  >
                    Confirm PIN
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: PROFILE SETUP (ONLY FOR NEW ACCOUNTS) */}
          {/* ============================================================ */}
          {step === 'profile' && (
            <form onSubmit={handleFinishProfile} className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                  Profile Info
                </h3>
                <p className="text-xs text-gray-500">
                  Set up your name and optional profile avatar.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative group cursor-pointer" onClick={() => setAvatarSeed(Math.random().toString(36).substring(2, 7))}>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt="Profile Avatar"
                    className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-[#00a884] p-1 shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                    Change
                  </div>
                </div>
                <span className="text-[11px] text-gray-400">Tap avatar to randomize</span>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Srijesh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              {/* About Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  About
                </label>
                <input
                  type="text"
                  placeholder="Hey there! I am using WhatsApp."
                  value={aboutStatus}
                  onChange={(e) => setAboutStatus(e.target.value)}
                  className="w-full py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-medium text-sm flex items-center justify-center space-x-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Account Setup</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SOCIAL OAUTH MODAL (GOOGLE / FACEBOOK) */}
      {/* ============================================================ */}
      {oauthModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center space-x-2.5">
                {oauthModal === 'google' ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {oauthModal === 'google' ? 'Sign in with Google' : 'Log in with Facebook'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOauthModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Continue to WhatsApp with your {oauthModal === 'google' ? 'Google' : 'Facebook'} profile.
            </p>

            <form onSubmit={handleCompleteSocialOAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={oauthName}
                  onChange={(e) => setOauthName(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {oauthModal === 'google' ? 'Google Account Email' : 'Facebook Account Email'}
                </label>
                <input
                  type="email"
                  required
                  value={oauthEmail}
                  onChange={(e) => setOauthEmail(e.target.value)}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 px-4 text-white rounded-xl text-xs font-medium transition-colors shadow-sm ${
                  oauthModal === 'google'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-[#1877F2] hover:bg-[#166fe5]'
                }`}
              >
                Continue as {oauthName || 'User'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
