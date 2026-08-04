import React, { useState, useMemo } from 'react';
import { Person, Language } from '../types';
import { getAllRelationshipsForPerson } from '../utils/relationshipEngine';
import {
  X,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Heart,
  Edit2,
  Trash2,
  Sparkles,
  Info,
  User,
  Users,
  Share2,
} from 'lucide-react';
import { t } from '../utils/translations';

interface PersonDetailModalProps {
  person: Person | null;
  allPersons: Person[];
  language: Language;
  onClose: () => void;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
  isEditMode: boolean;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  person,
  allPersons,
  language,
  onClose,
  onEdit,
  onDelete,
  isEditMode,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'relations'>('profile');

  // Compute all auto relationships
  const autoRelations = useMemo(() => {
    if (!person) return [];
    return getAllRelationshipsForPerson(allPersons, person.id);
  }, [person, allPersons]);

  if (!person) return null;

  const age = person.birthDate
    ? Math.floor(
        (new Date(person.deathDate || Date.now()).getTime() - new Date(person.birthDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  const personMap = new Map<string, Person>(allPersons.map((p) => [p.id, p]));

  // Related direct family
  const parents = person.parentIds.map((id) => personMap.get(id)).filter(Boolean) as Person[];
  const spouses = person.spouseIds.map((id) => personMap.get(id)).filter(Boolean) as Person[];
  const children = person.childrenIds.map((id) => personMap.get(id)).filter(Boolean) as Person[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F7F5F2] border-2 border-[#1A1A1A] w-full max-w-lg overflow-hidden shadow-[10px_10px_0px_#1A1A1A] flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="relative bg-white p-5 border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-serif font-bold text-[#1A1A1A] truncate leading-tight">
                {language === 'hi' && person.nameHindi ? person.nameHindi : person.name}
              </h2>
              {person.nameHindi && (
                <p className="text-sm text-[#C2410C] font-serif italic truncate">
                  {language === 'hi' ? person.name : person.nameHindi}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] px-2 py-0.5 border border-[#1A1A1A] font-sans font-bold uppercase tracking-wider ${
                    person.isAlive
                      ? 'bg-[#F7F5F2] text-[#1A1A1A]'
                      : 'bg-[#1A1A1A] text-white'
                  }`}
                >
                  {person.isAlive ? t(language, 'living') : t(language, 'deceased')}
                </span>
                {age !== null && (
                  <span className="text-xs text-[#555] font-sans font-medium italic">
                    {age} {t(language, 'age')}
                  </span>
                )}
              </div>
            </div>

          <button
            onClick={onClose}
            className="p-2 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition shrink-0 shadow-[2px_2px_0px_#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1A1A1A] bg-[#EAE6DF]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-xs font-sans font-bold uppercase tracking-wider text-center border-r border-[#1A1A1A] transition ${
              activeTab === 'profile'
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#1A1A1A] hover:bg-[#F7F5F2]'
            }`}
          >
            {t(language, 'viewDetails')}
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`flex-1 py-3 text-xs font-sans font-bold uppercase tracking-wider text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'relations'
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#1A1A1A] hover:bg-[#F7F5F2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t(language, 'autoRelations')}</span>
            <span className="bg-[#C2410C] text-white text-[10px] px-1.5 py-0.2 font-bold">
              {autoRelations.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'profile' ? (
            <>
              {/* Relation Notes callout */}
              {person.relationNotes && (
                <div className="bg-white border border-[#1A1A1A] p-3.5 text-xs text-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-sans font-bold uppercase text-[10px] tracking-wider text-[#555] block">{t(language, 'relationNotes')}</span>
                    <span className="font-serif italic text-sm text-[#1A1A1A]">{person.relationNotes}</span>
                  </div>
                </div>
              )}

              {/* Personal Dates & Places */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {person.birthDate && (
                  <div className="bg-white border border-[#1A1A1A] p-3 shadow-[2px_2px_0px_#1A1A1A]">
                    <span className="text-[#555] text-[10px] font-sans font-bold uppercase tracking-wider block">{t(language, 'born')}</span>
                    <span className="text-[#1A1A1A] font-serif font-bold text-sm">
                      {new Date(person.birthDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {!person.isAlive && person.deathDate && (
                  <div className="bg-white border border-[#1A1A1A] p-3 shadow-[2px_2px_0px_#1A1A1A]">
                    <span className="text-[#555] text-[10px] font-sans font-bold uppercase tracking-wider block">{t(language, 'died')}</span>
                    <span className="text-[#1A1A1A] font-serif font-bold text-sm">
                      {new Date(person.deathDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {person.birthPlace && (
                  <div className="bg-white border border-[#1A1A1A] p-3 shadow-[2px_2px_0px_#1A1A1A]">
                    <span className="text-[#555] text-[10px] font-sans font-bold uppercase tracking-wider block">{t(language, 'birthPlace')}</span>
                    <span className="text-[#1A1A1A] font-sans font-medium truncate block">{person.birthPlace}</span>
                  </div>
                )}

                {person.currentLocation && (
                  <div className="bg-white border border-[#1A1A1A] p-3 shadow-[2px_2px_0px_#1A1A1A]">
                    <span className="text-[#555] text-[10px] font-sans font-bold uppercase tracking-wider block">{t(language, 'currentLocation')}</span>
                    <span className="text-[#1A1A1A] font-sans font-medium truncate block">
                      {person.currentLocation}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio / Family Story */}
              {person.bio && (
                <div className="bg-white border border-[#1A1A1A] p-4 shadow-[3px_3px_0px_#1A1A1A]">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#555] mb-1">{t(language, 'bio')}</h4>
                  <p className="text-xs text-[#1A1A1A] font-serif leading-relaxed italic">{person.bio}</p>
                </div>
              )}

              {/* Direct Family Connections */}
              <div className="space-y-3 pt-3 border-t border-[#1A1A1A]">
                <h4 className="text-xs font-sans font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Immediate Family Connections
                </h4>

                {/* Parents */}
                {parents.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#555] font-sans italic">{t(language, 'parents')}:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parents.map((p) => (
                        <span
                          key={p.id}
                          className="bg-white text-[#1A1A1A] text-xs px-3 py-1 border border-[#1A1A1A] font-serif font-bold shadow-[2px_2px_0px_#1A1A1A]"
                        >
                          {language === 'hi' && p.nameHindi ? p.nameHindi : p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spouses */}
                {spouses.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#555] font-sans italic">{t(language, 'spouses')}:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {spouses.map((p) => (
                        <span
                          key={p.id}
                          className="bg-white text-[#1A1A1A] text-xs px-3 py-1 border border-[#1A1A1A] font-serif font-bold shadow-[2px_2px_0px_#1A1A1A]"
                        >
                          {language === 'hi' && p.nameHindi ? p.nameHindi : p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Children */}
                {children.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-[#555] font-sans italic">{t(language, 'children')}:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {children.map((p) => (
                        <span
                          key={p.id}
                          className="bg-white text-[#1A1A1A] text-xs px-3 py-1 border border-[#1A1A1A] font-serif font-bold shadow-[2px_2px_0px_#1A1A1A]"
                        >
                          {language === 'hi' && p.nameHindi ? p.nameHindi : p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Links */}
              {(person.phone || person.email) && (
                <div className="flex items-center gap-3 pt-3">
                  {person.phone && (
                    <a
                      href={`https://wa.me/${person.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-[#1A1A1A] border border-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition shadow-[3px_3px_0px_#1A1A1A]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp / Call</span>
                    </a>
                  )}
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white text-[#1A1A1A] border border-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#1A1A1A] hover:text-white transition shadow-[3px_3px_0px_#1A1A1A]"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Auto-Marked Relationships List */
            <div className="space-y-3">
              <p className="text-xs text-[#555] font-serif italic">
                Auto-calculated kinships relative to{' '}
                <strong className="text-[#1A1A1A]">
                  {language === 'hi' && person.nameHindi ? person.nameHindi : person.name}
                </strong>
                :
              </p>

              {autoRelations.map((rel) => {
                const targetPerson = personMap.get(rel.targetPersonId);
                if (!targetPerson) return null;

                const targetName =
                  language === 'hi' && targetPerson.nameHindi ? targetPerson.nameHindi : targetPerson.name;

                return (
                  <div
                    key={rel.targetPersonId}
                    className="bg-white border border-[#1A1A1A] p-3 flex items-center justify-between gap-3 shadow-[3px_3px_0px_#1A1A1A]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={targetPerson.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={targetPerson.name}
                        className="w-10 h-10 object-cover shrink-0 border border-[#1A1A1A]"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-serif font-bold text-[#1A1A1A] block truncate">
                          {targetName}
                        </span>
                        <span className="text-[10px] text-[#666] font-sans truncate block italic">
                          {rel.pathDescriptionEn}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-sans">
                      <span className="text-xs font-bold text-[#C2410C] bg-[#F7F5F2] px-2.5 py-1 border border-[#1A1A1A] block shadow-[1px_1px_0px_#1A1A1A]">
                        {language === 'hi' ? rel.hindiRelation : rel.englishRelation}
                      </span>
                      {language === 'en' && rel.hindiTransliterated && (
                        <span className="text-[10px] text-[#555] block mt-0.5 italic">
                          ({rel.hindiTransliterated})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Edit/Delete Controls */}
        {isEditMode && (
          <div className="p-4 bg-[#EAE6DF] border-t border-[#1A1A1A] flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (window.confirm(t(language, 'confirmDelete'))) {
                  onDelete(person.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C2410C] text-white border border-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider transition shadow-[2px_2px_0px_#1A1A1A]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t(language, 'deletePerson')}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(person);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white border border-[#1A1A1A] font-sans font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_#C2410C] hover:bg-[#333] transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{t(language, 'editPerson')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
