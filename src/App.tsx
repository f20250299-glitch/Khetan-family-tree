/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Person, FamilyTreeData, Language } from './types';
import { INITIAL_FAMILY_TREE } from './data/initialTree';
import { Header } from './components/Header';
import { MobileTreeView } from './components/MobileTreeView';
import { GenerationListView } from './components/GenerationListView';
import { PersonDetailModal } from './components/PersonDetailModal';
import { AddEditPersonModal } from './components/AddEditPersonModal';
import { RelationshipCalculatorModal } from './components/RelationshipCalculatorModal';
import { EditPasswordModal } from './components/EditPasswordModal';
import { BirthdayAnniversaryTracker } from './components/BirthdayAnniversaryTracker';
import { ExportImportModal } from './components/ExportImportModal';
import { subscribeToTree, saveTreeToFirestore } from './lib/firebase';
import { removeTreePhotos, sanitizeAndCompressTreePhotos } from './utils/imageCompressor';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [treeData, setTreeData] = useState<FamilyTreeData>(() => {
    const saved = localStorage.getItem('khetan_family_tree');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const pass = String(parsed.editPasswordHash || '').trim().toLowerCase();
          if (!parsed.editPasswordHash || pass === 'family123' || pass === 'family1234') {
            parsed.editPasswordHash = 'Dev2006';
          }
          return removeTreePhotos(parsed);
        }
      } catch (e) {
        console.warn('Could not parse saved tree from localStorage');
      }
    }
    return removeTreePhotos(INITIAL_FAMILY_TREE);
  });
  const [editPassword, setEditPassword] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // View state
  const [activeView, setActiveView] = useState<'tree' | 'list' | 'birthdays'>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);

  // Apply real-time updates from Firestore directly to React state and localStorage with conflict protection
  const applyRemoteTreeUpdate = useCallback((incomingTree: FamilyTreeData) => {
    if (!incomingTree || !Array.isArray(incomingTree.persons)) return;

    const cleaned = removeTreePhotos(incomingTree);
    const incomingPass = String(cleaned.editPasswordHash || '').trim().toLowerCase();
    if (!cleaned.editPasswordHash || incomingPass === 'family123' || incomingPass === 'family1234') {
      cleaned.editPasswordHash = 'Dev2006';
    }

    setTreeData((prev) => {
      if (!prev || !Array.isArray(prev.persons) || prev.persons.length === 0) {
        try {
          localStorage.setItem('khetan_family_tree', JSON.stringify(cleaned));
        } catch (e) {}
        return cleaned;
      }

      const prevTime = prev.lastUpdated ? new Date(prev.lastUpdated).getTime() : 0;
      const incomingTime = cleaned.lastUpdated ? new Date(cleaned.lastUpdated).getTime() : 0;

      // Protect newly added local members: if local tree has more persons and equal/newer timestamp, keep local
      if (prev.persons.length > cleaned.persons.length && prevTime >= incomingTime) {
        console.warn('Protecting local tree with more members from older remote snapshot');
        // Heal Firestore with the larger local tree
        saveTreeToFirestore(prev).catch(() => {});
        return prev;
      }

      // If timestamps match and counts match, don't trigger unnecessary re-renders
      if (prevTime === incomingTime && prev.persons.length === cleaned.persons.length) {
        return prev;
      }

      // If incoming tree is strictly newer or has more persons, adopt remote
      if (incomingTime > prevTime || cleaned.persons.length > prev.persons.length) {
        try {
          localStorage.setItem('khetan_family_tree', JSON.stringify(cleaned));
        } catch (e) {
          console.warn('Could not update localStorage:', e);
        }
        return cleaned;
      }

      return prev;
    });
  }, []);

  // Fetch tree from server fallback on initial load if local tree is empty
  const loadTreeFromServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/tree');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && typeof data === 'object' && Array.isArray(data.persons)) {
          applyRemoteTreeUpdate(data);
        }
      }
    } catch (err) {
      console.warn('Backend tree sync error, using local state:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [applyRemoteTreeUpdate]);


  // Real-time Firestore sync listener across all connected devices and browsers
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeToTree((firestoreTree) => {
      if (firestoreTree && typeof firestoreTree === 'object' && Array.isArray(firestoreTree.persons)) {
        applyRemoteTreeUpdate(firestoreTree);
      }
      setIsSyncing(false);
    });

    loadTreeFromServer();

    return () => {
      unsubscribe();
    };
  }, [loadTreeFromServer, applyRemoteTreeUpdate]);

  // Save updated tree to cloud (Firestore & server)
  const saveTreeDataToServer = async (newTree: FamilyTreeData) => {
    const preparedTree: FamilyTreeData = removeTreePhotos({
      ...newTree,
      lastUpdated: new Date().toISOString(),
    });

    // Immediate optimistic state update to React state & LocalStorage
    setTreeData(preparedTree);
    try {
      localStorage.setItem('khetan_family_tree', JSON.stringify(preparedTree));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    try {
      setIsSyncing(true);

      // Save to Firebase Firestore for instant real-time sync on all devices
      await saveTreeToFirestore(preparedTree);

      // Also try express server backend
      await fetch('/api/tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-password': editPassword || 'Dev2006',
        },
        body: JSON.stringify(preparedTree),
      }).catch(() => {});
    } catch (err) {
      console.error('Error saving tree to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Password verification
  const handleVerifyPassword = async (pass: string): Promise<boolean> => {
    const rawPass = pass.trim();
    const cleanPass = rawPass.toLowerCase();
    let currentPassword = String(treeData.editPasswordHash || 'Dev2006').trim();
    const cleanCurrent = currentPassword.toLowerCase();
    const effectiveTarget = (cleanCurrent === 'family123' || cleanCurrent === 'family1234') ? 'Dev2006' : currentPassword;

    // Direct client-side verification - only Dev2006 or customized active password is accepted
    const isPassValid =
      cleanPass === effectiveTarget.toLowerCase() ||
      cleanPass === 'dev2006';

    if (isPassValid) {
      setEditPassword(rawPass);
      setIsEditMode(true);

      // Ensure local state and localStorage carry the normalized valid password
      const updatedTree = {
        ...treeData,
        editPasswordHash: effectiveTarget === 'Dev2006' ? 'Dev2006' : rawPass,
      };
      setTreeData(updatedTree);
      localStorage.setItem('khetan_family_tree', JSON.stringify(updatedTree));
      saveTreeToFirestore(updatedTree).catch(() => {});

      // Attempt server ping if backend is active
      try {
        await fetch('/api/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: rawPass }),
        });
      } catch (err) {
        // Ignored on static deployments like Vercel
      }

      return true;
    }

    // Secondary attempt via server API if custom password was set on backend
    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: rawPass }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
          setEditPassword(rawPass);
          setIsEditMode(true);
          return true;
        }
      }
    } catch (err) {
      console.error('Error verifying password via backend:', err);
    }

    return false;
  };

  // Change password
  const handleChangePassword = async (newPass: string): Promise<boolean> => {
    const cleanNewPass = newPass.trim();
    const updatedTree: FamilyTreeData = {
      ...treeData,
      editPasswordHash: cleanNewPass,
      lastUpdated: new Date().toISOString(),
    };

    setTreeData(updatedTree);
    localStorage.setItem('khetan_family_tree', JSON.stringify(updatedTree));

    try {
      await saveTreeToFirestore(updatedTree);
      await fetch('/api/tree/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-password': editPassword || 'Dev2006',
        },
        body: JSON.stringify({ newPassword: cleanNewPass }),
      }).catch(() => {});
    } catch (err) {
      console.error('Error changing password on server:', err);
    }

    setEditPassword(cleanNewPass);
    return true;
  };

  // Reset to initial tree
  const handleResetTree = async () => {
    const resetTree: FamilyTreeData = {
      ...INITIAL_FAMILY_TREE,
      editPasswordHash: treeData.editPasswordHash || 'Dev2006',
      lastUpdated: new Date().toISOString(),
    };

    setTreeData(resetTree);
    localStorage.setItem('khetan_family_tree', JSON.stringify(resetTree));

    try {
      await saveTreeToFirestore(resetTree);
      await fetch('/api/tree/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-edit-password': editPassword || 'Dev2006',
        },
      }).catch(() => {});
    } catch (err) {
      console.error('Error resetting tree on server:', err);
    }
  };

  // Add / Edit Member handler with automatic inverse relation syncing
  const handleSavePerson = async (personFields: Partial<Person>) => {
    const existingPersons = [...treeData.persons];

    if (personFields.id) {
      // EDIT existing person
      const targetId = personFields.id;
      const updatedList = existingPersons.map((p) => {
        if (p.id === targetId) {
          return { ...p, ...personFields } as Person;
        }
        return p;
      });

      // Update inverse relationships
      syncInverseRelations(updatedList, targetId, personFields);

      await saveTreeDataToServer({
        ...treeData,
        persons: updatedList,
      });
    } else {
      // ADD new person
      const newId = 'p_' + Date.now();
      const newPerson: Person = {
        id: newId,
        name: personFields.name || 'New Member',
        nameHindi: personFields.nameHindi,
        gender: personFields.gender || 'male',
        birthDate: personFields.birthDate,
        isAlive: personFields.isAlive ?? true,
        deathDate: personFields.deathDate,
        birthPlace: personFields.birthPlace,
        currentLocation: personFields.currentLocation,
        avatarUrl: personFields.avatarUrl,
        bio: personFields.bio,
        phone: personFields.phone,
        email: personFields.email,
        relationNotes: personFields.relationNotes,
        parentIds: personFields.parentIds || [],
        spouseIds: personFields.spouseIds || [],
        childrenIds: personFields.childrenIds || [],
      };

      const newList = [...existingPersons, newPerson];
      syncInverseRelations(newList, newId, personFields);

      await saveTreeDataToServer({
        ...treeData,
        persons: newList,
      });
    }
  };

  // Synchronizes parent <-> child & spouse <-> spouse two-way links automatically
  const syncInverseRelations = (
    persons: Person[],
    subjectId: string,
    fields: Partial<Person>
  ) => {
    const parentIds = fields.parentIds || [];
    const spouseIds = fields.spouseIds || [];
    const childrenIds = fields.childrenIds || [];

    persons.forEach((p) => {
      // Parent link -> add subject as child
      if (parentIds.includes(p.id)) {
        if (!p.childrenIds.includes(subjectId)) p.childrenIds.push(subjectId);
      } else {
        p.childrenIds = p.childrenIds.filter((id) => id !== subjectId);
      }

      // Child link -> add subject as parent
      if (childrenIds.includes(p.id)) {
        if (!p.parentIds.includes(subjectId)) p.parentIds.push(subjectId);
      } else {
        p.parentIds = p.parentIds.filter((id) => id !== subjectId);
      }

      // Spouse link -> add subject as spouse
      if (spouseIds.includes(p.id)) {
        if (!p.spouseIds.includes(subjectId)) p.spouseIds.push(subjectId);
      } else {
        p.spouseIds = p.spouseIds.filter((id) => id !== subjectId);
      }
    });
  };

  // Delete person
  const handleDeletePerson = async (personId: string) => {
    const updatedPersons = treeData.persons
      .filter((p) => p.id !== personId)
      .map((p) => ({
        ...p,
        parentIds: p.parentIds.filter((id) => id !== personId),
        spouseIds: p.spouseIds.filter((id) => id !== personId),
        childrenIds: p.childrenIds.filter((id) => id !== personId),
      }));

    await saveTreeDataToServer({
      ...treeData,
      persons: updatedPersons,
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white flex flex-col">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        isEditMode={isEditMode}
        onToggleEditMode={() => {
          if (isEditMode) {
            setIsEditMode(false);
          } else {
            setIsChangingPassword(false);
            setIsPasswordModalOpen(true);
          }
        }}
        onOpenAddMember={() => {
          if (!isEditMode) {
            setIsChangingPassword(false);
            setIsPasswordModalOpen(true);
          } else {
            setPersonToEdit(null);
            setIsAddEditModalOpen(true);
          }
        }}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        onOpenBirthdays={() => setActiveView('birthdays')}
        activeView={activeView}
        onViewChange={setActiveView}
        treeData={treeData}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="w-full">
        {activeView === 'tree' && (
          <MobileTreeView
            persons={treeData.persons}
            language={language}
            onSelectPerson={setSelectedPerson}
            onAddMember={() => {
              if (!isEditMode) {
                setIsChangingPassword(false);
                setIsPasswordModalOpen(true);
              } else {
                setPersonToEdit(null);
                setIsAddEditModalOpen(true);
              }
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeView === 'list' && (
          <GenerationListView
            persons={treeData.persons}
            language={language}
            onSelectPerson={setSelectedPerson}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeView === 'birthdays' && (
          <BirthdayAnniversaryTracker
            persons={treeData.persons}
            language={language}
            onSelectPerson={setSelectedPerson}
          />
        )}
      </main>

      {/* Modals */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          allPersons={treeData.persons}
          language={language}
          onClose={() => setSelectedPerson(null)}
          onEdit={(p) => {
            setPersonToEdit(p);
            setIsAddEditModalOpen(true);
          }}
          onDelete={handleDeletePerson}
          isEditMode={isEditMode}
        />
      )}

      {isAddEditModalOpen && (
        <AddEditPersonModal
          personToEdit={personToEdit}
          allPersons={treeData.persons}
          language={language}
          onClose={() => setIsAddEditModalOpen(false)}
          onSave={handleSavePerson}
        />
      )}

      {isCalculatorOpen && (
        <RelationshipCalculatorModal
          allPersons={treeData.persons}
          language={language}
          onClose={() => setIsCalculatorOpen(false)}
        />
      )}

      {isPasswordModalOpen && (
        <EditPasswordModal
          language={language}
          onClose={() => setIsPasswordModalOpen(false)}
          onVerify={handleVerifyPassword}
          onChangePassword={handleChangePassword}
          isChangingPassword={isChangingPassword}
        />
      )}

      {isExportImportOpen && (
        <ExportImportModal
          treeData={treeData}
          language={language}
          onClose={() => setIsExportImportOpen(false)}
          onImportData={saveTreeDataToServer}
          onResetData={handleResetTree}
          onOpenChangePassword={() => {
            setIsChangingPassword(true);
            setIsPasswordModalOpen(true);
          }}
          isEditMode={isEditMode}
        />
      )}
    </div>
  );
}
