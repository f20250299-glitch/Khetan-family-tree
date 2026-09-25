import { FamilyTreeData } from '../types';

export const AVATAR_PRESETS = [
  { id: 'grandpa-1', label: 'Grandfather 1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: 'grandma-1', label: 'Grandmother 1', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80' },
  { id: 'man-1', label: 'Man 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'woman-1', label: 'Woman 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'man-2', label: 'Man 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'woman-2', label: 'Woman 2', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { id: 'boy-1', label: 'Boy 1', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: 'girl-1', label: 'Girl 1', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
];

export const INITIAL_FAMILY_TREE: FamilyTreeData = {
  title: 'Khetan Family Tree',
  titleHindi: 'खेतान परिवार वृक्ष',
  editPasswordHash: 'Dev2006',
  lastUpdated: new Date().toISOString(),
  persons: [],
};
