import React, { useState } from 'react';
import { Language, FamilyTreeData } from '../types';
import { t } from '../utils/translations';
import {
  TreeDeciduous,
  Lock,
  Unlock,
  Plus,
  Calculator,
  Share2,
  Globe,
  RefreshCw,
  List,
  Network,
  Calendar,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenAddMember: () => void;
  onOpenCalculator: () => void;
  onOpenExportImport: () => void;
  onOpenBirthdays: () => void;
  activeView: 'tree' | 'list' | 'birthdays';
  onViewChange: (view: 'tree' | 'list' | 'birthdays') => void;
  treeData: FamilyTreeData;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isEditMode,
  onToggleEditMode,
  onOpenAddMember,
  onOpenCalculator,
  onOpenExportImport,
  onOpenBirthdays,
  activeView,
  onViewChange,
  treeData,
  isSyncing,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileViewSelect = (view: 'tree' | 'list' | 'birthdays') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F5F2] border-b border-[#1A1A1A] text-[#1A1A1A] shadow-sm">
      {/* Top Title Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 border border-[#1A1A1A] bg-[#1A1A1A] text-white flex items-center justify-center font-serif font-bold text-lg sm:text-xl shrink-0 shadow-[2px_2px_0px_#1A1A1A]">
            <TreeDeciduous className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-serif font-bold truncate tracking-tight text-[#1A1A1A] leading-tight uppercase">
              {language === 'hi' ? treeData.titleHindi || 'मेरा परिवार वृक्ष' : treeData.title || 'My Family Tree'}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#555] font-sans">
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#C2410C] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C] animate-pulse" />
                {t(language, 'syncedJustNow')}
              </span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-[#C2410C]" />}
            </div>
          </div>
        </div>

        {/* Right Action Buttons (Desktop view) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Language Selector */}
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#1A1A1A]"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Edit / Lock Mode Button */}
          <button
            onClick={onToggleEditMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A] text-xs font-bold font-sans uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#1A1A1A] ${
              isEditMode
                ? 'bg-[#C2410C] text-white'
                : 'bg-white text-[#1A1A1A] hover:bg-[#EAE6DF]'
            }`}
          >
            {isEditMode ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>{t(language, 'editMode')}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{t(language, 'unlockEdit')}</span>
              </>
            )}
          </button>

          {/* Add Member Button */}
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#333] font-bold text-xs font-sans uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#1A1A1A]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t(language, 'addMember')}</span>
          </button>
        </div>

        {/* Mobile View Toggle & More Options Trigger */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenAddMember}
            className="p-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold text-xs font-sans transition shadow-[2px_2px_0px_#1A1A1A]"
            title={t(language, 'addMember')}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold text-xs font-sans uppercase tracking-wider shadow-[3px_3px_0px_#C2410C] hover:bg-[#333] transition"
          >
            <Menu className="w-4 h-4" />
            <span className="text-[11px] font-sans font-bold uppercase">{language === 'hi' ? 'विकल्प' : 'More'}</span>
          </button>
        </div>
      </div>

      {/* Secondary Navigation Toolbar (Desktop) */}
      <div className="hidden md:block bg-[#EAE6DF] border-t border-[#1A1A1A] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Views switcher */}
          <div className="flex items-center gap-1 border border-[#1A1A1A] bg-white p-0.5 shadow-[2px_2px_0px_#1A1A1A]">
            <button
              onClick={() => onViewChange('tree')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                activeView === 'tree'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-[#F7F5F2]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>{t(language, 'treeView')}</span>
            </button>

            <button
              onClick={() => onViewChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                activeView === 'list'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-[#F7F5F2]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t(language, 'listView')}</span>
            </button>

            <button
              onClick={() => onViewChange('birthdays')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider transition-colors ${
                activeView === 'birthdays'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A] hover:bg-[#F7F5F2]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t(language, 'birthdaysView')}</span>
            </button>
          </div>

          {/* Quick Tools */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCalculator}
              className="flex items-center gap-1.5 px-3 py-1 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider transition-colors shadow-[2px_2px_0px_#1A1A1A]"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t(language, 'relationshipCalculator')}</span>
            </button>

            <button
              onClick={onOpenExportImport}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] text-xs font-sans font-bold transition-colors shadow-[2px_2px_0px_#1A1A1A]"
              title="Share / Backup"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-Out Options Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1A1A1A]/70 backdrop-blur-xs animate-fade-in md:hidden">
          <div className="w-full max-w-xs bg-[#F7F5F2] border-l-2 border-[#1A1A1A] h-full flex flex-col shadow-[-10px_0px_0px_#1A1A1A]">
            {/* Sidebar Header */}
            <div className="p-4 bg-white border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-[#C2410C]" />
                <h2 className="text-sm font-serif font-bold uppercase tracking-wider text-[#1A1A1A]">
                  {language === 'hi' ? 'नेविगेशन व विकल्प' : 'Menu & Options'}
                </h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition shadow-[2px_2px_0px_#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Options Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-6 font-sans text-xs">
              {/* Views Switcher Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#555] block">
                  {language === 'hi' ? 'दृश्य चुनें (Select View)' : 'Select View'}
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleMobileViewSelect('tree')}
                    className={`flex items-center justify-between p-3 border border-[#1A1A1A] font-bold uppercase tracking-wider text-xs transition shadow-[3px_3px_0px_#1A1A1A] ${
                      activeView === 'tree'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Network className="w-4 h-4" />
                      <span>{t(language, 'treeView')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleMobileViewSelect('list')}
                    className={`flex items-center justify-between p-3 border border-[#1A1A1A] font-bold uppercase tracking-wider text-xs transition shadow-[3px_3px_0px_#1A1A1A] ${
                      activeView === 'list'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <List className="w-4 h-4" />
                      <span>{t(language, 'listView')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleMobileViewSelect('birthdays')}
                    className={`flex items-center justify-between p-3 border border-[#1A1A1A] font-bold uppercase tracking-wider text-xs transition shadow-[3px_3px_0px_#1A1A1A] ${
                      activeView === 'birthdays'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4" />
                      <span>{t(language, 'birthdaysView')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Family Tree Actions Section */}
              <div className="space-y-2 pt-2 border-t border-[#1A1A1A]">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#555] block">
                  {language === 'hi' ? 'मुख्य कार्य (Actions)' : 'Tree Tools'}
                </span>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAddMember();
                    }}
                    className="flex items-center justify-between p-3 border border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#C2410C] hover:bg-[#333] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>{t(language, 'addMember')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCalculator();
                    }}
                    className="flex items-center justify-between p-3 border border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#EAE6DF] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Calculator className="w-4 h-4 text-[#C2410C]" />
                      <span>{t(language, 'relationshipCalculator')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenExportImport();
                    }}
                    className="flex items-center justify-between p-3 border border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#EAE6DF] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-[#C2410C]" />
                      <span>{t(language, 'exportImport')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preferences & Edit Mode */}
              <div className="space-y-2 pt-2 border-t border-[#1A1A1A]">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#555] block">
                  {language === 'hi' ? 'सेटिंग्स व भाषा' : 'Settings'}
                </span>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onLanguageChange(language === 'en' ? 'hi' : 'en');
                    }}
                    className="flex items-center justify-between p-3 border border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold uppercase tracking-wider text-xs shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#EAE6DF] transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-[#C2410C]" />
                      <span>{language === 'en' ? 'भाषा: हिंदी (Hindi)' : 'Language: English'}</span>
                    </div>
                    <span className="text-[10px] bg-[#1A1A1A] text-white px-2 py-0.5 uppercase">
                      {language === 'en' ? 'HI' : 'EN'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleEditMode();
                    }}
                    className={`flex items-center justify-between p-3 border border-[#1A1A1A] font-bold uppercase tracking-wider text-xs transition shadow-[3px_3px_0px_#1A1A1A] ${
                      isEditMode
                        ? 'bg-[#C2410C] text-white'
                        : 'bg-white text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isEditMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{isEditMode ? t(language, 'editMode') : t(language, 'unlockEdit')}</span>
                    </div>
                    <span className="text-[10px] uppercase underline">
                      {isEditMode ? 'Active' : 'Lock'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 bg-[#EAE6DF] border-t border-[#1A1A1A] text-center text-[10px] text-[#555] font-serif italic">
              {t(language, 'syncedJustNow')} • {treeData.persons.length} Members
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

