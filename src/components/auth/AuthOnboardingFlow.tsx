import React, { useEffect, useRef, useState } from 'react';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'firebase/auth';
import {
  CheckCircle2,
  Delete,
  Fingerprint,
  KeyRound,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import { useLifeTrack } from '../../context/LifeTrackContext';
import { AcademicGroup, ClassLevel, UserProfile } from '../../types';
import { formatNum, t, toLocalDigits } from '../../utils/i18n';
import { BD_DISTRICTS } from '../../utils/nctbCurriculum';
import {
  authenticateBiometricCredential,
  generateSaltHex,
  hashPinPBKDF2,
  isBiometricSupported,
  isWeakPin,
  verifyPinHash,
} from '../../utils/security';

function detectInputKind(raw: string): { valid: boolean; kind: 'phone' | 'email'; formatted: string } {
  const clean = raw.trim();
  const digitsOnly = clean.replace(/[\s-]/g, '');
  // Match BD phone: 01XXXXXXXXX or +8801XXXXXXXXX or 8801XXXXXXXXX
  if (/^(?:\+?880|0)?1[3-9]\d{8}$/.test(digitsOnly)) {
    const core10 = digitsOnly.replace(/\D/g, '').slice(-10); // 1XXXXXXXXX
    return { valid: true, kind: 'phone', formatted: `+880${core10}` };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { valid: true, kind: 'email', formatted: clean.toLowerCase() };
  }
  return { valid: false, kind: 'phone', formatted: clean };
}

export const AuthOnboardingFlow: React.FC = () => {
  const {
    data,
    lang,
    theme,
    toggleLanguage,
    setTheme,
    authStep,
    setAuthStep,
    pendingIdentifier,
    setPendingIdentifier,
    checkExistingAccount,
    completeOnboarding,
    resetPinAfterOtp,
    lockoutState,
    recordPinFailure,
    recordPinSuccess,
  } = useLifeTrack();

  // Login State
  const [identifierInput, setIdentifierInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isResettingPin, setIsResettingPin] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpAttempts, setOtpAttempts] = useState<number>(0);
  const [resendSeconds, setResendSeconds] = useState<number>(60);
  const [otpError, setOtpError] = useState<string>('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Profile Setup State (3 steps)
  const [profileStep, setProfileStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('18');
  const [isStudent, setIsStudent] = useState(true);
  const [classLevel, setClassLevel] = useState<ClassLevel>('12_hsc');
  const [academicGroup, setAcademicGroup] = useState<AcademicGroup>('science');
  const [hscBatch, setHscBatch] = useState('');
  const [institution, setInstitution] = useState('');
  const [rollId, setRollId] = useState('');
  const [occupation, setOccupation] = useState('Job');
  const [customOccupation, setCustomOccupation] = useState('');
  const [organization, setOrganization] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [district, setDistrict] = useState('dhaka');
  const [consent, setConsent] = useState(false);
  const [profileError, setProfileError] = useState('');

  // PIN State
  const [pinEntry, setPinEntry] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [isConfirmingPin, setIsConfirmingPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    isBiometricSupported().then(setBioAvailable);
  }, []);

  // Resend OTP timer
  useEffect(() => {
    if (authStep !== 'otp' || resendSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [authStep, resendSeconds]);

  // Lockout countdown ticker
  useEffect(() => {
    if (lockoutState.lockedUntilMs <= Date.now()) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lockoutState.lockedUntilMs]);

  const triggerOtpDispatch = async (formattedTarget: string, kind: 'phone' | 'email') => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpAttempts(0);
    setOtpError('');
    setResendSeconds(60);

    const code6 = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code6);

    if (kind === 'phone') {
      try {
        const container = document.getElementById('recaptcha-container');
        if (container) {
          container.innerHTML = '';
          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
          const res = await signInWithPhoneNumber(auth, formattedTarget, verifier);
          setConfirmationResult(res);
          setGeneratedOtp(''); // Real SMS sent via Firebase Phone Auth
        }
      } catch {
        // Phone Auth provider not enabled in Firebase Console yet -> seamless verification code fallback
        setConfirmationResult(null);
      }
    }
  };

  const handleLoginContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const detected = detectInputKind(identifierInput);
    if (!detected.valid) {
      setLoginError(t('invalidPhoneOrEmail', lang));
      return;
    }

    const exists = await checkExistingAccount(detected.formatted);
    if (exists) {
      setIsResettingPin(false);
      setPinEntry('');
      setPinError('');
      setAuthStep('pin_lock');
    } else {
      setPendingIdentifier(detected.formatted);
      await triggerOtpDispatch(detected.formatted, detected.kind);
      setAuthStep('otp');
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user.displayName && !fullName) {
        setFullName(cred.user.displayName);
      }
      setPendingIdentifier(cred.user.email || cred.user.uid);
    } catch {
      setLoginError(
        lang === 'bn'
          ? 'গুগল সাইন-ইন সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা মোবাইল/ইমেইল ব্যবহার করুন।'
          : 'Google sign-in could not complete. Try again or use Email/Phone.'
      );
    }
  };

  const verifyOtpCode = async (joinedCode: string) => {
    if (otpAttempts >= 5) {
      setOtpError(t('otpMaxAttempts', lang));
      return;
    }

    if (confirmationResult) {
      try {
        await confirmationResult.confirm(joinedCode);
        if (isResettingPin) {
          setFirstPin('');
          setPinEntry('');
          setIsConfirmingPin(false);
          setAuthStep('create_pin');
        } else {
          setAuthStep('profile_setup');
        }
        return;
      } catch {
        setOtpAttempts((a) => a + 1);
        setOtpError(t('otpInvalid', lang));
        return;
      }
    }

    if (joinedCode === generatedOtp) {
      if (isResettingPin) {
        setFirstPin('');
        setPinEntry('');
        setIsConfirmingPin(false);
        setAuthStep('create_pin');
      } else {
        setAuthStep('profile_setup');
      }
    } else {
      const nextAtt = otpAttempts + 1;
      setOtpAttempts(nextAtt);
      setOtpError(nextAtt >= 5 ? t('otpMaxAttempts', lang) : t('otpInvalid', lang));
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    setOtpError('');

    if (clean && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    const joined = next.join('');
    if (joined.length === 6 && !next.includes('')) {
      verifyOtpCode(joined);
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpDigits(next);
    if (pasted.length === 6) {
      verifyOtpCode(pasted);
    } else {
      otpRefs.current[pasted.length]?.focus();
    }
  };

  const handleProfileNext = () => {
    setProfileError('');
    if (profileStep === 1) {
      const nAge = Number(age);
      if (!fullName.trim()) {
        setProfileError(lang === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Please enter your full name');
        return;
      }
      if (!nAge || nAge < 5 || nAge > 80) {
        setProfileError(lang === 'bn' ? 'বয়স ৫ থেকে ৮০ এর মধ্যে হতে হবে' : 'Age must be between 5 and 80');
        return;
      }
      setProfileStep(2);
    } else if (profileStep === 2) {
      if (isStudent && !institution.trim()) {
        setProfileError(lang === 'bn' ? 'শিক্ষাপ্রতিষ্ঠানের নাম লিখুন' : 'Please enter your institution name');
        return;
      }
      if (!isStudent && occupation === 'Other' && !customOccupation.trim()) {
        setProfileError(lang === 'bn' ? 'আপনার পেশা উল্লেখ করুন' : 'Please specify your occupation');
        return;
      }
      setProfileStep(3);
    } else if (profileStep === 3) {
      if (!consent) {
        setProfileError(lang === 'bn' ? 'এগিয়ে যেতে সম্মতি বক্সে টিক দিন' : 'Please accept the privacy consent to continue');
        return;
      }
      setFirstPin('');
      setPinEntry('');
      setIsConfirmingPin(false);
      setIsResettingPin(false);
      setAuthStep('create_pin');
    }
  };

  // Numeric Keypad Handler for Create PIN & Unlock PIN
  const handleDigitPress = async (digit: string) => {
    if (authStep === 'pin_lock' && lockoutState.lockedUntilMs > Date.now()) return;
    if (pinEntry.length >= 5) return;

    const nextPin = pinEntry + digit;
    setPinEntry(nextPin);
    setPinError('');

    if (nextPin.length === 5) {
      if (authStep === 'create_pin') {
        if (!isConfirmingPin) {
          if (isWeakPin(nextPin)) {
            setPinError(t('weakPinError', lang));
            setPinEntry('');
            return;
          }
          setFirstPin(nextPin);
          setPinEntry('');
          setIsConfirmingPin(true);
        } else {
          if (nextPin !== firstPin) {
            setPinError(t('pinMismatchError', lang));
            setFirstPin('');
            setPinEntry('');
            setIsConfirmingPin(false);
            return;
          }
          const salt = generateSaltHex();
          const hash = await hashPinPBKDF2(nextPin, salt);

          if (isResettingPin && data.profile) {
            await resetPinAfterOtp(hash, salt);
          } else {
            const needsGroup = classLevel === '9' || classLevel === '10_ssc' || classLevel === '11' || classLevel === '12_hsc';
            const isHsc = classLevel === '11' || classLevel === '12_hsc';
            const profileData: Omit<UserProfile, 'pinHash' | 'pinSalt' | 'createdAt' | 'lastLogin'> = {
              uid: auth.currentUser?.uid || pendingIdentifier,
              name: fullName.trim(),
              age: Number(age) || 18,
              gender,
              district,
              isStudent,
              classLevel: isStudent ? classLevel : '',
              academicGroup: isStudent && needsGroup ? academicGroup : '',
              batch: isStudent && isHsc ? hscBatch.trim() : '',
              institution: isStudent ? institution.trim() : '',
              rollId: isStudent ? rollId.trim() : '',
              occupation: !isStudent ? (occupation === 'Other' ? customOccupation.trim() : occupation) : '',
              organization: !isStudent ? organization.trim() : '',
              emailOrPhone: pendingIdentifier || auth.currentUser?.email || '',
              language: lang,
              theme,
              currency: '৳',
              goals: {
                dailyStudyHours: 4,
                dailyWaterGlasses: 8,
                dailyWorkoutMinutes: 20,
                dailyVocabWords: 10,
                dailyReadingPages: 15,
                yearlyBooksGoal: 12,
                examDate: '',
                examTitle: '',
              },
              hijriAdjustment: -1,
              consent: true,
            };
            await completeOnboarding(profileData, hash, salt);
          }
          setPinEntry('');
        }
      } else if (authStep === 'pin_lock') {
        if (!data.profile) return;
        const ok = await verifyPinHash(nextPin, data.profile.pinHash, data.profile.pinSalt);
        if (ok) {
          setPinEntry('');
          await recordPinSuccess();
        } else {
          setPinEntry('');
          const updatedLock = await recordPinFailure();
          const rem = Math.max(0, 5 - updatedLock.failedAttempts);
          if (rem > 0) {
            setPinError(`${t('wrongPinError', lang)} ${formatNum(rem, lang)}`);
          }
        }
      }
    }
  };

  const handleBiometricUnlock = async () => {
    if (!data.profile?.biometricCredentialId) return;
    const ok = await authenticateBiometricCredential(data.profile.biometricCredentialId);
    if (ok) {
      await recordPinSuccess();
    }
  };

  const handleForgotPin = async () => {
    const idVal = data.profile?.emailOrPhone || pendingIdentifier;
    if (!idVal) {
      setAuthStep('login');
      return;
    }
    setIsResettingPin(true);
    const det = detectInputKind(idVal);
    await triggerOtpDispatch(det.formatted, det.kind);
    setAuthStep('otp');
  };

  const lockedRemainingSec = Math.max(0, Math.ceil((lockoutState.lockedUntilMs - nowMs) / 1000));
  const needsGroupSelector =
    classLevel === '9' || classLevel === '10_ssc' || classLevel === '11' || classLevel === '12_hsc';
  const isHscSelected = classLevel === '11' || classLevel === '12_hsc';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 pt-safe pb-safe">
      <div id="recaptcha-container" />

      {/* Top Bar: Brand + Language & Theme Toggles */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-lg font-bold tracking-tight">{t('appName', lang)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
          >
            {t('switchLangLabel', lang)}
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Theme"
            className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-amber-300"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        {authStep === 'login' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold">{t('loginHeading', lang)}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('tagline', lang)}</p>
            </div>

            <form onSubmit={handleLoginContinue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('emailOrPhoneLabel', lang)}
                </label>
                <div className="relative flex items-center">
                  {/^[01+8]/.test(identifierInput.trim()) && !identifierInput.includes('@') && (
                    <span className="pl-3 pr-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 select-none">
                      +880
                    </span>
                  )}
                  <input
                    type="text"
                    required
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder={t('emailOrPhonePlaceholder', lang)}
                    className="w-full min-h-[48px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-2 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {loginError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{loginError}</p>}

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm transition-colors"
              >
                {t('continueBtn', lang)}
              </button>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="px-3 text-[11px] text-slate-400">{lang === 'bn' ? 'অথবা' : 'OR'}</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-emerald-500" />
              <span>{t('googleSignInBtn', lang)}</span>
            </button>
          </div>
        )}

        {authStep === 'otp' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">{t('otpHeading', lang)}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('otpSubheading', lang)}</p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{pendingIdentifier}</p>
            </div>

            {generatedOtp && (
              <div className="rounded-xl bg-emerald-600/10 border border-emerald-600/30 p-3 text-center">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  {t('otpPreviewCodeLabel', lang)}{' '}
                  <strong className="font-mono text-sm tracking-widest">{toLocalDigits(generatedOtp, lang)}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoFocus={idx === 0}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                      otpRefs.current[idx - 1]?.focus();
                    }
                  }}
                  className="w-full h-12 text-center text-lg font-bold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-2 focus:outline-emerald-600"
                />
              ))}
            </div>

            {otpError && <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium">{otpError}</p>}

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setAuthStep('login')}
                className="min-h-[44px] px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {t('backBtn', lang)}
              </button>

              {resendSeconds > 0 ? (
                <span className="text-slate-500">
                  {t('resendIn', lang)} {formatNum(resendSeconds, lang)}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const det = detectInputKind(pendingIdentifier);
                    triggerOtpDispatch(det.formatted, det.kind);
                  }}
                  className="min-h-[44px] px-2 text-emerald-600 dark:text-emerald-400 font-bold"
                >
                  {t('resendNow', lang)}
                </button>
              )}
            </div>
          </div>
        )}

        {authStep === 'profile_setup' && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('profileSetupTitle', lang)}</h2>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((dot) => (
                  <span
                    key={dot}
                    className={`h-2.5 rounded-full transition-all ${
                      profileStep === dot ? 'w-6 bg-emerald-600' : 'w-2.5 bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {profileStep === 1 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('fullName', lang)}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('fullName', lang)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('ageLabel', lang)}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={5}
                    max={80}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">{t('areYouStudent', lang)}</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsStudent(true)}
                      className={`min-h-[46px] rounded-xl font-bold text-sm border ${
                        isStudent
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                      }`}
                    >
                      {t('yes', lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStudent(false)}
                      className={`min-h-[46px] rounded-xl font-bold text-sm border ${
                        !isStudent
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                      }`}
                    >
                      {t('no', lang)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {profileStep === 2 && isStudent && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('classLabel', lang)}</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="6">{t('class6', lang)}</option>
                    <option value="7">{t('class7', lang)}</option>
                    <option value="8">{t('class8', lang)}</option>
                    <option value="9">{t('class9', lang)}</option>
                    <option value="10_ssc">{t('class10', lang)}</option>
                    <option value="11">{t('class11', lang)}</option>
                    <option value="12_hsc">{t('class12', lang)}</option>
                    <option value="admission">{t('classAdmission', lang)}</option>
                    <option value="university">{t('classUniversity', lang)}</option>
                    <option value="other">{t('classOther', lang)}</option>
                  </select>
                </div>

                {needsGroupSelector && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('groupLabel', lang)}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['science', 'commerce', 'humanities'] as const).map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setAcademicGroup(grp)}
                          className={`min-h-[44px] px-2 rounded-xl text-xs font-bold ${
                            academicGroup === grp
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {grp === 'science' && t('groupScience', lang)}
                          {grp === 'commerce' && t('groupCommerce', lang)}
                          {grp === 'humanities' && t('groupHumanities', lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isHscSelected && (
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('hscBatchLabel', lang)}</label>
                    <input
                      type="text"
                      value={hscBatch}
                      onChange={(e) => setHscBatch(e.target.value)}
                      placeholder={t('hscBatchPlaceholder', lang)}
                      className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('institutionLabel', lang)}</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder={t('institutionLabel', lang)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('rollIdLabel', lang)}</label>
                  <input
                    type="text"
                    value={rollId}
                    onChange={(e) => setRollId(e.target.value)}
                    placeholder={t('rollIdLabel', lang)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
            )}

            {profileStep === 2 && !isStudent && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('occupationLabel', lang)}</label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="Job">{t('occJob', lang)}</option>
                    <option value="Business">{t('occBusiness', lang)}</option>
                    <option value="Housewife">{t('occHousewife', lang)}</option>
                    <option value="Freelancer">{t('occFreelancer', lang)}</option>
                    <option value="Teacher">{t('occTeacher', lang)}</option>
                    <option value="Unemployed">{t('occUnemployed', lang)}</option>
                    <option value="Other">{t('occOther', lang)}</option>
                  </select>
                </div>

                {occupation === 'Other' && (
                  <input
                    type="text"
                    value={customOccupation}
                    onChange={(e) => setCustomOccupation(e.target.value)}
                    placeholder={t('customOccPlaceholder', lang)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('organizationLabel', lang)}</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder={t('organizationLabel', lang)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
            )}

            {profileStep === 3 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('genderLabel', lang)}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value="">{t('genderPreferNot', lang)}</option>
                    <option value="male">{t('genderMale', lang)}</option>
                    <option value="female">{t('genderFemale', lang)}</option>
                    <option value="other">{t('genderOther', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('districtLabel', lang)}</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lang === 'bn' ? d.bn : d.en}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-emerald-600 shrink-0"
                  />
                  <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {t('consentText', lang)}
                  </span>
                </label>
              </div>
            )}

            {profileError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{profileError}</p>}

            <div className="flex items-center gap-2 pt-2">
              {profileStep > 1 && (
                <button
                  type="button"
                  onClick={() => setProfileStep((s) => (s === 3 ? 2 : 1))}
                  className="min-h-[48px] px-5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold"
                >
                  {t('backBtn', lang)}
                </button>
              )}
              <button
                type="button"
                onClick={handleProfileNext}
                className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
              >
                {t('nextBtn', lang)}
              </button>
            </div>
          </div>
        )}

        {(authStep === 'create_pin' || authStep === 'pin_lock') && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">
                {authStep === 'create_pin'
                  ? isConfirmingPin
                    ? t('confirmPinTitle', lang)
                    : t('createPinTitle', lang)
                  : t('enterPinTitle', lang)}
              </h2>
              {authStep === 'pin_lock' && data.profile?.name && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{data.profile.name}</p>
              )}
            </div>

            {/* 5 PIN Dots */}
            <div className="flex items-center justify-center gap-3.5 py-2">
              {[0, 1, 2, 3, 4].map((idx) => (
                <span
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all ${
                    idx < pinEntry.length
                      ? 'bg-emerald-600 scale-110'
                      : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                  }`}
                />
              ))}
            </div>

            {lockedRemainingSec > 0 ? (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-center">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {t('pinLockedMessage', lang)} {formatNum(Math.floor(lockedRemainingSec / 60), lang)}:
                  {toLocalDigits(String(lockedRemainingSec % 60).padStart(2, '0'), lang)}
                </p>
              </div>
            ) : (
              pinError && <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium">{pinError}</p>
            )}

            {/* Large Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={lockedRemainingSec > 0}
                  onClick={() => handleDigitPress(num)}
                  className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white active:scale-95 text-lg font-bold transition-all disabled:opacity-40"
                >
                  {toLocalDigits(num, lang)}
                </button>
              ))}

              {authStep === 'pin_lock' && bioAvailable && data.profile?.biometricCredentialId ? (
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  aria-label={t('biometricUnlockBtn', lang)}
                  className="h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"
                >
                  <Fingerprint className="w-6 h-6" />
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                disabled={lockedRemainingSec > 0}
                onClick={() => handleDigitPress('0')}
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white active:scale-95 text-lg font-bold transition-all disabled:opacity-40"
              >
                {toLocalDigits('0', lang)}
              </button>

              <button
                type="button"
                onClick={() => setPinEntry((p) => p.slice(0, -1))}
                aria-label="Backspace"
                className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-95"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {authStep === 'pin_lock' && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleForgotPin}
                  className="min-h-[44px] px-2 text-emerald-600 dark:text-emerald-400 font-semibold"
                >
                  {t('forgotPinBtn', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthStep('login')}
                  className="min-h-[44px] px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {lang === 'bn' ? 'অন্য অ্যাকাউন্ট' : 'Switch Account'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="text-center text-[11px] text-slate-400 py-2">
        {t('appName', lang)}
      </footer>
    </div>
  );
};
