Build a complete, production-quality, mobile-first web app called "LifeTrack" for students in Bangladesh (Class 6 to university and admission candidates) and general users. It combines a study planner, daily life tracker, Islamic life, and money management. Use React + TypeScript + Tailwind + Recharts + lucide-react, with Firebase Authentication and Cloud Firestore for login and cloud storage. Design for a 360px-wide phone first.

========== GLOBAL RULES ==========
- ONE LANGUAGE AT A TIME: Bangla (default) or English, chosen by a header toggle. All strings live in one i18n object (bn/en keys). Never show Bangla and English together in a label, placeholder, subtitle, or preset. Use Bangla numerals in Bangla mode. Fonts: Hind Siliguri (Bangla), Amiri (Arabic). This also applies to the built-in HSC chapter names: each chapter stores separate bn and en fields and only the selected language is shown.
- THEME: two separate selectable options, "ডার্ক / Dark" (moon) and "লাইট / Light" (sun), default Dark. Tailwind dark mode with the `dark` class on <html>. Use theme tokens everywhere (no hard-coded dark colors). Check contrast of every screen in both themes. Palette: deep green (#059669) + gold accents, rounded cards, soft shadows, smooth animations. Add subtle Islamic geometric patterns in the Islamic section only.
- LAYOUT: bottom navigation (Home, Study, Daily, Islamic Life, Money). Sticky header with app name (no "PRO" badge), Gregorian + Hijri date, language toggle showing the language it switches to, theme icon, settings. Header uses padding-top: env(safe-area-inset-top) and can grow to two lines without clipping. Every page has 96px bottom padding. The floating "+" quick-add button sits above the bottom nav and never covers content. Quick-add items: Start timer, Add task, Log study, Add expense, Log workout, Add word, Log reading.
- SUB-TAB BAR: one reusable <SubTabBar /> for every section: horizontally scrollable pills (flex, overflow-x:auto, nowrap, flex-shrink:0, hidden scrollbar, scroll-snap), min-height 44px, rounded-full, lucide icon + short one-language label, active tab solid green with white bold text, tapped tab scrolls to center, edge fade gradients, sticky below the header.
- SINGLE SOURCE OF TRUTH: one shared context/store for subjects, profile, settings, and logs. Never duplicate data between sections.
- DATA SAFETY: deep-merge saved data with the default schema on load so missing keys get safe defaults (never crash on undefined); add schemaVersion and a migration function. localStorage is an offline cache; sync to Firestore when online.
- TIMERS: all timers (Pomodoro, workout, reading) store start/end timestamps and compute remaining time from Date.now() on every tick and on visibilitychange, so they stay accurate when the phone locks. Play a chime on user gesture, vibrate only if supported, and show a visible flash as fallback.
- Loading, empty, offline, and error states in the selected language. Validate all inputs. No API keys visible in the UI. Include sample demo data after onboarding with a "Clear demo data" button.

========== 1) LOGIN, ONBOARDING & SECURITY ==========
Login screen: logo, tagline, language toggle, one input "Email or Phone" (auto-detect; phone default +880, validate 01XXXXXXXXX), Continue button.
- New account -> OTP -> profile setup -> create 5-digit PIN. Existing account -> enter the 5-digit PIN on a large numeric keypad. "Forgot PIN?" -> OTP again -> new PIN.
- OTP (first time only): phone via Firebase Phone Auth with invisible reCAPTCHA; email via a 6-digit code (Firebase email verification, or EmailJS/Cloud Function). 6-box input, auto-focus, auto-submit, paste support, 60s resend timer, max 5 attempts.
- Profile setup (one time, step-by-step with progress dots): full name, age (5-80), "Are you a student?" Yes/No.
  - Yes: Class (6, 7, 8, 9, 10 SSC, 11, 12 HSC, Admission candidate, University, Other), group (Science/Commerce/Humanities for class 9-12), institution, optional roll/ID. For Class 11 and 12 (HSC) also ask an optional "HSC batch/year" field (free text, no default value and no fixed batch name; the student types their own, whatever their batch is).
  - No: occupation (Job / Business / Housewife / Freelancer / Teacher / Unemployed / Other with text box), organization.
  - Gender (optional), district (64 districts), required consent checkbox with a short privacy note.
- PIN: set and confirm 5 digits, block weak PINs (00000, 12345, 11111, 54321, repeated or sequential). Do NOT use the raw PIN as the Firebase password. Store a salted PBKDF2 hash (Web Crypto, random salt, many iterations) and compare hashes. Never store or log the plain PIN. Lock 5 minutes after 5 wrong attempts, longer after repeated lockouts; store the lockout counter where the client cannot freely reset it (Firestore rules allowing only increments, or a Cloud Function). Treat the PIN as an app-lock only; Firebase OTP login is the real authentication. Show the PIN lock on app open and after 5 minutes in the background. Optional biometric unlock (WebAuthn).
- Cloud structure: users/{uid} holds profile and settings only (name, age, gender, district, isStudent, classLevel, academicGroup, batch, institution, rollId, occupation, organization, emailOrPhone, language, theme, currency, goals, hijriAdjustment, pinHash, pinSalt, consent, createdAt, lastLogin). Logs go in subcollections (users/{uid}/studySessions, workoutLogs, words, books, readingLogs, expenses, habitLogs, chapterProgress, routines), one document per entry, chapter, or day. Firestore rules: allow read, write only if request.auth != null && request.auth.uid == userId, including subcollections. Show the final rules.

========== 2) SETTINGS & PROFILE ==========
Collapsible sections (one-language headings): Profile, Appearance & Language, Islamic Life & Prayer, Study, Money, Account & Security.
- Profile edits ALL signup fields (including Batch) from the same single profile object, plus daily study goal (hours) and exam date. Email/phone shown read-only as verified. Avatar with initials. Save button with success message. Changing class/group asks "Update your subject list?" and refreshes subjects. Moving INTO HSC loads the HSC tracker; moving OUT of HSC archives (never deletes) the HSC progress so it returns if the user comes back.
- Appearance: Dark/Light two-option control, language, currency (৳ $ € £ SAR ₹).
- Account: Change PIN (ask current first), Export my data (JSON), Logout, Delete my account and all data (with confirmation).

========== 3) HOME ==========
Greeting with name, today's Gregorian + Hijri date, exam countdown, today's schedule, tasks due, study hours vs goal, next prayer countdown, today's spending and balance, habits done (x/y), compact cards for workout minutes, words reviewed, and pages read vs goals, word of the day, daily motivational quote, quick buttons (Start timer, Add task, Log study).
- HSC CARD (only for Class 11/12 users): "Overall HSC preparation %" with a progress bar, plus the weakest subject (lowest %, or the most Not Started chapters). Tapping the card opens that subject in Study > Syllabus.

========== 4) STUDY (sub-tabs: Timer, Logs, Syllabus, Planner, Progress, Exams) ==========
- SUBJECTS:
  - HSC (Class 11 and 12), Science group: PRELOADED subjects Physics, Chemistry, Mathematics, Biology (each with 1st Paper and 2nd Paper and the full chapter list in section 8), plus Bangla 1st & 2nd, English 1st & 2nd, and ICT. Bangla, English and ICT start with NO chapters: the student writes their own. The student can HIDE any subject (for example Biology or Mathematics) but not delete the preloaded ones.
  - HSC Commerce and Humanities: subjects from the lists below (plus Bangla 1st & 2nd, English 1st & 2nd, ICT), same tracker screen, but NO preloaded chapters. The student writes their own syllabus.
  - ALL OTHER CLASSES (6-10, Admission candidate, University, Other, non-students): there is NO default syllabus. Only the subject NAMES are suggested from the lists below, with an EMPTY chapter list. The student writes their own chapters/topics. If they do not want a suggested subject they can hide or delete it, and they can create new subjects. If the list becomes empty, show an "Add your first subject" empty state.
  - Suggested subject names by class:
    - Class 6-8: Bangla, English, Mathematics, Science, Bangladesh & Global Studies, Religion & Moral Education (user selects religion), ICT, Agriculture/Home Science (user selects), Arts & Culture, Physical Education & Health.
    - Class 9-10 common: Bangla 1st & 2nd, English 1st & 2nd, General Mathematics, Religion & Moral Education, ICT, Bangladesh & Global Studies, Physical Education. Science: Physics, Chemistry, Biology, Higher Mathematics. Humanities: Geography & Environment, Civics & Citizenship, Economics, History of Bangladesh & World Civilization. Commerce: Accounting, Business Entrepreneurship, Finance & Banking, Production Management & Marketing.
    - Class 11-12 common: Bangla 1st & 2nd, English 1st & 2nd, ICT. Science: Physics, Chemistry, Mathematics, Biology 1st & 2nd. Commerce: Accounting 1st & 2nd, Business Organization & Management, Production Management & Marketing, Finance Banking & Insurance. Humanities: Economics, Civics & Good Governance, Islamic History & Culture, Logic, Sociology, Social Work, Geography (pick 3-4).
    - University/other/no class: Bangla, English, Mathematics, Science, ICT, Religion, Bangladesh & Global Studies, all editable.
  - Each subject has bilingual names (stored as bn and en, shown one at a time), a color, an icon, and an editable chapter list. Users can add, rename, hide, or delete subjects and chapters they created themselves. Preloaded HSC chapters can only be hidden (with a "Show hidden chapters" option to restore).
  - When class/group changes: reuse subjects with the same name, add new ones, and ARCHIVE (never delete) old subjects that have logs or progress, so Logs and Progress keep their data.
- TIMER: Pomodoro presets 25/5, 50/10, 90/15 plus custom. "Link session to subject" is a controlled picker (bottom sheet on mobile, 48px rows, color dot): first "কোনো বিষয় নয়", then the user's active subjects, last "+ নতুন বিষয় যোগ করুন". The selection must not reset on timer ticks, and the last choice is remembered. Add a topic/goal field. Sessions of 1 minute or more are saved with subject, topic, duration, and time.
- LOGS: manual and timer logs, filter by subject/date, archived subjects still shown.
- SYLLABUS: subject tabs, then a 1st Paper / 2nd Paper toggle, then collapsible chapter cards with a small progress ring. Every chapter (preloaded or user-written) uses the TRACKER MODEL below, plus optional notes and difficulty. Weak-subject marker.
  - TRACKER MODEL, fields per chapter: Total Classes (whole number > 0), Classes Completed (whole number, 0 to Total, never above Total), and tick-boxes: CQ Solved, MCQ Solved, Admission PYQs Solved, Other Problems, Exam, Mistakes Corrected. Tick each task only after finishing it for the whole chapter.
  - Chapter progress % = Classes (Completed / Total x 35, max 35, 0 if Total is empty) + CQ 20 + MCQ 10 + Admission PYQs 10 + Other Problems 10 + Exam 10 + Mistakes Corrected 5. Result 0 to 100%.
  - Status: 0% = Not Started (শুরু হয়নি), 100% = Completed (সম্পন্ন), anything between = In Progress (চলমান).
  - Subject card: total chapters, completed, in progress, not started, Subject Preparation % (average of its chapters across both papers, ignoring hidden chapters), a progress bar, and the 1st Paper and 2nd Paper % shown separately. Blank or hidden chapters do not affect progress.
  - Overall HSC Preparation % (HSC users only) = average of the subject percentages, equal weight, counting only visible subjects that have at least one chapter.
  - Header fields (HSC users): Student Name and Student ID come from the profile (name and roll/ID, do not duplicate), Batch from the profile (shown only if the student filled it in). The tracker works the same for every HSC batch, current or future.
- PLANNER: a type filter at the top (Study / Daily life / Money / All). ALL users, in every class and occupation, can create routines of any type in four views: Yearly (12-month overview with goals, exams, holidays), Monthly (calendar with targets, exams, model tests, Hijri date shown under each day, color-coded by subject or type), Weekly (7-day timetable, weekly goal vs hours, review box), Daily (hour-by-hour time blocks for study + general work, top 3 priorities, reflection). A routine item has title, type (Study / Daily life / Money), date or repeat, reminder time, done/not done and a progress %, stored in one routines collection that Daily > Routine and Money also read (no duplicates). Prayer times appear as fixed blocks. "Generate plan" spreads remaining chapters over the weeks left before the exam based on daily study hours (uses the tracker's incomplete chapters). "Copy last week's plan". Fixed weekly class/coaching routine.
- PROGRESS: hours per day/week/month, hours per subject (pie), syllabus % (the tracker %), streak, monthly heatmap, "On track / Behind" status.
- EXAMS: countdown, date, subject, model tests with scores and a score trend chart.

========== 5) DAILY (sub-tabs in this order: Habits, Routine, Water, Workout, Vocabulary, Storybook, Sleep & Mood, Journal, Badges) ==========
- HABITS: custom habits with daily checkboxes, streaks, monthly heatmap. Tasks for general daily work: title, category (Study/Home/Personal/Coaching/Other), date/time, priority, repeat, subtasks, in-app reminders, Today/Upcoming/Completed filters.
- ROUTINE: time-blocked day planner (shows the Daily life routines from the shared routines collection).
- WATER: glass counter with daily goal.
- WORKOUT: exercise library (Push-ups, Squats, Plank, Sit-ups, Jumping jacks, Lunges, Burpees, Skipping, Running, Walking, Stretching, Yoga, Cycling, Swimming) plus custom; modes: sets x reps, duration, distance. Session log, total minutes, estimated calories (labeled "আনুমানিক"). Quick routines (5-minute morning stretch, 10-minute home workout, study-break desk exercise) with exercise and rest timers. Weekly plan with rest days, daily goal, streak, weekly chart, heatmap. Weight log, chart, and BMI ONLY for users aged 18 or older; for under 18 show activity minutes and streaks only. Safety note: stop if pain or unwell and consult a doctor.
- VOCABULARY: add words (word, Bangla meaning, English meaning, part of speech, example, tags SSC/HSC/Admission/IELTS, difficulty). Starter pack of about 100 common SSC/HSC/admission words marked "reviewed: false", with a "Report wrong meaning" edit button. Word of the day. Flashcards with flip, "জানি" / "আবার দেখাও", spaced repetition (1, 3, 7, 14, 30 days), due-today count. Quiz mode (both directions) with score and mistakes list. English pronunciation via speechSynthesis (hide Bangla read-aloud if no Bangla voice exists). Search and filter, daily target, import/export CSV/JSON.
- STORYBOOK: personal library (title, author, type, language, total pages, cover emoji/color, status Want/Reading/Finished), reading log with pages and minutes, timer, per-book progress, daily goal, streak, yearly books goal, notes, favorite quotes, 1-5 star rating and review. 5 original short practice stories (3 Bangla, 2 simple English, 200-300 words each) with a reader view (font size, line height, light/dark/sepia), "mark as read", tap an English word to see its meaning from the vocabulary list or add it in one tap. Do not include copyrighted books.
- SLEEP & MOOD: sleep hours and mood log with weekly trend chart.
- JOURNAL: short daily note with date history.
- BADGES & XP: levels and badges. XP: +10 per workout, +5 per 10 words reviewed (each card counts once per day), +10 per reading session, plus study and habit XP. Daily XP cap per activity (for example max 30 for vocabulary), and only real logged activity earns XP. New badges: ফিটনেস স্টার / Fitness Star, শব্দ যোদ্ধা / Word Warrior, বইপোকা / Bookworm.

========== 6) ISLAMIC LIFE (sub-tabs: Prayer, Ibadah, Quran, Dua, Calendar, Qibla) ==========
- REAL HIJRI CALENDAR: compute from the real Umm al-Qura calendar with Intl.DateTimeFormat('en-u-ca-islamic-umalqura'). Never hard-code or fake the date. Moon-sighting adjustment setting with options "-১ দিন (বাংলাদেশে সাধারণত)", "০ দিন (সৌদি / উম্মুল কুরা)", "+১ দিন"; default -1 for Bangladesh users, changeable. IMPORTANT: this adjustment affects ONLY the Hijri date, Hijri calendar, White Days, Ramadan, and Eid countdowns. It must NOT change prayer times, Sehri, or Iftar.
- Hijri month names (Bangla/Arabic): মুহাররম, সফর, রবিউল আউয়াল, রবিউস সানি, জমাদিউল আউয়াল, জমাদিউস সানি, রজব, শাবান, রমজান, শাওয়াল, জিলকদ, জিলহজ. Monthly Hijri grid with the Gregorian date under each day. Auto-mark Ashura, Eid-e-Miladunnabi, Shab-e-Mi'raj, Shab-e-Barat, Ramadan start, Laylat al-Qadr nights, Eid-ul-Fitr, Arafah, Eid-ul-Adha, White Days (13-14-15), Monday/Thursday fasting reminders. Tap a date for meaning and recommended amal. Show Hijri dates inside all planners; events can be added by either calendar.
- PRAYER TIMES: Adhan.js (CDN) offline, with the Aladhan API as fallback. Setting label: "Karachi পদ্ধতি (ঢাকা / ইসলামিক ফাউন্ডেশন বাংলাদেশ)" / "Karachi method (Dhaka / Islamic Foundation Bangladesh)" with a helper line (Fajr and Isha 18°, Hanafi Asr), default for Bangladesh. Asr label "হানাফি (বাংলাদেশ মান)". District picker (all 64, GPS option) with per-district minute offsets from Dhaka (longitude-based) shown with a small note. Show Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, Sehri end, Iftar, makruh times, Tahajjud, Ishraq/Chasht, and a live countdown to the next prayer. Optional custom Sehri/Iftar times.
- IBADAH: 5 fard prayers (on time / qaza / jamaat), sunnah/nafl, witr, tahajjud, duha, tilawat, morning/evening adhkar, istighfar, durood, sadaqah. Heatmap, streaks, qaza prayer and fast counters, tasbih counter with goal and vibration.
- QURAN & DUA: para (juz) and page tracker with a 30-para progress bar and daily target calculator; optional surah reader via https://api.alquran.cloud (bn.bengali edition) with offline fallback; dua of the day (Arabic + Bangla pronunciation + Bangla meaning), daily and situational duas, Asmaul Husna with Bangla meaning.
- RAMADAN MODE: auto-activates in Ramadan: 30-day fasting tracker, Taraweeh, Sehri/Iftar timetable, Quran khatam planner, Laylat al-Qadr checklist, Eid countdown, Zakat calculator (editable gold/silver/fitrah rates with a "last updated" date and the note "আজকের বাজারদর অনুযায়ী আপডেট করুন", clear nisab calculation) and Fitrah calculator.
- QIBLA: compass using device orientation and location, with a fallback angle.
- Jumu'ah reminder with a sunnah checklist.

========== 7) MONEY (sub-tabs: Overview, Transactions, Budget, Goals, Reports) ==========
Add income/expense (amount, category, date, note, payment method incl. bKash/Nagad/Cash/Card). Default categories (Food, Transport, Education, Bills, Shopping, Health, Charity, Other) plus custom. Monthly budget per category with progress bars and warnings at 80% and 100%. Savings goals with deadlines. Debt/loan tracker (I owe / owed to me) with due dates. Reports: category pie chart, income vs expense bars, balance trend. Search and filter. Currency from settings (default ৳). Optional recurring transactions. Money-type routines created in Study > Planner (for example a weekly budget check or a monthly savings day) also appear here as reminders.

========== QUALITY BAR ==========
- No mixed languages, no overlapping or clipped text at 360px, no dead buttons, every feature persists after refresh, theme readable everywhere.
- Test: new user (OTP -> profile -> PIN -> home); returning user (PIN -> home); forgot PIN; wrong-PIN lockout; Class 10 Science subjects load in the dropdown; change to Commerce keeps old logs; old saved data without new keys does not crash; Hijri adjustment does not change prayer times; user A cannot read user B's data; timers stay accurate after the phone locks; offline then online sync; Light mode on every screen; Bangla mode with zero English leftovers.
- HSC tests: a Class 12 Science user sees Physics, Chemistry, Mathematics, Biology preloaded (75 chapters in total) and empty Bangla/English/ICT; a Class 8 user sees suggested subject names with NO chapters; chapter progress matches the formula (for example 5 of 10 classes done = 17.5%; all tasks ticked and all classes done = 100%); Completed can never exceed Total; hiding a preloaded chapter removes it from the % and it can be restored; switching language changes chapter names with no mixed Bangla/English; a Money-type weekly routine appears in both Planner and Money; moving out of HSC and back restores the progress.
- Organize code into separate components (types, utils/i18n, utils/nctbCurriculum, utils/hscSyllabus, context, components/common, components/modules/{study,daily,islamic,money}). Run lint and compile with 0 errors.

========== 8) DEFAULT HSC SYLLABUS DATA (Class 11/12 Science only) ==========
Put this in utils/hscSyllabus. Each chapter has bn and en names (show only the selected language). Chapter numbers restart in Paper 2. Biology Paper 1 is the Botany side and Paper 2 is the Zoology side. Keep names exactly as given. Do not add Bangla, English or ICT chapters; the student writes those.

```json
{
 "physics": {
  "paper1": [
   {
    "no": 1,
    "bn": "ভৌতজগত ও পরিমাপ",
    "en": "Physical World & Measurement"
   },
   {
    "no": 2,
    "bn": "ভেক্টর",
    "en": "Vector"
   },
   {
    "no": 3,
    "bn": "গতিবিদ্যা",
    "en": "Dynamics"
   },
   {
    "no": 4,
    "bn": "নিউটনীয় বলবিদ্যা",
    "en": "Newtonian Mechanics"
   },
   {
    "no": 5,
    "bn": "কাজ, ক্ষমতা ও শক্তি",
    "en": "Work, Power & Energy"
   },
   {
    "no": 6,
    "bn": "মহাকর্ষ ও অভিকর্ষ",
    "en": "Gravitation and Gravity"
   },
   {
    "no": 7,
    "bn": "পদার্থের গাঠনিক ধর্ম",
    "en": "Material's Structural Property"
   },
   {
    "no": 8,
    "bn": "পর্যাবৃত্ত গতি",
    "en": "Periodic Motion"
   },
   {
    "no": 9,
    "bn": "তরঙ্গ",
    "en": "Wave"
   },
   {
    "no": 10,
    "bn": "আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",
    "en": "Ideal Gas & Gas Kinematics"
   }
  ],
  "paper2": [
   {
    "no": 1,
    "bn": "তাপগতিবিদ্যা",
    "en": "Thermodynamics"
   },
   {
    "no": 2,
    "bn": "স্থির তড়িৎ",
    "en": "Static Electricity"
   },
   {
    "no": 3,
    "bn": "চলতড়িৎ",
    "en": "Current Electricity"
   },
   {
    "no": 4,
    "bn": "তড়িৎ প্রবাহের চুম্বকক্রিয়া",
    "en": "Magnetic Effects of Electric Current"
   },
   {
    "no": 5,
    "bn": "তাড়িত-চৌম্বক আবেশ",
    "en": "Electro-Magnetic Induction"
   },
   {
    "no": 6,
    "bn": "জ্যামিতিক আলোকবিজ্ঞান",
    "en": "Geometrical Optics"
   },
   {
    "no": 7,
    "bn": "ভৌত আলোকবিজ্ঞান",
    "en": "Physical Optics"
   },
   {
    "no": 8,
    "bn": "আধুনিক পদার্থবিজ্ঞান",
    "en": "Modern Physics"
   },
   {
    "no": 9,
    "bn": "পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান",
    "en": "Atomic Model & Nuclear Physics"
   },
   {
    "no": 10,
    "bn": "অর্ধ-পরিবাহী ও ইলেকট্রনিক্স",
    "en": "Semi-conductor & Electronics"
   },
   {
    "no": 11,
    "bn": "জ্যোতির্বিজ্ঞান",
    "en": "Astronomy"
   }
  ]
 },
 "chemistry": {
  "paper1": [
   {
    "no": 1,
    "bn": "ল্যাবরেটরির নিরাপদ ব্যবহার",
    "en": "Safe Use of Laboratory"
   },
   {
    "no": 2,
    "bn": "গুণগত রসায়ন",
    "en": "Qualitative Chemistry"
   },
   {
    "no": 3,
    "bn": "মৌলের পর্যাবৃত্তিক ধর্ম ও রাসায়নিক বন্ধন",
    "en": "Periodic Property of Elements & Chemical Bond"
   },
   {
    "no": 4,
    "bn": "রাসায়নিক পরিবর্তন",
    "en": "Chemical Change"
   },
   {
    "no": 5,
    "bn": "কর্মমূখী রসায়ন",
    "en": "Functional Chemistry"
   }
  ],
  "paper2": [
   {
    "no": 1,
    "bn": "পরিবেশ রসায়ন",
    "en": "Environment Chemistry"
   },
   {
    "no": 2,
    "bn": "জৈব রসায়ন",
    "en": "Organic Chemistry"
   },
   {
    "no": 3,
    "bn": "পরিমাণগত",
    "en": "Quantitative Chemistry"
   },
   {
    "no": 4,
    "bn": "তড়িৎ রসায়ন",
    "en": "Electro-Chemistry"
   },
   {
    "no": 5,
    "bn": "অর্থনৈতিক রসায়ন",
    "en": "Economical Chemistry"
   }
  ]
 },
 "mathematics": {
  "paper1": [
   {
    "no": 1,
    "bn": "ম্যাট্রিক্স ও নির্ণায়ক",
    "en": "Matrix & Determinant"
   },
   {
    "no": 2,
    "bn": "ভেক্টর",
    "en": "Vector"
   },
   {
    "no": 3,
    "bn": "সরলরেখা",
    "en": "Straight Line"
   },
   {
    "no": 4,
    "bn": "বৃত্ত",
    "en": "Circle"
   },
   {
    "no": 5,
    "bn": "বিন্যাস ও সমাবেশ",
    "en": "Permutation & Combination"
   },
   {
    "no": 6,
    "bn": "ত্রিকোনমিতিক অনুপাত",
    "en": "Trigonometric Ratio"
   },
   {
    "no": 7,
    "bn": "সংযুক্ত কোনের ত্রিকোনমিতিক অনুপাত",
    "en": "Trigonometrical Ratios of Associated Angles"
   },
   {
    "no": 8,
    "bn": "ফাংশন ও ফাংশনের লেখচিত্র",
    "en": "Function & Graphs of Function"
   },
   {
    "no": 9,
    "bn": "অন্তরীকরণ",
    "en": "Differentiation"
   },
   {
    "no": 10,
    "bn": "যোগজীকরণ",
    "en": "Integration"
   }
  ],
  "paper2": [
   {
    "no": 1,
    "bn": "বাস্তব সংখ্যা ও অসমতা",
    "en": "Real numbers and inequality"
   },
   {
    "no": 2,
    "bn": "যোগাশ্রয়ী প্রোগ্রাম",
    "en": "Linear Programming"
   },
   {
    "no": 3,
    "bn": "জটিল সংখ্যা",
    "en": "Complex Number"
   },
   {
    "no": 4,
    "bn": "বহুপদী ও বহুপদী সমীকরণ",
    "en": "Polynomial and polynomial equations"
   },
   {
    "no": 5,
    "bn": "দ্বিপদী বিস্তৃতি",
    "en": "Binomial expansion"
   },
   {
    "no": 6,
    "bn": "কনিক",
    "en": "Conic"
   },
   {
    "no": 7,
    "bn": "বিপরীত ত্রিকোনমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ",
    "en": "Reverse trigonometric functions and trigonometric equations"
   },
   {
    "no": 8,
    "bn": "স্থিতিবিদ্যা",
    "en": "Statics"
   },
   {
    "no": 9,
    "bn": "সমতলে বস্তুকনার গতি",
    "en": "Motion of Perticles on the plane"
   },
   {
    "no": 10,
    "bn": "বিস্তার পরিমাপ ও সম্ভাবনা",
    "en": "Measurement Of Dispersion and probability"
   }
  ]
 },
 "biology": {
  "paper1": [
   {
    "no": 1,
    "bn": "কোষ ও এর গঠন",
    "en": "Cell and its Structure"
   },
   {
    "no": 2,
    "bn": "কোষ বিভাজন",
    "en": "Cell Division"
   },
   {
    "no": 3,
    "bn": "কোষ রসায়ন",
    "en": "Cell Chemistry"
   },
   {
    "no": 4,
    "bn": "অণুজীব",
    "en": "Micro-Organisms"
   },
   {
    "no": 5,
    "bn": "শৈবাল ও ছত্রাক",
    "en": "Algae and fungi"
   },
   {
    "no": 6,
    "bn": "ব্রায়োফাইটা ও টেরেডোফাইটা",
    "en": "Bryophyta & Pteridophyta"
   },
   {
    "no": 7,
    "bn": "নগ্নবীজী ও আবৃতবীজী উদ্ভিদ",
    "en": "Angiosperm and Gymnosperm"
   },
   {
    "no": 8,
    "bn": "টিস্যু ও টিস্যুতন্ত্র",
    "en": "Tissue and Tissue System"
   },
   {
    "no": 9,
    "bn": "উদ্ভিদ শারীরতত্ত্ব",
    "en": "Plant Physiology"
   },
   {
    "no": 10,
    "bn": "উদ্ভিদ প্রজনন",
    "en": "Plant Reproduction"
   },
   {
    "no": 11,
    "bn": "জীবপ্রযুক্তি",
    "en": "Biotechnology"
   },
   {
    "no": 12,
    "bn": "জীবের পরিবেশ, বিস্তার ও সংরক্ষণ",
    "en": "Environment, Distribution and Conservation of Living Organisms"
   }
  ],
  "paper2": [
   {
    "no": 1,
    "bn": "প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস",
    "en": "Animal Diversity and Classification"
   },
   {
    "no": 2,
    "bn": "প্রাণীর পরিচিতি",
    "en": "Introduction to animal"
   },
   {
    "no": 3,
    "bn": "পরিপাক ও শোষণ",
    "en": "Digestion and Absorption"
   },
   {
    "no": 4,
    "bn": "রক্ত ও সংবহন",
    "en": "Blood and Circulation"
   },
   {
    "no": 5,
    "bn": "শ্বসন ও শ্বাসক্রিয়া",
    "en": "Respiration and its Process"
   },
   {
    "no": 6,
    "bn": "বর্জ্য ও নিষ্কাশন",
    "en": "Waste and Excretion"
   },
   {
    "no": 7,
    "bn": "চলন ও অঙগচালনা",
    "en": "Locomotion and Organ Movement"
   },
   {
    "no": 8,
    "bn": "সমন্বয় ও নিয়ন্ত্রণ",
    "en": "Co -Ordination and Control"
   },
   {
    "no": 9,
    "bn": "মানব জীবনের ধারাবাহিকতা",
    "en": "Continuity of Human life"
   },
   {
    "no": 10,
    "bn": "মানবদেহের প্রতিরক্ষা",
    "en": "Immunity Of Human Body"
   },
   {
    "no": 11,
    "bn": "জিনতত্ত্ব ও বিবর্তন",
    "en": "Genetics and Evolution"
   },
   {
    "no": 12,
    "bn": "প্রাণীর আচরণ",
    "en": "Animal Behaviour"
   }
  ]
 }
}
```

========== 9) POLISH & PRODUCTION CHECK (apply while building, then run as the final step) ==========
Rules for every step: never remove or rename an existing feature, tab, or saved data when adding something new; do not redesign finished screens; fix only what is broken.
- DATA SYNC: a change in one place updates every related screen immediately, with no refresh and no duplicates. Examples: a chapter tick or class count updates the chapter %, subject %, overall HSC % on Study, Progress and the Home card; a routine, task or habit appears once in every place that shows it; editing or deleting updates all views; double-tapping Save never creates two items. After refresh everything is still saved, and after offline use and reconnecting it syncs without loss or duplicates.
- STATES (selected language only): every list and screen has a friendly empty state with one clear button; loading skeletons or spinners wherever data is awaited; kind error messages that say what to do next (no raw error text); a short success toast after save, delete and complete; Undo for delete; a confirmation before anything destructive.
- MOBILE CHECK AT 360px, screen by screen: tap targets at least 44px with spacing; no clipped or overlapping text, no sideways scrolling, no overflowing cards; forms fit, the keyboard never hides the field or the Save button, number fields open the numeric keypad; the bottom nav and "+" button never cover content; calendar, tracker cards, charts and timers stay readable; check Bangla mode (longer text) and both Dark and Light themes on every screen.
- CONSISTENCY: buttons, cards, spacing, fonts, icons and form layouts look the same in every section. Animations are subtle and fast and respect "reduce motion".
- FINAL FEATURE-FREEZE REVIEW: add no new features. Find and fix broken buttons, dead links, console errors, layout bugs, missing validation, broken navigation and slow screens. Keep the first load fast and load screens lazily. Finish with a short list of what was found and fixed.

Build in this order and make each step work before the next: (1) foundation (theme, i18n, layout, SubTabBar, context, migration), (2) login + profile + PIN + Firestore, (3) Study (including the HSC tracker and routines), (4) Daily, (5) Islamic Life, (6) Money, (7) Home dashboard (including the HSC card), (8) the full polish and production check from section 9, then the tests.
