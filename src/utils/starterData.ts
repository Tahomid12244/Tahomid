import { VocabWord } from '../types';

const RAW_VOCAB: [string, string, string, string, string, 'SSC' | 'HSC' | 'Admission' | 'IELTS', 'easy' | 'medium' | 'hard'][] = [
  ['Abundant', 'প্রচুর', 'Existing in large quantities', 'adj', 'Bangladesh has abundant natural beauty.', 'SSC', 'easy'],
  ['Accomplish', 'সম্পাদন করা', 'Achieve or complete successfully', 'verb', 'She worked hard to accomplish her study goal.', 'SSC', 'easy'],
  ['Accurate', 'নির্ভুল', 'Correct in all details', 'adj', 'Keep accurate notes during physics lectures.', 'SSC', 'easy'],
  ['Adapt', 'মানিয়ে নেওয়া', 'Adjust to new conditions', 'verb', 'Students quickly adapt to new routines.', 'SSC', 'easy'],
  ['Adequate', 'পর্যাপ্ত', 'Satisfactory or acceptable in quantity', 'adj', 'Get adequate sleep before exam day.', 'HSC', 'medium'],
  ['Advocate', 'সমর্থন করা', 'Publicly recommend or support', 'verb', 'Teachers advocate daily reading habits.', 'Admission', 'medium'],
  ['Alleviate', 'উপশম করা', 'Make suffering less severe', 'verb', 'Deep breathing helps alleviate exam stress.', 'Admission', 'hard'],
  ['Ambiguous', 'দ্ব্যর্থবোধক', 'Open to more than one interpretation', 'adj', 'Avoid ambiguous sentences in essays.', 'Admission', 'hard'],
  ['Ample', 'যথেষ্ট', 'Enough or more than enough', 'adj', 'There is ample time to revise every chapter.', 'HSC', 'easy'],
  ['Analyze', 'বিশ্লেষণ করা', 'Examine methodically in detail', 'verb', 'Analyze your model test mistakes carefully.', 'SSC', 'easy'],
  ['Anticipate', 'পূর্বানুমান করা', 'Regard as probable', 'verb', 'We anticipate good results this semester.', 'IELTS', 'medium'],
  ['Apparent', 'স্পষ্ট', 'Clearly visible or understood', 'adj', 'Her progress in mathematics became apparent.', 'HSC', 'medium'],
  ['Articulate', 'স্পষ্টভাষী', 'Able to speak fluently and coherently', 'adj', 'An articulate speaker captures attention.', 'IELTS', 'hard'],
  ['Aspire', 'আকাঙ্ক্ষা করা', 'Direct hopes toward achieving something', 'verb', 'Many students aspire to study engineering.', 'HSC', 'medium'],
  ['Authentic', 'খাঁটি', 'Of undisputed origin; genuine', 'adj', 'Always verify information from authentic books.', 'HSC', 'easy'],
  ['Benevolent', 'পরোপকারী', 'Well meaning and kindly', 'adj', 'A benevolent citizen helped flood victims.', 'Admission', 'medium'],
  ['Bolster', 'শক্তিশালী করা', 'Support or strengthen', 'verb', 'Daily practice will bolster your confidence.', 'IELTS', 'hard'],
  ['Brief', 'সংক্ষিপ্ত', 'Of short duration', 'adj', 'Write a brief summary of the poem.', 'SSC', 'easy'],
  ['Candid', 'অকপট', 'Truthful and straightforward', 'adj', 'He gave a candid review of his preparation.', 'Admission', 'medium'],
  ['Catalyst', 'অনুঘটক', 'Something that precipitates an event', 'noun', 'Discipline is a catalyst for academic success.', 'HSC', 'medium'],
  ['Cautious', 'সতর্ক', 'Careful to avoid potential problems', 'adj', 'Be cautious with unit conversions in physics.', 'SSC', 'easy'],
  ['Coherent', 'সুসংগত', 'Logical and consistent', 'adj', 'Present a coherent argument in your paragraph.', 'IELTS', 'medium'],
  ['Collaborate', 'সহযোগিতা করা', 'Work jointly on an activity', 'verb', 'Classmates collaborate on lab experiments.', 'HSC', 'easy'],
  ['Compassion', 'সহমর্মিতা', 'Sympathetic pity and concern', 'noun', 'Show compassion toward everyone around you.', 'SSC', 'easy'],
  ['Comprehensive', 'ব্যাপক ও পূর্ণাঙ্গ', 'Complete and including nearly everything', 'adj', 'Follow a comprehensive revision plan.', 'HSC', 'medium'],
  ['Concise', 'সংক্ষিপ্ত ও স্পষ্ট', 'Giving much info clearly in few words', 'adj', 'Keep your creative answers clear and concise.', 'HSC', 'medium'],
  ['Consecutive', 'ধারাবাহিক', 'Following continuously', 'adj', 'She studied for seven consecutive days.', 'HSC', 'medium'],
  ['Consistent', 'ধারাবাহিক ও স্থির', 'Acting in the same way over time', 'adj', 'Consistent effort beats last-minute cramming.', 'SSC', 'easy'],
  ['Contemplate', 'গভীরভাবে চিন্তা করা', 'Look thoughtfully for a long time', 'verb', 'Take time to contemplate your long-term goals.', 'Admission', 'medium'],
  ['Contradict', 'বিরোধিতা করা', 'Assert the opposite of a statement', 'verb', 'The two observations do not contradict each other.', 'HSC', 'medium'],
  ['Crucial', 'অত্যন্ত গুরুত্বপূর্ণ', 'Of great importance', 'adj', 'Time management is crucial during admission tests.', 'SSC', 'easy'],
  ['Cultivate', 'চর্চা করা', 'Try to acquire or develop a quality', 'verb', 'Cultivate a habit of waking up early.', 'HSC', 'medium'],
  ['Dedicate', 'উৎসর্গ করা', 'Devote time or effort to a purpose', 'verb', 'Dedicate two hours daily to problem solving.', 'SSC', 'easy'],
  ['Deficient', 'ঘাটতিপূর্ণ', 'Not having enough of a specified quality', 'adj', 'A diet deficient in vitamins causes fatigue.', 'HSC', 'medium'],
  ['Deliberate', 'ইচ্ছাকৃত / সুচিন্তিত', 'Done consciously and intentionally', 'adj', 'Make deliberate progress every single morning.', 'Admission', 'medium'],
  ['Demonstrate', 'প্রদর্শন করা', 'Clearly show the existence or truth of', 'verb', 'Graphs demonstrate how velocity changes.', 'SSC', 'easy'],
  ['Deteriorate', 'অবনতি হওয়া', 'Become progressively worse', 'verb', 'Do not let your sleep schedule deteriorate.', 'IELTS', 'medium'],
  ['Diligent', 'পরিশ্রমী', 'Having or showing care in work', 'adj', 'Diligent students revise their mistakes weekly.', 'SSC', 'easy'],
  ['Diminish', 'হ্রাস পাওয়া', 'Make or become less', 'verb', 'Regular revision ensures memory does not diminish.', 'HSC', 'medium'],
  ['Discern', 'উপলব্ধি করা', 'Perceive or recognize clearly', 'adj', 'Read carefully to discern the main theme.', 'Admission', 'hard'],
  ['Diverse', 'বৈচিত্র্যময়', 'Showing a great deal of variety', 'adj', 'Bangladesh has a rich and diverse culture.', 'SSC', 'easy'],
  ['Eloquent', 'বাগ্মী', 'Fluent or persuasive in speaking or writing', 'adj', 'His eloquent essay earned top marks.', 'Admission', 'medium'],
  ['Emphasize', 'গুরুত্ব আরোপ করা', 'Give special importance to something', 'verb', 'Teachers emphasize conceptual clarity.', 'SSC', 'easy'],
  ['Empirical', 'অভিজ্ঞতালব্ধ', 'Based on observation rather than theory', 'adj', 'Chemistry relies on empirical evidence.', 'IELTS', 'hard'],
  ['Endeavor', 'প্রচেষ্টা', 'An attempt to achieve a goal', 'noun', 'Every honest endeavor brings valuable lessons.', 'HSC', 'medium'],
  ['Enhance', 'বৃদ্ধি করা', 'Intensify, increase, or further improve', 'verb', 'Reading stories will enhance your vocabulary.', 'SSC', 'easy'],
  ['Enormous', 'বিশাল', 'Very large in size or quantity', 'adj', 'Focused study makes an enormous difference.', 'SSC', 'easy'],
  ['Ephemeral', 'ক্ষণস্থায়ী', 'Lasting for a very short time', 'adj', 'Distractions bring only ephemeral pleasure.', 'Admission', 'hard'],
  ['Equitable', 'ন্যায়সঙ্গত', 'Fair and impartial', 'adj', 'Divide your study hours in an equitable way.', 'IELTS', 'hard'],
  ['Eradicate', 'নির্মূল করা', 'Destroy completely', 'verb', 'Literacy helps eradicate poverty.', 'HSC', 'medium'],
  ['Essential', 'অপরিহার্য', 'Absolutely necessary', 'adj', 'Drinking clean water is essential for focus.', 'SSC', 'easy'],
  ['Evaluate', 'মূল্যায়ন করা', 'Form an idea of the value of', 'verb', 'Evaluate your syllabus progress every Friday.', 'SSC', 'easy'],
  ['Evident', 'প্রত্যক্ষ / স্পষ্ট', 'Plain or obvious', 'adj', 'It is evident that practice improves speed.', 'HSC', 'easy'],
  ['Exacerbate', 'আরও খারাপ করা', 'Make a problem worse', 'verb', 'Skipping classes will exacerbate exam anxiety.', 'Admission', 'hard'],
  ['Exemplary', 'দৃষ্টান্তমূলক', 'Serving as a desirable model', 'adj', 'She maintained exemplary discipline all year.', 'Admission', 'medium'],
  ['Exhaustive', 'সর্বাঙ্গীণ', 'Including or considering all elements', 'adj', 'He prepared an exhaustive formula sheet.', 'IELTS', 'hard'],
  ['Feasible', 'বাস্তবসম্মত', 'Possible to do easily or conveniently', 'adj', 'Set a feasible daily study target.', 'IELTS', 'medium'],
  ['Fluctuate', 'ওঠানামা করা', 'Rise and fall irregularly', 'verb', 'Vegetable prices often fluctuate in winter.', 'IELTS', 'medium'],
  ['Foster', 'লালন করা', 'Encourage the development of something', 'verb', 'Group discussions foster deeper understanding.', 'IELTS', 'medium'],
  ['Frugal', 'মিতব্যয়ী', 'Sparing or economical with money', 'adj', 'Students benefit from a frugal monthly budget.', 'Admission', 'medium'],
  ['Fundamental', 'মৌলিক', 'Forming a necessary base or core', 'adj', 'Master the fundamental laws of mechanics first.', 'SSC', 'easy'],
  ['Genuine', 'আসল / অকৃত্রিম', 'Truly what something is said to be', 'adj', 'Curiosity is the genuine root of learning.', 'SSC', 'easy'],
  ['Gratitude', 'কৃতজ্ঞতা', 'The quality of being thankful', 'noun', 'Begin every day with prayer and gratitude.', 'SSC', 'easy'],
  ['Hinder', 'বাধাগ্রস্ত করা', 'Create difficulties for someone', 'verb', 'Excessive phone use can hinder concentration.', 'HSC', 'medium'],
  ['Hypothesis', 'অনুমান / প্রকল্প', 'A proposed explanation for a phenomenon', 'noun', 'Test your hypothesis in the science lab.', 'HSC', 'medium'],
  ['Illustrate', 'উদাহরণসহ ব্যাখ্যা করা', 'Explain by using examples or diagrams', 'verb', 'Draw a neat diagram to illustrate cell division.', 'SSC', 'easy'],
  ['Imminent', 'আসন্ন', 'About to happen', 'adj', 'With the board exam imminent, revise calmly.', 'Admission', 'medium'],
  ['Impartial', 'নিরপেক্ষ', 'Treating all rivals or disputants equally', 'adj', 'A judge must remain completely impartial.', 'HSC', 'medium'],
  ['Imperative', 'অত্যাবশ্যক', 'Of vital importance; crucial', 'adj', 'It is imperative to solve past board questions.', 'IELTS', 'hard'],
  ['Implement', 'বাস্তবায়ন করা', 'Put a decision or plan into effect', 'verb', 'Implement your weekly routine starting today.', 'HSC', 'easy'],
  ['Incentive', 'উৎসাহ / প্রণোদনা', 'A thing that motivates someone', 'noun', 'Progress badges provide a fun incentive.', 'IELTS', 'medium'],
  ['Inevitable', 'অনিবার্য', 'Certain to happen; unavoidable', 'adj', 'Mistakes are an inevitable part of learning.', 'HSC', 'medium'],
  ['Ingenious', 'উদ্ভাবনী ও চতুর', 'Clever, original, and inventive', 'adj', 'He found an ingenious shortcut for integration.', 'Admission', 'hard'],
  ['Inherent', 'অন্তর্নিহিত', 'Existing in something as a permanent attribute', 'adj', 'Every learner has inherent potential.', 'IELTS', 'hard'],
  ['Innovate', 'নতুন কিছু উদ্ভাবন করা', 'Make changes by introducing new methods', 'verb', 'Young engineers innovate affordable solutions.', 'HSC', 'easy'],
  ['Integrity', 'সততা ও নিষ্ঠা', 'The quality of being honest and moral', 'noun', 'Maintain academic integrity in every exam.', 'HSC', 'medium'],
  ['Intricate', 'জটিল ও সূক্ষ্ম', 'Very complicated or detailed', 'adj', 'Islamic geometric art features intricate symmetry.', 'Admission', 'medium'],
  ['Judicious', 'বিচক্ষণ', 'Having or showing good judgment', 'adj', 'Make judicious use of your morning hours.', 'Admission', 'hard'],
  ['Lucid', 'সহজবোধ্য', 'Expressed clearly; easy to understand', 'adj', 'The teacher gave a lucid explanation of optics.', 'Admission', 'hard'],
  ['Magnificent', 'চমৎকার / মহৎ', 'Extremely beautiful or impressive', 'adj', 'The Sundarbans is a magnificent mangrove forest.', 'SSC', 'easy'],
  ['Meticulous', 'অত্যন্ত যত্নশীল', 'Showing great attention to detail', 'adj', 'Meticulous calculation prevents silly errors.', 'Admission', 'hard'],
  ['Mitigate', 'প্রশমিত করা', 'Make less severe, serious, or painful', 'verb', 'Tree plantation helps mitigate heatwaves.', 'IELTS', 'hard'],
  ['Modest', 'বিনয়ী', 'Unassuming in the estimation of abilities', 'adj', 'Despite topping the exam, she stayed modest.', 'SSC', 'easy'],
  ['Momentum', 'গতিবেগ / ধারা', 'Strength gained by a series of events', 'noun', 'Twenty-five minutes of focus builds momentum.', 'HSC', 'medium'],
  ['Novice', 'নবীন শিক্ষার্থী', 'A person new to an activity', 'noun', 'Even an expert coder was once a novice.', 'Admission', 'medium'],
  ['Obsolete', 'অপ্রচলিত', 'No longer produced or used', 'adj', 'Typewriters have become largely obsolete.', 'HSC', 'medium'],
  ['Optimistic', 'আশাবাদী', 'Hopeful and confident about the future', 'adj', 'Stay optimistic and keep working steadily.', 'SSC', 'easy'],
  ['Paradigm', 'দৃষ্টান্ত / কাঠামো', 'A typical example or pattern of something', 'noun', 'Digital tools created a new learning paradigm.', 'IELTS', 'hard'],
  ['Persevere', 'অধ্যবসায় বজায় রাখা', 'Continue in a course of action despite difficulty', 'verb', 'Persevere through tough chapters with patience.', 'HSC', 'medium'],
  ['Plausible', 'বিশ্বাসযোগ্য', 'Seeming reasonable or probable', 'adj', 'Eliminate unplausible options in MCQ tests.', 'Admission', 'hard'],
  ['Pragmatic', 'বাস্তববাদী', 'Dealing with things sensibly and realistically', 'adj', 'Take a pragmatic approach to syllabus completion.', 'Admission', 'hard'],
  ['Precise', 'সুনির্দিষ্ট', 'Marked by exactness and accuracy', 'adj', 'Write precise definitions in chemistry papers.', 'SSC', 'easy'],
  ['Profound', 'গভীর', 'Very great or intense', 'adj', 'Good books leave a profound impact on character.', 'HSC', 'medium'],
  ['Prolific', 'বহুপ্রসূ', ' Producing much fruit or many works', 'adj', 'Kazi Nazrul Islam was a prolific poet.', 'Admission', 'hard'],
  ['Prudent', 'দূরদর্শী', 'Acting with care and thought for the future', 'adj', 'Saving a portion of pocket money is prudent.', 'Admission', 'medium'],
  ['Resilient', 'ঘাতসহিষ্ণু', 'Able to recover quickly from difficulties', 'adj', 'Bangladeshi farmers are remarkably resilient.', 'IELTS', 'medium'],
  ['Rigorous', 'কঠোর ও পুঙ্খানুপুঙ্খ', 'Extremely thorough and careful', 'adj', 'Admission candidates follow rigorous practice.', 'IELTS', 'medium'],
  ['Scrutinize', 'সূক্ষ্মভাবে পরীক্ষা করা', 'Examine or inspect closely and thoroughly', 'verb', 'Scrutinize your answer script before submitting.', 'Admission', 'hard'],
  ['Substantial', 'উল্লেখযোগ্য', 'Of considerable importance, size, or worth', 'adj', 'She made substantial progress in organic chemistry.', 'IELTS', 'medium'],
  ['Tenacious', 'দৃঢ়প্রতিজ্ঞ', 'Tending to keep a firm hold; persistent', 'adj', 'Tenacious learners never give up on mathematics.', 'Admission', 'hard'],
];

export function buildStarterVocabulary(): VocabWord[] {
  const today = new Date().toISOString().slice(0, 10);
  return RAW_VOCAB.map((item, idx) => ({
    id: `starter_word_${idx + 1}`,
    word: item[0],
    bnMeaning: item[1],
    enMeaning: item[2],
    partOfSpeech: item[3],
    example: item[4],
    tag: item[5],
    difficulty: item[6],
    reviewed: false,
    intervalDays: 0,
    nextReviewDate: today,
  }));
}

export interface PracticeStory {
  id: string;
  language: 'bn' | 'en';
  title: string;
  author: string;
  readingMinutes: number;
  moral: string;
  paragraphs: string[];
}

export const ORIGINAL_PRACTICE_STORIES: PracticeStory[] = [
  {
    id: 'story_bn_1',
    language: 'bn',
    title: 'ভোরের পঁচিশ মিনিট',
    author: 'লাইফট্র্যাক মৌলিক গল্প',
    readingMinutes: 3,
    moral: 'বড় সাফল্যের শুরু হয় প্রতিদিনের ছোট ও নিয়মিত পদক্ষেপ থেকে।',
    paragraphs: [
      'রাফি তখন একাদশ শ্রেণির ছাত্র। টেবিলের ওপর পদার্থবিজ্ঞান, রসায়ন আর উচ্চতর গণিতের মোটা বইগুলো দেখলেই তার বুক ধড়ফড় করত। প্রতিদিন ভাবত আজ সারাদিন আট ঘণ্টা পড়বে, কিন্তু শুরু করতে করতেই দুপুর পেরিয়ে যেত। দিনশেষে অপরাধবোধ ছাড়া কিছুই জমত না।',
      'একদিন তার কলেজের গণিত শিক্ষক বললেন, রাফি, পুরো পাহাড়টা এক লাফে পার হওয়ার চেষ্টা কোরো না। প্রতিদিন ফজরের পর মাত্র পঁচিশ মিনিট সবচেয়ে কঠিন অধ্যায়টা মনোযোগ দিয়ে পড়ো। ফোনটা অন্য ঘরে রাখবে।',
      'পরদিন ভোরবেলা রাফি অ্যালার্ম শুনে উঠে অজু করে নামাজ পড়ল। তারপর ঘড়িতে ঠিক পঁচিশ মিনিটের টাইমার দিয়ে ভেক্টর অধ্যায়টা খুলল। প্রথম পাঁচ মিনিট মন উসখুস করলেও কিছুক্ষণের মধ্যেই সে অঙ্কের ভেতরে ডুবে গেল। টাইমার বাজার পর সে অবাক হয়ে দেখল তিনটি সৃজনশীল সমস্যার মূল সূত্র সে বুঝে ফেলেছে।',
      'সেই ছোট্ট পঁচিশ মিনিট রাফির আত্মবিশ্বাস বদলে দিল। এক সপ্তাহের মধ্যে এক সেশন থেকে দুটি, দুটি থেকে চারটি সেশন হতে লাগল। ছয় মাস পর অর্ধবার্ষিক পরীক্ষায় রাফি যখন নিজের ফলাফল দেখল, তখন সে বুঝল—অপেক্ষা নয়, ছোট শুরুই আসল শক্তি।',
    ],
  },
  {
    id: 'story_bn_2',
    language: 'bn',
    title: 'মাটির ব্যাংকের শিক্ষা',
    author: 'লাইফট্র্যাক মৌলিক গল্প',
    readingMinutes: 3,
    moral: 'মিতব্যয়িতা ও পরিকল্পিত সঞ্চয় মানুষকে অসময়ে স্বাবলম্বী রাখে।',
    paragraphs: [
      'মালিহা রাজশাহী শহরের একটি মেসে থেকে বিশ্ববিদ্যালয়ে পড়ার প্রস্তুতি নিচ্ছিল। মাসের প্রথম দশ দিনেই টিফিন আর অপ্রয়োজনীয় কেনাকাটায় তার হাতখরচের বড় অংশ শেষ হয়ে যেত। মাসের শেষ সপ্তাহে এসে বই বা খাতা কিনতে গিয়ে তাকে বারবার দুশ্চিন্তায় পড়তে হতো।',
      'পাশের রুমের বড় আপু তানিয়া তাকে একটি সহজ বুদ্ধি দিলেন। তানিয়া বললেন, প্রতিদিন রাতে ঘুমানোর আগে মাত্র দুই মিনিট সময় নিয়ে দিনের প্রতিটি খরচ খাতায় লিখবে। আর মাসের শুরুতেই অন্তত দশ শতাংশ টাকা আলাদা করে রাখবে।',
      'মালিহা সেদিন থেকেই নিজের ছোট্ট বাজেট খাতা চালু করল। চায়ের দোকানে অহেতুক খরচ কমিয়ে সে সপ্তাহে তিনশো টাকা বাঁচাতে শুরু করল। তিন মাস পর হঠাৎ যখন তার ক্যালকুলেটরটি নষ্ট হয়ে গেল, তখন তাকে আর বাড়িতে ফোন করে টাকা চাইতে হলো না।',
      'নিজের জমানো অর্থে নতুন ক্যালকুলেটর কেনার দিন মালিহা অনুভব করল, টাকার পরিমাণ কম বা বেশি হওয়া বড় কথা নয়—হিসাব রাখার অভ্যাসই মানুষের মনে সত্যিকারের স্বস্তি আনে।',
    ],
  },
  {
    id: 'story_bn_3',
    language: 'bn',
    title: 'বৃষ্টির বিকেলের সততা',
    author: 'লাইফট্র্যাক মৌলিক গল্প',
    readingMinutes: 3,
    moral: 'সততা ও আমানতদারিতা মানুষের চরিত্রকে সবচেয়ে উজ্জ্বল করে তোলে।',
    paragraphs: [
      'শ্রাবণ মাসের ঝুম বৃষ্টিতে কোচিং শেষ করে বাড়ি ফিরছিল নবম শ্রেণির ছাত্র সামির। রিকশার হুড তুলে বসে থাকার সময় সে লক্ষ্য করল সিটের এক কোণে একটি কালো রঙের চামড়ার ব্যাগ পড়ে আছে। রিকশাওয়ালা মামা তখন বৃষ্টির পানিতে পথ দেখতেই ব্যস্ত।',
      'সামির ব্যাগটি হাতে নিয়ে দেখল ভেতরে একটি ফাইলে একজন রোগীর জরুরি প্রেসক্রিপশন, পরীক্ষার রিপোর্ট এবং ওষুধ কেনার বেশ কিছু টাকা রয়েছে। ফাইলের গায়ে একটি মোবাইল নম্বর লেখা ছিল, কিন্তু বৃষ্টির ছাঁটে শেষের একটি সংখ্যা অস্পষ্ট হয়ে গেছে।',
      'সামির বাড়ি না ফিরে রিকশাওয়ালা মামাকে অনুরোধ করল আগের যাত্রীকে যেখানে নামিয়েছিলেন সেই ফার্মেসির সামনে ফিরে যেতে। সেখানে পৌঁছে তারা দেখলেন একজন বয়স্ক ভদ্রলোক ছাতা হাতে উদ্বিগ্ন মুখে এদিক-ওদিক খুঁজছেন। ব্যাগটি হাতে পেয়ে ভদ্রলোকের চোখ ভিজে উঠল।',
      'তিনি সামিরকে পুরস্কৃত করতে চাইলেন, কিন্তু সামির বিনয়ের সাথে বলল, আঙ্কেল, শুধু আমার জন্য দোয়া করবেন। ভেজা কাপড়ে বাড়ি ফিরেও সেদিন সামিরের মনটা ছিল অদ্ভুত এক প্রশান্তিতে ভরা।',
    ],
  },
  {
    id: 'story_en_1',
    language: 'en',
    title: 'The Quiet Lantern on the Riverbank',
    author: 'LifeTrack Original',
    readingMinutes: 3,
    moral: 'Consistent small efforts illuminate even the longest journey.',
    paragraphs: [
      'Nabil lived near a calm river in Sylhet and dreamed of earning a scholarship at a leading university. Every evening he watched boats glide past in the mist, each carrying a modest lantern at its bow. Although the lantern shone only a few meters ahead, the boatmen always reached the distant market safely.',
      'Whenever Nabil looked at his thick syllabus, he felt overwhelmed by the chapters still left untouched. His elder sister noticed his worry and pointed toward a passing boat. She reminded him that a lantern never lights the entire river at once; it only needs to illuminate the next honest step.',
      'Encouraged by this simple idea, Nabil became diligent and structured his evenings carefully. He began reviewing ten new English words, solving five analytical problems, and writing concise notes before sleeping. Whenever a difficult topic tried to hinder his momentum, he remained patient and resilient.',
      'Months later, when the admission results were announced, Nabil saw his roll number near the top of the merit list. Standing by the riverbank in gratitude, he realized that steady habits had quietly carried him across the widest waters.',
    ],
  },
  {
    id: 'story_en_2',
    language: 'en',
    title: 'Two Notebooks in the Library',
    author: 'LifeTrack Original',
    readingMinutes: 3,
    moral: 'Learning from mistakes is the fastest path to mastery.',
    paragraphs: [
      'Farhana was a dedicated candidate who spent long hours in her college library, yet her model test scores continued to fluctuate. She filled notebook after notebook with neat summaries, hoping that reading chapters repeatedly would guarantee an exemplary score.',
      'One afternoon, her mentor examined her desk and suggested a pragmatic change. Instead of keeping only one notebook for lectures, Farhana should cultivate a second notebook dedicated exclusively to mistakes. Every wrong answer needed a brief note explaining why the error happened and what concept was missed.',
      'At first, scrutinizing her own errors felt uncomfortable, because nobody enjoys facing weaknesses. Soon, however, the mistake notebook became her most authentic teacher. Ambiguous concepts in chemistry and physics became lucid once she wrote precise corrections in her own words.',
      'By the final examination, Farhana walked into the hall calm and optimistic. Her preparation was no longer built on guesswork; it stood on genuine understanding earned one corrected mistake at a time.',
    ],
  },
];

export interface ExerciseItem {
  key: string;
  bn: string;
  en: string;
  defaultMode: 'reps' | 'duration' | 'distance';
  met: number; // Metabolic equivalent for approximate calorie calculation
}

export const EXERCISE_LIBRARY: ExerciseItem[] = [
  { key: 'pushups', bn: 'পুশ-আপ', en: 'Push-ups', defaultMode: 'reps', met: 6.0 },
  { key: 'squats', bn: 'স্কোয়াট', en: 'Squats', defaultMode: 'reps', met: 5.5 },
  { key: 'plank', bn: 'প্ল্যাঙ্ক', en: 'Plank', defaultMode: 'duration', met: 4.0 },
  { key: 'situps', bn: 'সিট-আপ', en: 'Sit-ups', defaultMode: 'reps', met: 5.0 },
  { key: 'jumping_jacks', bn: 'জাম্পিং জ্যাকস', en: 'Jumping jacks', defaultMode: 'reps', met: 7.5 },
  { key: 'lunges', bn: 'লাঞ্জেস', en: 'Lunges', defaultMode: 'reps', met: 5.5 },
  { key: 'burpees', bn: 'বার্পিস', en: 'Burpees', defaultMode: 'reps', met: 8.5 },
  { key: 'skipping', bn: 'দড়িলাফ', en: 'Skipping', defaultMode: 'duration', met: 9.0 },
  { key: 'running', bn: 'দৌড়ানো', en: 'Running', defaultMode: 'distance', met: 9.5 },
  { key: 'walking', bn: 'হাঁটা', en: 'Walking', defaultMode: 'distance', met: 3.8 },
  { key: 'stretching', bn: 'স্ট্রেচিং', en: 'Stretching', defaultMode: 'duration', met: 2.5 },
  { key: 'yoga', bn: 'ইয়োগা / ব্যায়াম', en: 'Yoga', defaultMode: 'duration', met: 3.0 },
  { key: 'cycling', bn: 'সাইক্লিং', en: 'Cycling', defaultMode: 'distance', met: 7.0 },
  { key: 'swimming', bn: 'সাঁতার', en: 'Swimming', defaultMode: 'duration', met: 8.0 },
];

export const QUICK_WORKOUT_ROUTINES = [
  {
    id: 'qr_morning_5',
    bn: '৫ মিনিটের সকালের স্ট্রেচ',
    en: '5-Minute Morning Stretch',
    minutes: 5,
    stepsBn: ['ঘাড় ও কাঁধ ঘোরানো (৬০ সেকেন্ড)', 'হাত ও পিঠ প্রসারিত করা (৯০ সেকেন্ড)', 'হালকা স্কোয়াট ১০ বার', 'গভীর শ্বাস ও শিথিলকরণ (৯০ সেকেন্ড)'],
    stepsEn: ['Neck & shoulder rolls (60s)', 'Overhead back stretch (90s)', '10 gentle squats', 'Deep breathing & posture reset (90s)'],
  },
  {
    id: 'qr_home_10',
    bn: '১০ মিনিটের ঘরোয়া ব্যায়াম',
    en: '10-Minute Home Workout',
    minutes: 10,
    stepsBn: ['জাম্পিং জ্যাকস (৬০ সেকেন্ড)', 'পুশ-আপ (২ সেট x ১০ বার)', 'স্কোয়াট (২ সেট x ১৫ বার)', 'প্ল্যাঙ্ক (৪৫ সেকেন্ড)', 'স্ট্রেচিং বিরতি (৬০ সেকেন্ড)'],
    stepsEn: ['Jumping jacks (60s)', 'Push-ups (2 sets x 10)', 'Bodyweight squats (2 sets x 15)', 'Plank hold (45s)', 'Cool-down stretch (60s)'],
  },
  {
    id: 'qr_desk_break',
    bn: 'পড়ার বিরতিতে ডেস্ক ব্যায়াম',
    en: 'Study-Break Desk Exercise',
    minutes: 4,
    stepsBn: ['চোখের বিশ্রাম ২০-২০-২০ নিয়ম (৩০ সেকেন্ড)', 'বসে মেরুদণ্ড টুইস্ট (৬০ সেকেন্ড)', 'কবজি ও আঙুল স্ট্রেচ (৬০ সেকেন্ড)', 'দাঁড়িয়ে গোড়ালি উঁচু করা ১৫ বার'],
    stepsEn: ['20-20-20 eye rest (30s)', 'Seated spinal twist (60s)', 'Wrist & finger stretch (60s)', 'Standing calf raises x 15'],
  },
];

export const DAILY_QUOTES = [
  {
    bn: 'প্রতিদিনের ছোট ছোট নিয়মিত প্রচেষ্টাই একদিন বড় সাফল্যে রূপ নেয়।',
    en: 'Small disciplines repeated with consistency every day lead to great achievements.',
  },
  {
    bn: 'আজকের এক ঘণ্টার মনোযোগ আগামীকালের দশ ঘণ্টার দুশ্চিন্তা কমিয়ে দেয়।',
    en: 'One hour of calm focus today saves ten hours of panic tomorrow.',
  },
  {
    bn: 'নিজের ভুলগুলো সংশোধন করার মধ্যেই লুকিয়ে আছে প্রকৃত মেধার বিকাশ।',
    en: 'True mastery grows when you patiently review and correct your own mistakes.',
  },
  {
    bn: 'সময়ের বরকত আসে নিয়মিত নামাজ, সুশৃঙ্খল রুটিন এবং সৎ নিয়ত থেকে।',
    en: 'Blessing in time comes through prayer, structured routine, and sincere intention.',
  },
  {
    bn: 'অন্যের সাথে নয়, প্রতিদিন নিজের গতকালের অবস্থানের সাথে প্রতিযোগিতা করো।',
    en: 'Compete not with others, only with the version of yourself from yesterday.',
  },
];

export const DEFAULT_MONEY_CATEGORIES = [
  { id: 'Food', bn: 'খাবার', en: 'Food' },
  { id: 'Transport', bn: 'যাতায়াত', en: 'Transport' },
  { id: 'Education', bn: 'শিক্ষা ও বই', en: 'Education' },
  { id: 'Bills', bn: 'বিল ও রিচার্জ', en: 'Bills' },
  { id: 'Shopping', bn: 'কেনাকাটা', en: 'Shopping' },
  { id: 'Health', bn: 'স্বাস্থ্য', en: 'Health' },
  { id: 'Charity', bn: 'দান ও সদকা', en: 'Charity' },
  { id: 'Other', bn: 'অন্যান্য', en: 'Other' },
];
