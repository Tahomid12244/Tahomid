import { AppDataSchema, ActiveTimerState, DailyIbadahLog, UserProfile } from '../types';
import { buildSuggestedSubjects } from './nctbCurriculum';
import { buildStarterVocabulary } from './starterData';

export const CURRENT_SCHEMA_VERSION = 2;

export function createDefaultTimer(kind: 'pomodoro' | 'workout' | 'reading', workMin = 25, breakMin = 5): ActiveTimerState {
  return {
    kind,
    isRunning: false,
    phase: 'work',
    workMinutes: workMin,
    breakMinutes: breakMin,
    startedAtMs: null,
    targetEndMs: null,
    remainingMsWhenPaused: workMin * 60 * 1000,
    subjectId: 'none',
    topic: '',
  };
}

export function createEmptyIbadahLog(date: string): DailyIbadahLog {
  return {
    date,
    fard: {
      fajr: 'none',
      dhuhr: 'none',
      asr: 'none',
      maghrib: 'none',
      isha: 'none',
    },
    sunnahNafl: false,
    witr: false,
    tahajjud: false,
    duha: false,
    tilawatPages: 0,
    morningAdhkar: false,
    eveningAdhkar: false,
    istighfarCount: 0,
    duroodCount: 0,
    sadaqahDone: false,
    jumuahSunnahs: [],
    fastingDone: false,
    taraweehDone: false,
  };
}

export function createDefaultAppData(): AppDataSchema {
  const today = new Date().toISOString().slice(0, 10);
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    isDemoDataLoaded: false,
    profile: null,
    subjects: [],
    hscArchive: [],
    studySessions: [],
    exams: [],
    routines: [],
    dailyReflections: {},
    weeklyReviewNote: '',
    yearlyGoals: {},
    habits: [
      { id: 'hab_fajr', bn: 'ফজরের পর পড়াশোনা', en: 'Study after Fajr', icon: 'Sunrise', color: '#059669' },
      { id: 'hab_revision', bn: 'দৈনিক রিভিশন', en: 'Daily Revision', icon: 'BookCheck', color: '#2563eb' },
      { id: 'hab_quran', bn: 'কুরআন তিলাওয়াত', en: 'Quran Recitation', icon: 'BookOpen', color: '#d97706' },
      { id: 'hab_exercise', bn: 'শারীরিক ব্যায়াম', en: 'Daily Exercise', icon: 'Dumbbell', color: '#0d9488' },
    ],
    habitLogs: {},
    tasks: [],
    waterLogs: {},
    workoutLogs: [],
    workoutRestDays: [5], // Friday default rest day
    weightLogs: [],
    words: buildStarterVocabulary(),
    quizMistakes: [],
    books: [],
    readingLogs: [],
    readStories: [],
    sleepMoodLogs: {},
    journalEntries: [],
    ibadahLogs: {},
    islamicState: {
      qazaPrayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 },
      qazaFasts: 0,
      tasbihCount: 0,
      tasbihGoal: 100,
      tasbihPhraseIndex: 0,
      completedParas: [],
      currentQuranPage: 1,
      khatamTargetDays: 30,
      ramadanFasts: {},
      ramadanTaraweeh: {},
      laylatulQadrChecks: {},
      zakatRates: {
        goldPerGram: 11200,
        silverPerGram: 185,
        fitrahPerPerson: 115,
        lastUpdated: today,
      },
      islamicEvents: [],
    },
    expenses: [],
    customMoneyCategories: [],
    categoryBudgets: {
      Food: 3500,
      Transport: 1500,
      Education: 2500,
      Bills: 1000,
    },
    savingsGoals: [],
    debts: [],
    xp: {
      totalXp: 0,
      dailyEarned: {},
      reviewedCardsToday: {},
    },
    activeTimers: {
      pomodoro: createDefaultTimer('pomodoro', 25, 5),
      workout: createDefaultTimer('workout', 10, 1),
      reading: createDefaultTimer('reading', 20, 5),
    },
  };
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function deepMergeWithDefaults<T>(defaults: T, saved: unknown): T {
  if (saved === undefined || saved === null) return defaults;
  if (Array.isArray(defaults)) {
    return (Array.isArray(saved) ? saved : defaults) as unknown as T;
  }
  if (isPlainObject(defaults) && isPlainObject(saved)) {
    const out: Record<string, unknown> = { ...defaults };
    for (const key of Object.keys(saved)) {
      if (key in defaults && isPlainObject((defaults as Record<string, unknown>)[key])) {
        out[key] = deepMergeWithDefaults((defaults as Record<string, unknown>)[key], saved[key]);
      } else if (saved[key] !== undefined) {
        out[key] = saved[key];
      }
    }
    return out as T;
  }
  return (saved as T) ?? defaults;
}

export function migrateAppData(raw: unknown): AppDataSchema {
  const defaults = createDefaultAppData();
  if (!isPlainObject(raw)) return defaults;

  const merged = deepMergeWithDefaults(defaults, raw);

  // Ensure words starter pack exists if empty
  if (!Array.isArray(merged.words) || merged.words.length === 0) {
    merged.words = buildStarterVocabulary();
  }

  // Ensure activeTimers always have safe numbers
  for (const k of ['pomodoro', 'workout', 'reading'] as const) {
    if (!merged.activeTimers[k]) {
      merged.activeTimers[k] = createDefaultTimer(k);
    }
  }

  // Ensure profile goals exist if profile is set
  if (merged.profile) {
    merged.profile.goals = deepMergeWithDefaults(
      {
        dailyStudyHours: 4,
        dailyWaterGlasses: 8,
        dailyWorkoutMinutes: 20,
        dailyVocabWords: 10,
        dailyReadingPages: 15,
        yearlyBooksGoal: 12,
        examDate: '',
        examTitle: '',
      },
      merged.profile.goals
    );
  }

  merged.schemaVersion = CURRENT_SCHEMA_VERSION;
  return merged;
}

export function injectSampleDemoData(base: AppDataSchema, profile: UserProfile): AppDataSchema {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10);

  const subjects =
    base.subjects.length > 0
      ? base.subjects
      : buildSuggestedSubjects(profile.classLevel, profile.academicGroup, profile.isStudent);

  // Give slight sample progress on first chapter if chapters exist
  const demoSubjects = subjects.map((s, idx) => {
    if (idx === 0 && s.chapters.length > 0) {
      const updatedCh = s.chapters.map((c, cIdx) =>
        cIdx === 0
          ? { ...c, totalClasses: 10, completedClasses: 5, cqSolved: true, mcqSolved: true }
          : c
      );
      return { ...s, chapters: updatedCh };
    }
    return s;
  });

  const firstSubjId = demoSubjects[0]?.id || 'none';
  const lang = profile.language;

  return {
    ...base,
    isDemoDataLoaded: true,
    profile: {
      ...profile,
      goals: {
        ...profile.goals,
        examDate: profile.goals.examDate || nextMonth,
        examTitle: profile.goals.examTitle || (lang === 'bn' ? 'সাময়িক পরীক্ষা' : 'Term Examination'),
      },
    },
    subjects: demoSubjects,
    studySessions: [
      {
        id: 'demo_ss_1',
        subjectId: firstSubjId,
        topic: lang === 'bn' ? 'অধ্যায় ১ অনুশীলন' : 'Chapter 1 Practice',
        durationMinutes: 50,
        date: today,
        startedAt: new Date().toISOString(),
        source: 'timer',
      },
      {
        id: 'demo_ss_2',
        subjectId: firstSubjId,
        topic: lang === 'bn' ? 'বিগত বছরের প্রশ্ন' : 'Past Paper Questions',
        durationMinutes: 45,
        date: yesterday,
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'manual',
      },
    ],
    tasks: [
      {
        id: 'demo_task_1',
        title: lang === 'bn' ? 'গণিত নোট রিভিশন দেওয়া' : 'Revise Mathematics Notes',
        category: 'study',
        date: today,
        time: '19:00',
        priority: 'high',
        repeat: 'none',
        reminderTime: '18:45',
        done: false,
        subtasks: [],
      },
    ],
    routines: [
      {
        id: 'demo_rt_1',
        title: lang === 'bn' ? 'সকালের পড়াশোনা ব্লক' : 'Morning Focus Study Block',
        routineType: 'study',
        subjectId: firstSubjId,
        date: today,
        repeat: 'daily',
        startTime: '06:30',
        endTime: '08:00',
        reminderTime: '06:25',
        done: true,
        progress: 100,
      },
      {
        id: 'demo_rt_2',
        title: lang === 'bn' ? 'সাপ্তাহিক বাজেট পর্যালোচনা' : 'Weekly Budget Review',
        routineType: 'money',
        subjectId: 'none',
        date: today,
        repeat: 'weekly',
        startTime: '21:00',
        endTime: '21:30',
        reminderTime: '20:55',
        done: false,
        progress: 0,
      },
    ],
    habitLogs: {
      [today]: { hab_fajr: true, hab_quran: true },
    },
    waterLogs: {
      [today]: 5,
    },
    workoutLogs: [
      {
        id: 'demo_wo_1',
        exerciseKey: 'stretching',
        mode: 'duration',
        sets: 1,
        reps: 0,
        durationMinutes: 15,
        distanceKm: 0,
        calories: 48,
        date: today,
      },
    ],
    books: [
      {
        id: 'demo_book_1',
        title: lang === 'bn' ? 'অধ্যবসায়ের গল্প' : 'Atomic Focus Habits',
        author: lang === 'bn' ? 'আনোয়ার হোসেন' : 'R. Karim',
        bookType: lang === 'bn' ? 'আত্মউন্নয়ন' : 'Self-Improvement',
        language: lang,
        totalPages: 180,
        pagesRead: 45,
        coverEmoji: '📘',
        coverColor: '#059669',
        status: 'reading',
        rating: 5,
        review: '',
        notes: '',
        quotes: [],
      },
    ],
    readingLogs: [
      {
        id: 'demo_rl_1',
        bookId: 'demo_book_1',
        pages: 12,
        minutes: 20,
        date: today,
      },
    ],
    expenses: [
      {
        id: 'demo_exp_1',
        txType: 'income',
        amount: 5000,
        category: 'Other',
        date: today,
        note: lang === 'bn' ? 'মাসিক হাতখরচ' : 'Monthly Allowance',
        paymentMethod: 'bkash',
        recurring: true,
      },
      {
        id: 'demo_exp_2',
        txType: 'expense',
        amount: 220,
        category: 'Education',
        date: today,
        note: lang === 'bn' ? 'খাতা ও কলম কেনা' : 'Notebooks & Pens',
        paymentMethod: 'cash',
        recurring: false,
      },
    ],
    exams: [
      {
        id: 'demo_exam_1',
        title: lang === 'bn' ? 'মডেল টেস্ট ১' : 'Model Test 1',
        subjectId: firstSubjId,
        date: yesterday,
        isModelTest: true,
        score: 82,
        maxScore: 100,
      },
    ],
  };
}

export function clearDemoDataFromState(state: AppDataSchema): AppDataSchema {
  // Strip demo_* items and reset chapter sample ticks while keeping user-created items & profile
  const cleanedSubjects = state.subjects.map((s, idx) => {
    if (idx === 0 && s.chapters.length > 0) {
      return {
        ...s,
        chapters: s.chapters.map((c, cIdx) =>
          cIdx === 0 && c.totalClasses === 10 && c.completedClasses === 5
            ? { ...c, totalClasses: 0, completedClasses: 0, cqSolved: false, mcqSolved: false }
            : c
        ),
      };
    }
    return s;
  });

  return {
    ...state,
    isDemoDataLoaded: false,
    subjects: cleanedSubjects,
    studySessions: state.studySessions.filter((x) => !x.id.startsWith('demo_')),
    tasks: state.tasks.filter((x) => !x.id.startsWith('demo_')),
    routines: state.routines.filter((x) => !x.id.startsWith('demo_')),
    workoutLogs: state.workoutLogs.filter((x) => !x.id.startsWith('demo_')),
    books: state.books.filter((x) => !x.id.startsWith('demo_')),
    readingLogs: state.readingLogs.filter((x) => !x.id.startsWith('demo_')),
    expenses: state.expenses.filter((x) => !x.id.startsWith('demo_')),
    exams: state.exams.filter((x) => !x.id.startsWith('demo_')),
    habitLogs: {},
    waterLogs: {},
  };
}
