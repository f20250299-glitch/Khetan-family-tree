import React, { useMemo } from 'react';
import { Person, Language } from '../types';
import { calculateGenerations } from '../utils/relationshipEngine';
import { Search, ChevronRight, User, Heart, Sparkles } from 'lucide-react';
import { t } from '../utils/translations';

interface GenerationListViewProps {
  persons: Person[];
  language: Language;
  onSelectPerson: (person: Person) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const GenerationListView: React.FC<GenerationListViewProps> = ({
  persons,
  language,
  onSelectPerson,
  searchQuery,
  setSearchQuery,
}) => {
  const structuredPersons = useMemo(() => calculateGenerations(persons), [persons]);

  // Group by generation
  const generationGroups = useMemo(() => {
    const map = new Map<number, Person[]>();
    structuredPersons.forEach((p) => {
      const g = p.generation || 1;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    });

    const keys = Array.from(map.keys()).sort((a, b) => a - b);
    return keys.map((genKey) => {
      let titleEn = `Generation ${genKey}`;
      let titleHi = `पीढ़ी ${genKey}`;

      if (genKey === 1) {
        titleEn = 'Generation 1: Grandparents & Elders';
        titleHi = 'प्रथम पीढ़ी: दादा-दादी एवं पूर्वज';
      } else if (genKey === 2) {
        titleEn = 'Generation 2: Parents & Uncles/Aunts';
        titleHi = 'द्वितीय पीढ़ी: माता-पिता एवं चाचा-ताऊ';
      } else if (genKey === 3) {
        titleEn = 'Generation 3: Self, Cousins & Siblings';
        titleHi = 'तृतीय पीढ़ी: स्वयं, भाई-बहन एवं कज़न';
      } else if (genKey === 4) {
        titleEn = 'Generation 4: Children & Nephews/Nieces';
        titleHi = 'चतुर्थ पीढ़ी: संतान एवं भतीजे/भांजे';
      }

      return {
        generation: genKey,
        title: language === 'hi' ? titleHi : titleEn,
        members: map.get(genKey) || [],
      };
    });
  }, [structuredPersons, language]);

  // Search Filter
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return generationGroups;
    const q = searchQuery.toLowerCase().trim();

    return generationGroups
      .map((group) => {
        const filtered = group.members.filter((p) => {
          return (
            p.name.toLowerCase().includes(q) ||
            (p.nameHindi && p.nameHindi.toLowerCase().includes(q)) ||
            (p.relationNotes && p.relationNotes.toLowerCase().includes(q)) ||
            (p.currentLocation && p.currentLocation.toLowerCase().includes(q))
          );
        });
        return { ...group, members: filtered };
      })
      .filter((group) => group.members.length > 0);
  }, [generationGroups, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-20">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#1A1A1A] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(language, 'searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#1A1A1A] text-[#1A1A1A] placeholder-[#888] text-xs font-serif italic focus:outline-none shadow-[4px_4px_0px_#1A1A1A]"
        />
      </div>

      {/* Generation Sections */}
      {filteredGroups.map((group) => (
        <div key={group.generation} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1A1A1A] pb-2">
            <span className="w-7 h-7 bg-[#1A1A1A] text-white font-sans font-bold text-xs flex items-center justify-center border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
              G{group.generation}
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1A1A1A] uppercase tracking-tight">{group.title}</h2>
            <span className="ml-auto text-xs text-[#555] font-sans font-medium italic">
              ({group.members.length} {language === 'hi' ? 'सदस्य' : 'members'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.members.map((person) => {
              const nameDisplay = language === 'hi' && person.nameHindi ? person.nameHindi : person.name;
              const altName = language === 'hi' ? person.name : person.nameHindi;
              const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '';
              const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : '';

              return (
                <div
                  key={person.id}
                  onClick={() => onSelectPerson(person)}
                  className="bg-white border border-[#1A1A1A] p-4 flex items-center justify-between gap-3 transition cursor-pointer shadow-[4px_4px_0px_#1A1A1A] hover:shadow-[6px_6px_0px_#1A1A1A] hover:translate-x-[-1px] hover:translate-y-[-1px] group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-serif font-bold text-[#1A1A1A] truncate group-hover:text-[#C2410C] transition">
                          {nameDisplay}
                        </h3>
                        {!person.isAlive && (
                          <span className="text-[10px] text-white bg-[#1A1A1A] px-1 font-serif font-bold">
                            †
                          </span>
                        )}
                      </div>

                      {altName && <p className="text-xs text-[#C2410C] font-serif italic truncate">{altName}</p>}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#555]">
                        {birthYear && (
                          <span className="font-sans italic">
                            {person.isAlive ? `b. ${birthYear}` : `${birthYear} - ${deathYear || '?'}`}
                          </span>
                        )}
                        {person.currentLocation && (
                          <>
                            <span>•</span>
                            <span className="truncate font-sans">{person.currentLocation}</span>
                          </>
                        )}
                      </div>

                      {person.relationNotes && (
                        <p className="mt-1 text-[10px] text-[#666] italic truncate">
                          {person.relationNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#1A1A1A] group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filteredGroups.length === 0 && (
        <div className="text-center py-12 text-[#555] font-serif italic text-sm">
          No family members matched your search filter.
        </div>
      )}
    </div>
  );
};
