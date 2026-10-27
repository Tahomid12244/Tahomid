import { AcademicGroup, ClassLevel, SubjectItem } from '../types';
import { buildHscScienceChapters, calculateChapterProgress } from './hscSyllabus';

export interface DistrictInfo {
  id: string;
  bn: string;
  en: string;
  lat: number;
  lng: number;
  offsetMin: number; // Longitude offset in minutes from Dhaka (90.4125°E)
}

// All 64 districts of Bangladesh with coordinates and longitude minute offset from Dhaka
export const BD_DISTRICTS: DistrictInfo[] = [
  { id: 'dhaka', bn: 'ঢাকা', en: 'Dhaka', lat: 23.8103, lng: 90.4125, offsetMin: 0 },
  { id: 'faridpur', bn: 'ফরিদপুর', en: 'Faridpur', lat: 23.607, lng: 89.8429, offsetMin: 2 },
  { id: 'gazipur', bn: 'গাজীপুর', en: 'Gazipur', lat: 24.0023, lng: 90.4264, offsetMin: 0 },
  { id: 'gopalganj', bn: 'গোপালগঞ্জ', en: 'Gopalganj', lat: 23.0051, lng: 89.8266, offsetMin: 2 },
  { id: 'kishoreganj', bn: 'কিশোরগঞ্জ', en: 'Kishoreganj', lat: 24.4449, lng: 90.7766, offsetMin: -1 },
  { id: 'madaripur', bn: 'মাদারীপুর', en: 'Madaripur', lat: 23.1641, lng: 90.1897, offsetMin: 1 },
  { id: 'manikganj', bn: 'মানিকগঞ্জ', en: 'Manikganj', lat: 23.8644, lng: 90.0047, offsetMin: 2 },
  { id: 'munshiganj', bn: 'মুন্সীগঞ্জ', en: 'Munshiganj', lat: 23.5422, lng: 90.5305, offsetMin: 0 },
  { id: 'narayanganj', bn: 'নারায়ণগঞ্জ', en: 'Narayanganj', lat: 23.6238, lng: 90.5, offsetMin: 0 },
  { id: 'narsingdi', bn: 'নরসিংদী', en: 'Narsingdi', lat: 23.9322, lng: 90.7151, offsetMin: -1 },
  { id: 'রাজবাড়ী', bn: 'রাজবাড়ী', en: 'Rajbari', lat: 23.7574, lng: 89.6445, offsetMin: 3 },
  { id: 'shariatpur', bn: 'শরীয়তপুর', en: 'Shariatpur', lat: 23.2423, lng: 90.4348, offsetMin: 0 },
  { id: 'tangail', bn: 'টাঙ্গাইল', en: 'Tangail', lat: 24.2513, lng: 89.9167, offsetMin: 2 },
  { id: 'chattogram', bn: 'চট্টগ্রাম', en: 'Chattogram', lat: 22.3569, lng: 91.7832, offsetMin: -5 },
  { id: 'bandarban', bn: 'বান্দরবান', en: 'Bandarban', lat: 22.1953, lng: 92.2184, offsetMin: -7 },
  { id: 'brahmanbaria', bn: 'ব্রাহ্মণবাড়িয়া', en: 'Brahmanbaria', lat: 23.9571, lng: 91.1119, offsetMin: -3 },
  { id: 'chandpur', bn: 'চাঁদপুর', en: 'Chandpur', lat: 23.2333, lng: 90.6713, offsetMin: -1 },
  { id: 'cumilla', bn: 'কুমিল্লা', en: 'Cumilla', lat: 23.4607, lng: 91.1809, offsetMin: -3 },
  { id: 'coxsbazar', bn: 'কক্সবাজার', en: "Cox's Bazar", lat: 21.4272, lng: 92.0058, offsetMin: -6 },
  { id: 'feni', bn: 'ফেনী', en: 'Feni', lat: 23.0159, lng: 91.3976, offsetMin: -4 },
  { id: 'khagrachhari', bn: 'খাগড়াছড়ি', en: 'Khagrachhari', lat: 23.1193, lng: 91.9847, offsetMin: -6 },
  { id: 'lakshmipur', bn: 'লক্ষ্মীপুর', en: 'Lakshmipur', lat: 22.9425, lng: 90.8412, offsetMin: -2 },
  { id: 'noakhali', bn: 'নোয়াখালী', en: 'Noakhali', lat: 22.8696, lng: 91.0994, offsetMin: -3 },
  { id: 'rangamati', bn: 'রাঙ্গামাটি', en: 'Rangamati', lat: 22.6556, lng: 92.1754, offsetMin: -7 },
  { id: 'rajshahi', bn: 'রাজশাহী', en: 'Rajshahi', lat: 24.3745, lng: 88.6042, offsetMin: 7 },
  { id: 'bogura', bn: 'বগুড়া', en: 'Bogura', lat: 24.8481, lng: 89.373, offsetMin: 4 },
  { id: 'chapainawabganj', bn: 'চাঁপাইনবাবগঞ্জ', en: 'Chapainawabganj', lat: 24.5965, lng: 88.2775, offsetMin: 9 },
  { id: 'joypurhat', bn: 'জয়পুরহাট', en: 'Joypurhat', lat: 25.0968, lng: 89.0227, offsetMin: 6 },
  { id: 'naogaon', bn: 'নওগাঁ', en: 'Naogaon', lat: 24.7936, lng: 88.9318, offsetMin: 6 },
  { id: 'natore', bn: 'নাটোর', en: 'Natore', lat: 24.4206, lng: 89.0003, offsetMin: 6 },
  { id: 'pabna', bn: 'পাবনা', en: 'Pabna', lat: 24.0064, lng: 89.2372, offsetMin: 5 },
  { id: 'sirajganj', bn: 'সিরাজগঞ্জ', en: 'Sirajganj', lat: 24.4534, lng: 89.7007, offsetMin: 3 },
  { id: 'khulna', bn: 'খুলনা', en: 'Khulna', lat: 22.8456, lng: 89.5403, offsetMin: 3 },
  { id: 'bagerhat', bn: 'বাগেরহাট', en: 'Bagerhat', lat: 22.6516, lng: 89.7859, offsetMin: 3 },
  { id: 'chuadanga', bn: 'চুয়াডাঙ্গা', en: 'Chuadanga', lat: 23.6402, lng: 88.8418, offsetMin: 6 },
  { id: 'jashore', bn: 'যশোর', en: 'Jashore', lat: 23.1664, lng: 89.2081, offsetMin: 5 },
  { id: 'jhenaidah', bn: 'ঝিনাইদহ', en: 'Jhenaidah', lat: 23.545, lng: 89.1726, offsetMin: 5 },
  { id: 'kushtia', bn: 'কুষ্টিয়া', en: 'Kushtia', lat: 23.9013, lng: 89.1204, offsetMin: 5 },
  { id: 'magura', bn: 'মাগুরা', en: 'Magura', lat: 23.4873, lng: 89.4199, offsetMin: 4 },
  { id: 'meherpur', bn: 'মেহেরপুর', en: 'Meherpur', lat: 23.7622, lng: 88.6318, offsetMin: 7 },
  { id: 'narail', bn: 'নড়াইল', en: 'Narail', lat: 23.1725, lng: 89.5127, offsetMin: 4 },
  { id: 'satkhira', bn: 'সাতক্ষীরা', en: 'Satkhira', lat: 22.7185, lng: 89.0705, offsetMin: 5 },
  { id: 'barishal', bn: 'বরিশাল', en: 'Barishal', lat: 22.701, lng: 90.3535, offsetMin: 0 },
  { id: 'barguna', bn: 'বরগুনা', en: 'Barguna', lat: 22.1592, lng: 90.1264, offsetMin: 1 },
  { id: 'bhola', bn: 'ভোলা', en: 'Bhola', lat: 22.6859, lng: 90.6482, offsetMin: -1 },
  { id: 'jhalokati', bn: 'ঝালকাঠি', en: 'Jhalokati', lat: 22.6406, lng: 90.1987, offsetMin: 1 },
  { id: 'patuakhali', bn: 'পটুয়াখালী', en: 'Patuakhali', lat: 22.3596, lng: 90.3299, offsetMin: 0 },
  { id: 'pirojpur', bn: 'পিরোজপুর', en: 'Pirojpur', lat: 22.5841, lng: 89.972, offsetMin: 2 },
  { id: 'sylhet', bn: 'সিলেট', en: 'Sylhet', lat: 24.8949, lng: 91.8687, offsetMin: -6 },
  { id: 'habiganj', bn: 'হবিগঞ্জ', en: 'Habiganj', lat: 24.3749, lng: 91.4155, offsetMin: -4 },
  { id: 'moulvibazar', bn: 'মৌলভীবাজার', en: 'Moulvibazar', lat: 24.4829, lng: 91.7774, offsetMin: -5 },
  { id: 'sunamganj', bn: 'সুনামগঞ্জ', en: 'Sunamganj', lat: 25.0658, lng: 91.395, offsetMin: -4 },
  { id: 'rangpur', bn: 'রংপুর', en: 'Rangpur', lat: 25.7439, lng: 89.2752, offsetMin: 5 },
  { id: 'dinajpur', bn: 'দিনাজপুর', en: 'Dinajpur', lat: 25.6217, lng: 88.6354, offsetMin: 7 },
  { id: 'gaibandha', bn: 'গাইবান্ধা', en: 'Gaibandha', lat: 25.3288, lng: 89.5281, offsetMin: 4 },
  { id: 'kurigram', bn: 'কুড়িগ্রাম', en: 'Kurigram', lat: 25.8054, lng: 89.6362, offsetMin: 3 },
  { id: 'lalmonirhat', bn: 'লালমনিরহাট', en: 'Lalmonirhat', lat: 25.9923, lng: 89.2847, offsetMin: 5 },
  { id: 'nilphamari', bn: 'নীলফামারী', en: 'Nilphamari', lat: 25.9318, lng: 88.856, offsetMin: 6 },
  { id: 'panchagarh', bn: 'পঞ্চগড়', en: 'Panchagarh', lat: 26.3411, lng: 88.5542, offsetMin: 7 },
  { id: 'thakurgaon', bn: 'ঠাকুরগাঁও', en: 'Thakurgaon', lat: 26.0337, lng: 88.4617, offsetMin: 8 },
  { id: 'mymensingh', bn: 'ময়মনসিংহ', en: 'Mymensingh', lat: 24.7471, lng: 90.4203, offsetMin: 0 },
  { id: 'jamalpur', bn: 'জামালপুর', en: 'Jamalpur', lat: 24.9375, lng: 89.9378, offsetMin: 2 },
  { id: 'netrokona', bn: 'নেত্রকোনা', en: 'Netrokona', lat: 24.8709, lng: 90.7279, offsetMin: -1 },
  { id: 'sherpur', bn: 'শেরপুর', en: 'Sherpur', lat: 25.0205, lng: 90.0153, offsetMin: 2 },
];

interface SubjectTemplate {
  key: string;
  bn: string;
  en: string;
  color: string;
  icon: string;
  hasTwoPapers?: boolean;
  preloadedHscKey?: 'physics' | 'chemistry' | 'mathematics' | 'biology';
  isPreloadedHsc?: boolean;
}

export function isHscClass(classLevel: ClassLevel): boolean {
  return classLevel === '11' || classLevel === '12_hsc';
}

export function buildSuggestedSubjects(
  classLevel: ClassLevel,
  academicGroup: AcademicGroup,
  isStudent: boolean
): SubjectItem[] {
  let templates: SubjectTemplate[] = [];

  if (!isStudent || !classLevel || classLevel === 'university' || classLevel === 'other' || classLevel === 'admission') {
    templates = [
      { key: 'bangla', bn: 'বাংলা', en: 'Bangla', color: '#059669', icon: 'BookOpen' },
      { key: 'english', bn: 'ইংরেজি', en: 'English', color: '#2563eb', icon: 'Languages' },
      { key: 'mathematics', bn: 'গণিত', en: 'Mathematics', color: '#d97706', icon: 'Calculator' },
      { key: 'science', bn: 'বিজ্ঞান', en: 'Science', color: '#0891b2', icon: 'Atom' },
      { key: 'ict', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'ICT', color: '#7c3aed', icon: 'Cpu' },
      { key: 'religion', bn: 'ধর্ম ও নৈতিক শিক্ষা', en: 'Religion', color: '#10b981', icon: 'HeartHandshake' },
      { key: 'bgs', bn: 'বাংলাদেশ ও বিশ্বপরিচয়', en: 'Bangladesh & Global Studies', color: '#ea580c', icon: 'Globe' },
    ];
  } else if (classLevel === '6' || classLevel === '7' || classLevel === '8') {
    templates = [
      { key: 'bangla', bn: 'বাংলা', en: 'Bangla', color: '#059669', icon: 'BookOpen' },
      { key: 'english', bn: 'ইংরেজি', en: 'English', color: '#2563eb', icon: 'Languages' },
      { key: 'mathematics', bn: 'গণিত', en: 'Mathematics', color: '#d97706', icon: 'Calculator' },
      { key: 'science', bn: 'বিজ্ঞান', en: 'Science', color: '#0891b2', icon: 'Atom' },
      { key: 'bgs', bn: 'বাংলাদেশ ও বিশ্বপরিচয়', en: 'Bangladesh & Global Studies', color: '#ea580c', icon: 'Globe' },
      { key: 'religion', bn: 'ধর্ম ও নৈতিক শিক্ষা', en: 'Religion & Moral Education', color: '#10b981', icon: 'HeartHandshake' },
      { key: 'ict', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'ICT', color: '#7c3aed', icon: 'Cpu' },
      { key: 'agri_home', bn: 'কৃষিশিক্ষা', en: 'Agriculture Studies', color: '#65a30d', icon: 'Sprout' },
      { key: 'arts', bn: 'শিল্প ও সংস্কৃতি', en: 'Arts & Culture', color: '#db2777', icon: 'Palette' },
      { key: 'pe', bn: 'শারীরিক শিক্ষা ও স্বাস্থ্য', en: 'Physical Education & Health', color: '#0d9488', icon: 'Activity' },
    ];
  } else if (classLevel === '9' || classLevel === '10_ssc') {
    const common: SubjectTemplate[] = [
      { key: 'bangla', bn: 'বাংলা ১ম ও ২য় পত্র', en: 'Bangla 1st & 2nd Paper', color: '#059669', icon: 'BookOpen', hasTwoPapers: true },
      { key: 'english', bn: 'ইংরেজি ১ম ও ২য় পত্র', en: 'English 1st & 2nd Paper', color: '#2563eb', icon: 'Languages', hasTwoPapers: true },
      { key: 'gen_math', bn: 'সাধারণ গণিত', en: 'General Mathematics', color: '#d97706', icon: 'Calculator' },
      { key: 'religion', bn: 'ধর্ম ও নৈতিক শিক্ষা', en: 'Religion & Moral Education', color: '#10b981', icon: 'HeartHandshake' },
      { key: 'ict', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'ICT', color: '#7c3aed', icon: 'Cpu' },
      { key: 'bgs', bn: 'বাংলাদেশ ও বিশ্বপরিচয়', en: 'Bangladesh & Global Studies', color: '#ea580c', icon: 'Globe' },
      { key: 'pe', bn: 'শারীরিক শিক্ষা', en: 'Physical Education', color: '#0d9488', icon: 'Activity' },
    ];
    if (academicGroup === 'commerce') {
      templates = [
        ...common,
        { key: 'accounting', bn: 'হিসাববিজ্ঞান', en: 'Accounting', color: '#0284c7', icon: 'Receipt' },
        { key: 'entrepreneurship', bn: 'ব্যবসায় উদ্যোগ', en: 'Business Entrepreneurship', color: '#b45309', icon: 'Briefcase' },
        { key: 'finance', bn: 'ফিন্যান্স ও ব্যাংকিং', en: 'Finance & Banking', color: '#0f766e', icon: 'Landmark' },
        { key: 'marketing', bn: 'উৎপাদন ব্যবস্থাপনা ও বিপণন', en: 'Production Management & Marketing', color: '#9333ea', icon: 'TrendingUp' },
      ];
    } else if (academicGroup === 'humanities') {
      templates = [
        ...common,
        { key: 'geography', bn: 'ভূগোল ও পরিবেশ', en: 'Geography & Environment', color: '#16a34a', icon: 'Map' },
        { key: 'civics', bn: 'পৌরনীতি ও নাগরিকতা', en: 'Civics & Citizenship', color: '#2563eb', icon: 'Scale' },
        { key: 'economics', bn: 'অর্থনীতি', en: 'Economics', color: '#ca8a04', icon: 'BarChart3' },
        { key: 'history', bn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', en: 'History of Bangladesh & World Civilization', color: '#b91c1c', icon: 'ScrollText' },
      ];
    } else {
      templates = [
        ...common,
        { key: 'physics', bn: 'পদার্থবিজ্ঞান', en: 'Physics', color: '#0284c7', icon: 'Atom' },
        { key: 'chemistry', bn: 'রসায়ন', en: 'Chemistry', color: '#e11d48', icon: 'FlaskConical' },
        { key: 'biology', bn: 'জীববিজ্ঞান', en: 'Biology', color: '#16a34a', icon: 'Dna' },
        { key: 'higher_math', bn: 'উচ্চতর গণিত', en: 'Higher Mathematics', color: '#7c3aed', icon: 'Sigma' },
      ];
    }
  } else if (classLevel === '11' || classLevel === '12_hsc') {
    const commonHsc: SubjectTemplate[] = [
      { key: 'bangla_hsc', bn: 'বাংলা ১ম ও ২য় পত্র', en: 'Bangla 1st & 2nd Paper', color: '#059669', icon: 'BookOpen', hasTwoPapers: true, isPreloadedHsc: true },
      { key: 'english_hsc', bn: 'ইংরেজি ১ম ও ২য় পত্র', en: 'English 1st & 2nd Paper', color: '#2563eb', icon: 'Languages', hasTwoPapers: true, isPreloadedHsc: true },
      { key: 'ict_hsc', bn: 'তথ্য ও যোগাযোগ প্রযুক্তি', en: 'ICT', color: '#7c3aed', icon: 'Cpu', hasTwoPapers: false, isPreloadedHsc: true },
    ];
    if (academicGroup === 'commerce') {
      templates = [
        { key: 'accounting_hsc', bn: 'হিসাববিজ্ঞান ১ম ও ২য় পত্র', en: 'Accounting 1st & 2nd Paper', color: '#0284c7', icon: 'Receipt', hasTwoPapers: true },
        { key: 'bom_hsc', bn: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা', en: 'Business Organization & Management', color: '#b45309', icon: 'Briefcase', hasTwoPapers: true },
        { key: 'pmm_hsc', bn: 'উৎপাদন ব্যবস্থাপনা ও বিপণন', en: 'Production Management & Marketing', color: '#9333ea', icon: 'TrendingUp', hasTwoPapers: true },
        { key: 'fbi_hsc', bn: 'ফিন্যান্স, ব্যাংকিং ও বিমা', en: 'Finance, Banking & Insurance', color: '#0f766e', icon: 'Landmark', hasTwoPapers: true },
        ...commonHsc,
      ];
    } else if (academicGroup === 'humanities') {
      templates = [
        { key: 'economics_hsc', bn: 'অর্থনীতি', en: 'Economics', color: '#ca8a04', icon: 'BarChart3', hasTwoPapers: true },
        { key: 'civics_hsc', bn: 'পৌরনীতি ও সুশাসন', en: 'Civics & Good Governance', color: '#2563eb', icon: 'Scale', hasTwoPapers: true },
        { key: 'ihc_hsc', bn: 'ইসলামের ইতিহাস ও সংস্কৃতি', en: 'Islamic History & Culture', color: '#059669', icon: 'ScrollText', hasTwoPapers: true },
        { key: 'logic_hsc', bn: 'যুক্তিবিদ্যা', en: 'Logic', color: '#7c3aed', icon: 'Brain', hasTwoPapers: true },
        { key: 'sociology_hsc', bn: 'সমাজবিজ্ঞান', en: 'Sociology', color: '#0d9488', icon: 'Users', hasTwoPapers: true },
        { key: 'socialwork_hsc', bn: 'সমাজকর্ম', en: 'Social Work', color: '#db2777', icon: 'HeartHandshake', hasTwoPapers: true },
        { key: 'geography_hsc', bn: 'ভূগোল', en: 'Geography', color: '#16a34a', icon: 'Map', hasTwoPapers: true },
        ...commonHsc,
      ];
    } else {
      // HSC Science: Physics, Chemistry, Mathematics, Biology PRELOADED with 75 chapters + empty Bangla, English, ICT
      templates = [
        { key: 'physics_hsc', bn: 'পদার্থবিজ্ঞান', en: 'Physics', color: '#0284c7', icon: 'Atom', hasTwoPapers: true, preloadedHscKey: 'physics', isPreloadedHsc: true },
        { key: 'chemistry_hsc', bn: 'রসায়ন', en: 'Chemistry', color: '#e11d48', icon: 'FlaskConical', hasTwoPapers: true, preloadedHscKey: 'chemistry', isPreloadedHsc: true },
        { key: 'mathematics_hsc', bn: 'উচ্চতর গণিত', en: 'Mathematics', color: '#d97706', icon: 'Sigma', hasTwoPapers: true, preloadedHscKey: 'mathematics', isPreloadedHsc: true },
        { key: 'biology_hsc', bn: 'জীববিজ্ঞান', en: 'Biology', color: '#16a34a', icon: 'Dna', hasTwoPapers: true, preloadedHscKey: 'biology', isPreloadedHsc: true },
        ...commonHsc,
      ];
    }
  }

  return templates.map((t) => ({
    id: `subj_${t.key}`,
    key: t.key,
    bn: t.bn,
    en: t.en,
    color: t.color,
    icon: t.icon,
    hasTwoPapers: Boolean(t.hasTwoPapers),
    preloaded: Boolean(t.isPreloadedHsc),
    hidden: false,
    archived: false,
    chapters: t.preloadedHscKey ? buildHscScienceChapters(t.preloadedHscKey) : [],
  }));
}

export function getSubjectStats(subject: SubjectItem) {
  const visibleChapters = subject.chapters.filter((c) => !c.hidden && (c.bn.trim() !== '' || c.en.trim() !== ''));
  const total = visibleChapters.length;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let sumAll = 0;

  let p1Count = 0;
  let p1Sum = 0;
  let p2Count = 0;
  let p2Sum = 0;

  for (const ch of visibleChapters) {
    const pct = calculateChapterProgress(ch);
    sumAll += pct;
    if (pct <= 0) notStarted++;
    else if (pct >= 100) completed++;
    else inProgress++;

    if (ch.paper === 2) {
      p2Count++;
      p2Sum += pct;
    } else {
      p1Count++;
      p1Sum += pct;
    }
  }

  const avgPct = total > 0 ? Math.round((sumAll / total) * 10) / 10 : 0;
  const paper1Pct = p1Count > 0 ? Math.round((p1Sum / p1Count) * 10) / 10 : 0;
  const paper2Pct = p2Count > 0 ? Math.round((p2Sum / p2Count) * 10) / 10 : 0;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    avgPct,
    paper1Pct,
    paper2Pct,
    hasChapters: total > 0,
  };
}

export function getOverallHscStats(subjects: SubjectItem[]) {
  const activeWithChapters = subjects.filter((s) => !s.archived && !s.hidden && getSubjectStats(s).hasChapters);
  if (activeWithChapters.length === 0) {
    return { overallPct: 0, weakestSubject: null as SubjectItem | null };
  }

  let totalPct = 0;
  let weakest: SubjectItem | null = null;
  let lowestPct = Infinity;
  let mostNotStarted = -1;

  for (const s of activeWithChapters) {
    const st = getSubjectStats(s);
    totalPct += st.avgPct;
    if (st.avgPct < lowestPct || (st.avgPct === lowestPct && st.notStarted > mostNotStarted)) {
      lowestPct = st.avgPct;
      mostNotStarted = st.notStarted;
      weakest = s;
    }
  }

  return {
    overallPct: Math.round((totalPct / activeWithChapters.length) * 10) / 10,
    weakestSubject: weakest,
  };
}

/**
 * Transitions subject lists safely when changing Class or Academic Group:
 * - Never deletes subjects with logs or progress (archives them instead).
 * - Preserves HSC archive when leaving HSC and restores it if returning to HSC!
 */
export function transitionSubjectsForProfileChange(params: {
  oldSubjects: SubjectItem[];
  hscArchive: SubjectItem[];
  wasHsc: boolean;
  nowHsc: boolean;
  newClassLevel: ClassLevel;
  newGroup: AcademicGroup;
  isStudent: boolean;
  subjectIdsWithLogs: Set<string>;
}): { subjects: SubjectItem[]; hscArchive: SubjectItem[] } {
  const { oldSubjects, hscArchive, wasHsc, nowHsc, newClassLevel, newGroup, isStudent, subjectIdsWithLogs } = params;

  let nextHscArchive = hscArchive;
  if (wasHsc && !nowHsc) {
    // Archive HSC subjects without deleting progress
    nextHscArchive = oldSubjects.filter((s) => !s.archived);
  }

  const freshSuggested = buildSuggestedSubjects(newClassLevel, newGroup, isStudent);

  // If moving back INTO HSC and we have archived HSC progress, merge it back!
  const sourcePool = nowHsc && nextHscArchive.length > 0 ? [...nextHscArchive, ...oldSubjects] : oldSubjects;

  const result: SubjectItem[] = [];
  const usedIds = new Set<string>();

  for (const suggested of freshSuggested) {
    const match = sourcePool.find(
      (old) => old.id === suggested.id || old.en.toLowerCase() === suggested.en.toLowerCase()
    );
    if (match) {
      // Reuse existing subject and its chapter progress; if suggested has preloaded HSC chapters and match had none, populate them
      const chapters =
        suggested.chapters.length > 0 && match.chapters.length === 0
          ? suggested.chapters
          : match.chapters;
      result.push({ ...match, archived: false, chapters });
      usedIds.add(match.id);
    } else {
      result.push(suggested);
      usedIds.add(suggested.id);
    }
  }

  // Keep any old subjects that have study logs or chapter progress as archived so Logs & Progress never lose data
  for (const old of oldSubjects) {
    if (usedIds.has(old.id)) continue;
    const hasProgress = old.chapters.some((c) => calculateChapterProgress(c) > 0 || c.notes.trim() !== '');
    if (subjectIdsWithLogs.has(old.id) || hasProgress) {
      result.push({ ...old, archived: true });
      usedIds.add(old.id);
    }
  }

  return { subjects: result, hscArchive: nextHscArchive };
}
