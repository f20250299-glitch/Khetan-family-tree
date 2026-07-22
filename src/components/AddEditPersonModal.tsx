import React, { useState } from 'react';
import { Person, Gender, Language } from '../types';
import { AVATAR_PRESETS } from '../data/initialTree';
import { X, Check, Upload, Image as ImageIcon, Info } from 'lucide-react';
import { t } from '../utils/translations';

interface AddEditPersonModalProps {
  personToEdit?: Person | null;
  allPersons: Person[];
  language: Language;
  onClose: () => void;
  onSave: (personData: Partial<Person>) => void;
}

export const AddEditPersonModal: React.FC<AddEditPersonModalProps> = ({
  personToEdit,
  allPersons,
  language,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(personToEdit?.name || '');
  const [nameHindi, setNameHindi] = useState(personToEdit?.nameHindi || '');
  const [gender, setGender] = useState<Gender>(personToEdit?.gender || 'male');
  const [birthDate, setBirthDate] = useState(personToEdit?.birthDate || '');
  const [isAlive, setIsAlive] = useState<boolean>(personToEdit?.isAlive ?? true);
  const [deathDate, setDeathDate] = useState(personToEdit?.deathDate || '');
  const [birthPlace, setBirthPlace] = useState(personToEdit?.birthPlace || '');
  const [currentLocation, setCurrentLocation] = useState(personToEdit?.currentLocation || '');
  const [avatarUrl, setAvatarUrl] = useState(
    personToEdit?.avatarUrl || AVATAR_PRESETS[0].url
  );
  const [bio, setBio] = useState(personToEdit?.bio || '');
  const [phone, setPhone] = useState(personToEdit?.phone || '');
  const [email, setEmail] = useState(personToEdit?.email || '');
  const [relationNotes, setRelationNotes] = useState(personToEdit?.relationNotes || '');

  // Relationships select state
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>(
    personToEdit?.parentIds || []
  );
  const [selectedSpouseIds, setSelectedSpouseIds] = useState<string[]>(
    personToEdit?.spouseIds || []
  );
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>(
    personToEdit?.childrenIds || []
  );

  const availableMembers = allPersons.filter((p) => !personToEdit || p.id !== personToEdit.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: personToEdit?.id,
      name: name.trim(),
      nameHindi: nameHindi.trim() || undefined,
      gender,
      birthDate: birthDate || undefined,
      isAlive,
      deathDate: isAlive ? undefined : deathDate || undefined,
      birthPlace: birthPlace.trim() || undefined,
      currentLocation: currentLocation.trim() || undefined,
      avatarUrl,
      bio: bio.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      relationNotes: relationNotes.trim() || undefined,
      parentIds: selectedParentIds,
      spouseIds: selectedSpouseIds,
      childrenIds: selectedChildrenIds,
    });

    onClose();
  };

  const toggleParent = (id: string) => {
    if (selectedParentIds.includes(id)) {
      setSelectedParentIds(selectedParentIds.filter((pId) => pId !== id));
    } else {
      if (selectedParentIds.length < 2) {
        setSelectedParentIds([...selectedParentIds, id]);
      }
    }
  };

  const toggleSpouse = (id: string) => {
    if (selectedSpouseIds.includes(id)) {
      setSelectedSpouseIds(selectedSpouseIds.filter((sId) => sId !== id));
    } else {
      setSelectedSpouseIds([...selectedSpouseIds, id]);
    }
  };

  const toggleChild = (id: string) => {
    if (selectedChildrenIds.includes(id)) {
      setSelectedChildrenIds(selectedChildrenIds.filter((cId) => cId !== id));
    } else {
      setSelectedChildrenIds([...selectedChildrenIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#F7F5F2] border-2 border-[#1A1A1A] w-full max-w-xl overflow-hidden shadow-[10px_10px_0px_#1A1A1A] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#1A1A1A] flex items-center justify-between">
          <h2 className="text-base font-serif font-bold uppercase tracking-tight text-[#1A1A1A]">
            {personToEdit ? t(language, 'editPerson') : t(language, 'addMember')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition shadow-[2px_2px_0px_#1A1A1A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Avatar Picker */}
          <div>
            <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1.5">
              {t(language, 'avatarSelection')}
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`relative overflow-hidden border-2 transition shrink-0 ${
                    avatarUrl === preset.url
                      ? 'border-[#1A1A1A] scale-105 shadow-[3px_3px_0px_#C2410C]'
                      : 'border-[#1A1A1A] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-11 h-11 object-cover" />
                  {avatarUrl === preset.url && (
                    <div className="absolute inset-0 bg-[#C2410C]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#1A1A1A] stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom URL Input */}
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste image URL here..."
              className="mt-1.5 w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] placeholder-[#888] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
            />
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'fullName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-serif font-bold text-sm focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-[#C2410C] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'fullNameHindi')}
              </label>
              <input
                type="text"
                value={nameHindi}
                onChange={(e) => setNameHindi(e.target.value)}
                placeholder="उदा. रमेश शर्मा"
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-serif italic text-sm focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>
          </div>

          {/* Relation Notes */}
          <div>
            <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
              {t(language, 'addRelationNotes')}
            </label>
            <input
              type="text"
              value={relationNotes}
              onChange={(e) => setRelationNotes(e.target.value)}
              placeholder={t(language, 'relationNotesHint')}
              className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-serif italic focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
            />
          </div>

          {/* Gender & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'gender')}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              >
                <option value="male">{t(language, 'male')}</option>
                <option value="female">{t(language, 'female')}</option>
                <option value="other">{t(language, 'other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'isAliveLabel')}
              </label>
              <select
                value={isAlive ? 'true' : 'false'}
                onChange={(e) => setIsAlive(e.target.value === 'true')}
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              >
                <option value="true">{t(language, 'living')}</option>
                <option value="false">{t(language, 'deceased')}</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'birthDate')}
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>

            {!isAlive && (
              <div>
                <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                  {t(language, 'deathDate')}
                </label>
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
                />
              </div>
            )}
          </div>

          {/* Birthplace & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'birthPlace')}
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="e.g. Jaipur"
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'currentLocation')}
              </label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>
          </div>

          {/* Linking Relationships Section */}
          <div className="space-y-3 pt-3 border-t border-[#1A1A1A]">
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
              Family Connections
            </h3>

            {/* Parents Selection */}
            <div>
              <label className="block text-[#555] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'parents')}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white border border-[#1A1A1A]">
                {availableMembers.map((m) => {
                  const isSelected = selectedParentIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleParent(m.id)}
                      className={`px-2.5 py-1 text-xs border border-[#1A1A1A] font-bold transition shadow-[2px_2px_0px_#1A1A1A] ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#C2410C]'
                          : 'bg-[#F7F5F2] text-[#1A1A1A] hover:bg-white'
                      }`}
                    >
                      {language === 'hi' && m.nameHindi ? m.nameHindi : m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spouse Selection */}
            <div>
              <label className="block text-[#555] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'spouses')}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white border border-[#1A1A1A]">
                {availableMembers.map((m) => {
                  const isSelected = selectedSpouseIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleSpouse(m.id)}
                      className={`px-2.5 py-1 text-xs border border-[#1A1A1A] font-bold transition shadow-[2px_2px_0px_#1A1A1A] ${
                        isSelected
                          ? 'bg-[#C2410C] text-white'
                          : 'bg-[#F7F5F2] text-[#1A1A1A] hover:bg-white'
                      }`}
                    >
                      {language === 'hi' && m.nameHindi ? m.nameHindi : m.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Children Selection */}
            <div>
              <label className="block text-[#555] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'children')}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-white border border-[#1A1A1A]">
                {availableMembers.map((m) => {
                  const isSelected = selectedChildrenIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleChild(m.id)}
                      className={`px-2.5 py-1 text-xs border border-[#1A1A1A] font-bold transition shadow-[2px_2px_0px_#1A1A1A] ${
                        isSelected
                          ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0px_#C2410C]'
                          : 'bg-[#F7F5F2] text-[#1A1A1A] hover:bg-white'
                      }`}
                    >
                      {language === 'hi' && m.nameHindi ? m.nameHindi : m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact Details & Bio */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1A1A1A]">
            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'phone')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>

            <div>
              <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
                {t(language, 'email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider mb-1">
              {t(language, 'bio')}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short family notes, occupation or story..."
              className="w-full px-3 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-serif italic focus:outline-none shadow-[2px_2px_0px_#1A1A1A]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#1A1A1A] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#EAE6DF] font-bold uppercase text-xs tracking-wider shadow-[2px_2px_0px_#1A1A1A] transition"
            >
              {t(language, 'cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#333] font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0px_#C2410C] transition"
            >
              {t(language, 'savePerson')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
