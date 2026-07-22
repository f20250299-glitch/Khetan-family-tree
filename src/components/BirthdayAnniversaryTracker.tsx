import React, { useMemo } from 'react';
import { Person, Language } from '../types';
import { Calendar as CalendarIcon, Cake, Sparkles, Gift } from 'lucide-react';
import { t } from '../utils/translations';

interface BirthdayAnniversaryTrackerProps {
  persons: Person[];
  language: Language;
  onSelectPerson: (person: Person) => void;
}

export const BirthdayAnniversaryTracker: React.FC<BirthdayAnniversaryTrackerProps> = ({
  persons,
  language,
  onSelectPerson,
}) => {
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    const living = persons.filter((p) => p.isAlive && p.birthDate);

    const mapped = living.map((p) => {
      const bdate = new Date(p.birthDate!);
      const bMonth = bdate.getMonth();
      const bDay = bdate.getDate();

      // Calculate days until next birthday
      let nextBday = new Date(today.getFullYear(), bMonth, bDay);
      if (nextBday < today) {
        nextBday = new Date(today.getFullYear() + 1, bMonth, bDay);
      }

      const diffTime = nextBday.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const turningAge = nextBday.getFullYear() - bdate.getFullYear();

      return {
        person: p,
        nextBday,
        daysLeft,
        turningAge,
        formattedDate: `${bdate.toLocaleString('default', { month: 'short' })} ${bDay}`,
      };
    });

    mapped.sort((a, b) => a.daysLeft - b.daysLeft);
    return mapped;
  }, [persons]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
      <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-3">
        <Cake className="w-5 h-5 text-[#C2410C]" />
        <h2 className="text-lg font-serif font-bold uppercase tracking-tight text-[#1A1A1A]">
          {t(language, 'upcomingEvents')}
        </h2>
      </div>

      <div className="space-y-4">
        {upcomingBirthdays.map(({ person, daysLeft, turningAge, formattedDate }) => {
          const nameDisplay = language === 'hi' && person.nameHindi ? person.nameHindi : person.name;

          return (
            <div
              key={person.id}
              onClick={() => onSelectPerson(person)}
              className="bg-white border border-[#1A1A1A] p-4 flex items-center justify-between gap-3 transition cursor-pointer shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[6px_6px_0px_#1A1A1A] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={
                    person.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={person.name}
                  className="w-12 h-12 border border-[#1A1A1A] object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-serif font-bold text-[#1A1A1A] truncate">{nameDisplay}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#555] font-sans mt-0.5">
                    <span className="italic">{formattedDate}</span>
                    <span>•</span>
                    <span className="text-[#C2410C] font-semibold">
                      Turning {turningAge} {t(language, 'age')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 font-sans">
                {daysLeft === 0 ? (
                  <span className="bg-[#C2410C] text-white border border-[#1A1A1A] px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#1A1A1A] animate-pulse">
                    🎂 Today!
                  </span>
                ) : (
                  <span className="bg-[#F7F5F2] text-[#1A1A1A] border border-[#1A1A1A] px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#1A1A1A]">
                    In {daysLeft} days
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {upcomingBirthdays.length === 0 && (
          <div className="text-center py-10 text-[#555] font-serif italic text-xs">
            {t(language, 'noEvents')}
          </div>
        )}
      </div>
    </div>
  );
};
