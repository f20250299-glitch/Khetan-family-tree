import React, { useState } from 'react';
import { Language } from '../types';
import { Lock, Key, X, AlertCircle } from 'lucide-react';
import { t } from '../utils/translations';

interface EditPasswordModalProps {
  language: Language;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean>;
  onChangePassword?: (newPassword: string) => Promise<boolean>;
  isChangingPassword?: boolean;
}

export const EditPasswordModal: React.FC<EditPasswordModalProps> = ({
  language,
  onClose,
  onVerify,
  onChangePassword,
  isChangingPassword = false,
}) => {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isChangingPassword && onChangePassword) {
        const success = await onChangePassword(newPassword);
        if (success) {
          onClose();
        } else {
          setErrorMsg(t(language, 'wrongPassword'));
        }
      } else {
        const success = await onVerify(password);
        if (success) {
          onClose();
        } else {
          setErrorMsg(t(language, 'wrongPassword'));
        }
      }
    } catch (err) {
      setErrorMsg(t(language, 'wrongPassword'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F7F5F2] border-2 border-[#1A1A1A] w-full max-w-sm overflow-hidden shadow-[10px_10px_0px_#1A1A1A]">
        <div className="p-4 bg-white border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <Lock className="w-5 h-5 text-[#C2410C]" />
            <h2 className="text-sm font-serif font-bold uppercase tracking-tight text-[#1A1A1A]">
              {isChangingPassword ? t(language, 'changePassword') : t(language, 'enterPassword')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition shadow-[2px_2px_0px_#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-sans">
          {errorMsg && (
            <div className="bg-[#C2410C]/10 border border-[#C2410C] p-3 text-[#C2410C] font-bold flex items-center gap-2 shadow-[2px_2px_0px_#1A1A1A]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isChangingPassword ? (
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'enterPassword')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t(language, 'passwordPlaceholder')}
                className="w-full px-3 py-2.5 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'newPasswordLabel')}
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new edit password..."
                className="w-full px-3 py-2.5 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1A1A1A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#EAE6DF] font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_#1A1A1A] transition"
            >
              {t(language, 'cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#333] font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0px_#C2410C] transition disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : t(language, 'submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
