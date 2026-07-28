import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { FamilyTreeData } from '../types';
import { INITIAL_FAMILY_TREE } from '../data/initialTree';

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

  // Check if doc exists; if not, seed initial tree
  getDoc(treeRef).then((snapshot) => {
    if (!snapshot.exists()) {
      setDoc(treeRef, sanitizeForFirestore(INITIAL_FAMILY_TREE)).catch((err) => {
        console.error('Error seeding initial family tree to Firestore:', err);
      });
    }
  }).catch((err) => {
    console.warn('Could not check Firestore tree doc:', err);
  });

  const unsubscribe = onSnapshot(treeRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as FamilyTreeData;
      onUpdate(data);
    }
  }, (error) => {
    console.error('Firestore real-time subscription error:', error);
  });

  return unsubscribe;
}

export async function saveTreeToFirestore(data: FamilyTreeData): Promise<void> {
  const treeRef = doc(db, TREE_COLLECTION, TREE_DOC_PATH);
  const cleanData = sanitizeForFirestore(data);
  await setDoc(treeRef, cleanData, { merge: true });
}
