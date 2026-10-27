import React from 'react';
import { BookOpen, Calendar, Clock, Compass, HeartHandshake, Sparkles } from 'lucide-react';
import { useLifeTrack } from '../../../context/LifeTrackContext';
import { t } from '../../../utils/i18n';
import { SubTabBar, SubTabItem } from '../../common/SubTabBar';
import { IslamicIbadahTab, IslamicPrayerTab } from './IslamicPrayerAndIbadah';
import {
  IslamicCalendarTab,
  IslamicDuaTab,
  IslamicQiblaTab,
  IslamicQuranTab,
} from './IslamicQuranDuaCalendarQibla';

export const IslamicModule: React.FC = () => {
  const { islamicSubTab, navigateTo, lang } = useLifeTrack();

  const tabs: SubTabItem[] = [
    { id: 'prayer', label: t('islamicTabPrayer', lang), icon: Clock },
    { id: 'ibadah', label: t('islamicTabIbadah', lang), icon: Sparkles },
    { id: 'quran', label: t('islamicTabQuran', lang), icon: BookOpen },
    { id: 'dua', label: t('islamicTabDua', lang), icon: HeartHandshake },
    { id: 'calendar', label: t('islamicTabCalendar', lang), icon: Calendar },
    { id: 'qibla', label: t('islamicTabQibla', lang), icon: Compass },
  ];

  // Subtle Islamic geometric pattern applied strictly inside Islamic Life section
  return (
    <div className="min-h-full islamic-pattern">
      <SubTabBar
        tabs={tabs}
        activeId={islamicSubTab}
        onSelect={(sub) => navigateTo('islamic', sub)}
      />

      <div className="max-w-3xl mx-auto px-3.5 pt-4 pb-24">
        {islamicSubTab === 'prayer' && <IslamicPrayerTab />}
        {islamicSubTab === 'ibadah' && <IslamicIbadahTab />}
        {islamicSubTab === 'quran' && <IslamicQuranTab />}
        {islamicSubTab === 'dua' && <IslamicDuaTab />}
        {islamicSubTab === 'calendar' && <IslamicCalendarTab />}
        {islamicSubTab === 'qibla' && <IslamicQiblaTab />}
      </div>
    </div>
  );
};

export default IslamicModule;
