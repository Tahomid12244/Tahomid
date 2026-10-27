import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import {
  ActiveTimerState,
  AppDataSchema,
  BookEntry,
  ChapterItem,
  DailyIbadahLog,
  DebtRecord,
  ExamItem,
  ExpenseRecord,
  HabitDefinition,
  JournalEntry,
  Language,
  MainTab,
  ReadingLog,
  RoutineItem,
  SavingsGoal,
  SleepMoodLog,
  StudySession,
  SubjectItem,
  TaskItem,
  ThemeMode,
  UserProfile,
  VocabWord,
  WeightEntry,
  WorkoutLog,
} from '../types';
import { t } from '../utils/i18n';
import {
  clearDemoDataFromState,
  createDefaultAppData,
  createEmptyIbadahLog,
  injectSampleDemoData,
  migrateAppData,
} from '../utils/migrationAndDefaults';
import {
  buildSuggestedSubjects,
  isHscClass,
  transitionSubjectsForProfileChange,
} from '../utils/nctbCurriculum';
import { playTimerChime } from '../utils/security';

export interface LockoutRecord {
  failedAttempts: number;
  lockoutCount: number;
  lockedUntilMs: number;
}

export interface ToastItem {
  id: string;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
}

export type AuthFlowStep = 'login' | 'otp' | 'profile_setup' | 'create_pin' | 'pin_lock' | 'unlocked';

interface LifeTrackContextValue {
  data: AppDataSchema;
  lang: Language;
  theme: ThemeMode;
  isOnline: boolean;
  isLoadingAuth: boolean;
  firebaseUser: FirebaseUser | null;
  authStep: AuthFlowStep;
  pendingIdentifier: string;
  setPendingIdentifier: (val: string) => void;
  setAuthStep: (step: AuthFlowStep) => void;

  // Navigation
  mainTab: MainTab;
  studySubTab: string;
  dailySubTab: string;
  islamicSubTab: string;
  moneySubTab: string;
  selectedSyllabusSubjectId: string | null;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  navigateTo: (tab: MainTab, subTab?: string, subjectId?: string) => void;

  // Global Preferences (work even on login screen)
  toggleLanguage: () => void;
  setLanguage: (l: Language) => void;
  setTheme: (m: ThemeMode) => void;

  // Auth & Security Actions
  checkExistingAccount: (identifier: string) => Promise<boolean>;
  completeOnboarding: (profileInput: Omit<UserProfile, 'pinHash' | 'pinSalt' | 'createdAt' | 'lastLogin'>, pinHash: string, pinSalt: string) => Promise<void>;
  resetPinAfterOtp: (pinHash: string, pinSalt: string) => Promise<void>;
  unlockApp: () => void;
  lockoutState: LockoutRecord;
  recordPinFailure: () => Promise<LockoutRecord>;
  recordPinSuccess: () => Promise<void>;
  logoutUser: () => Promise<void>;
  deleteAccountAndData: () => Promise<void>;
  clearDemoData: () => void;

  // Profile & Settings
  updateProfile: (nextProfile: UserProfile, refreshSubjectsChoice?: boolean) => Promise<void>;

  // Study Actions
  addOrUpdateSubject: (subj: SubjectItem) => void;
  deleteOrHideSubject: (subjectId: string, hideOnly?: boolean) => void;
  restoreSubject: (subjectId: string) => void;
  updateChapter: (subjectId: string, chapter: ChapterItem) => void;
  addChapter: (subjectId: string, paper: 1 | 2, bn: string, en: string, totalClasses: number) => void;
  deleteOrHideChapter: (subjectId: string, chapterId: string) => void;
  restoreHiddenChapters: (subjectId: string) => void;
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  deleteStudySession: (id: string) => void;
  saveExam: (exam: ExamItem) => void;
  deleteExam: (id: string) => void;
  saveRoutine: (routine: RoutineItem) => void;
  toggleRoutineDone: (id: string) => void;
  deleteRoutine: (id: string) => void;
  setRoutinesBulk: (routines: RoutineItem[]) => void;
  saveDailyReflection: (date: string, priorities: [string, string, string], reflection: string) => void;
  setWeeklyReviewNote: (note: string) => void;
  setYearlyGoal: (monthIdx: number, goalText: string) => void;

  // Daily Actions
  saveHabitDef: (habit: HabitDefinition) => void;
  deleteHabitDef: (id: string) => void;
  toggleHabitToday: (habitId: string, date: string) => void;
  saveTask: (task: TaskItem) => void;
  toggleTaskDone: (id: string) => void;
  deleteTask: (id: string) => void;
  setWaterGlasses: (date: string, count: number) => void;
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void;
  deleteWorkoutLog: (id: string) => void;
  setWorkoutRestDays: (days: number[]) => void;
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => void;
  saveWord: (word: VocabWord) => void;
  deleteWord: (id: string) => void;
  importWordsBulk: (words: VocabWord[]) => void;
  reviewWordCard: (wordId: string, knewIt: boolean) => void;
  recordQuizMistake: (wordId: string) => void;
  saveBook: (book: BookEntry) => void;
  deleteBook: (id: string) => void;
  addReadingLog: (log: Omit<ReadingLog, 'id'>) => void;
  markStoryRead: (storyId: string) => void;
  saveSleepMood: (entry: SleepMoodLog) => void;
  saveJournalEntry: (date: string, content: string) => void;
  deleteJournalEntry: (id: string) => void;

  // Islamic Actions
  updateIbadahLog: (date: string, updater: (prev: DailyIbadahLog) => DailyIbadahLog) => void;
  updateIslamicState: (updater: (prev: AppDataSchema['islamicState']) => AppDataSchema['islamicState']) => void;

  // Money Actions
  saveExpense: (tx: ExpenseRecord) => void;
  deleteExpense: (id: string) => void;
  addCustomMoneyCategory: (cat: string) => void;
  setCategoryBudget: (category: string, amount: number) => void;
  saveSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  saveDebt: (debt: DebtRecord) => void;
  deleteDebt: (id: string) => void;

  // Timers & Flash & Toasts
  updateTimer: (kind: 'pomodoro' | 'workout' | 'reading', updater: (prev: ActiveTimerState) => ActiveTimerState) => void;
  timerFlashActive: boolean;
  dismissTimerFlash: () => void;
  toasts: ToastItem[];
  showToast: (message: string, undo?: { label: string; action: () => void }) => void;
}

const STORAGE_PREFIX = 'lifetrack_v2_state_';
const ACTIVE_ACCOUNT_KEY = 'lifetrack_v2_active_account';
const PREF_LANG_KEY = 'lifetrack_v2_lang';
const PREF_THEME_KEY = 'lifetrack_v2_theme';
const LOCKOUT_KEY_PREFIX = 'lifetrack_v2_lockout_';

const LifeTrackContext = createContext<LifeTrackContextValue | null>(null);

function normalizeIdentifier(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (/^(?:\+?880|0)?1[3-9]\d{8}$/.test(trimmed.replace(/[\s-]/g, ''))) {
    const digits = trimmed.replace(/\D/g, '');
    const core = digits.slice(-11); // 01XXXXXXXXX
    return `+88${core}`;
  }
  return trimmed;
}

function makeAccountStorageKey(idOrUid: string): string {
  return `${STORAGE_PREFIX}${idOrUid.replace(/[^a-zA-Z0-9_@-]/g, '_')}`;
}

export const LifeTrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(PREF_LANG_KEY);
    return saved === 'en' ? 'en' : 'bn';
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(PREF_THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [activeAccountId, setActiveAccountId] = useState<string>(() => localStorage.getItem(ACTIVE_ACCOUNT_KEY) || '');
  const [pendingIdentifier, setPendingIdentifier] = useState<string>('');
  const [authStep, setAuthStep] = useState<AuthFlowStep>('login');

  const [data, setData] = useState<AppDataSchema>(() => {
    const acc = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (acc) {
      try {
        const raw = localStorage.getItem(makeAccountStorageKey(acc));
        if (raw) return migrateAppData(JSON.parse(raw));
      } catch {
        // Fallback to default
      }
    }
    return createDefaultAppData();
  });

  const [lockoutState, setLockoutState] = useState<LockoutRecord>({
    failedAttempts: 0,
    lockoutCount: 0,
    lockedUntilMs: 0,
  });

  // Navigation States
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [studySubTab, setStudySubTab] = useState<string>('timer');
  const [dailySubTab, setDailySubTab] = useState<string>('habits');
  const [islamicSubTab, setIslamicSubTab] = useState<string>('prayer');
  const [moneySubTab, setMoneySubTab] = useState<string>('overview');
  const [selectedSyllabusSubjectId, setSelectedSyllabusSubjectId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Timers & Feedback
  const [timerFlashActive, setTimerFlashActive] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const hiddenTimestampRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, undo?: { label: string; action: () => void }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, undoLabel: undo?.label, onUndo: undo?.action }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  // Sync HTML lang & dark class immediately
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    localStorage.setItem(PREF_LANG_KEY, lang);
  }, [lang]);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem(PREF_THEME_KEY, theme);
  }, [theme]);

  // Network online/offline listeners
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load lockout state for active account
  useEffect(() => {
    if (!activeAccountId) return;
    try {
      const localLock = localStorage.getItem(`${LOCKOUT_KEY_PREFIX}${activeAccountId}`);
      if (localLock) {
        const parsed = JSON.parse(localLock) as LockoutRecord;
        setLockoutState({
          failedAttempts: Number(parsed.failedAttempts) || 0,
          lockoutCount: Number(parsed.lockoutCount) || 0,
          lockedUntilMs: Number(parsed.lockedUntilMs) || 0,
        });
      }
    } catch {
      // Ignore corrupt lockout cache
    }
  }, [activeAccountId]);

  // Firebase Auth listener + initial PIN lock determination
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const uid = fbUser.uid;
        let loadedLocal: AppDataSchema | null = null;
        try {
          const cached = localStorage.getItem(makeAccountStorageKey(uid));
          if (cached) loadedLocal = migrateAppData(JSON.parse(cached));
        } catch {
          // Ignore cache error
        }

        // Try loading from Firestore if online
        if (navigator.onLine) {
          try {
            const profSnap = await getDoc(doc(db, 'users', uid));
            if (profSnap.exists()) {
              const pData = profSnap.data();
              const base = loadedLocal || createDefaultAppData();
              const cloudProfile: UserProfile = {
                uid,
                name: String(pData.name || ''),
                age: Number(pData.age || 18),
                gender: (pData.gender as UserProfile['gender']) || '',
                district: String(pData.district || 'dhaka'),
                isStudent: Boolean(pData.isStudent),
                classLevel: (pData.classLevel as UserProfile['classLevel']) || '',
                academicGroup: (pData.academicGroup as UserProfile['academicGroup']) || '',
                batch: String(pData.batch || ''),
                institution: String(pData.institution || ''),
                rollId: String(pData.rollId || ''),
                occupation: String(pData.occupation || ''),
                organization: String(pData.organization || ''),
                emailOrPhone: String(pData.emailOrPhone || fbUser.email || fbUser.phoneNumber || ''),
                language: pData.language === 'en' ? 'en' : 'bn',
                theme: pData.theme === 'light' ? 'light' : 'dark',
                currency: (pData.currency as UserProfile['currency']) || '৳',
                goals: base.profile?.goals || {
                  dailyStudyHours: 4,
                  dailyWaterGlasses: 8,
                  dailyWorkoutMinutes: 20,
                  dailyVocabWords: 10,
                  dailyReadingPages: 15,
                  yearlyBooksGoal: 12,
                  examDate: '',
                  examTitle: '',
                },
                ...(typeof pData.goals === 'object' && pData.goals ? { goals: { ...base.profile?.goals, ...pData.goals } } : {}),
                hijriAdjustment: (pData.hijriAdjustment === 0 || pData.hijriAdjustment === 1 ? pData.hijriAdjustment : -1),
                pinHash: String(pData.pinHash || ''),
                pinSalt: String(pData.pinSalt || ''),
                consent: Boolean(pData.consent),
                createdAt: pData.createdAt instanceof Timestamp ? pData.createdAt.toDate().toISOString() : new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              };

              // Load domainState map if available
              let domainExtra: Partial<AppDataSchema> = {};
              const dsSnap = await getDocs(collection(db, 'users', uid, 'domainState'));
              dsSnap.forEach((docSnap) => {
                const d = docSnap.data();
                if (d && d.domain && d.data && typeof d.data === 'object') {
                  Object.assign(domainExtra, d.data);
                }
              });

              // Load security lockout from Firestore
              const lockSnap = await getDoc(doc(db, 'users', uid, 'security', 'pinLock'));
              if (lockSnap.exists()) {
                const lData = lockSnap.data();
                const lockedUntilMs = lData.lockedUntil instanceof Timestamp ? lData.lockedUntil.toMillis() : 0;
                const nextLock: LockoutRecord = {
                  failedAttempts: Number(lData.failedAttempts) || 0,
                  lockoutCount: Number(lData.lockoutCount) || 0,
                  lockedUntilMs,
                };
                setLockoutState(nextLock);
                localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${uid}`, JSON.stringify(nextLock));
              }

              const mergedCloud = migrateAppData({
                ...base,
                ...domainExtra,
                profile: cloudProfile,
              });
              setData(mergedCloud);
              setLangState(cloudProfile.language);
              setThemeState(cloudProfile.theme);
              setActiveAccountId(uid);
              localStorage.setItem(ACTIVE_ACCOUNT_KEY, uid);
              localStorage.setItem(makeAccountStorageKey(uid), JSON.stringify(mergedCloud));
              setAuthStep(cloudProfile.pinHash ? 'pin_lock' : 'create_pin');
              setIsLoadingAuth(false);
              return;
            }
          } catch (err) {
            // Non-fatal on initial boot if offline or not yet provisioned doc
            console.warn('Cloud profile check skipped:', err);
          }
        }

        if (loadedLocal?.profile) {
          setData(loadedLocal);
          setLangState(loadedLocal.profile.language);
          setThemeState(loadedLocal.profile.theme);
          setActiveAccountId(uid);
          localStorage.setItem(ACTIVE_ACCOUNT_KEY, uid);
          setAuthStep(loadedLocal.profile.pinHash ? 'pin_lock' : 'create_pin');
        } else {
          setPendingIdentifier(fbUser.email || fbUser.phoneNumber || uid);
          setAuthStep('profile_setup');
        }
      } else {
        // Check local offline cached session
        const savedAcc = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
        if (savedAcc) {
          try {
            const raw = localStorage.getItem(makeAccountStorageKey(savedAcc));
            if (raw) {
              const migrated = migrateAppData(JSON.parse(raw));
              if (migrated.profile && migrated.profile.pinHash) {
                setData(migrated);
                setLangState(migrated.profile.language);
                setThemeState(migrated.profile.theme);
                setActiveAccountId(savedAcc);
                setAuthStep('pin_lock');
                setIsLoadingAuth(false);
                return;
              }
            }
          } catch {
            // Ignore
          }
        }
        setAuthStep('login');
      }
      setIsLoadingAuth(false);
    });

    return () => unsub();
  }, []);

  // Persist local cache & schedule Firestore cloud sync when online & authenticated
  const syncToFirestore = useCallback(async (snapshot: AppDataSchema) => {
    const fbUser = auth.currentUser;
    if (!fbUser || !navigator.onLine || !snapshot.profile) return;
    const uid = fbUser.uid;
    const p = snapshot.profile;

    try {
      const userRef = doc(db, 'users', uid);
      const existingSnap = await getDoc(userRef);
      const profilePayload = {
        uid,
        name: p.name.slice(0, 100),
        age: Math.max(5, Math.min(100, Number(p.age) || 18)),
        gender: (p.gender || '').slice(0, 32),
        district: (p.district || 'dhaka').slice(0, 64),
        isStudent: Boolean(p.isStudent),
        classLevel: (p.classLevel || '').slice(0, 40),
        academicGroup: (p.academicGroup || '').slice(0, 40),
        batch: (p.batch || '').slice(0, 60),
        institution: (p.institution || '').slice(0, 160),
        rollId: (p.rollId || '').slice(0, 60),
        occupation: (p.occupation || '').slice(0, 80),
        organization: (p.organization || '').slice(0, 160),
        emailOrPhone: (p.emailOrPhone || fbUser.email || '').slice(0, 160),
        language: p.language,
        theme: p.theme,
        currency: p.currency.slice(0, 10),
        goals: p.goals,
        hijriAdjustment: p.hijriAdjustment,
        pinHash: p.pinHash.slice(0, 256),
        pinSalt: p.pinSalt.slice(0, 128),
        consent: true,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!existingSnap.exists()) {
        await setDoc(userRef, {
          ...profilePayload,
          createdAt: serverTimestamp(),
        });
      } else {
        const { uid: _u, emailOrPhone: _e, consent: _c, ...updatable } = profilePayload;
        await updateDoc(userRef, updatable);
      }

      // Sync structured domainState documents natively (no JSON.stringify!)
      const domains: Record<string, Record<string, unknown>> = {
        studyCore: {
          subjects: snapshot.subjects,
          hscArchive: snapshot.hscArchive,
          exams: snapshot.exams,
          dailyReflections: snapshot.dailyReflections,
          weeklyReviewNote: snapshot.weeklyReviewNote,
          yearlyGoals: snapshot.yearlyGoals,
          isDemoDataLoaded: snapshot.isDemoDataLoaded,
        },
        dailyCore: {
          habits: snapshot.habits,
          habitLogs: snapshot.habitLogs,
          tasks: snapshot.tasks,
          waterLogs: snapshot.waterLogs,
          workoutRestDays: snapshot.workoutRestDays,
          weightLogs: snapshot.weightLogs,
          quizMistakes: snapshot.quizMistakes,
          readStories: snapshot.readStories,
          sleepMoodLogs: snapshot.sleepMoodLogs,
          journalEntries: snapshot.journalEntries,
          xp: snapshot.xp,
        },
        islamicCore: {
          ibadahLogs: snapshot.ibadahLogs,
          islamicState: snapshot.islamicState,
        },
        moneyCore: {
          customMoneyCategories: snapshot.customMoneyCategories,
          categoryBudgets: snapshot.categoryBudgets,
          savingsGoals: snapshot.savingsGoals,
          debts: snapshot.debts,
        },
        logsMirror: {
          studySessions: snapshot.studySessions.slice(-200),
          workoutLogs: snapshot.workoutLogs.slice(-200),
          books: snapshot.books.slice(-100),
          readingLogs: snapshot.readingLogs.slice(-200),
          expenses: snapshot.expenses.slice(-250),
          routines: snapshot.routines.slice(-200),
        },
      };

      for (const [domainKey, mapData] of Object.entries(domains)) {
        const dRef = doc(db, 'users', uid, 'domainState', domainKey);
        const dSnap = await getDoc(dRef);
        if (!dSnap.exists()) {
          await setDoc(dRef, {
            uid,
            domain: domainKey,
            data: mapData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(dRef, {
            data: mapData,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
        handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      }
      console.warn('Background Firestore sync deferred:', error);
    }
  }, []);

  // Save to localStorage immediately on every data change & debounce cloud sync
  useEffect(() => {
    if (!activeAccountId || !data.profile) return;
    try {
      localStorage.setItem(makeAccountStorageKey(activeAccountId), JSON.stringify(data));
    } catch (e) {
      console.warn('Local cache write warning:', e);
    }

    if (isOnline && auth.currentUser) {
      if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(() => {
        syncToFirestore(data);
      }, 1200);
    }
  }, [data, activeAccountId, isOnline, syncToFirestore]);

  // 5-Minute Background Inactivity PIN Lock + Accurate Timer Wall-Clock Recalculation
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestampRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        if (
          hiddenTimestampRef.current &&
          Date.now() - hiddenTimestampRef.current >= 5 * 60 * 1000 &&
          authStep === 'unlocked' &&
          data.profile?.pinHash
        ) {
          setAuthStep('pin_lock');
        }
        hiddenTimestampRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [authStep, data.profile?.pinHash]);

  // Award XP helper with daily cap per category
  const awardXp = useCallback((prevXp: AppDataSchema['xp'], category: string, amount: number, dailyCap: number): AppDataSchema['xp'] => {
    const today = new Date().toISOString().slice(0, 10);
    const todayMap = prevXp.dailyEarned[today] || {};
    const already = todayMap[category] || 0;
    if (already >= dailyCap) return prevXp;
    const grant = Math.min(amount, dailyCap - already);
    if (grant <= 0) return prevXp;
    return {
      ...prevXp,
      totalXp: prevXp.totalXp + grant,
      dailyEarned: {
        ...prevXp.dailyEarned,
        [today]: {
          ...todayMap,
          [category]: already + grant,
        },
      },
    };
  }, []);

  // Global Wall-Clock Timer Engine (accurate across phone lock/unlock via targetEndMs & Date.now())
  useEffect(() => {
    const hasRunning =
      data.activeTimers.pomodoro.isRunning ||
      data.activeTimers.workout.isRunning ||
      data.activeTimers.reading.isRunning;
    if (!hasRunning) return;

    const checkTimers = () => {
      const now = Date.now();
      for (const kind of ['pomodoro', 'workout', 'reading'] as const) {
        const tm = data.activeTimers[kind];
        if (tm.isRunning && tm.targetEndMs && now >= tm.targetEndMs) {
          playTimerChime();
          setTimerFlashActive(true);
          window.setTimeout(() => setTimerFlashActive(false), 4000);

          setData((prev) => {
            const cur = prev.activeTimers[kind];
            if (!cur.isRunning) return prev;
            const today = new Date().toISOString().slice(0, 10);

            if (kind === 'pomodoro' && cur.phase === 'work') {
              const mins = Math.max(1, Math.round(cur.workMinutes));
              const newSession: StudySession = {
                id: `ss_${Date.now()}`,
                subjectId: cur.subjectId || 'none',
                topic: cur.topic || (lang === 'bn' ? 'পোমোডোরো সেশন' : 'Pomodoro Session'),
                durationMinutes: mins,
                date: today,
                startedAt: new Date(cur.startedAtMs || now - mins * 60000).toISOString(),
                source: 'timer',
              };
              const nextBreakMs = cur.breakMinutes * 60 * 1000;
              return {
                ...prev,
                studySessions: [newSession, ...prev.studySessions],
                xp: awardXp(prev.xp, 'study', 10, 50),
                activeTimers: {
                  ...prev.activeTimers,
                  pomodoro: {
                    ...cur,
                    isRunning: false,
                    phase: 'break',
                    startedAtMs: null,
                    targetEndMs: null,
                    remainingMsWhenPaused: nextBreakMs,
                  },
                },
              };
            }

            const resetMinutes = cur.phase === 'break' ? cur.workMinutes : cur.workMinutes;
            return {
              ...prev,
              activeTimers: {
                ...prev.activeTimers,
                [kind]: {
                  ...cur,
                  isRunning: false,
                  phase: 'work',
                  startedAtMs: null,
                  targetEndMs: null,
                  remainingMsWhenPaused: resetMinutes * 60 * 1000,
                },
              },
            };
          });
        }
      }
    };

    const interval = window.setInterval(checkTimers, 500);
    document.addEventListener('visibilitychange', checkTimers);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkTimers);
    };
  }, [data.activeTimers, awardXp, lang]);

  // Language & Theme Controls
  const setLanguage = useCallback((l: Language) => {
    setLangState(l);
    setData((prev) => (prev.profile ? { ...prev, profile: { ...prev.profile, language: l } } : prev));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'bn' ? 'en' : 'bn';
      setData((d) => (d.profile ? { ...d, profile: { ...d.profile, language: next } } : d));
      return next;
    });
  }, []);

  const setTheme = useCallback((m: ThemeMode) => {
    setThemeState(m);
    setData((prev) => (prev.profile ? { ...prev, profile: { ...prev.profile, theme: m } } : prev));
  }, []);

  const navigateTo = useCallback((tab: MainTab, subTab?: string, subjectId?: string) => {
    setMainTab(tab);
    setIsSettingsOpen(false);
    if (subTab) {
      if (tab === 'study') setStudySubTab(subTab);
      if (tab === 'daily') setDailySubTab(subTab);
      if (tab === 'islamic') setIslamicSubTab(subTab);
      if (tab === 'money') setMoneySubTab(subTab);
    }
    if (subjectId) {
      setSelectedSyllabusSubjectId(subjectId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const checkExistingAccount = useCallback(async (identifier: string): Promise<boolean> => {
    const norm = normalizeIdentifier(identifier);
    setPendingIdentifier(norm);
    const localRaw = localStorage.getItem(makeAccountStorageKey(norm));
    if (localRaw) {
      try {
        const parsed = migrateAppData(JSON.parse(localRaw));
        if (parsed.profile && parsed.profile.pinHash) {
          setData(parsed);
          setLangState(parsed.profile.language);
          setThemeState(parsed.profile.theme);
          setActiveAccountId(norm);
          localStorage.setItem(ACTIVE_ACCOUNT_KEY, norm);
          return true;
        }
      } catch {
        // Ignore
      }
    }
    return false;
  }, []);

  const completeOnboarding = useCallback(
    async (
      profileInput: Omit<UserProfile, 'pinHash' | 'pinSalt' | 'createdAt' | 'lastLogin'>,
      pinHash: string,
      pinSalt: string
    ) => {
      const nowIso = new Date().toISOString();
      const accountKey = auth.currentUser?.uid || normalizeIdentifier(profileInput.emailOrPhone || pendingIdentifier || `local_${Date.now()}`);
      const fullProfile: UserProfile = {
        ...profileInput,
        uid: accountKey,
        language: lang,
        theme,
        pinHash,
        pinSalt,
        createdAt: nowIso,
        lastLogin: nowIso,
      };

      const base = createDefaultAppData();
      const suggestedSubjects = buildSuggestedSubjects(
        fullProfile.classLevel,
        fullProfile.academicGroup,
        fullProfile.isStudent
      );
      const seeded = injectSampleDemoData({ ...base, subjects: suggestedSubjects }, fullProfile);

      setData(seeded);
      setActiveAccountId(accountKey);
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountKey);
      localStorage.setItem(makeAccountStorageKey(accountKey), JSON.stringify(seeded));
      setAuthStep('unlocked');

      if (auth.currentUser && navigator.onLine) {
        await syncToFirestore(seeded);
      }
    },
    [lang, theme, pendingIdentifier, syncToFirestore]
  );

  const resetPinAfterOtp = useCallback(
    async (pinHash: string, pinSalt: string) => {
      setData((prev) => {
        if (!prev.profile) return prev;
        return {
          ...prev,
          profile: {
            ...prev.profile,
            pinHash,
            pinSalt,
            lastLogin: new Date().toISOString(),
          },
        };
      });
      const cleared: LockoutRecord = { failedAttempts: 0, lockoutCount: 0, lockedUntilMs: 0 };
      setLockoutState(cleared);
      if (activeAccountId) {
        localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${activeAccountId}`, JSON.stringify(cleared));
      }
      setAuthStep('unlocked');
    },
    [activeAccountId]
  );

  const recordPinFailure = useCallback(async (): Promise<LockoutRecord> => {
    const nextAttempts = lockoutState.failedAttempts + 1;
    let nextLockoutCount = lockoutState.lockoutCount;
    let nextLockedUntilMs = lockoutState.lockedUntilMs;

    if (nextAttempts >= 5) {
      nextLockoutCount += 1;
      // 5 mins on first 5 wrong attempts, escalates on repeated lockouts (10m, 20m...)
      const lockMinutes = 5 * Math.pow(2, Math.max(0, nextLockoutCount - 1));
      nextLockedUntilMs = Date.now() + lockMinutes * 60 * 1000;
    }

    const updated: LockoutRecord = {
      failedAttempts: nextAttempts,
      lockoutCount: nextLockoutCount,
      lockedUntilMs: nextLockedUntilMs,
    };

    setLockoutState(updated);
    if (activeAccountId) {
      localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${activeAccountId}`, JSON.stringify(updated));
    }

    // Sync monotonically to Firestore security/pinLock if authenticated
    if (auth.currentUser && navigator.onLine) {
      const uid = auth.currentUser.uid;
      const lockRef = doc(db, 'users', uid, 'security', 'pinLock');
      try {
        const snap = await getDoc(lockRef);
        const tsUntil = Timestamp.fromMillis(Math.max(nextLockedUntilMs, Date.now()));
        if (!snap.exists()) {
          await setDoc(lockRef, {
            uid,
            failedAttempts: nextAttempts,
            lockoutCount: nextLockoutCount,
            lockedUntil: tsUntil,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(lockRef, {
            failedAttempts: nextAttempts,
            lockoutCount: nextLockoutCount,
            lockedUntil: tsUntil,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.warn('Pin lockout cloud write warning:', e);
      }
    }

    return updated;
  }, [lockoutState, activeAccountId]);

  const recordPinSuccess = useCallback(async () => {
    const resetRec: LockoutRecord = {
      failedAttempts: 0,
      lockoutCount: lockoutState.lockoutCount,
      lockedUntilMs: lockoutState.lockedUntilMs,
    };
    setLockoutState(resetRec);
    if (activeAccountId) {
      localStorage.setItem(`${LOCKOUT_KEY_PREFIX}${activeAccountId}`, JSON.stringify(resetRec));
    }
    if (auth.currentUser && navigator.onLine) {
      const uid = auth.currentUser.uid;
      const lockRef = doc(db, 'users', uid, 'security', 'pinLock');
      try {
        const snap = await getDoc(lockRef);
        if (snap.exists() && Date.now() > (snap.data().lockedUntil?.toMillis?.() || 0)) {
          await updateDoc(lockRef, {
            failedAttempts: 0,
            updatedAt: serverTimestamp(),
          });
        }
      } catch {
        // Ignore
      }
    }
    setAuthStep('unlocked');
  }, [lockoutState, activeAccountId]);

  const unlockApp = useCallback(() => {
    setAuthStep('unlocked');
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // Ignore
    }
    setIsSettingsOpen(false);
    setAuthStep('login');
  }, []);

  const deleteAccountAndData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (uid && navigator.onLine) {
      try {
        const dsSnap = await getDocs(collection(db, 'users', uid, 'domainState'));
        for (const d of dsSnap.docs) {
          await deleteDoc(d.ref);
        }
        await deleteDoc(doc(db, 'users', uid));
        await signOut(auth);
      } catch (e) {
        console.warn('Cloud account cleanup warning:', e);
      }
    }
    if (activeAccountId) {
      localStorage.removeItem(makeAccountStorageKey(activeAccountId));
      localStorage.removeItem(`${LOCKOUT_KEY_PREFIX}${activeAccountId}`);
    }
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    setActiveAccountId('');
    setData(createDefaultAppData());
    setIsSettingsOpen(false);
    setAuthStep('login');
  }, [activeAccountId]);

  const clearDemoData = useCallback(() => {
    setData((prev) => clearDemoDataFromState(prev));
    showToast(t('demoClearedToast', lang));
  }, [lang, showToast]);

  const updateProfile = useCallback(
    async (nextProfile: UserProfile, refreshSubjectsChoice?: boolean) => {
      setLangState(nextProfile.language);
      setThemeState(nextProfile.theme);

      setData((prev) => {
        let subjects = prev.subjects;
        let hscArchive = prev.hscArchive;
        if (refreshSubjectsChoice && prev.profile) {
          const subjectIdsWithLogs = new Set(prev.studySessions.map((s) => s.subjectId));
          const transitioned = transitionSubjectsForProfileChange({
            oldSubjects: prev.subjects,
            hscArchive: prev.hscArchive,
            wasHsc: isHscClass(prev.profile.classLevel),
            nowHsc: isHscClass(nextProfile.classLevel),
            newClassLevel: nextProfile.classLevel,
            newGroup: nextProfile.academicGroup,
            isStudent: nextProfile.isStudent,
            subjectIdsWithLogs,
          });
          subjects = transitioned.subjects;
          hscArchive = transitioned.hscArchive;
        }
        return {
          ...prev,
          profile: nextProfile,
          subjects,
          hscArchive,
        };
      });
      showToast(t('savedSuccess', nextProfile.language));
    },
    [showToast]
  );

  // Study Handlers
  const addOrUpdateSubject = useCallback(
    (subj: SubjectItem) => {
      setData((prev) => {
        const exists = prev.subjects.some((s) => s.id === subj.id);
        const subjects = exists
          ? prev.subjects.map((s) => (s.id === subj.id ? subj : s))
          : [...prev.subjects, subj];
        return { ...prev, subjects };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteOrHideSubject = useCallback(
    (subjectId: string, hideOnly = false) => {
      setData((prev) => {
        const target = prev.subjects.find((s) => s.id === subjectId);
        if (!target) return prev;
        const hasLogs = prev.studySessions.some((ss) => ss.subjectId === subjectId);

        if (hideOnly || target.preloaded) {
          return {
            ...prev,
            subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, hidden: true } : s)),
          };
        }
        if (hasLogs) {
          return {
            ...prev,
            subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, archived: true } : s)),
          };
        }
        return {
          ...prev,
          subjects: prev.subjects.filter((s) => s.id !== subjectId),
        };
      });
      showToast(t('deletedToast', lang));
    },
    [lang, showToast]
  );

  const restoreSubject = useCallback((subjectId: string) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subjectId ? { ...s, hidden: false, archived: false } : s)),
    }));
  }, []);

  const updateChapter = useCallback((subjectId: string, chapter: ChapterItem) => {
    const safeTotal = Math.max(0, Math.floor(Number(chapter.totalClasses) || 0));
    const safeDone = Math.min(safeTotal, Math.max(0, Math.floor(Number(chapter.completedClasses) || 0)));
    const normalized: ChapterItem = {
      ...chapter,
      totalClasses: safeTotal,
      completedClasses: safeDone,
    };

    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.map((c) => (c.id === normalized.id ? normalized : c)) }
          : s
      ),
    }));

    // Mirror chapterProgress to subcollection when online
    if (auth.currentUser && navigator.onLine) {
      const uid = auth.currentUser.uid;
      const cRef = doc(db, 'users', uid, 'chapterProgress', normalized.id);
      getDoc(cRef)
        .then((snap) => {
          const payload = {
            uid,
            id: normalized.id,
            subjectId,
            paper: normalized.paper,
            chapterNo: normalized.no,
            totalClasses: normalized.totalClasses,
            completedClasses: normalized.completedClasses,
            cqSolved: normalized.cqSolved,
            mcqSolved: normalized.mcqSolved,
            admissionPyq: normalized.admissionPyq,
            otherProblems: normalized.otherProblems,
            examDone: normalized.examDone,
            mistakesCorrected: normalized.mistakesCorrected,
            difficulty: normalized.difficulty,
            notes: normalized.notes.slice(0, 500),
            hidden: normalized.hidden,
            updatedAt: serverTimestamp(),
          };
          if (!snap.exists()) {
            return setDoc(cRef, { ...payload, createdAt: serverTimestamp() });
          } else {
            const { uid: _u, id: _i, subjectId: _s, paper: _p, chapterNo: _n, ...upd } = payload;
            return updateDoc(cRef, upd);
          }
        })
        .catch(() => {});
    }
  }, []);

  const addChapter = useCallback(
    (subjectId: string, paper: 1 | 2, bn: string, en: string, totalClasses: number) => {
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          const paperChaps = s.chapters.filter((c) => c.paper === paper);
          const nextNo = paperChaps.length + 1;
          const newCh: ChapterItem = {
            id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            no: nextNo,
            paper,
            bn: bn.trim() || en.trim(),
            en: en.trim() || bn.trim(),
            preloaded: false,
            hidden: false,
            totalClasses: Math.max(0, Math.floor(totalClasses || 0)),
            completedClasses: 0,
            cqSolved: false,
            mcqSolved: false,
            admissionPyq: false,
            otherProblems: false,
            examDone: false,
            mistakesCorrected: false,
            difficulty: 'medium',
            notes: '',
          };
          return { ...s, chapters: [...s.chapters, newCh] };
        }),
      }));
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteOrHideChapter = useCallback(
    (subjectId: string, chapterId: string) => {
      setData((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) => {
          if (s.id !== subjectId) return s;
          const target = s.chapters.find((c) => c.id === chapterId);
          if (!target) return s;
          if (target.preloaded) {
            return {
              ...s,
              chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, hidden: true } : c)),
            };
          }
          return {
            ...s,
            chapters: s.chapters.filter((c) => c.id !== chapterId),
          };
        }),
      }));
      showToast(t('deletedToast', lang));
    },
    [lang, showToast]
  );

  const restoreHiddenChapters = useCallback((subjectId: string) => {
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id === subjectId ? { ...s, chapters: s.chapters.map((c) => ({ ...c, hidden: false })) } : s
      ),
    }));
  }, []);

  const addStudySession = useCallback(
    (session: Omit<StudySession, 'id'>) => {
      if (session.durationMinutes < 1) return;
      const newEntry: StudySession = {
        ...session,
        id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      };
      setData((prev) => ({
        ...prev,
        studySessions: [newEntry, ...prev.studySessions],
        xp: awardXp(prev.xp, 'study', 10, 50),
      }));
      showToast(t('savedSuccess', lang));

      if (auth.currentUser && navigator.onLine) {
        const uid = auth.currentUser.uid;
        setDoc(doc(db, 'users', uid, 'studySessions', newEntry.id), {
          uid,
          id: newEntry.id,
          subjectId: newEntry.subjectId,
          topic: newEntry.topic.slice(0, 200),
          durationMinutes: newEntry.durationMinutes,
          date: newEntry.date,
          source: newEntry.source,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    },
    [awardXp, lang, showToast]
  );

  const deleteStudySession = useCallback(
    (id: string) => {
      let removed: StudySession | undefined;
      setData((prev) => {
        removed = prev.studySessions.find((s) => s.id === id);
        return { ...prev, studySessions: prev.studySessions.filter((s) => s.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, studySessions: [snap, ...p.studySessions] })),
        });
      }
    },
    [lang, showToast]
  );

  const saveExam = useCallback(
    (exam: ExamItem) => {
      setData((prev) => {
        const exists = prev.exams.some((e) => e.id === exam.id);
        return {
          ...prev,
          exams: exists ? prev.exams.map((e) => (e.id === exam.id ? exam : e)) : [...prev.exams, exam],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteExam = useCallback(
    (id: string) => {
      let removed: ExamItem | undefined;
      setData((prev) => {
        removed = prev.exams.find((e) => e.id === id);
        return { ...prev, exams: prev.exams.filter((e) => e.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, exams: [...p.exams, snap] })),
        });
      }
    },
    [lang, showToast]
  );

  const saveRoutine = useCallback(
    (routine: RoutineItem) => {
      setData((prev) => {
        const exists = prev.routines.some((r) => r.id === routine.id);
        return {
          ...prev,
          routines: exists ? prev.routines.map((r) => (r.id === routine.id ? routine : r)) : [...prev.routines, routine],
        };
      });
      showToast(t('savedSuccess', lang));

      if (auth.currentUser && navigator.onLine) {
        const uid = auth.currentUser.uid;
        setDoc(doc(db, 'users', uid, 'routines', routine.id), {
          uid,
          id: routine.id,
          title: routine.title.slice(0, 200),
          routineType: routine.routineType,
          subjectId: routine.subjectId || 'none',
          date: routine.date || '',
          repeat: routine.repeat || 'none',
          startTime: routine.startTime || '',
          endTime: routine.endTime || '',
          reminderTime: routine.reminderTime || '',
          done: routine.done,
          progress: routine.progress,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    },
    [lang, showToast]
  );

  const toggleRoutineDone = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      routines: prev.routines.map((r) =>
        r.id === id ? { ...r, done: !r.done, progress: !r.done ? 100 : 0 } : r
      ),
    }));
  }, []);

  const deleteRoutine = useCallback(
    (id: string) => {
      let removed: RoutineItem | undefined;
      setData((prev) => {
        removed = prev.routines.find((r) => r.id === id);
        return { ...prev, routines: prev.routines.filter((r) => r.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, routines: [...p.routines, snap] })),
        });
      }
    },
    [lang, showToast]
  );

  const setRoutinesBulk = useCallback(
    (routines: RoutineItem[]) => {
      setData((prev) => ({ ...prev, routines }));
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const saveDailyReflection = useCallback((date: string, priorities: [string, string, string], reflection: string) => {
    setData((prev) => ({
      ...prev,
      dailyReflections: {
        ...prev.dailyReflections,
        [date]: { date, priorities, reflection },
      },
    }));
  }, []);

  const setWeeklyReviewNote = useCallback((note: string) => {
    setData((prev) => ({ ...prev, weeklyReviewNote: note }));
  }, []);

  const setYearlyGoal = useCallback((monthIdx: number, goalText: string) => {
    setData((prev) => ({
      ...prev,
      yearlyGoals: { ...prev.yearlyGoals, [monthIdx]: goalText },
    }));
  }, []);

  // Daily Handlers
  const saveHabitDef = useCallback(
    (habit: HabitDefinition) => {
      setData((prev) => {
        const exists = prev.habits.some((h) => h.id === habit.id);
        return {
          ...prev,
          habits: exists ? prev.habits.map((h) => (h.id === habit.id ? habit : h)) : [...prev.habits, habit],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteHabitDef = useCallback(
    (id: string) => {
      let removed: HabitDefinition | undefined;
      setData((prev) => {
        removed = prev.habits.find((h) => h.id === id);
        return { ...prev, habits: prev.habits.filter((h) => h.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, habits: [...p.habits, snap] })),
        });
      }
    },
    [lang, showToast]
  );

  const toggleHabitToday = useCallback(
    (habitId: string, date: string) => {
      setData((prev) => {
        const dayMap = prev.habitLogs[date] || {};
        const nextVal = !dayMap[habitId];
        return {
          ...prev,
          habitLogs: {
            ...prev.habitLogs,
            [date]: { ...dayMap, [habitId]: nextVal },
          },
          xp: nextVal ? awardXp(prev.xp, 'habit', 5, 25) : prev.xp,
        };
      });
    },
    [awardXp]
  );

  const saveTask = useCallback(
    (task: TaskItem) => {
      setData((prev) => {
        const exists = prev.tasks.some((tk) => tk.id === task.id);
        return {
          ...prev,
          tasks: exists ? prev.tasks.map((tk) => (tk.id === task.id ? task : tk)) : [task, ...prev.tasks],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const toggleTaskDone = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((tk) => (tk.id === id ? { ...tk, done: !tk.done } : tk)),
      }));
      showToast(t('completedToast', lang));
    },
    [lang, showToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      let removed: TaskItem | undefined;
      setData((prev) => {
        removed = prev.tasks.find((tk) => tk.id === id);
        return { ...prev, tasks: prev.tasks.filter((tk) => tk.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, tasks: [snap, ...p.tasks] })),
        });
      }
    },
    [lang, showToast]
  );

  const setWaterGlasses = useCallback((date: string, count: number) => {
    setData((prev) => ({
      ...prev,
      waterLogs: { ...prev.waterLogs, [date]: Math.max(0, Math.min(30, count)) },
    }));
  }, []);

  const addWorkoutLog = useCallback(
    (log: Omit<WorkoutLog, 'id'>) => {
      const entry: WorkoutLog = { ...log, id: `wo_${Date.now()}` };
      setData((prev) => ({
        ...prev,
        workoutLogs: [entry, ...prev.workoutLogs],
        xp: awardXp(prev.xp, 'workout', 10, 30),
      }));
      showToast(t('savedSuccess', lang));

      if (auth.currentUser && navigator.onLine) {
        const uid = auth.currentUser.uid;
        setDoc(doc(db, 'users', uid, 'workoutLogs', entry.id), {
          uid,
          id: entry.id,
          exercise: (entry.customExerciseName || entry.exerciseKey).slice(0, 100),
          mode: entry.mode,
          sets: entry.sets,
          reps: entry.reps,
          durationMinutes: entry.durationMinutes,
          distanceKm: entry.distanceKm,
          calories: entry.calories,
          date: entry.date,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    },
    [awardXp, lang, showToast]
  );

  const deleteWorkoutLog = useCallback(
    (id: string) => {
      let removed: WorkoutLog | undefined;
      setData((prev) => {
        removed = prev.workoutLogs.find((w) => w.id === id);
        return { ...prev, workoutLogs: prev.workoutLogs.filter((w) => w.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, workoutLogs: [snap, ...p.workoutLogs] })),
        });
      }
    },
    [lang, showToast]
  );

  const setWorkoutRestDays = useCallback((days: number[]) => {
    setData((prev) => ({ ...prev, workoutRestDays: days }));
  }, []);

  const addWeightEntry = useCallback(
    (entry: Omit<WeightEntry, 'id'>) => {
      const item: WeightEntry = { ...entry, id: `wt_${Date.now()}` };
      setData((prev) => ({ ...prev, weightLogs: [...prev.weightLogs, item] }));
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const saveWord = useCallback(
    (word: VocabWord) => {
      setData((prev) => {
        const exists = prev.words.some((w) => w.id === word.id);
        return {
          ...prev,
          words: exists ? prev.words.map((w) => (w.id === word.id ? word : w)) : [word, ...prev.words],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteWord = useCallback(
    (id: string) => {
      let removed: VocabWord | undefined;
      setData((prev) => {
        removed = prev.words.find((w) => w.id === id);
        return { ...prev, words: prev.words.filter((w) => w.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, words: [snap, ...p.words] })),
        });
      }
    },
    [lang, showToast]
  );

  const importWordsBulk = useCallback(
    (words: VocabWord[]) => {
      setData((prev) => {
        const existingMap = new Map(prev.words.map((w) => [w.word.toLowerCase(), w]));
        for (const nw of words) {
          existingMap.set(nw.word.toLowerCase(), nw);
        }
        return { ...prev, words: Array.from(existingMap.values()) };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const reviewWordCard = useCallback(
    (wordId: string, knewIt: boolean) => {
      const today = new Date().toISOString().slice(0, 10);
      const intervals = [1, 3, 7, 14, 30];

      setData((prev) => {
        const nextWords = prev.words.map((w) => {
          if (w.id !== wordId) return w;
          let nextInt = 1;
          if (knewIt) {
            const idx = intervals.indexOf(w.intervalDays);
            nextInt = idx >= 0 && idx < intervals.length - 1 ? intervals[idx + 1] : w.intervalDays >= 30 ? 30 : 3;
            if (w.intervalDays === 0) nextInt = 1;
          } else {
            nextInt = 1;
          }
          const nextDate = new Date(Date.now() + nextInt * 86400000).toISOString().slice(0, 10);
          return {
            ...w,
            reviewed: true,
            intervalDays: nextInt,
            nextReviewDate: nextDate,
            lastReviewedDate: today,
          };
        });

        // XP: +5 per 10 words reviewed (each card counts once per day, daily cap 30 XP)
        const cardsToday = prev.xp.reviewedCardsToday[today] || [];
        let nextXp = prev.xp;
        if (!cardsToday.includes(wordId)) {
          const updatedCards = [...cardsToday, wordId];
          nextXp = {
            ...prev.xp,
            reviewedCardsToday: {
              ...prev.xp.reviewedCardsToday,
              [today]: updatedCards,
            },
          };
          if (updatedCards.length % 10 === 0) {
            nextXp = awardXp(nextXp, 'vocab', 5, 30);
          }
        }

        return { ...prev, words: nextWords, xp: nextXp };
      });
    },
    [awardXp]
  );

  const recordQuizMistake = useCallback((wordId: string) => {
    setData((prev) => ({
      ...prev,
      quizMistakes: prev.quizMistakes.includes(wordId) ? prev.quizMistakes : [...prev.quizMistakes, wordId],
    }));
  }, []);

  const saveBook = useCallback(
    (book: BookEntry) => {
      setData((prev) => {
        const exists = prev.books.some((b) => b.id === book.id);
        return {
          ...prev,
          books: exists ? prev.books.map((b) => (b.id === book.id ? book : b)) : [book, ...prev.books],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteBook = useCallback(
    (id: string) => {
      let removed: BookEntry | undefined;
      setData((prev) => {
        removed = prev.books.find((b) => b.id === id);
        return { ...prev, books: prev.books.filter((b) => b.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, books: [snap, ...p.books] })),
        });
      }
    },
    [lang, showToast]
  );

  const addReadingLog = useCallback(
    (log: Omit<ReadingLog, 'id'>) => {
      const entry: ReadingLog = { ...log, id: `rl_${Date.now()}` };
      setData((prev) => {
        const updatedBooks: BookEntry[] = prev.books.map((b) => {
          if (b.id !== log.bookId) return b;
          const nextPages = Math.min(b.totalPages, b.pagesRead + log.pages);
          const nextStatus: BookEntry['status'] = nextPages >= b.totalPages ? 'finished' : 'reading';
          return { ...b, pagesRead: nextPages, status: nextStatus };
        });
        return {
          ...prev,
          books: updatedBooks,
          readingLogs: [entry, ...prev.readingLogs],
          xp: awardXp(prev.xp, 'reading', 10, 30),
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [awardXp, lang, showToast]
  );

  const markStoryRead = useCallback(
    (storyId: string) => {
      setData((prev) => {
        if (prev.readStories.includes(storyId)) return prev;
        return {
          ...prev,
          readStories: [...prev.readStories, storyId],
          xp: awardXp(prev.xp, 'reading', 10, 30),
        };
      });
      showToast(t('completedToast', lang));
    },
    [awardXp, lang, showToast]
  );

  const saveSleepMood = useCallback(
    (entry: SleepMoodLog) => {
      setData((prev) => ({
        ...prev,
        sleepMoodLogs: { ...prev.sleepMoodLogs, [entry.date]: entry },
      }));
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const saveJournalEntry = useCallback(
    (date: string, content: string) => {
      setData((prev) => {
        const existing = prev.journalEntries.find((j) => j.date === date);
        const nowIso = new Date().toISOString();
        const nextEntries = existing
          ? prev.journalEntries.map((j) => (j.date === date ? { ...j, content, updatedAt: nowIso } : j))
          : [{ id: `jr_${Date.now()}`, date, content, updatedAt: nowIso }, ...prev.journalEntries];
        return { ...prev, journalEntries: nextEntries };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteJournalEntry = useCallback(
    (id: string) => {
      let removed: JournalEntry | undefined;
      setData((prev) => {
        removed = prev.journalEntries.find((j) => j.id === id);
        return { ...prev, journalEntries: prev.journalEntries.filter((j) => j.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, journalEntries: [snap, ...p.journalEntries] })),
        });
      }
    },
    [lang, showToast]
  );

  // Islamic Handlers
  const updateIbadahLog = useCallback((date: string, updater: (prev: DailyIbadahLog) => DailyIbadahLog) => {
    setData((prev) => {
      const current = prev.ibadahLogs[date] || createEmptyIbadahLog(date);
      const next = updater(current);
      return {
        ...prev,
        ibadahLogs: { ...prev.ibadahLogs, [date]: next },
      };
    });
  }, []);

  const updateIslamicState = useCallback(
    (updater: (prev: AppDataSchema['islamicState']) => AppDataSchema['islamicState']) => {
      setData((prev) => ({
        ...prev,
        islamicState: updater(prev.islamicState),
      }));
    },
    []
  );

  // Money Handlers
  const saveExpense = useCallback(
    (tx: ExpenseRecord) => {
      setData((prev) => {
        const exists = prev.expenses.some((x) => x.id === tx.id);
        return {
          ...prev,
          expenses: exists ? prev.expenses.map((x) => (x.id === tx.id ? tx : x)) : [tx, ...prev.expenses],
        };
      });
      showToast(t('savedSuccess', lang));

      if (auth.currentUser && navigator.onLine) {
        const uid = auth.currentUser.uid;
        setDoc(doc(db, 'users', uid, 'expenses', tx.id), {
          uid,
          id: tx.id,
          txType: tx.txType,
          amount: tx.amount,
          category: tx.category.slice(0, 64),
          date: tx.date,
          note: tx.note.slice(0, 300),
          paymentMethod: tx.paymentMethod,
          recurring: tx.recurring,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    },
    [lang, showToast]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      let removed: ExpenseRecord | undefined;
      setData((prev) => {
        removed = prev.expenses.find((x) => x.id === id);
        return { ...prev, expenses: prev.expenses.filter((x) => x.id !== id) };
      });
      if (removed) {
        const snap = removed;
        showToast(t('deletedToast', lang), {
          label: t('undo', lang),
          action: () => setData((p) => ({ ...p, expenses: [snap, ...p.expenses] })),
        });
      }
    },
    [lang, showToast]
  );

  const addCustomMoneyCategory = useCallback((cat: string) => {
    const clean = cat.trim();
    if (!clean) return;
    setData((prev) => ({
      ...prev,
      customMoneyCategories: prev.customMoneyCategories.includes(clean)
        ? prev.customMoneyCategories
        : [...prev.customMoneyCategories, clean],
    }));
  }, []);

  const setCategoryBudget = useCallback((category: string, amount: number) => {
    setData((prev) => ({
      ...prev,
      categoryBudgets: { ...prev.categoryBudgets, [category]: Math.max(0, amount) },
    }));
  }, []);

  const saveSavingsGoal = useCallback(
    (goal: SavingsGoal) => {
      setData((prev) => {
        const exists = prev.savingsGoals.some((g) => g.id === goal.id);
        return {
          ...prev,
          savingsGoals: exists
            ? prev.savingsGoals.map((g) => (g.id === goal.id ? goal : g))
            : [...prev.savingsGoals, goal],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteSavingsGoal = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, savingsGoals: prev.savingsGoals.filter((g) => g.id !== id) }));
      showToast(t('deletedToast', lang));
    },
    [lang, showToast]
  );

  const saveDebt = useCallback(
    (debt: DebtRecord) => {
      setData((prev) => {
        const exists = prev.debts.some((d) => d.id === debt.id);
        return {
          ...prev,
          debts: exists ? prev.debts.map((d) => (d.id === debt.id ? debt : d)) : [...prev.debts, debt],
        };
      });
      showToast(t('savedSuccess', lang));
    },
    [lang, showToast]
  );

  const deleteDebt = useCallback(
    (id: string) => {
      setData((prev) => ({ ...prev, debts: prev.debts.filter((d) => d.id !== id) }));
      showToast(t('deletedToast', lang));
    },
    [lang, showToast]
  );

  const updateTimer = useCallback(
    (kind: 'pomodoro' | 'workout' | 'reading', updater: (prev: ActiveTimerState) => ActiveTimerState) => {
      setData((prev) => ({
        ...prev,
        activeTimers: {
          ...prev.activeTimers,
          [kind]: updater(prev.activeTimers[kind]),
        },
      }));
    },
    []
  );

  const dismissTimerFlash = useCallback(() => setTimerFlashActive(false), []);

  const value = useMemo<LifeTrackContextValue>(
    () => ({
      data,
      lang,
      theme,
      isOnline,
      isLoadingAuth,
      firebaseUser,
      authStep,
      pendingIdentifier,
      setPendingIdentifier,
      setAuthStep,
      mainTab,
      studySubTab,
      dailySubTab,
      islamicSubTab,
      moneySubTab,
      selectedSyllabusSubjectId,
      isSettingsOpen,
      setIsSettingsOpen,
      navigateTo,
      toggleLanguage,
      setLanguage,
      setTheme,
      checkExistingAccount,
      completeOnboarding,
      resetPinAfterOtp,
      unlockApp,
      lockoutState,
      recordPinFailure,
      recordPinSuccess,
      logoutUser,
      deleteAccountAndData,
      clearDemoData,
      updateProfile,
      addOrUpdateSubject,
      deleteOrHideSubject,
      restoreSubject,
      updateChapter,
      addChapter,
      deleteOrHideChapter,
      restoreHiddenChapters,
      addStudySession,
      deleteStudySession,
      saveExam,
      deleteExam,
      saveRoutine,
      toggleRoutineDone,
      deleteRoutine,
      setRoutinesBulk,
      saveDailyReflection,
      setWeeklyReviewNote,
      setYearlyGoal,
      saveHabitDef,
      deleteHabitDef,
      toggleHabitToday,
      saveTask,
      toggleTaskDone,
      deleteTask,
      setWaterGlasses,
      addWorkoutLog,
      deleteWorkoutLog,
      setWorkoutRestDays,
      addWeightEntry,
      saveWord,
      deleteWord,
      importWordsBulk,
      reviewWordCard,
      recordQuizMistake,
      saveBook,
      deleteBook,
      addReadingLog,
      markStoryRead,
      saveSleepMood,
      saveJournalEntry,
      deleteJournalEntry,
      updateIbadahLog,
      updateIslamicState,
      saveExpense,
      deleteExpense,
      addCustomMoneyCategory,
      setCategoryBudget,
      saveSavingsGoal,
      deleteSavingsGoal,
      saveDebt,
      deleteDebt,
      updateTimer,
      timerFlashActive,
      dismissTimerFlash,
      toasts,
      showToast,
    }),
    [
      data,
      lang,
      theme,
      isOnline,
      isLoadingAuth,
      firebaseUser,
      authStep,
      pendingIdentifier,
      mainTab,
      studySubTab,
      dailySubTab,
      islamicSubTab,
      moneySubTab,
      selectedSyllabusSubjectId,
      isSettingsOpen,
      navigateTo,
      toggleLanguage,
      setLanguage,
      setTheme,
      checkExistingAccount,
      completeOnboarding,
      resetPinAfterOtp,
      unlockApp,
      lockoutState,
      recordPinFailure,
      recordPinSuccess,
      logoutUser,
      deleteAccountAndData,
      clearDemoData,
      updateProfile,
      addOrUpdateSubject,
      deleteOrHideSubject,
      restoreSubject,
      updateChapter,
      addChapter,
      deleteOrHideChapter,
      restoreHiddenChapters,
      addStudySession,
      deleteStudySession,
      saveExam,
      deleteExam,
      saveRoutine,
      toggleRoutineDone,
      deleteRoutine,
      setRoutinesBulk,
      saveDailyReflection,
      setWeeklyReviewNote,
      setYearlyGoal,
      saveHabitDef,
      deleteHabitDef,
      toggleHabitToday,
      saveTask,
      toggleTaskDone,
      deleteTask,
      setWaterGlasses,
      addWorkoutLog,
      deleteWorkoutLog,
      setWorkoutRestDays,
      addWeightEntry,
      saveWord,
      deleteWord,
      importWordsBulk,
      reviewWordCard,
      recordQuizMistake,
      saveBook,
      deleteBook,
      addReadingLog,
      markStoryRead,
      saveSleepMood,
      saveJournalEntry,
      deleteJournalEntry,
      updateIbadahLog,
      updateIslamicState,
      saveExpense,
      deleteExpense,
      addCustomMoneyCategory,
      setCategoryBudget,
      saveSavingsGoal,
      deleteSavingsGoal,
      saveDebt,
      deleteDebt,
      updateTimer,
      timerFlashActive,
      dismissTimerFlash,
      toasts,
      showToast,
    ]
  );

  return <LifeTrackContext.Provider value={value}>{children}</LifeTrackContext.Provider>;
};

export function useLifeTrack(): LifeTrackContextValue {
  const ctx = useContext(LifeTrackContext);
  if (!ctx) throw new Error('useLifeTrack must be used inside LifeTrackProvider');
  return ctx;
}
