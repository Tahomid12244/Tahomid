import React from 'react';
import { BarChart3, BookOpenCheck, CalendarRange, Clock, History, Trophy } from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { t } from '../../../utils/i18n';
import { SubTabBar, SubTabItem } from '../../common/SubTabBar';
import { StudyLogsTab, StudyTimerTab } from './StudyTimerAndLogs';
import { StudySyllabusTab } from './StudySyllabus';
import { StudyExamsTab, StudyPlannerTab, StudyProgressTab } from './StudyPlannerProgressExams';

export const StudyModule: React.FC = () => {
  const { lang, studySubTab, navigateTo } = useLifeTrack();

  const tabs: SubTabItem[] = [
    { id: 'timer', label: t('studyTabTimer', lang), icon: Clock },
    { id: 'logs', label: t('studyTabLogs', lang), icon: History },
    { id: 'syllabus', label: t('studyTabSyllabus', lang), icon: BookOpenCheck },
    { id: 'planner', label: t('studyTabPlanner', lang), icon: CalendarRange },
    { id: 'progress', label: t('studyTabProgress', lang), icon: BarChart3 },
    { id: 'exams', label: t('studyTabExams', lang), icon: Trophy },
  ];

  return (
    <div>
      <SubTabBar
        tabs={tabs}
        activeId={studySubTab}
        onSelect={(id) => navigateTo('study', id)}
      />
      <div className="max-w-5xl mx-auto px-3 pt-4 pb-24">
        {studySubTab === 'timer' && <StudyTimerTab />}
        {studySubTab === 'logs' && <StudyLogsTab />}
        {studySubTab === 'syllabus' && <StudySyllabusTab />}
        {studySubTab === 'planner' && <StudyPlannerTab />}
        {studySubTab === 'progress' && <StudyProgressTab />}
        {studySubTab === 'exams' && <StudyExamsTab />}
      </div>
    </div>
  );
};
