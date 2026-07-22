import React, { useState } from 'react';
import { Person, Language } from '../types';
import { calculateRelationship } from '../utils/relationshipEngine';
import { X, Calculator, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { t } from '../utils/translations';

interface RelationshipCalculatorModalProps {
  allPersons: Person[];
  language: Language;
  onClose: () => void;
}

export const RelationshipCalculatorModal: React.FC<RelationshipCalculatorModalProps> = ({
  allPersons,
  language,
  onClose,
}) => {
  const [personAId, setPersonAId] = useState<string>(allPersons[0]?.id || '');
  const [personBId, setPersonBId] = useState<string>(allPersons[1]?.id || '');

  const personA = allPersons.find((p) => p.id === personAId);
  const personB = allPersons.find((p) => p.id === personBId);

  const result =
    personAId && personBId && personAId !== personBId
      ? calculateRelationship(allPersons, personAId, personBId)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F7F5F2] border-2 border-[#1A1A1A] w-full max-w-md overflow-hidden shadow-[10px_10px_0px_#1A1A1A] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <Calculator className="w-5 h-5 text-[#C2410C]" />
            <h2 className="text-base font-serif font-bold uppercase tracking-tight text-[#1A1A1A]">
              {t(language, 'relationshipCalculator')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition shadow-[2px_2px_0px_#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs font-sans">
          {/* Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'selectPersonA')}
              </label>
              <select
                value={personAId}
                onChange={(e) => setPersonAId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A] font-bold text-xs"
              >
                {allPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'hi' && p.nameHindi ? p.nameHindi : p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'selectPersonB')}
              </label>
              <select
                value={personBId}
                onChange={(e) => setPersonBId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A] font-bold text-xs"
              >
                {allPersons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'hi' && p.nameHindi ? p.nameHindi : p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Box */}
          {result && personA && personB && (
            <div className="bg-white border border-[#1A1A1A] p-4 space-y-3 shadow-[4px_4px_0px_#1A1A1A]">
              <div className="flex items-center justify-between text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 font-serif font-bold text-sm">
                <span>
                  {language === 'hi' && personA.nameHindi ? personA.nameHindi : personA.name}
                </span>
                <ArrowRight className="w-4 h-4 text-[#C2410C] shrink-0" />
                <span>
                  {language === 'hi' && personB.nameHindi ? personB.nameHindi : personB.name}
                </span>
              </div>

              <div className="text-center py-2 space-y-1">
                <span className="text-[10px] text-[#555] font-sans uppercase tracking-widest font-bold block">
                  {t(language, 'relationshipResult')}
                </span>
                <div className="text-2xl font-serif font-bold text-[#C2410C]">
                  {language === 'hi' ? result.hindiRelation : result.englishRelation}
                </div>
                {result.hindiTransliterated && language === 'en' && (
                  <div className="text-xs text-[#555] font-serif italic">
                    ({result.hindiTransliterated})
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#1A1A1A]">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#555] block mb-1">
                  {t(language, 'connectionPath')}:
                </span>
                <p className="text-xs text-[#1A1A1A] bg-[#F7F5F2] p-2.5 font-serif italic leading-relaxed border border-[#1A1A1A]">
                  {language === 'hi' ? result.pathDescriptionHi : result.pathDescriptionEn}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
