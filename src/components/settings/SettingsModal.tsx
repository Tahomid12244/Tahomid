import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Fingerprint,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { FIRESTORE_RULES_SUMMARY } from '../../firebase';
import { useLifeTrack } from '../../context/LifeTrackContext';
import { AcademicGroup, ClassLevel, CurrencySymbol, UserProfile } from '../../types';
import { t } from '../../utils/i18n';
import { BD_DISTRICTS } from '../../utils/nctbCurriculum';
import {
  generateSaltHex,
  hashPinPBKDF2,
  isBiometricSupported,
  isWeakPin,
  registerBiometricCredential,
  verifyPinHash,
} from '../../utils/security';

export const SettingsModal: React.FC = () => {
  const {
    data,
    lang,
    theme,
    isSettingsOpen,
    setIsSettingsOpen,
    updateProfile,
    setTheme,
    setLanguage,
    logoutUser,
    deleteAccountAndData,
    clearDemoData,
    showToast,
  } = useLifeTrack();

  const [openSec, setOpenSec] = useState<string>('profile');
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [askSubjectRefresh, setAskSubjectRefresh] = useState(false);

  // PIN change states
  const [curPin, setCurPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bioSupported, setBioSupported] = useState(false);

  useEffect(() => {
    isBiometricSupported().then(setBioSupported);
  }, []);

  useEffect(() => {
    if (isSettingsOpen && data.profile) {
      setDraft({ ...data.profile, goals: { ...data.profile.goals } });
      setAskSubjectRefresh(false);
      setConfirmDelete(false);
      setPinMsg('');
    }
  }, [isSettingsOpen, data.profile]);

  if (!isSettingsOpen || !draft || !data.profile) return null;

  const initials = draft.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'LT';

  const classOrGroupChanged =
    draft.isStudent !== data.profile.isStudent ||
    draft.classLevel !== data.profile.classLevel ||
    draft.academicGroup !== data.profile.academicGroup;

  const handleSaveProfile = async () => {
    if (classOrGroupChanged && !askSubjectRefresh) {
      setAskSubjectRefresh(true);
      return;
    }
    await updateProfile(draft, false);
  };

  const handleConfirmRefreshChoice = async (refreshSubjects: boolean) => {
    setAskSubjectRefresh(false);
    await updateProfile(draft, refreshSubjects);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg('');
    if (!data.profile) return;
    const validCur = await verifyPinHash(curPin, data.profile.pinHash, data.profile.pinSalt);
    if (!validCur) {
      setPinMsg(lang === 'bn' ? 'বর্তমান পিনটি সঠিক নয়' : 'Current PIN is incorrect');
      return;
    }
    if (isWeakPin(newPin)) {
      setPinMsg(t('weakPinError', lang));
      return;
    }
    const salt = generateSaltHex();
    const hash = await hashPinPBKDF2(newPin, salt);
    await updateProfile({ ...draft, pinHash: hash, pinSalt: salt }, false);
    setCurPin('');
    setNewPin('');
    setPinMsg(t('savedSuccess', lang));
  };

  const handleEnableBiometrics = async () => {
    const credId = await registerBiometricCredential(draft.uid, draft.name);
    if (credId) {
      const updated = { ...draft, biometricCredentialId: credId };
      setDraft(updated);
      await updateProfile(updated, false);
    }
  };

  const handleExportJson = () => {
    const safeExport = {
      ...data,
      profile: data.profile ? { ...data.profile, pinHash: '[REDACTED]', pinSalt: '[REDACTED]' } : null,
    };
    const blob = new Blob([JSON.stringify(safeExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifetrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('savedSuccess', lang));
  };

  const toggleSection = (key: string) => {
    setOpenSec((prev) => (prev === key ? '' : key));
  };

  const currencies: CurrencySymbol[] = ['৳', '$', '€', '£', 'SAR', '₹'];
  const needsGroup =
    draft.classLevel === '9' ||
    draft.classLevel === '10_ssc' ||
    draft.classLevel === '11' ||
    draft.classLevel === '12_hsc';
  const isHsc = draft.classLevel === '11' || draft.classLevel === '12_hsc';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto pt-safe pb-24">
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('settings', lang)}</h2>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Avatar Banner */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base truncate">{draft.name}</h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                {draft.emailOrPhone} · {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
              </p>
            </div>
          </div>

          {/* Update Subject List Prompt */}
          {askSubjectRefresh && (
            <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                {t('updateSubjectListAsk', lang)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmRefreshChoice(true)}
                  className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  {t('yes', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmRefreshChoice(false)}
                  className="flex-1 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                >
                  {t('no', lang)}
                </button>
              </div>
            </div>
          )}

          {/* 1. Profile Section */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('profile')}
              className="w-full min-h-[52px] px-4 flex items-center justify-between font-bold text-sm"
            >
              <span>{t('secProfile', lang)}</span>
              {openSec === 'profile' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec === 'profile' && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('fullName', lang)}</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('ageLabel', lang)}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={5}
                      max={80}
                      value={draft.age}
                      onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) || 18 })}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('districtLabel', lang)}</label>
                    <select
                      value={draft.district}
                      onChange={(e) => setDraft({ ...draft, district: e.target.value })}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    >
                      {BD_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {lang === 'bn' ? d.bn : d.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('areYouStudent', lang)}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, isStudent: true })}
                      className={`min-h-[44px] rounded-xl text-xs font-bold ${
                        draft.isStudent ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {t('yes', lang)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, isStudent: false })}
                      className={`min-h-[44px] rounded-xl text-xs font-bold ${
                        !draft.isStudent ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {t('no', lang)}
                    </button>
                  </div>
                </div>

                {draft.isStudent ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold mb-1">{t('classLabel', lang)}</label>
                      <select
                        value={draft.classLevel}
                        onChange={(e) => setDraft({ ...draft, classLevel: e.target.value as ClassLevel })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
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

                    {needsGroup && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t('groupLabel', lang)}</label>
                        <select
                          value={draft.academicGroup}
                          onChange={(e) => setDraft({ ...draft, academicGroup: e.target.value as AcademicGroup })}
                          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                        >
                          <option value="science">{t('groupScience', lang)}</option>
                          <option value="commerce">{t('groupCommerce', lang)}</option>
                          <option value="humanities">{t('groupHumanities', lang)}</option>
                        </select>
                      </div>
                    )}

                    {isHsc && (
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t('hscBatchLabel', lang)}</label>
                        <input
                          type="text"
                          value={draft.batch}
                          onChange={(e) => setDraft({ ...draft, batch: e.target.value })}
                          placeholder={t('hscBatchPlaceholder', lang)}
                          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t('institutionLabel', lang)}</label>
                        <input
                          type="text"
                          value={draft.institution}
                          onChange={(e) => setDraft({ ...draft, institution: e.target.value })}
                          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">{t('rollIdLabel', lang)}</label>
                        <input
                          type="text"
                          value={draft.rollId}
                          onChange={(e) => setDraft({ ...draft, rollId: e.target.value })}
                          className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold mb-1">{t('occupationLabel', lang)}</label>
                      <input
                        type="text"
                        value={draft.occupation}
                        onChange={(e) => setDraft({ ...draft, occupation: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">{t('organizationLabel', lang)}</label>
                      <input
                        type="text"
                        value={draft.organization}
                        onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
                        className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full min-h-[46px] rounded-xl bg-emerald-600 text-white font-bold text-sm"
                >
                  {t('save', lang)}
                </button>
              </div>
            )}
          </div>

          {/* 2. Appearance & Language */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('appearance')}
              className="w-full min-h-[52px] px-4 flex items-center justify-between font-bold text-sm"
            >
              <span>{t('secAppearance', lang)}</span>
              {openSec === 'appearance' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec === 'appearance' && (
              <div className="px-4 pb-4 space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      setDraft({ ...draft, theme: 'dark' });
                    }}
                    className={`min-h-[46px] rounded-xl flex items-center justify-center gap-2 text-xs font-bold border ${
                      theme === 'dark'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{t('themeDark', lang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      setDraft({ ...draft, theme: 'light' });
                    }}
                    className={`min-h-[46px] rounded-xl flex items-center justify-center gap-2 text-xs font-bold border ${
                      theme === 'light'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-transparent'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{t('themeLight', lang)}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('bn');
                      setDraft({ ...draft, language: 'bn' });
                    }}
                    className={`min-h-[44px] rounded-xl text-xs font-bold ${
                      lang === 'bn' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setDraft({ ...draft, language: 'en' });
                    }}
                    className={`min-h-[44px] rounded-xl text-xs font-bold ${
                      lang === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    English
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    {lang === 'bn' ? 'মুদ্রা' : 'Currency'}
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {currencies.map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => {
                          const updated = { ...draft, currency: cur };
                          setDraft(updated);
                          updateProfile(updated, false);
                        }}
                        className={`min-h-[44px] rounded-xl text-xs font-bold ${
                          draft.currency === cur ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Islamic Life & Prayer */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('islamic')}
              className="w-full min-h-[52px] px-4 flex items-center justify-between font-bold text-sm"
            >
              <span>{t('secIslamic', lang)}</span>
              {openSec === 'islamic' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec === 'islamic' && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="p-3 rounded-xl bg-emerald-600/10 text-xs space-y-1">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">{t('karachiMethodLabel', lang)}</p>
                  <p className="text-slate-600 dark:text-slate-400">{t('karachiHelperText', lang)}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {lang === 'bn' ? 'চাঁদ দেখার সমন্বয় (শুধু হিজরি তারিখ)' : 'Moon-Sighting Adjustment (Hijri Date Only)'}
                  </label>
                  <select
                    value={draft.hijriAdjustment}
                    onChange={(e) => {
                      const val = Number(e.target.value) as -1 | 0 | 1;
                      const updated = { ...draft, hijriAdjustment: val };
                      setDraft(updated);
                      updateProfile(updated, false);
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                  >
                    <option value={-1}>{t('moonAdjMinus1', lang)}</option>
                    <option value={0}>{t('moonAdjZero', lang)}</option>
                    <option value={1}>{t('moonAdjPlus1', lang)}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Study Goals */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('study')}
              className="w-full min-h-[52px] px-4 flex items-center justify-between font-bold text-sm"
            >
              <span>{t('secStudy', lang)}</span>
              {openSec === 'study' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec === 'study' && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {lang === 'bn' ? 'দৈনিক পড়ার লক্ষ্য (ঘণ্টা)' : 'Daily Study Goal (Hours)'}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={18}
                      value={draft.goals.dailyStudyHours}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          goals: { ...draft.goals, dailyStudyHours: Math.max(1, Number(e.target.value) || 4) },
                        })
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      {lang === 'bn' ? 'পরীক্ষার তারিখ' : 'Target Exam Date'}
                    </label>
                    <input
                      type="date"
                      value={draft.goals.examDate}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          goals: { ...draft.goals, examDate: e.target.value },
                        })
                      }
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateProfile(draft, false)}
                  className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  {t('save', lang)}
                </button>
              </div>
            )}
          </div>

          {/* 5. Money & Demo Data */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('money')}
              className="w-full min-h-[52px] px-4 flex items-center justify-between font-bold text-sm"
            >
              <span>{t('secMoney', lang)}</span>
              {openSec === 'money' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec === 'money' && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                {data.isDemoDataLoaded && (
                  <button
                    type="button"
                    onClick={clearDemoData}
                    className="w-full min-h-[44px] rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold"
                  >
                    {t('clearDemo', lang)}
                  </button>
                )}
                <p className="text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'হিসাব ট্যাব থেকে বিভাগভিত্তিক মাসিক বাজেট ও সঞ্চয় লক্ষ্য নির্ধারণ করা যাবে।'
                    : 'Manage category budgets and savings targets directly inside the Money tab.'}
                </p>
              </div>
            )}
          </div>

          {/* 6. Account & Security */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('account')}
              className="w-full min-h-[52px] px-4 flex items-center justify-between font-bold text-sm"
            >
              <span>{t('secAccount', lang)}</span>
              {openSec === 'account' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSec === 'account' && (
              <div className="px-4 pb-4 space-y-3.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                <form onSubmit={handleChangePin} className="space-y-2">
                  <p className="text-xs font-bold">{t('changePinBtn', lang)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={5}
                      required
                      value={curPin}
                      onChange={(e) => setCurPin(e.target.value.replace(/\D/g, ''))}
                      placeholder={lang === 'bn' ? 'বর্তমান পিন' : 'Current PIN'}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={5}
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder={lang === 'bn' ? 'নতুন ৫ সংখ্যার পিন' : 'New 5-digit PIN'}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm"
                    />
                  </div>
                  {pinMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{pinMsg}</p>}
                  <button
                    type="submit"
                    className="w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
                  >
                    {t('changePinBtn', lang)}
                  </button>
                </form>

                {bioSupported && (
                  <button
                    type="button"
                    onClick={handleEnableBiometrics}
                    className="w-full min-h-[44px] rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{t('enableBiometricBtn', lang)}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('exportDataBtn', lang)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRules((s) => !s)}
                  className="w-full min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>{t('firestoreRulesHeading', lang)}</span>
                </button>

                {showRules && (
                  <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 text-[10px] overflow-x-auto leading-relaxed font-mono">
                    {FIRESTORE_RULES_SUMMARY}
                  </pre>
                )}

                <button
                  type="button"
                  onClick={logoutUser}
                  className="w-full min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logoutBtn', lang)}</span>
                </button>

                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full min-h-[44px] rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('deleteAccountBtn', lang)}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 space-y-2">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-300">
                      {lang === 'bn'
                        ? 'আপনি কি নিশ্চিত? আপনার সব ডেটা স্থায়ীভাবে মুছে যাবে।'
                        : 'Are you sure? All your cloud and local data will be permanently deleted.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={deleteAccountAndData}
                        className="flex-1 min-h-[44px] rounded-xl bg-rose-600 text-white text-xs font-bold"
                      >
                        {t('confirm', lang)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                      >
                        {t('cancel', lang)}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
