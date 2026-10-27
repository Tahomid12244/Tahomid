import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';
import { Language } from '../types';
import { toLocalDigits } from './i18n';
import { BD_DISTRICTS } from './nctbCurriculum';

export const HIJRI_MONTHS_BN = [
  'মুহাররম',
  'সফর',
  'রবিউল আউয়াল',
  'রবিউস সানি',
  'জমাদিউল আউয়াল',
  'জমাদিউস সানি',
  'রজব',
  'শাবান',
  'রমজান',
  'শাওয়াল',
  'জিলকদ',
  'জিলহজ',
];

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul Qadah',
  'Dhul Hijjah',
];

export interface HijriDateParts {
  day: number;
  month: number; // 1..12
  year: number;
  monthNameBn: string;
  monthNameEn: string;
}

/**
 * Computes real Umm al-Qura Hijri date using Intl.DateTimeFormat('en-u-ca-islamic-umalqura').
 * Moon-sighting adjustment (-1, 0, +1 days) shifts ONLY the Hijri date calculation,
 * NEVER affecting prayer times, Sehri, or Iftar.
 */
export function getHijriDateParts(gregorianDate: Date, adjustmentDays: number = -1): HijriDateParts {
  const shifted = new Date(gregorianDate.getTime() + adjustmentDays * 86400000);
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = fmt.formatToParts(shifted);
    let day = 1;
    let month = 1;
    let year = 1448;
    for (const p of parts) {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') month = parseInt(p.value, 10) || 1;
      if (p.type === 'year') year = parseInt(p.value.replace(/\D/g, ''), 10) || 1448;
    }
    const clampedMonth = Math.max(1, Math.min(12, month));
    return {
      day,
      month: clampedMonth,
      year,
      monthNameBn: HIJRI_MONTHS_BN[clampedMonth - 1],
      monthNameEn: HIJRI_MONTHS_EN[clampedMonth - 1],
    };
  } catch {
    return {
      day: 1,
      month: 1,
      year: 1448,
      monthNameBn: HIJRI_MONTHS_BN[0],
      monthNameEn: HIJRI_MONTHS_EN[0],
    };
  }
}

export function formatHijriDate(date: Date, adjustmentDays: number, lang: Language): string {
  const h = getHijriDateParts(date, adjustmentDays);
  const mName = lang === 'bn' ? h.monthNameBn : h.monthNameEn;
  const suffix = lang === 'bn' ? 'হিজরি' : 'AH';
  return `${toLocalDigits(h.day, lang)} ${mName} ${toLocalDigits(h.year, lang)} ${suffix}`;
}

export function formatShortHijri(date: Date, adjustmentDays: number, lang: Language): string {
  const h = getHijriDateParts(date, adjustmentDays);
  const mName = lang === 'bn' ? h.monthNameBn : h.monthNameEn;
  return `${toLocalDigits(h.day, lang)} ${mName}`;
}

export interface IslamicSpecialDay {
  key: string;
  bnTitle: string;
  enTitle: string;
  bnMeaning: string;
  enMeaning: string;
  bnAmal: string;
  enAmal: string;
}

export function getSpecialIslamicDay(gregorianDate: Date, adjustmentDays: number): IslamicSpecialDay[] {
  const h = getHijriDateParts(gregorianDate, adjustmentDays);
  const dow = gregorianDate.getDay(); // 1=Mon, 4=Thu, 5=Fri
  const events: IslamicSpecialDay[] = [];

  if (h.month === 1 && h.day === 10) {
    events.push({
      key: 'ashura',
      bnTitle: 'পবিত্র আশুরা',
      enTitle: 'Day of Ashura',
      bnMeaning: 'মুহাররমের ১০ তারিখ; নবী মুসা (আ.) ও তাঁর উম্মতের মুক্তির ঐতিহাসিক দিন।',
      enMeaning: '10th of Muharram; historic day of salvation for Prophet Musa (AS).',
      bnAmal: '৯ ও ১০ মুহাররম (অথবা ১০ ও ১১) নফল রোজা রাখা এবং বেশি বেশি তওবা ও ইস্তিগফার করা।',
      enAmal: 'Observe voluntary fasting on 9th & 10th (or 10th & 11th) Muharram and increase Istighfar.',
    });
  }
  if (h.month === 3 && h.day === 12) {
    events.push({
      key: 'miladunnabi',
      bnTitle: 'ঈদে মিলাদুন্নবী (সা.)',
      enTitle: 'Eid-e-Miladunnabi (SAW)',
      bnMeaning: 'মহানবী হযরত মুহাম্মদ (সা.)-এর জন্ম ও ওফাত দিবস।',
      enMeaning: 'Commemoration of the birth and life of Prophet Muhammad (SAW).',
      bnAmal: 'বেশি বেশি দরুদ শরিফ পাঠ, সীরাত অধ্যয়ন ও সুন্নাতের অনুসরণ।',
      enAmal: 'Send abundant Durood, study the Seerah, and practice the Sunnah.',
    });
  }
  if (h.month === 7 && h.day === 27) {
    events.push({
      key: 'miraj',
      bnTitle: 'শবে মেরাজ',
      enTitle: "Shab-e-Mi'raj",
      bnMeaning: 'মহানবী (সা.)-এর ঊর্ধ্বাকাশ ভ্রমণ ও পাঁচ ওয়াক্ত নামাজ ফরজ হওয়ার রজনী।',
      enMeaning: 'Night Journey and Ascension where the five daily prayers were enjoined.',
      bnAmal: 'পাঁচ ওয়াক্ত ফরজ নামাজের যত্ন নেওয়া, নফল ইবাদত ও দোয়া করা।',
      enAmal: 'Guard the five daily prayers with devotion, pray Nafl, and make sincere Dua.',
    });
  }
  if (h.month === 8 && h.day === 15) {
    events.push({
      key: 'barat',
      bnTitle: 'শবে বরাত',
      enTitle: 'Shab-e-Barat',
      bnMeaning: 'মধ্য শাবানের ক্ষমা ও মাগফিরাত প্রার্থনার রজনী।',
      enMeaning: 'Mid-Shaban night of seeking forgiveness and mercy.',
      bnAmal: 'নফল নামাজ, তওবা-ইস্তিগফার এবং আইয়ামে বীজের নফল রোজা রাখা।',
      enAmal: 'Sincere repentance, voluntary night prayer, and fasting the White Days.',
    });
  }
  if (h.month === 9 && h.day === 1) {
    events.push({
      key: 'ramadan_start',
      bnTitle: 'পবিত্র রমজান শুরু',
      enTitle: 'Start of Ramadan',
      bnMeaning: 'রহমত, মাগফিরাত ও নাজাতের মাস রমজানের সূচনা।',
      enMeaning: 'Beginning of the blessed month of fasting and Quran.',
      bnAmal: 'ফরজ রোজা, তারাবিহ, কুরআন তিলাওয়াত ও দান-সদকা বৃদ্ধি করা।',
      enAmal: 'Observe obligatory fasts, pray Taraweeh, recite Quran daily, and give charity.',
    });
  }
  if (h.month === 9 && h.day >= 21 && h.day % 2 === 1) {
    events.push({
      key: 'qadr',
      bnTitle: 'সম্ভাব্য লাইলাতুল কদর',
      enTitle: 'Odd Night of Laylat al-Qadr',
      bnMeaning: 'হাজার মাসের চেয়ে উত্তম রজনী অনুসন্ধানের বেজোড় রাত।',
      enMeaning: 'Odd night in the last ten nights of Ramadan, better than a thousand months.',
      bnAmal: 'রাত জেগে ইবাদত ও দোয়া: আল্লাহুম্মা ইন্নাকা আফুউন তুহিব্বুল আফওয়া ফাফু আন্নি।',
      enAmal: 'Night prayer, Quran recitation, and reciting: Allahumma innaka afuwwun tuhibbul afwa fafu anni.',
    });
  }
  if (h.month === 10 && h.day === 1) {
    events.push({
      key: 'eid_fitr',
      bnTitle: 'পবিত্র ঈদুল ফিতর',
      enTitle: 'Eid-ul-Fitr',
      bnMeaning: 'দীর্ঘ এক মাস সিয়াম সাধনার পর আনন্দের ঈদ।',
      enMeaning: 'Festival of breaking the fast after completing Ramadan.',
      bnAmal: 'ঈদের নামাজের আগে সদকাতুল ফিতর আদায়, তাকবির পাঠ ও আত্মীয়তার বন্ধন রক্ষা।',
      enAmal: 'Pay Zakat al-Fitr before Eid prayer, recite Takbir, and share joy with family and the poor.',
    });
  }
  if (h.month === 12 && h.day === 9) {
    events.push({
      key: 'arafah',
      bnTitle: 'আরাফার দিন',
      enTitle: 'Day of Arafah',
      bnMeaning: 'হজের মূল দিবস এবং গুনাহ মাফের শ্রেষ্ঠ দিন।',
      enMeaning: 'Pinnacle day of Hajj and immense forgiveness.',
      bnAmal: 'আরাফার দিনের রোজা রাখা (পূর্বের ১ বছর ও পরের ১ বছরের সগিরা গুনাহ মাফের আশা) এবং বেশি বেশি দোয়া।',
      enAmal: 'Fast the Day of Arafah (for non-pilgrims) and engage in abundant Tahleel and Dua.',
    });
  }
  if (h.month === 12 && h.day === 10) {
    events.push({
      key: 'eid_adha',
      bnTitle: 'পবিত্র ঈদুল আজহা',
      enTitle: 'Eid-ul-Adha',
      bnMeaning: 'ত্যাগ ও কুরবানির মহিমান্বিত ঈদ।',
      enMeaning: 'Festival of Sacrifice commemorating Prophet Ibrahim (AS).',
      bnAmal: 'ঈদের নামাজ আদায়, তাকবিরে তাশরিক পাঠ এবং সামর্থ্যবানদের কুরবানি ও গোশত বিতরণ।',
      enAmal: 'Perform Eid prayer, recite Takbirat al-Tashreeq, and offer Udhiyah/Qurbani if able.',
    });
  }
  if ((h.day === 13 || h.day === 14 || h.day === 15) && !(h.month === 12 && h.day === 13)) {
    events.push({
      key: 'white_days',
      bnTitle: 'আইয়ামে বীজ (নফল রোজা)',
      enTitle: 'White Days (13-14-15)',
      bnMeaning: 'প্রতি হিজরি মাসের ১৩, ১৪ ও ১৫ তারিখের সুন্নাত রোজার দিন।',
      enMeaning: '13th, 14th, and 15th days of the lunar month recommended for voluntary fasting.',
      bnAmal: 'সুন্নাত অনুসারে নফল রোজা রাখা।',
      enAmal: 'Observe Sunnah voluntary fasting.',
    });
  }
  if ((dow === 1 || dow === 4) && h.month !== 9 && !(h.month === 10 && h.day === 1) && !(h.month === 12 && h.day >= 10 && h.day <= 13)) {
    events.push({
      key: 'mon_thu_fast',
      bnTitle: dow === 1 ? 'সোমবারের সুন্নাত রোজা' : 'বৃহস্পতিবারের সুন্নাত রোজা',
      enTitle: dow === 1 ? 'Monday Sunnah Fast' : 'Thursday Sunnah Fast',
      bnMeaning: 'সোমবার ও বৃহস্পতিবার বান্দার আমল আল্লাহর দরবারে পেশ করা হয়।',
      enMeaning: 'Deeds are presented on Mondays and Thursdays.',
      bnAmal: 'সুন্নাত নফল রোজা রাখার চেষ্টা করা।',
      enAmal: 'Consider fasting this Sunnah day.',
    });
  }

  return events;
}

export interface ComputedPrayerSchedule {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sehriEnd: Date;
  iftar: Date;
  ishraqStart: Date;
  chashtStart: Date;
  tahajjudLastThird: Date;
  makruhSunriseEnd: Date;
  makruhZawalStart: Date;
  makruhSunsetStart: Date;
  districtOffsetMin: number;
  qiblaDegrees: number;
}

/**
 * Computes prayer schedule using Karachi Method (Fajr 18°, Isha 18°, Hanafi Asr)
 * strictly from Gregorian clock & geographic coordinates — NEVER altered by Hijri moon adjustment!
 */
export function computePrayerTimesForDate(
  date: Date,
  districtId: string,
  customCoords?: { lat: number; lng: number } | null
): ComputedPrayerSchedule {
  const dist = BD_DISTRICTS.find((d) => d.id === districtId) || BD_DISTRICTS[0];
  const lat = customCoords?.lat ?? dist.lat;
  const lng = customCoords?.lng ?? dist.lng;

  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Karachi();
  params.madhab = Madhab.Hanafi;

  const pt = new PrayerTimes(coords, date, params);

  const sunriseMs = pt.sunrise.getTime();
  const dhuhrMs = pt.dhuhr.getTime();
  const maghribMs = pt.maghrib.getTime();
  const ishaMs = pt.isha.getTime();

  // Next day's Fajr approx for last third of night calculation
  const nextDate = new Date(date.getTime() + 86400000);
  const nextPt = new PrayerTimes(coords, nextDate, params);
  const nightDuration = nextPt.fajr.getTime() - maghribMs;
  const tahajjudStartMs = nextPt.fajr.getTime() - Math.round(nightDuration / 3);

  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    sehriEnd: new Date(pt.fajr.getTime() - 2 * 60000), // 2 min precaution before Fajr
    iftar: pt.maghrib,
    ishraqStart: new Date(sunriseMs + 18 * 60000),
    chashtStart: new Date(sunriseMs + 90 * 60000),
    tahajjudLastThird: new Date(tahajjudStartMs),
    makruhSunriseEnd: new Date(sunriseMs + 15 * 60000),
    makruhZawalStart: new Date(dhuhrMs - 7 * 60000),
    makruhSunsetStart: new Date(maghribMs - 15 * 60000),
    districtOffsetMin: dist.offsetMin,
    qiblaDegrees: Math.round(Qibla(coords) * 10) / 10,
  };
}

export function getNextPrayerCountdown(now: Date, districtId: string) {
  const todaySched = computePrayerTimesForDate(now, districtId);
  const list: { key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; bn: string; en: string; time: Date }[] = [
    { key: 'fajr', bn: 'ফজর', en: 'Fajr', time: todaySched.fajr },
    { key: 'dhuhr', bn: 'যোহর', en: 'Dhuhr', time: todaySched.dhuhr },
    { key: 'asr', bn: 'আসর', en: 'Asr', time: todaySched.asr },
    { key: 'maghrib', bn: 'মাগরিব', en: 'Maghrib', time: todaySched.maghrib },
    { key: 'isha', bn: 'এশা', en: 'Isha', time: todaySched.isha },
  ];

  for (const p of list) {
    if (p.time.getTime() > now.getTime()) {
      const diffSec = Math.max(0, Math.floor((p.time.getTime() - now.getTime()) / 1000));
      return { ...p, diffSec };
    }
  }

  const tomorrow = new Date(now.getTime() + 86400000);
  const tomSched = computePrayerTimesForDate(tomorrow, districtId);
  const diffSec = Math.max(0, Math.floor((tomSched.fajr.getTime() - now.getTime()) / 1000));
  return { key: 'fajr' as const, bn: 'ফজর', en: 'Fajr', time: tomSched.fajr, diffSec };
}

export interface DuaItem {
  id: string;
  category: 'daily' | 'study' | 'protection' | 'forgiveness';
  titleBn: string;
  titleEn: string;
  arabic: string;
  pronunciationBn: string;
  pronunciationEn: string;
  meaningBn: string;
  meaningEn: string;
}

export const BUILTIN_DUAS: DuaItem[] = [
  {
    id: 'dua_knowledge',
    category: 'study',
    titleBn: 'জ্ঞান বৃদ্ধির দোয়া',
    titleEn: 'Dua for Increasing Knowledge',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    pronunciationBn: 'রাব্বি যিদনী ইলমা।',
    pronunciationEn: 'Rabbi zidni ilma.',
    meaningBn: 'হে আমার রব, আমার জ্ঞান বৃদ্ধি করে দিন। (সূরা ত্বহা: ১১৪)',
    meaningEn: 'My Lord, increase me in knowledge. (Surah Taha: 114)',
  },
  {
    id: 'dua_ease',
    category: 'study',
    titleBn: 'কঠিন কাজ সহজ হওয়ার দোয়া',
    titleEn: 'Dua for Ease in Difficult Tasks',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    pronunciationBn: 'আল্লাহুম্মা লা সাহলা ইল্লা মা জাআলতাহু সাহলান, ওয়া আনতা তাজআলুল হাযনা ইযা শি’তা সাহলা।',
    pronunciationEn: 'Allahumma la sahla illa ma ja-altahu sahla, wa anta taj-alul hazna idha shi-ta sahla.',
    meaningBn: 'হে আল্লাহ, আপনি যা সহজ করেছেন তা ছাড়া কোনো কিছুই সহজ নয়, আর আপনি চাইলে কঠিনকেও সহজ করে দেন।',
    meaningEn: 'O Allah, there is no ease except in what You have made easy, and You make the difficulty easy if You wish.',
  },
  {
    id: 'dua_morning',
    category: 'daily',
    titleBn: 'সকালের দোয়া',
    titleEn: 'Morning Supplication',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    pronunciationBn: 'আল্লাহুম্মা বিকা আসবাহনা ওয়া বিকা আমসাইনা ওয়া বিকা নাহইয়া ওয়া বিকা নামুতু ওয়া ইলাইকান নুশূর।',
    pronunciationEn: 'Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur.',
    meaningBn: 'হে আল্লাহ, আপনার রহমতেই আমরা সকালে উপনীত হয়েছি, আপনার সাহায্যেই সন্ধ্যায় উপনীত হই, আপনার নামেই জীবিত থাকি ও মৃত্যুবরণ করি।',
    meaningEn: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.',
  },
  {
    id: 'dua_parents',
    category: 'daily',
    titleBn: 'পিতা-মাতার জন্য দোয়া',
    titleEn: 'Dua for Parents',
    arabic: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
    pronunciationBn: 'রাব্বির হামহুমা কামা রাব্বায়ানী সাগীরা।',
    pronunciationEn: 'Rabbir-hamhuma kama rabbayani saghira.',
    meaningBn: 'হে আমার রব, তাঁদের উভয়ের প্রতি দয়া করুন, যেভাবে তাঁরা শৈশবে আমাকে লালন-পালন করেছেন।',
    meaningEn: 'My Lord, have mercy upon them as they brought me up when I was small.',
  },
  {
    id: 'dua_sleep',
    category: 'daily',
    titleBn: 'ঘুমানোর আগের দোয়া',
    titleEn: 'Dua Before Sleeping',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    pronunciationBn: 'বিসমিকাল্লাহুম্মা আমুতু ওয়া আহইয়া।',
    pronunciationEn: 'Bismika Allahumma amutu wa ahya.',
    meaningBn: 'হে আল্লাহ, আপনার নামেই আমি মৃত্যুবরণ করি (ঘুমাই) এবং আপনার নামেই জীবিত হই (জাগ্রত হই)।',
    meaningEn: 'In Your name, O Allah, I die (sleep) and I live (wake).',
  },
  {
    id: 'dua_yunus',
    category: 'protection',
    titleBn: 'বিপদমুক্তির দোয়া (দোয়া ইউনুস)',
    titleEn: 'Dua in Distress (Prophet Yunus)',
    arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    pronunciationBn: 'লা ইলাহা ইল্লা আনতা সুবহানাকা ইন্নী কুনতু মিনায যালিমীন।',
    pronunciationEn: 'La ilaha illa Anta subhanaka inni kuntu minaz-zalimin.',
    meaningBn: 'আপনি ছাড়া কোনো সত্য উপাস্য নেই; আপনি পবিত্র মহান। নিশ্চয়ই আমি সীমালঙ্ঘনকারীদের অন্তর্ভুক্ত ছিলাম।',
    meaningEn: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
  },
  {
    id: 'dua_qadr',
    category: 'forgiveness',
    titleBn: 'লাইলাতুল কদরের দোয়া',
    titleEn: 'Dua for Laylat al-Qadr',
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    pronunciationBn: 'আল্লাহুম্মা ইন্নাকা আফুউন তুহিব্বুল আফওয়া ফাফু আন্নী।',
    pronunciationEn: 'Allahumma innaka afuwwun tuhibbul afwa fafu anni.',
    meaningBn: 'হে আল্লাহ, নিশ্চয়ই আপনি ক্ষমাশীল, ক্ষমা করাকে ভালোবাসেন; অতএব আমাকে ক্ষমা করে দিন।',
    meaningEn: 'O Allah, indeed You are Pardoning and love pardon, so pardon me.',
  },
];

export const ASMAUL_HUSNA = [
  { no: 1, ar: 'ٱللَّٰهُ', bn: 'আল্লাহ (সকল গুণের আধার)', en: 'Allah (The Greatest Name)' },
  { no: 2, ar: 'ٱلرَّحْمَٰنُ', bn: 'আর-রাহমান (পরম দয়ালু)', en: 'Ar-Rahman (The Most Gracious)' },
  { no: 3, ar: 'ٱلرَّحِيمُ', bn: 'আর-রাহীম (অতিশয় মেহেরবান)', en: 'Ar-Rahim (The Most Merciful)' },
  { no: 4, ar: 'ٱلْمَلِكُ', bn: 'আল-মালিক (সর্বময় অধিপতি)', en: 'Al-Malik (The Sovereign)' },
  { no: 5, ar: 'ٱلْقُدُّوسُ', bn: 'আল-কুদ্দুস (নিষ্কলুষ পবিত্র)', en: 'Al-Quddus (The Pure One)' },
  { no: 6, ar: 'ٱلسَّلَامُ', bn: 'আস-সালাম (শান্তিদাতা)', en: 'As-Salam (The Source of Peace)' },
  { no: 7, ar: 'ٱلْمُؤْمِنُ', bn: 'আল-মু’মিন (নিরাপত্তা দানকারী)', en: "Al-Mu'min (The Giver of Security)" },
  { no: 8, ar: 'ٱلْمُهَيْمِنُ', bn: 'আল-মুহাইমিন (রক্ষণাবেক্ষণকারী)', en: 'Al-Muhaymin (The Protector)' },
  { no: 9, ar: 'ٱلْعَزِيزُ', bn: 'আল-আযীয (পরাক্রমশালী)', en: 'Al-Aziz (The Almighty)' },
  { no: 10, ar: 'ٱلْجَبَّارُ', bn: 'আল-জাব্বার (অপ্রতিরোধ্য)', en: 'Al-Jabbar (The Compeller)' },
  { no: 11, ar: 'ٱلْخَالِقُ', bn: 'আল-খালিক (সৃষ্টিকর্তা)', en: 'Al-Khaliq (The Creator)' },
  { no: 12, ar: 'ٱلْغَفَّارُ', bn: 'আল-গাফফার (মহাক্ষমাশীল)', en: 'Al-Ghaffar (The Oft-Forgiving)' },
  { no: 13, ar: 'ٱلرَّزَّاقُ', bn: 'আর-রাযযাক (রিজিকদাতা)', en: 'Ar-Razzaq (The Provider)' },
  { no: 14, ar: 'ٱلْفَتَّاحُ', bn: 'আল-ফাত্তাহ (বিজয় দানকারী)', en: 'Al-Fattah (The Opener)' },
  { no: 15, ar: 'ٱلْعَلِيمُ', bn: 'আল-আলীম (সর্বজ্ঞ)', en: 'Al-Alim (The All-Knowing)' },
  { no: 16, ar: 'ٱلسَّمِيعُ', bn: 'আস-সামী (সর্বশ্রোতা)', en: 'As-Sami (The All-Hearing)' },
  { no: 17, ar: 'ٱلْبَصِيرُ', bn: 'আল-বাসীর (সর্বদ্রষ্টা)', en: 'Al-Basir (The All-Seeing)' },
  { no: 18, ar: 'ٱللَّطِيفُ', bn: 'আল-লাতীফ (সূক্ষ্মদর্শী দয়ালু)', en: 'Al-Latif (The Subtle One)' },
  { no: 19, ar: 'ٱلْحَلِيمُ', bn: 'আল-হালীম (অত্যন্ত ধৈর্যশীল)', en: 'Al-Halim (The Forbearing)' },
  { no: 20, ar: 'ٱلشَّكُورُ', bn: 'আশ-শাকূর (কৃতজ্ঞতার প্রতিদানকারী)', en: 'Ash-Shakur (The Appreciative)' },
  { no: 21, ar: 'ٱلْمُجِيبُ', bn: 'আল-মুজীব (প্রার্থনা কবুলকারী)', en: 'Al-Mujib (The Responsive)' },
  { no: 22, ar: 'ٱلْحَكِيمُ', bn: 'আল-হাকীম (প্রজ্ঞাময়)', en: 'Al-Hakim (The All-Wise)' },
  { no: 23, ar: 'ٱلْوَدُودُ', bn: 'আল-ওয়াদূদ (প্রেমময়)', en: 'Al-Wadud (The Most Loving)' },
  { no: 24, ar: 'ٱلْوَكِيلُ', bn: 'আল-ওয়াকীল (সর্বোত্তম কার্যনির্বাহী)', en: 'Al-Wakil (The Trustee)' },
];

export const OFFLINE_SURAHS = [
  {
    number: 1,
    nameBn: 'সূরা আল-ফাতিহা',
    nameEn: 'Surah Al-Fatihah',
    ayahs: [
      { no: 1, ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', bn: 'পরম করুণাময় অসীম দয়ালু আল্লাহর নামে।', en: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
      { no: 2, ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', bn: 'সকল প্রশংসা জগৎসমূহের প্রতিপালক আল্লাহরই জন্য।', en: 'All praise is due to Allah, Lord of the worlds.' },
      { no: 3, ar: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', bn: 'যিনি পরম করুণাময়, অতি দয়ালু।', en: 'The Entirely Merciful, the Especially Merciful.' },
      { no: 4, ar: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', bn: 'বিচার দ্বিবসের মালিক।', en: 'Sovereign of the Day of Recompense.' },
      { no: 5, ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', bn: 'আমরা কেবল আপনারই ইবাদত করি এবং আপনারই সাহায্য চাই।', en: 'It is You we worship and You we ask for help.' },
      { no: 6, ar: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', bn: 'আমাদের সরল পথ প্রদর্শন করুন।', en: 'Guide us to the straight path.' },
      { no: 7, ar: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', bn: 'তাঁদের পথ, যাঁদেরকে আপনি অনুগ্রহ দান করেছেন; অভিশপ্ত ও পথভ্রষ্টদের পথ নয়।', en: 'The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.' },
    ],
  },
  {
    number: 112,
    nameBn: 'সূরা আল-ইখলাস',
    nameEn: 'Surah Al-Ikhlas',
    ayahs: [
      { no: 1, ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', bn: 'বলুন, তিনি আল্লাহ, এক ও অদ্বিতীয়।', en: 'Say, He is Allah, Who is One.' },
      { no: 2, ar: 'ٱللَّهُ ٱلصَّمَدُ', bn: 'আল্লাহ অমুখাপেক্ষী।', en: 'Allah, the Eternal Refuge.' },
      { no: 3, ar: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', bn: 'তিনি কাউকে জন্ম দেননি এবং তাঁকেও জন্ম দেওয়া হয়নি।', en: 'He neither begets nor is born.' },
      { no: 4, ar: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ', bn: 'এবং তাঁর সমতুল্য কেউই নেই।', en: 'Nor is there to Him any equivalent.' },
    ],
  },
  {
    number: 113,
    nameBn: 'সূরা আল-ফালাক',
    nameEn: 'Surah Al-Falaq',
    ayahs: [
      { no: 1, ar: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', bn: 'বলুন, আমি আশ্রয় গ্রহণ করছি প্রভাতের পালনকর্তার।', en: 'Say, I seek refuge in the Lord of daybreak.' },
      { no: 2, ar: 'مِن شَرِّ مَا خَلَقَ', bn: 'তিনি যা সৃষ্টি করেছেন তার অনিষ্ট থেকে।', en: 'From the evil of that which He created.' },
      { no: 3, ar: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', bn: 'অন্ধকার রাতের অনিষ্ট থেকে যখন তা ঘনীভূত হয়।', en: 'And from the evil of darkness when it settles.' },
      { no: 4, ar: 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ', bn: 'গ্রন্থিতে ফুঁৎকারকারিণীদের অনিষ্ট থেকে।', en: 'And from the evil of the blowers in knots.' },
      { no: 5, ar: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', bn: 'এবং হিংসুকের অনিষ্ট থেকে যখন সে হিংসা করে।', en: 'And from the evil of an envier when he envies.' },
    ],
  },
  {
    number: 114,
    nameBn: 'সূরা আন-নাস',
    nameEn: 'Surah An-Nas',
    ayahs: [
      { no: 1, ar: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', bn: 'বলুন, আমি আশ্রয় চাই মানুষের পালনকর্তার।', en: 'Say, I seek refuge in the Lord of mankind.' },
      { no: 2, ar: 'مَلِكِ ٱلنَّاسِ', bn: 'মানুষের অধিপতির।', en: 'The Sovereign of mankind.' },
      { no: 3, ar: 'إِلَٰهِ ٱلنَّاسِ', bn: 'মানুষের উপাস্যের।', en: 'The God of mankind.' },
      { no: 4, ar: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', bn: 'আত্মগোপনকারী কুমন্ত্রণাদাতার অনিষ্ট থেকে।', en: 'From the evil of the retreating whisperer.' },
      { no: 5, ar: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', bn: 'যে মানুষের অন্তরে কুমন্ত্রণা দেয়।', en: 'Who whispers into the breasts of mankind.' },
      { no: 6, ar: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', bn: 'জিনের মধ্য থেকে অথবা মানুষের মধ্য থেকে।', en: 'From among the jinn and mankind.' },
    ],
  },
];
