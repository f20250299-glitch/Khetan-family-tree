export type Gender = 'male' | 'female' | 'other';

export interface Person {
  id: string;
  name: string; // Name in English or primary language
  nameHindi?: string; // Optional Hindi script name
  gender: Gender;
  birthDate?: string; // YYYY-MM-DD
  isAlive: boolean;
  deathDate?: string; // YYYY-MM-DD
  birthPlace?: string;
  currentLocation?: string;
  avatarUrl?: string; // Image URL or preset avatar key
  bio?: string;
  phone?: string;
  email?: string;
  relationNotes?: string; // Custom relation notes added by user
  generation?: number; // Calculated or user assigned generation level
  spouseIds: string[]; // List of spouse person IDs
  parentIds: string[]; // List of parent person IDs (up to 2)
  childrenIds: string[]; // List of children person IDs
}

export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling';

export interface CalculatedRelation {
  personId: string;
  targetPersonId: string;
  englishRelation: string;
  hindiRelation: string;
  hindiTransliterated?: string;
  pathDescriptionEn: string;
  pathDescriptionHi: string;
  degree: number;
}

export interface FamilyTreeData {
  title: string;
  titleHindi: string;
  editPasswordHash?: string; // Hash or encrypted password string
  lastUpdated: string;
  persons: Person[];
}

export type Language = 'en' | 'hi';
