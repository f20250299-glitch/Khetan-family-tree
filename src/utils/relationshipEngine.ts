import { Person, CalculatedRelation } from '../types';

interface PathNode {
  personId: string;
  relationFromPrev: string; // 'father' | 'mother' | 'son' | 'daughter' | 'husband' | 'wife' | 'brother' | 'sister'
  prev: PathNode | null;
}

// Map of canonical relation step keys to English and Hindi names
const KINSHIP_MAP: Record<string, { en: string; hi: string; transliterated: string }> = {
  // Direct (1 Degree)
  'father': { en: 'Father', hi: 'पिता जी', transliterated: 'Pita Ji' },
  'mother': { en: 'Mother', hi: 'माता जी', transliterated: 'Mata Ji' },
  'son': { en: 'Son', hi: 'बेटा', transliterated: 'Beta' },
  'daughter': { en: 'Daughter', hi: 'बेटी', transliterated: 'Beti' },
  'husband': { en: 'Husband', hi: 'पति', transliterated: 'Pati' },
  'wife': { en: 'Wife', hi: 'पत्नी', transliterated: 'Patni' },
  'brother': { en: 'Brother', hi: 'भाई', transliterated: 'Bhai' },
  'sister': { en: 'Sister', hi: 'बहन', transliterated: 'Behan' },

  // Grandparents & Ancestors (2-3 Degrees)
  'father.father': { en: 'Paternal Grandfather', hi: 'दादा जी', transliterated: 'Dada Ji' },
  'father.mother': { en: 'Paternal Grandmother', hi: 'दादी जी', transliterated: 'Dadi Ji' },
  'mother.father': { en: 'Maternal Grandfather', hi: 'नाना जी', transliterated: 'Nana Ji' },
  'mother.mother': { en: 'Maternal Grandmother', hi: 'नानी जी', transliterated: 'Nani Ji' },
  'father.father.father': { en: 'Paternal Great-Grandfather', hi: 'परदादा जी', transliterated: 'Pardada Ji' },
  'father.father.mother': { en: 'Paternal Great-Grandmother', hi: 'परदादी जी', transliterated: 'Pardadi Ji' },
  'mother.father.father': { en: 'Maternal Great-Grandfather', hi: 'परनाना जी', transliterated: 'Parnana Ji' },
  'mother.father.mother': { en: 'Maternal Great-Grandmother', hi: 'परनानी जी', transliterated: 'Parnani Ji' },

  // Uncles & Aunts (Paternal & Maternal)
  'father.brother': { en: 'Paternal Uncle', hi: 'चाचा जी / ताऊ जी', transliterated: 'Chacha Ji / Tau Ji' },
  'father.sister': { en: 'Paternal Aunt', hi: 'बुआ जी', transliterated: 'Bua Ji' },
  'mother.brother': { en: 'Maternal Uncle', hi: 'मामा जी', transliterated: 'Mama Ji' },
  'mother.sister': { en: 'Maternal Aunt', hi: 'मौसी जी', transliterated: 'Masi Ji' },

  // Spouses of Uncles / Aunts
  'father.brother.wife': { en: 'Paternal Aunt (Aunt)', hi: 'चाची जी / ताई जी', transliterated: 'Chachi Ji / Tai Ji' },
  'father.sister.husband': { en: 'Paternal Uncle (Uncle)', hi: 'फूफा जी', transliterated: 'Phupha Ji' },
  'mother.brother.wife': { en: 'Maternal Aunt (Aunt)', hi: 'मामी जी', transliterated: 'Mami Ji' },
  'mother.sister.husband': { en: 'Maternal Uncle (Uncle)', hi: 'मौसा जी', transliterated: 'Mausa Ji' },

  // Cousins
  'father.brother.son': { en: 'Paternal Cousin (Brother)', hi: 'चचेरा भाई', transliterated: 'Chachera Bhai' },
  'father.brother.daughter': { en: 'Paternal Cousin (Sister)', hi: 'चचेरी बहन', transliterated: 'Chacheri Behan' },
  'father.sister.son': { en: 'Paternal Cousin (Brother)', hi: 'फुफेरा भाई', transliterated: 'Phuphera Bhai' },
  'father.sister.daughter': { en: 'Paternal Cousin (Sister)', hi: 'फुफेरी बहन', transliterated: 'Phupheri Behan' },
  'mother.brother.son': { en: 'Maternal Cousin (Brother)', hi: 'ममेरा भाई', transliterated: 'Mamera Bhai' },
  'mother.brother.daughter': { en: 'Maternal Cousin (Sister)', hi: 'ममेरी बहन', transliterated: 'Mameri Behan' },
  'mother.sister.son': { en: 'Maternal Cousin (Brother)', hi: 'मौसेरा भाई', transliterated: 'Mausera Bhai' },
  'mother.sister.daughter': { en: 'Maternal Cousin (Sister)', hi: 'मौसेरी बहन', transliterated: 'Mauseri Behan' },

  // Nephews & Nieces
  'brother.son': { en: 'Nephew', hi: 'भतीजा', transliterated: 'Bhatija' },
  'brother.daughter': { en: 'Niece', hi: 'भतीजी', transliterated: 'Bhatiji' },
  'sister.son': { en: 'Nephew', hi: 'भांजा', transliterated: 'Bhanja' },
  'sister.daughter': { en: 'Niece', hi: 'भांजी', transliterated: 'Bhanji' },

  // In-laws
  'brother.wife': { en: 'Sister-in-law', hi: 'भाभी', transliterated: 'Bhabhi' },
  'sister.husband': { en: 'Brother-in-law', hi: 'जीजा जी', transliterated: 'Jija Ji' },
  'husband.father': { en: 'Father-in-law', hi: 'ससुर जी', transliterated: 'Sasur Ji' },
  'husband.mother': { en: 'Mother-in-law', hi: 'सास जी', transliterated: 'Saas Ji' },
  'wife.father': { en: 'Father-in-law', hi: 'ससुर जी', transliterated: 'Sasur Ji' },
  'wife.mother': { en: 'Mother-in-law', hi: 'सास जी', transliterated: 'Saas Ji' },
  'husband.brother': { en: 'Brother-in-law', hi: 'देवर / जेठ', transliterated: 'Devar / Jeth' },
  'husband.sister': { en: 'Sister-in-law', hi: 'ननद', transliterated: 'Nanad' },
  'wife.brother': { en: 'Brother-in-law', hi: 'साला', transliterated: 'Saala' },
  'wife.sister': { en: 'Sister-in-law', hi: 'साली', transliterated: 'Saali' },
  'son.wife': { en: 'Daughter-in-law', hi: 'बहू', transliterated: 'Bahu' },
  'daughter.husband': { en: 'Son-in-law', hi: 'दामाद', transliterated: 'Damaad' },

  // Grandchildren
  'son.son': { en: 'Grandson (Paternal)', hi: 'पोता', transliterated: 'Pota' },
  'son.daughter': { en: 'Granddaughter (Paternal)', hi: 'पोती', transliterated: 'Poti' },
  'daughter.son': { en: 'Grandson (Maternal)', hi: 'नाती', transliterated: 'Naati' },
  'daughter.daughter': { en: 'Granddaughter (Maternal)', hi: 'नातिन', transliterated: 'Naatin' },
  'son.son.son': { en: 'Great-Grandson', hi: 'परपोता', transliterated: 'Parpota' },
  'son.son.daughter': { en: 'Great-Granddaughter', hi: 'परपोती', transliterated: 'Parpoti' },
};

/**
 * Builds an adjacency lookup of all direct links for fast graph traversal
 */
function buildFamilyGraph(persons: Person[]) {
  const personMap = new Map<string, Person>();
  persons.forEach((p) => personMap.set(p.id, p));

  const graph = new Map<string, Array<{ to: string; relation: string }>>();

  const addEdge = (from: string, to: string, relation: string) => {
    if (!graph.has(from)) graph.set(from, []);
    graph.get(from)!.push({ to, relation });
  };

  persons.forEach((p) => {
    // Parents
    p.parentIds.forEach((parentId) => {
      const parent = personMap.get(parentId);
      if (parent) {
        const rel = parent.gender === 'female' ? 'mother' : 'father';
        addEdge(p.id, parentId, rel);
        // Inverse: parent -> child
        const childRel = p.gender === 'female' ? 'daughter' : 'son';
        addEdge(parentId, p.id, childRel);
      }
    });

    // Spouses
    p.spouseIds.forEach((spouseId) => {
      const spouse = personMap.get(spouseId);
      if (spouse) {
        const rel = spouse.gender === 'female' ? 'wife' : 'husband';
        addEdge(p.id, spouseId, rel);
      }
    });

    // Siblings (derived from shared parents)
    persons.forEach((other) => {
      if (other.id !== p.id) {
        const sharedParent = p.parentIds.some((pid) => other.parentIds.includes(pid));
        if (sharedParent) {
          const sibRel = other.gender === 'female' ? 'sister' : 'brother';
          addEdge(p.id, other.id, sibRel);
        }
      }
    });
  });

  return { personMap, graph };
}

/**
 * Finds shortest path between sourcePersonId and targetPersonId
 */
export function calculateRelationship(
  persons: Person[],
  sourcePersonId: string,
  targetPersonId: string
): CalculatedRelation | null {
  if (sourcePersonId === targetPersonId) {
    return {
      personId: sourcePersonId,
      targetPersonId,
      englishRelation: 'Self',
      hindiRelation: 'खुद / स्वयं',
      hindiTransliterated: 'Khud / Swayam',
      pathDescriptionEn: 'Same person',
      pathDescriptionHi: 'समान व्यक्ति',
      degree: 0,
    };
  }

  const { personMap, graph } = buildFamilyGraph(persons);

  const sourcePerson = personMap.get(sourcePersonId);
  const targetPerson = personMap.get(targetPersonId);

  if (!sourcePerson || !targetPerson) return null;

  // BFS
  const queue: PathNode[] = [{ personId: sourcePersonId, relationFromPrev: '', prev: null }];
  const visited = new Set<string>([sourcePersonId]);

  let targetNode: PathNode | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.personId === targetPersonId) {
      targetNode = current;
      break;
    }

    const neighbors = graph.get(current.personId) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({
          personId: edge.to,
          relationFromPrev: edge.relation,
          prev: current,
        });
      }
    }
  }

  if (!targetNode) {
    return {
      personId: sourcePersonId,
      targetPersonId,
      englishRelation: 'Distant Relative',
      hindiRelation: 'दूर के रिश्तेदार',
      hindiTransliterated: 'Door ke Rishtedar',
      pathDescriptionEn: 'No direct connected path found in current tree',
      pathDescriptionHi: 'वर्तमान वृक्ष में कोई सीधा जुड़ा हुआ मार्ग नहीं मिला',
      degree: 99,
    };
  }

  // Construct path steps
  const pathSteps: string[] = [];
  const personPath: Person[] = [];
  let curr: PathNode | null = targetNode;

  while (curr && curr.prev) {
    pathSteps.unshift(curr.relationFromPrev);
    const p = personMap.get(curr.personId);
    if (p) personPath.unshift(p);
    curr = curr.prev;
  }
  personPath.unshift(sourcePerson);

  const key = pathSteps.join('.');
  const degree = pathSteps.length;

  let englishRelation = '';
  let hindiRelation = '';
  let hindiTransliterated = '';

  if (KINSHIP_MAP[key]) {
    englishRelation = KINSHIP_MAP[key].en;
    hindiRelation = KINSHIP_MAP[key].hi;
    hindiTransliterated = KINSHIP_MAP[key].transliterated;
  } else {
    // Generate fallback description from steps
    const stepEn = pathSteps.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" -> ");
    englishRelation = `Relative (${stepEn})`;
    hindiRelation = `रिश्तेदार (${pathSteps.length} चरण)`;
    hindiTransliterated = `Rishtedar (${pathSteps.length} steps)`;
  }

  // Detailed path text
  const pathEn = personPath.map((p) => p.name).join(' ➔ ');
  const pathHi = personPath.map((p) => p.nameHindi || p.name).join(' ➔ ');

  return {
    personId: sourcePersonId,
    targetPersonId,
    englishRelation,
    hindiRelation,
    hindiTransliterated,
    pathDescriptionEn: pathEn,
    pathDescriptionHi: pathHi,
    degree,
  };
}

/**
 * Auto-calculates relationships from a target person to ALL other members in the tree
 */
export function getAllRelationshipsForPerson(
  persons: Person[],
  sourcePersonId: string
): CalculatedRelation[] {
  const results: CalculatedRelation[] = [];
  persons.forEach((target) => {
    if (target.id !== sourcePersonId) {
      const rel = calculateRelationship(persons, sourcePersonId, target.id);
      if (rel) results.push(rel);
    }
  });

  // Sort by degree (closest relations first)
  results.sort((a, b) => a.degree - b.degree);
  return results;
}

/**
 * Assigns or calculates generation levels (Root elders = Gen 1, children = Gen 2, etc.)
 */
export function calculateGenerations(persons: Person[]): Person[] {
  if (persons.length === 0) return [];

  const personMap = new Map<string, Person>();
  persons.forEach((p) => personMap.set(p.id, { ...p }));

  // Find elders with no parents recorded
  const roots = Array.from(personMap.values()).filter((p) => p.parentIds.length === 0);

  // BFS generation assignment
  const genMap = new Map<string, number>();

  roots.forEach((r) => {
    genMap.set(r.id, 1);
  });

  let changed = true;
  let passes = 0;
  while (changed && passes < 20) {
    changed = false;
    passes++;

    personMap.forEach((p) => {
      const currentGen = genMap.get(p.id) || 1;

      // Children are currentGen + 1
      p.childrenIds.forEach((childId) => {
        const childGen = genMap.get(childId);
        if (childGen === undefined || childGen < currentGen + 1) {
          genMap.set(childId, currentGen + 1);
          changed = true;
        }
      });

      // Spouses are same generation
      p.spouseIds.forEach((spouseId) => {
        const spouseGen = genMap.get(spouseId);
        if (spouseGen === undefined) {
          genMap.set(spouseId, currentGen);
          changed = true;
        }
      });

      // Parents are currentGen - 1
      p.parentIds.forEach((parentId) => {
        const parentGen = genMap.get(parentId);
        if (parentGen === undefined || parentGen > currentGen - 1) {
          const newGen = Math.max(1, currentGen - 1);
          genMap.set(parentId, newGen);
          changed = true;
        }
      });
    });
  }

  // Normalize min gen to 1
  let minGen = Infinity;
  genMap.forEach((g) => {
    if (g < minGen) minGen = g;
  });

  if (minGen === Infinity) minGen = 1;
  const shift = 1 - minGen;

  return Array.from(personMap.values()).map((p) => ({
    ...p,
    generation: (genMap.get(p.id) || 1) + shift,
  }));
}
