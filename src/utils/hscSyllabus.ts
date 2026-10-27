import { ChapterItem } from '../types';

export interface RawHscChapter {
  no: number;
  bn: string;
  en: string;
}

export interface RawHscSubjectSyllabus {
  paper1: RawHscChapter[];
  paper2: RawHscChapter[];
}

export const DEFAULT_HSC_SYLLABUS: Record<'physics' | 'chemistry' | 'mathematics' | 'biology', RawHscSubjectSyllabus> = {
  physics: {
    paper1: [
      { no: 1, bn: 'ভৌতজগত ও পরিমাপ', en: 'Physical World & Measurement' },
      { no: 2, bn: 'ভেক্টর', en: 'Vector' },
      { no: 3, bn: 'গতিবিদ্যা', en: 'Dynamics' },
      { no: 4, bn: 'নিউটনীয় বলবিদ্যা', en: 'Newtonian Mechanics' },
      { no: 5, bn: 'কাজ, ক্ষমতা ও শক্তি', en: 'Work, Power & Energy' },
      { no: 6, bn: 'মহাকর্ষ ও অভিকর্ষ', en: 'Gravitation and Gravity' },
      { no: 7, bn: 'পদার্থের গাঠনিক ধর্ম', en: "Material's Structural Property" },
      { no: 8, bn: 'পর্যাবৃত্ত গতি', en: 'Periodic Motion' },
      { no: 9, bn: 'তরঙ্গ', en: 'Wave' },
      { no: 10, bn: 'আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব', en: 'Ideal Gas & Gas Kinematics' },
    ],
    paper2: [
      { no: 1, bn: 'তাপগতিবিদ্যা', en: 'Thermodynamics' },
      { no: 2, bn: 'স্থির তড়িৎ', en: 'Static Electricity' },
      { no: 3, bn: 'চলতড়িৎ', en: 'Current Electricity' },
      { no: 4, bn: 'তড়িৎ প্রবাহের চুম্বকক্রিয়া', en: 'Magnetic Effects of Electric Current' },
      { no: 5, bn: 'তাড়িত-চৌম্বক আবেশ', en: 'Electro-Magnetic Induction' },
      { no: 6, bn: 'জ্যামিতিক আলোকবিজ্ঞান', en: 'Geometrical Optics' },
      { no: 7, bn: 'ভৌত আলোকবিজ্ঞান', en: 'Physical Optics' },
      { no: 8, bn: 'আধুনিক পদার্থবিজ্ঞান', en: 'Modern Physics' },
      { no: 9, bn: 'পরমাণুর মডেল ও নিউক্লিয়ার পদার্থবিজ্ঞান', en: 'Atomic Model & Nuclear Physics' },
      { no: 10, bn: 'অর্ধ-পরিবাহী ও ইলেকট্রনিক্স', en: 'Semi-conductor & Electronics' },
      { no: 11, bn: 'জ্যোতির্বিজ্ঞান', en: 'Astronomy' },
    ],
  },
  chemistry: {
    paper1: [
      { no: 1, bn: 'ল্যাবরেটরির নিরাপদ ব্যবহার', en: 'Safe Use of Laboratory' },
      { no: 2, bn: 'গুণগত রসায়ন', en: 'Qualitative Chemistry' },
      { no: 3, bn: 'মৌলের পর্যাবৃত্তিক ধর্ম ও রাসায়নিক বন্ধন', en: 'Periodic Property of Elements & Chemical Bond' },
      { no: 4, bn: 'রাসায়নিক পরিবর্তন', en: 'Chemical Change' },
      { no: 5, bn: 'কর্মমূখী রসায়ন', en: 'Functional Chemistry' },
    ],
    paper2: [
      { no: 1, bn: 'পরিবেশ রসায়ন', en: 'Environment Chemistry' },
      { no: 2, bn: 'জৈব রসায়ন', en: 'Organic Chemistry' },
      { no: 3, bn: 'পরিমাণগত', en: 'Quantitative Chemistry' },
      { no: 4, bn: 'তড়িৎ রসায়ন', en: 'Electro-Chemistry' },
      { no: 5, bn: 'অর্থনৈতিক রসায়ন', en: 'Economical Chemistry' },
    ],
  },
  mathematics: {
    paper1: [
      { no: 1, bn: 'ম্যাট্রিক্স ও নির্ণায়ক', en: 'Matrix & Determinant' },
      { no: 2, bn: 'ভেক্টর', en: 'Vector' },
      { no: 3, bn: 'সরলরেখা', en: 'Straight Line' },
      { no: 4, bn: 'বৃত্ত', en: 'Circle' },
      { no: 5, bn: 'বিন্যাস ও সমাবেশ', en: 'Permutation & Combination' },
      { no: 6, bn: 'ত্রিকোনমিতিক অনুপাত', en: 'Trigonometric Ratio' },
      { no: 7, bn: 'সংযুক্ত কোনের ত্রিকোনমিতিক অনুপাত', en: 'Trigonometrical Ratios of Associated Angles' },
      { no: 8, bn: 'ফাংশন ও ফাংশনের লেখচিত্র', en: 'Function & Graphs of Function' },
      { no: 9, bn: 'অন্তরীকরণ', en: 'Differentiation' },
      { no: 10, bn: 'যোগজীকরণ', en: 'Integration' },
    ],
    paper2: [
      { no: 1, bn: 'বাস্তব সংখ্যা ও অসমতা', en: 'Real numbers and inequality' },
      { no: 2, bn: 'যোগাশ্রয়ী প্রোগ্রাম', en: 'Linear Programming' },
      { no: 3, bn: 'জটিল সংখ্যা', en: 'Complex Number' },
      { no: 4, bn: 'বহুপদী ও বহুপদী সমীকরণ', en: 'Polynomial and polynomial equations' },
      { no: 5, bn: 'দ্বিপদী বিস্তৃতি', en: 'Binomial expansion' },
      { no: 6, bn: 'কনিক', en: 'Conic' },
      { no: 7, bn: 'বিপরীত ত্রিকোনমিতিক ফাংশন ও ত্রিকোণমিতিক সমীকরণ', en: 'Reverse trigonometric functions and trigonometric equations' },
      { no: 8, bn: 'স্থিতিবিদ্যা', en: 'Statics' },
      { no: 9, bn: 'সমতলে বস্তুকনার গতি', en: 'Motion of Perticles on the plane' },
      { no: 10, bn: 'বিস্তার পরিমাপ ও সম্ভাবনা', en: 'Measurement Of Dispersion and probability' },
    ],
  },
  biology: {
    paper1: [
      { no: 1, bn: 'কোষ ও এর গঠন', en: 'Cell and its Structure' },
      { no: 2, bn: 'কোষ বিভাজন', en: 'Cell Division' },
      { no: 3, bn: 'কোষ রসায়ন', en: 'Cell Chemistry' },
      { no: 4, bn: 'অণুজীব', en: 'Micro-Organisms' },
      { no: 5, bn: 'শৈবাল ও ছত্রাক', en: 'Algae and fungi' },
      { no: 6, bn: 'ব্রায়োফাইটা ও টেরেডোফাইটা', en: 'Bryophyta & Pteridophyta' },
      { no: 7, bn: 'নগ্নবীজী ও আবৃতবীজী উদ্ভিদ', en: 'Angiosperm and Gymnosperm' },
      { no: 8, bn: 'টিস্যু ও টিস্যুতন্ত্র', en: 'Tissue and Tissue System' },
      { no: 9, bn: 'উদ্ভিদ শারীরতত্ত্ব', en: 'Plant Physiology' },
      { no: 10, bn: 'উদ্ভিদ প্রজনন', en: 'Plant Reproduction' },
      { no: 11, bn: 'জীবপ্রযুক্তি', en: 'Biotechnology' },
      { no: 12, bn: 'জীবের পরিবেশ, বিস্তার ও সংরক্ষণ', en: 'Environment, Distribution and Conservation of Living Organisms' },
    ],
    paper2: [
      { no: 1, bn: 'প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস', en: 'Animal Diversity and Classification' },
      { no: 2, bn: 'প্রাণীর পরিচিতি', en: 'Introduction to animal' },
      { no: 3, bn: 'পরিপাক ও শোষণ', en: 'Digestion and Absorption' },
      { no: 4, bn: 'রক্ত ও সংবহন', en: 'Blood and Circulation' },
      { no: 5, bn: 'শ্বসন ও শ্বাসক্রিয়া', en: 'Respiration and its Process' },
      { no: 6, bn: 'বর্জ্য ও নিষ্কাশন', en: 'Waste and Excretion' },
      { no: 7, bn: 'চলন ও অঙগচালনা', en: 'Locomotion and Organ Movement' },
      { no: 8, bn: 'সমন্বয় ও নিয়ন্ত্রণ', en: 'Co -Ordination and Control' },
      { no: 9, bn: 'মানব জীবনের ধারাবাহিকতা', en: 'Continuity of Human life' },
      { no: 10, bn: 'মানবদেহের প্রতিরক্ষা', en: 'Immunity Of Human Body' },
      { no: 11, bn: 'জিনতত্ত্ব ও বিবর্তন', en: 'Genetics and Evolution' },
      { no: 12, bn: 'প্রাণীর আচরণ', en: 'Animal Behaviour' },
    ],
  },
};

export function buildHscScienceChapters(subjectKey: 'physics' | 'chemistry' | 'mathematics' | 'biology'): ChapterItem[] {
  const data = DEFAULT_HSC_SYLLABUS[subjectKey];
  const makeChapter = (raw: RawHscChapter, paper: 1 | 2): ChapterItem => ({
    id: `hsc_${subjectKey}_p${paper}_ch${raw.no}`,
    no: raw.no,
    paper,
    bn: raw.bn,
    en: raw.en,
    preloaded: true,
    hidden: false,
    totalClasses: 0,
    completedClasses: 0,
    cqSolved: false,
    mcqSolved: false,
    admissionPyq: false,
    otherProblems: false,
    examDone: false,
    mistakesCorrected: false,
    difficulty: 'medium',
    notes: '',
  });

  return [
    ...data.paper1.map((c) => makeChapter(c, 1)),
    ...data.paper2.map((c) => makeChapter(c, 2)),
  ];
}

/**
 * Exact HSC / Syllabus Chapter Progress Formula:
 * Classes: (Completed / Total * 35), max 35, 0 if Total <= 0
 * CQ Solved: 20
 * MCQ Solved: 10
 * Admission PYQs Solved: 10
 * Other Problems: 10
 * Exam: 10
 * Mistakes Corrected: 5
 * Total = 0 to 100%
 */
export function calculateChapterProgress(ch: ChapterItem): number {
  const total = Math.max(0, Math.floor(Number(ch.totalClasses) || 0));
  const completed = total > 0 ? Math.min(total, Math.max(0, Math.floor(Number(ch.completedClasses) || 0))) : 0;
  const classScore = total > 0 ? Math.min(35, (completed / total) * 35) : 0;
  const taskScore =
    (ch.cqSolved ? 20 : 0) +
    (ch.mcqSolved ? 10 : 0) +
    (ch.admissionPyq ? 10 : 0) +
    (ch.otherProblems ? 10 : 0) +
    (ch.examDone ? 10 : 0) +
    (ch.mistakesCorrected ? 5 : 0);

  const pct = Math.min(100, Math.max(0, classScore + taskScore));
  return Math.round(pct * 10) / 10;
}

export function getChapterStatus(pct: number): 'not_started' | 'in_progress' | 'completed' {
  if (pct <= 0) return 'not_started';
  if (pct >= 100) return 'completed';
  return 'in_progress';
}
