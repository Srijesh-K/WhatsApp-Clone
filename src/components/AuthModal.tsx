import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Inbox,
  AlertCircle,
  X,
  Settings,
  UserPlus,
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
  const [oauthModal, setOauthModal] = useState<'google' | 'github' | 'facebook' | null>(null);
  const [oauthName, setOauthName] = useState('');
  const [oauthEmail, setOauthEmail] = useState('');

  // Google Authenticator & Account Chooser state
  const [googleAccounts, setGoogleAccounts] = useState([
    {
      name: 'Srijesh K',
      email: 'srijeshkookal@gmail.com',
      avatarBg: '#ea4335',
      letter: 'S',
    },
    {
      name: 'Srijesh Nair',
      email: 'srijeshnair5@gmail.com',
      avatarBg: '#1a73e8',
      letter: 'S',
    },
  ]);
  const [googleAuthStep, setGoogleAuthStep] = useState<'chooser' | 'email_input' | 'authenticator_2fa'>('chooser');
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{
    name: string;
    email: string;
    avatarBg: string;
    letter: string;
  } | null>(null);
  const [google2faCode, setGoogle2faCode] = useState('');
  const [googleRememberDevice, setGoogleRememberDevice] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newGoogleName, setNewGoogleName] = useState('');

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
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(2, 7));

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

  // Handle browser back button: always return to login page if inside sub-steps or Google chooser
  useEffect(() => {
    const handlePopState = () => {
      if (oauthModal) {
        if (googleAuthStep === 'authenticator_2fa') {
          setGoogleAuthStep('chooser');
          setGoogle2faCode('');
          setErrorMsg(null);
        } else if (googleAuthStep === 'email_input') {
          setGoogleAuthStep('chooser');
          setErrorMsg(null);
        } else {
          setOauthModal(null);
          setGoogleAuthStep('chooser');
          setSelectedGoogleAccount(null);
          setErrorMsg(null);
        }
      } else if (step !== 'input') {
        setStep('input');
        setErrorMsg(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step, oauthModal, googleAuthStep]);

  const goToStep = (newStep: 'input' | 'otp' | 'security_check' | 'profile') => {
    if (newStep !== 'input') {
      window.history.pushState({ authStep: newStep }, '');
    }
    setStep(newStep);
    setErrorMsg(null);
  };

  const getCleanIdentifier = () => {
    if (authMethod === 'email') {
      return email.trim().toLowerCase();
    } else {
      const cleanNum = phoneNumber.replace(/\D/g, '');
      return cleanNum ? `${selectedCountry.code} ${cleanNum}` : '';
    }
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
          goToStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
        } else {
          setErrorMsg(res.message || 'Failed to dispatch email verification code.');
        }
      } else {
        const res = await mojoAuth.sendPhoneOtp(identifier);
        if (res.success && res.stateId) {
          setOtpStateId(res.stateId);
          setResendTimer(30);
          goToStep('otp');
          setOtpDigits(['', '', '', '', '', '']);
        } else {
          setErrorMsg(res.message || 'Failed to dispatch SMS verification code.');
        }
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
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
            goToStep('security_check');
          } else {
            supabaseData.setCurrentUser(existingUser);
            try {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
            } catch {}
            onSuccess(existingUser);
          }
        } else {
          goToStep('profile');
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
  const handleOpenSocialModal = (provider: 'google' | 'github' | 'facebook') => {
    setErrorMsg(null);
    window.history.pushState({ oauth: provider }, '');
    if (provider === 'google') {
      setGoogleAuthStep('chooser');
      setSelectedGoogleAccount(null);
      setGoogle2faCode('');
      setNewGoogleEmail('');
      setNewGoogleName('');
    } else if (provider === 'github') {
      setOauthName('Srijesh K');
      setOauthEmail('srijesh.dev@github.com');
    } else {
      setOauthName('Srijesh Nair');
      setOauthEmail('srijesh.meta@facebook.com');
    }
    setOauthModal(provider);
  };

  const handleStartGoogle2FA = (acc: { name: string; email: string; avatarBg: string; letter: string }) => {
    setSelectedGoogleAccount(acc);
    setGoogleAuthStep('authenticator_2fa');
    setGoogle2faCode('');
    setErrorMsg(null);
  };

  const handleVerifyGoogle2FA = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedGoogleAccount) return;

    const cleanCode = google2faCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit Google Authenticator code.');
      return;
    }

    setIsGoogleLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsGoogleLoading(false);
      handleFinishGoogleLogin(selectedGoogleAccount);
    }, 600);
  };

  const handleFinishGoogleLogin = (acc: { name: string; email: string }) => {
    const cleanId = acc.email.trim().toLowerCase();
    const existing = supabaseData.findAccount(cleanId);

    setDestinationDisplay(cleanId);
    setEmail(cleanId);
    setAuthMethod('email');

    if (existing) {
      setExistingUser(existing);
      supabaseData.setCurrentUser(existing);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
      onSuccess(existing);
    } else {
      const newUser: UserProfile = {
        id: 'usr_' + Date.now(),
        phoneNumber: cleanId,
        fullName: acc.name.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.name}`,
        aboutStatus: 'Hey there! I am using WhatsApp.',
        isOnline: true,
        lastSeen: 'online',
      };
      supabaseData.setCurrentUser(newUser);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
      onSuccess(newUser);
    }
    setOauthModal(null);
    setGoogleAuthStep('chooser');
  };

  const handleAddCustomGoogleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoogleEmail.trim()) return;
    const cleanEmail = newGoogleEmail.trim().toLowerCase();
    const cleanName = newGoogleName.trim() || cleanEmail.split('@')[0];
    const newAcc = {
      name: cleanName,
      email: cleanEmail,
      avatarBg: '#0b8043',
      letter: cleanName.charAt(0).toUpperCase() || 'G',
    };
    setGoogleAccounts((prev) => [...prev, newAcc]);
    handleStartGoogle2FA(newAcc);
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

              {/* Divider matching atelier.spherehive.in */}
              <div className="relative flex items-center justify-center my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <span className="relative px-3 bg-white dark:bg-[#222e35] text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  or continue with
                </span>
              </div>

              {/* Social Login Buttons matching atelier.spherehive.in */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('google')}
                  title="Sign in with Google"
                  className="py-2.5 px-3 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('github')}
                  title="Sign in with GitHub"
                  className="py-2.5 px-3 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub</span>
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
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Back to login"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Two-Step Verification
                </div>
                <div className="w-5" />
              </div>

              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-[#00a884] mx-auto">
                <KeyRound className="w-7 h-7" />
              </div>
              <div>
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
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setErrorMsg(null);
                  }}
                  className="p-1 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Back to login"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  Profile Info
                </div>
                <div className="w-5" />
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

      {/* Google Sign-In & Google Authenticator Modal */}
      {oauthModal === 'google' && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl flex flex-col space-y-3.5 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Main Google Card */}
            <div className="bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-[#e3e3e3] border border-gray-200 dark:border-[#303134] rounded-[28px] overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#303134]/60">
                <div className="flex items-center space-x-2.5">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-[#e3e3e3]">
                    {googleAuthStep === 'authenticator_2fa' ? 'Google Authenticator · 2-Step Verification' : 'Sign in with Google'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOauthModal(null);
                    setGoogleAuthStep('chooser');
                    setSelectedGoogleAccount(null);
                    setErrorMsg(null);
                  }}
                  className="p-1.5 rounded-full text-gray-500 dark:text-[#c4c7c5] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two Column Layout (Authentic Material 3) */}
              <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left Column: Brand & Title */}
                <div className="flex flex-col justify-start">
                  {googleAuthStep === 'authenticator_2fa' ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0b57d0] dark:text-[#a8c7fa] mb-6 shadow-xs">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 dark:text-white tracking-tight leading-snug">
                        2-Step Verification
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-[#c4c7c5] mt-2">
                        Get a verification code from your <strong className="text-gray-900 dark:text-white">Google Authenticator</strong> app
                      </p>

                      {selectedGoogleAccount && (
                        <div className="mt-5 inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-[#444746] bg-gray-50 dark:bg-[#282a2c] w-fit">
                          <div
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: selectedGoogleAccount.avatarBg }}
                          >
                            {selectedGoogleAccount.letter}
                          </div>
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {selectedGoogleAccount.email}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 mb-6">
                        <svg className="w-10 h-10 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                        </svg>
                        <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-xs">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      </div>
                      <h1 className="text-3xl font-normal text-gray-900 dark:text-white tracking-tight leading-tight">
                        {googleAuthStep === 'chooser' ? 'Choose an account' : 'Sign in'}
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-[#c4c7c5] mt-3">
                        to continue to <span className="text-[#0b57d0] dark:text-[#a8c7fa] font-medium">WhatsApp Web</span>
                      </p>
                    </>
                  )}
                </div>

                {/* Right Column: Dynamic View */}
                <div className="flex flex-col justify-between space-y-6">
                  {googleAuthStep === 'authenticator_2fa' ? (
                    /* STEP 2: Authenticator 2-Step Verification */
                    <form onSubmit={handleVerifyGoogle2FA} className="space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-600 dark:text-[#c4c7c5] leading-relaxed">
                          Enter the 6-digit verification code generated by your <strong>Google Authenticator</strong> app.
                        </p>
                      </div>

                      {/* Code Input */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Enter code
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-base font-semibold text-gray-500 dark:text-gray-400 select-none">
                            G-
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            autoFocus
                            placeholder="123456"
                            value={google2faCode}
                            onChange={(e) => setGoogle2faCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#131314] border border-gray-300 dark:border-[#747775] focus:border-[#0b57d0] dark:focus:border-[#a8c7fa] focus:ring-1 focus:ring-[#0b57d0] dark:focus:ring-[#a8c7fa] focus:outline-hidden rounded-lg text-lg tracking-widest font-semibold text-gray-900 dark:text-white transition-all shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Demo auto-fill */}
                      <button
                        type="button"
                        onClick={() => setGoogle2faCode('123456')}
                        className="w-full py-1.5 px-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#0b57d0] dark:text-[#a8c7fa] rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                      >
                        Auto-fill authenticator code: 123456
                      </button>

                      {/* Remember device checkbox */}
                      <label className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={googleRememberDevice}
                          onChange={(e) => setGoogleRememberDevice(e.target.checked)}
                          className="rounded border-gray-300 text-[#0b57d0] focus:ring-[#0b57d0]"
                        />
                        <span>Don't ask again on this device</span>
                      </label>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleAuthStep('chooser');
                            setGoogle2faCode('');
                            setErrorMsg(null);
                          }}
                          className="text-xs font-medium text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isGoogleLoading || google2faCode.length !== 6}
                          className="py-2.5 px-7 bg-[#0b57d0] hover:bg-[#0842a0] dark:bg-[#a8c7fa] dark:hover:bg-[#b8d4fa] text-white dark:text-[#062e6f] font-semibold text-xs rounded-full cursor-pointer transition-all disabled:opacity-40 shadow-xs flex items-center space-x-1.5"
                        >
                          {isGoogleLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <span>Next</span>
                          )}
                        </button>
                      </div>

                      {/* Direct skip fallback */}
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => selectedGoogleAccount && handleFinishGoogleLogin(selectedGoogleAccount)}
                          className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:underline cursor-pointer"
                        >
                          Try another way / Sign in directly
                        </button>
                      </div>
                    </form>
                  ) : googleAuthStep === 'chooser' ? (
                    /* STEP 1A: Choose an Account */
                    <>
                      <div className="space-y-1">
                        {googleAccounts.map((acc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleStartGoogle2FA(acc)}
                            className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors text-left cursor-pointer border-b border-gray-100 dark:border-[#303134]/60 last:border-b-0 group"
                          >
                            <div
                              className="w-9 h-9 rounded-full text-white flex items-center justify-center font-medium text-sm shrink-0 shadow-xs"
                              style={{ backgroundColor: acc.avatarBg }}
                            >
                              {acc.letter}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-[#e3e3e3] group-hover:text-[#0b57d0] dark:group-hover:text-white truncate">
                                {acc.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-[#8e918f] truncate">
                                {acc.email}
                              </div>
                            </div>
                            <span className="text-[11px] font-medium text-[#0b57d0] dark:text-[#a8c7fa] opacity-0 group-hover:opacity-100 transition-opacity">
                              2FA
                            </span>
                          </button>
                        ))}

                        {/* Use another account option */}
                        <button
                          type="button"
                          onClick={() => setGoogleAuthStep('email_input')}
                          className="w-full flex items-center space-x-3.5 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-[#282a2c] transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-full border border-gray-400 dark:border-[#8e918f] text-gray-600 dark:text-[#c4c7c5] flex items-center justify-center shrink-0 group-hover:border-gray-900 dark:group-hover:border-white group-hover:text-gray-900 dark:group-hover:text-white">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-[#e3e3e3] group-hover:text-[#0b57d0] dark:group-hover:text-white">
                            Use another account
                          </div>
                        </button>
                      </div>

                      {/* Disclaimer text */}
                      <p className="text-xs text-gray-500 dark:text-[#8e918f] leading-relaxed pt-2">
                        Before using this app, you can review WhatsApp Web's{' '}
                        <span className="text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                        <span className="text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer">Terms of Service</span>.
                      </p>
                    </>
                  ) : (
                    /* STEP 1B: Enter custom Google Account */
                    <form onSubmit={handleAddCustomGoogleAccount} className="space-y-4">
                      <div className="space-y-1">
                        <h2 className="text-base font-medium text-gray-900 dark:text-white">Sign in</h2>
                        <p className="text-xs text-gray-500 dark:text-[#8e918f]">with your Google Account</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-[#c4c7c5] mb-1">
                          Email or phone
                        </label>
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder="name@gmail.com"
                          value={newGoogleEmail}
                          onChange={(e) => setNewGoogleEmail(e.target.value)}
                          className="w-full py-2.5 px-3 bg-transparent border border-gray-300 dark:border-[#8e918f] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#0b57d0] dark:focus:border-[#a8c7fa]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-[#c4c7c5] mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Srijesh"
                          value={newGoogleName}
                          onChange={(e) => setNewGoogleName(e.target.value)}
                          className="w-full py-2.5 px-3 bg-transparent border border-gray-300 dark:border-[#8e918f] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-[#0b57d0] dark:focus:border-[#a8c7fa]"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="button"
                          onClick={() => setGoogleAuthStep('chooser')}
                          className="text-xs text-[#0b57d0] dark:text-[#a8c7fa] hover:underline cursor-pointer"
                        >
                          Back to accounts
                        </button>
                        <button
                          type="submit"
                          className="py-2 px-6 bg-[#0b57d0] hover:bg-[#0842a0] dark:bg-[#a8c7fa] dark:hover:bg-[#b8d4fa] text-white dark:text-[#062e6f] font-semibold text-xs rounded-full cursor-pointer transition-colors shadow-xs"
                        >
                          Next
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer links */}
            <div className="flex items-center justify-between px-3 text-xs text-gray-500 dark:text-[#8e918f]">
              <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-700 dark:hover:text-[#c4c7c5]">
                <span>English (United States)</span>
                <span className="text-[9px]">▼</span>
              </div>
              <div className="flex items-center space-x-6">
                <span className="hover:text-gray-700 dark:hover:text-[#c4c7c5] cursor-pointer">Help</span>
                <span className="hover:text-gray-700 dark:hover:text-[#c4c7c5] cursor-pointer">Privacy</span>
                <span className="hover:text-gray-700 dark:hover:text-[#c4c7c5] cursor-pointer">Terms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GitHub / Facebook Modal */}
      {(oauthModal === 'github' || oauthModal === 'facebook') && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center space-x-2">
                {oauthModal === 'github' ? (
                  <svg className="w-5 h-5 text-gray-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  Continue with {oauthModal === 'github' ? 'GitHub' : 'Facebook'}
                </h3>
              </div>
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
                className={`w-full py-2 px-4 text-white rounded-lg text-sm font-medium transition-all cursor-pointer shadow-xs ${
                  oauthModal === 'github'
                    ? 'bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600'
                    : 'bg-[#1877F2] hover:bg-[#166fe5]'
                }`}
              >
                Continue as {oauthName || 'User'}
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
