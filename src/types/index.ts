export type Language = 'bn' | 'en';
export type ThemeMode = 'dark' | 'light';
export type CurrencySymbol = '৳' | '$' | '€' | '£' | 'SAR' | '₹';
export type MainTab = 'home' | 'study' | 'daily' | 'islamic' | 'money';

export type ClassLevel =
  | '6'
  | '7'
  | '8'
  | '9'
  | '10_ssc'
  | '11'
  | '12_hsc'
  | 'admission'
  | 'university'
  | 'other'
  | '';

export type AcademicGroup = 'science' | 'commerce' | 'humanities' | '';

export interface BilingualText {
  bn: string;
  en: string;
}

export interface UserGoals {
  dailyStudyHours: number;
  dailyWaterGlasses: number;
  dailyWorkoutMinutes: number;
  dailyVocabWords: number;
  dailyReadingPages: number;
  yearlyBooksGoal: number;
  examDate: string;
  examTitle: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | '';
  district: string;
  isStudent: boolean;
  classLevel: ClassLevel;
  academicGroup: AcademicGroup;
  batch: string;
  institution: string;
  rollId: string;
  occupation: string;
  customOccupation?: string;
  organization: string;
  emailOrPhone: string;
  language: Language;
  theme: ThemeMode;
  currency: CurrencySymbol;
  goals: UserGoals;
  hijriAdjustment: -1 | 0 | 1;
  pinHash: string;
  pinSalt: string;
  biometricCredentialId?: string;
  consent: boolean;
  religionSubjectChoice?: string;
  optionalSixthChoice?: string;
  customSehriTime?: string;
  customIftarTime?: string;
  createdAt: string;
  lastLogin: string;
}

export interface ChapterItem {
  id: string;
  no: number;
  paper: 1 | 2;
  bn: string;
  en: string;
  preloaded: boolean;
  hidden: boolean;
  totalClasses: number;
  completedClasses: number;
  cqSolved: boolean;
  mcqSolved: boolean;
  admissionPyq: boolean;
  otherProblems: boolean;
  examDone: boolean;
  mistakesCorrected: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: string;
}

export interface SubjectItem {
  id: string;
  key: string;
  bn: string;
  en: string;
  color: string;
  icon: string;
  hasTwoPapers: boolean;
  preloaded: boolean;
  hidden: boolean;
  archived: boolean;
  chapters: ChapterItem[];
}

export interface StudySession {
  id: string;
  subjectId: string; // 'none' or subject.id
  topic: string;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO
  source: 'timer' | 'manual';
}

export interface ExamItem {
  id: string;
  title: string;
  subjectId: string;
  date: string;
  isModelTest: boolean;
  score?: number;
  maxScore?: number;
}

export interface RoutineItem {
  id: string;
  title: string;
  routineType: 'study' | 'daily' | 'money';
  subjectId: string;
  date: string; // YYYY-MM-DD or ''
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for fixed weekly class/coaching
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  reminderTime: string; // HH:mm
  done: boolean;
  progress: number; // 0-100
  isCoaching?: boolean;
}

export interface DailyReflection {
  date: string;
  priorities: [string, string, string];
  reflection: string;
}

export interface HabitDefinition {
  id: string;
  bn: string;
  en: string;
  icon: string;
  color: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  category: 'study' | 'home' | 'personal' | 'coaching' | 'other';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  priority: 'high' | 'medium' | 'low';
  repeat: 'none' | 'daily' | 'weekly';
  reminderTime: string;
  done: boolean;
  subtasks: SubTask[];
}

export interface WorkoutLog {
  id: string;
  exerciseKey: string;
  customExerciseName?: string;
  mode: 'reps' | 'duration' | 'distance';
  sets: number;
  reps: number;
  durationMinutes: number;
  distanceKm: number;
  calories: number;
  date: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  heightCm: number;
}

export interface VocabWord {
  id: string;
  word: string;
  bnMeaning: string;
  enMeaning: string;
  partOfSpeech: string;
  example: string;
  tag: 'SSC' | 'HSC' | 'Admission' | 'IELTS' | 'General';
  difficulty: 'easy' | 'medium' | 'hard';
  reviewed: boolean;
  intervalDays: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedDate?: string;
}

export interface BookEntry {
  id: string;
  title: string;
  author: string;
  bookType: string;
  language: 'bn' | 'en' | 'ar';
  totalPages: number;
  pagesRead: number;
  coverEmoji: string;
  coverColor: string;
  status: 'want' | 'reading' | 'finished';
  rating: number;
  review: string;
  notes: string;
  quotes: string[];
}

export interface ReadingLog {
  id: string;
  bookId: string;
  pages: number;
  minutes: number;
  date: string;
}

export interface SleepMoodLog {
  date: string;
  sleepHours: number;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
}

export type PrayerStatus = 'none' | 'ontime' | 'jamaat' | 'qaza';

export interface DailyIbadahLog {
  date: string;
  fard: {
    fajr: PrayerStatus;
    dhuhr: PrayerStatus;
    asr: PrayerStatus;
    maghrib: PrayerStatus;
    isha: PrayerStatus;
  };
  sunnahNafl: boolean;
  witr: boolean;
  tahajjud: boolean;
  duha: boolean;
  tilawatPages: number;
  morningAdhkar: boolean;
  eveningAdhkar: boolean;
  istighfarCount: number;
  duroodCount: number;
  sadaqahDone: boolean;
  jumuahSunnahs: string[];
  fastingDone?: boolean;
  taraweehDone?: boolean;
}

export interface IslamicTrackerState {
  qazaPrayers: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
    witr: number;
  };
  qazaFasts: number;
  tasbihCount: number;
  tasbihGoal: number;
  tasbihPhraseIndex: number;
  completedParas: number[]; // 1..30
  currentQuranPage: number;
  khatamTargetDays: number;
  ramadanFasts: Record<number, boolean>; // 1..30
  ramadanTaraweeh: Record<number, boolean>;
  laylatulQadrChecks: Record<string, boolean>;
  zakatRates: {
    goldPerGram: number;
    silverPerGram: number;
    fitrahPerPerson: number;
    lastUpdated: string;
  };
  islamicEvents: {
    id: string;
    title: string;
    calendarType: 'gregorian' | 'hijri';
    dateKey: string; // YYYY-MM-DD or H-MM-DD
  }[];
}

export interface ExpenseRecord {
  id: string;
  txType: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note: string;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'card' | 'bank';
  recurring: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
}

export interface DebtRecord {
  id: string;
  person: string;
  debtType: 'i_owe' | 'owed_to_me';
  amount: number;
  dueDate: string;
  note: string;
  settled: boolean;
}

export interface ActiveTimerState {
  kind: 'pomodoro' | 'workout' | 'reading';
  isRunning: boolean;
  phase: 'work' | 'break';
  workMinutes: number;
  breakMinutes: number;
  startedAtMs: number | null;
  targetEndMs: number | null;
  remainingMsWhenPaused: number;
  subjectId: string;
  topic: string;
  bookId?: string;
  workoutLabel?: string;
}

export interface XPState {
  totalXp: number;
  dailyEarned: Record<string, Record<string, number>>; // date -> category -> xp
  reviewedCardsToday: Record<string, string[]>; // date -> wordIds
}

export interface AppDataSchema {
  schemaVersion: number;
  isDemoDataLoaded: boolean;
  profile: UserProfile | null;
  subjects: SubjectItem[];
  hscArchive: SubjectItem[]; // Archived HSC subjects if user leaves Class 11/12 and comes back
  studySessions: StudySession[];
  exams: ExamItem[];
  routines: RoutineItem[];
  dailyReflections: Record<string, DailyReflection>;
  weeklyReviewNote: string;
  yearlyGoals: Record<number, string>; // month 0-11 -> goal text
  habits: HabitDefinition[];
  habitLogs: Record<string, Record<string, boolean>>; // date -> habitId -> done
  tasks: TaskItem[];
  waterLogs: Record<string, number>; // date -> glasses
  workoutLogs: WorkoutLog[];
  workoutRestDays: number[]; // 0-6
  weightLogs: WeightEntry[];
  words: VocabWord[];
  quizMistakes: string[];
  books: BookEntry[];
  readingLogs: ReadingLog[];
  readStories: string[];
  sleepMoodLogs: Record<string, SleepMoodLog>;
  journalEntries: JournalEntry[];
  ibadahLogs: Record<string, DailyIbadahLog>;
  islamicState: IslamicTrackerState;
  expenses: ExpenseRecord[];
  customMoneyCategories: string[];
  categoryBudgets: Record<string, number>;
  savingsGoals: SavingsGoal[];
  debts: DebtRecord[];
  xp: XPState;
  activeTimers: {
    pomodoro: ActiveTimerState;
    workout: ActiveTimerState;
    reading: ActiveTimerState;
  };
}
