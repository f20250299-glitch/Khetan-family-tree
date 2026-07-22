import React, { useState } from 'react';
import { FamilyTreeData, Language } from '../types';
import { Share2, Download, Upload, RefreshCw, Copy, Check, X, ShieldAlert } from 'lucide-react';
import { t } from '../utils/translations';

interface ExportImportModalProps {
  treeData: FamilyTreeData;
  language: Language;
  onClose: () => void;
  onImportData: (newData: FamilyTreeData) => Promise<void>;
  onResetData: () => Promise<void>;
  onOpenChangePassword: () => void;
  isEditMode: boolean;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  treeData,
  language,
  onClose,
  onImportData,
  onResetData,
  onOpenChangePassword,
  isEditMode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(treeData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-tree-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.persons)) {
          await onImportData(parsed);
          alert('Family tree imported successfully!');
          onClose();
        } else {
          alert('Invalid family tree JSON file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F7F5F2] border-2 border-[#1A1A1A] w-full max-w-md overflow-hidden shadow-[10px_10px_0px_#1A1A1A] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <Share2 className="w-5 h-5 text-[#C2410C]" />
            <h2 className="text-base font-serif font-bold uppercase tracking-tight text-[#1A1A1A]">
              {t(language, 'exportImport')}
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
        <div className="p-5 space-y-4 text-xs font-sans">
          {/* Private Link Copy */}
          <div className="bg-white p-4 border border-[#1A1A1A] space-y-2 shadow-[3px_3px_0px_#1A1A1A]">
            <label className="block font-bold uppercase text-[10px] tracking-wider text-[#1A1A1A]">
              {t(language, 'copyLink')}
            </label>
            <p className="text-[#555] font-serif italic text-[11px] leading-relaxed">
              {t(language, 'readOnlyBanner')}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="flex-1 px-3 py-2 bg-[#F7F5F2] border border-[#1A1A1A] text-[#1A1A1A] text-[11px] truncate focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-[#1A1A1A] text-white border border-[#1A1A1A] uppercase font-bold text-xs tracking-wider transition flex items-center gap-1 shrink-0 shadow-[2px_2px_0px_#C2410C]"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t(language, 'linkCopied') : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Backup Download */}
          <div className="bg-white p-4 border border-[#1A1A1A] flex items-center justify-between gap-3 shadow-[3px_3px_0px_#1A1A1A]">
            <div>
              <h3 className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-wider">{t(language, 'exportTitle')}</h3>
              <p className="text-[#555] font-serif italic text-[11px]">Save offline JSON backup file</p>
            </div>
            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-2 bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] border border-[#1A1A1A] font-bold uppercase text-xs tracking-wider transition flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0px_#1A1A1A]"
            >
              <Download className="w-4 h-4" />
              <span>{t(language, 'downloadJson')}</span>
            </button>
          </div>

          {/* Import / Restore (Edit mode only) */}
          {isEditMode ? (
            <div className="bg-white p-4 border border-[#1A1A1A] space-y-3 shadow-[3px_3px_0px_#1A1A1A]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-wider">{t(language, 'importTitle')}</h3>
                  <p className="text-[#555] font-serif italic text-[11px]">Restore from uploaded JSON backup</p>
                </div>
                <label className="px-3.5 py-2 bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] border border-[#1A1A1A] font-bold uppercase text-xs tracking-wider transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[2px_2px_0px_#1A1A1A]">
                  <Upload className="w-4 h-4 text-[#C2410C]" />
                  <span>Upload JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
                <button
                  onClick={onOpenChangePassword}
                  className="text-[#C2410C] hover:underline font-bold uppercase text-[11px] tracking-wider"
                >
                  {t(language, 'changePassword')}
                </button>

                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to reset to sample family tree data?')) {
                      await onResetData();
                      onClose();
                    }
                  }}
                  className="text-[#C2410C] hover:underline font-bold uppercase text-[11px] tracking-wider flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t(language, 'resetDefault')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3 border border-[#1A1A1A] text-[#555] font-serif italic text-[11px] text-center shadow-[2px_2px_0px_#1A1A1A]">
              Enter edit password to enable data restoration and password management.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
