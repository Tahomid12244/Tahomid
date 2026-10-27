import React from 'react';
import {
  Award,
  BookHeart,
  BookOpen,
  CalendarClock,
  CheckSquare,
  Droplets,
  Dumbbell,
  Languages,
  Moon,
} from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { t } from '../../../utils/i18n';
import { SubTabBar, SubTabItem } from '../../common/SubTabBar';
import {
  DailyHabitsTab,
  DailyRoutineTab,
  DailyWaterTab,
  DailyWorkoutTab,
} from './DailyHabitsRoutineWaterWorkout';
import { DailyBadgesTab, DailyJournalTab, DailySleepMoodTab } from './DailySleepJournalBadges';
import { DailyStorybookTab, DailyVocabTab } from './DailyVocabAndStorybook';

export const DailyModule: React.FC = () => {
  const { dailySubTab, navigateTo, lang } = useLifeTrack();

  // Exact required order: Habits, Routine, Water, Workout, Vocabulary, Storybook, Sleep & Mood, Journal, Badges
  const tabs: SubTabItem[] = [
    { id: 'habits', label: t('dailyTabHabits', lang), icon: CheckSquare },
    { id: 'routine', label: t('dailyTabRoutine', lang), icon: CalendarClock },
    { id: 'water', label: t('dailyTabWater', lang), icon: Droplets },
    { id: 'workout', label: t('dailyTabWorkout', lang), icon: Dumbbell },
    { id: 'vocab', label: t('dailyTabVocab', lang), icon: Languages },
    { id: 'storybook', label: t('dailyTabStorybook', lang), icon: BookOpen },
    { id: 'sleep', label: t('dailyTabSleep', lang), icon: Moon },
    { id: 'journal', label: t('dailyTabJournal', lang), icon: BookHeart },
    { id: 'badges', label: t('dailyTabBadges', lang), icon: Award },
  ];

  return (
    <div className="min-h-full">
      <SubTabBar
        tabs={tabs}
        activeId={dailySubTab}
        onSelect={(sub) => navigateTo('daily', sub)}
      />

      <div className="max-w-3xl mx-auto px-3.5 pt-4 pb-24">
        {dailySubTab === 'habits' && <DailyHabitsTab />}
        {dailySubTab === 'routine' && <DailyRoutineTab />}
        {dailySubTab === 'water' && <DailyWaterTab />}
        {dailySubTab === 'workout' && <DailyWorkoutTab />}
        {dailySubTab === 'vocab' && <DailyVocabTab />}
        {dailySubTab === 'storybook' && <DailyStorybookTab />}
        {dailySubTab === 'sleep' && <DailySleepMoodTab />}
        {dailySubTab === 'journal' && <DailyJournalTab />}
        {dailySubTab === 'badges' && <DailyBadgesTab />}
      </div>
    </div>
  );
};

export default DailyModule;
