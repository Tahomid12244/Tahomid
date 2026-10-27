import React, { useRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface SubTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SubTabBarProps {
  tabs: SubTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const SubTabBar: React.FC<SubTabBarProps> = ({ tabs, activeId, onSelect }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleTap = (id: string) => {
    onSelect(id);
    const btn = btnRefs.current[id];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className="sticky top-[62px] z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="relative max-w-5xl mx-auto">
        {/* Left & Right edge fade gradients */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10"
        />

        <div
          ref={containerRef}
          className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar snap-x snap-mandatory px-3 py-2"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  btnRefs.current[tab.id] = el;
                }}
                type="button"
                onClick={() => handleTap(tab.id)}
                className={`snap-center shrink-0 min-h-[44px] px-4 rounded-full flex items-center gap-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                  active
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
