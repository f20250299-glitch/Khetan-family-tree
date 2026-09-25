import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FamilyTreeData } from '../types';
import { INITIAL_FAMILY_TREE } from '../data/initialTree';
import { sanitizeAndCompressTreePhotos } from '../utils/imageCompressor';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const TREE_DOC_PATH = 'main';
const TREE_COLLECTION = 'familyTree';

function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_, value) => (value === undefined ? null : value)));
}

export function subscribeToTree(onUpdate: (data: FamilyTreeData) => void): () => void {
  const treeRef = doc(db, TREE_COLLECTION, TREE_DOC_PATH);

  // Check if doc exists; if not, seed with saved local tree or initial tree
  getDoc(treeRef).then(async (snapshot) => {
    if (!snapshot.exists()) {
      let initialToSeed = INITIAL_FAMILY_TREE;
      try {
        const localSaved = localStorage.getItem('khetan_family_tree');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (parsed && Array.isArray(parsed.persons) && parsed.persons.length > 0) {
            initialToSeed = parsed;
          }
        }
      } catch (e) {
        // ignore fallback
      }
      const compressedInitial = await sanitizeAndCompressTreePhotos(initialToSeed);
      setDoc(treeRef, sanitizeForFirestore(compressedInitial)).catch((err) => {
        console.error('Error seeding initial family tree to Firestore:', err);
      });
    }
  }).catch((err) => {
    console.warn('Could not check Firestore tree doc:', err);
  });

  const unsubscribe = onSnapshot(treeRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as FamilyTreeData;
      if (data && Array.isArray(data.persons)) {
        const pass = String(data.editPasswordHash || '').trim().toLowerCase();
        if (!data.editPasswordHash || pass === 'family123' || pass === 'family1234') {
          data.editPasswordHash = 'Dev2006';
          saveTreeToFirestore(data).catch(() => {});
        }
        onUpdate(data);
      }
    }
  }, (error) => {
    console.error('Firestore real-time subscription error:', error);
  });

  return unsubscribe;
}

export async function saveTreeToFirestore(data: FamilyTreeData): Promise<void> {
  try {
    const treeRef = doc(db, TREE_COLLECTION, TREE_DOC_PATH);
    const compressedData = await sanitizeAndCompressTreePhotos(data);
    const cleanData = sanitizeForFirestore(compressedData);
    // Overwrite document to ensure full tree snapshot sync including person removals
    await setDoc(treeRef, cleanData);
  } catch (err) {
    console.error('Error saving tree to Firestore:', err);
  }
}
