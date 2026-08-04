/**
 * Utility to scrub and strip all profile photo assets from family tree data.
 * Completely eliminates heavy image payloads to optimize database storage and allow adding unlimited people.
 */

export function removeTreePhotos<T extends { persons?: any[] }>(tree: T): T {
  if (!tree || !Array.isArray(tree.persons)) return tree;

  const cleanedPersons = tree.persons.map((person) => {
    if (!person) return person;
    const { avatarUrl, ...rest } = person;
    return rest;
  });

  return {
    ...tree,
    persons: cleanedPersons,
  };
}

/**
 * Legacy compatibility alias for sanitizing tree photos by stripping them completely.
 */
export async function sanitizeAndCompressTreePhotos<T extends { persons?: any[] }>(tree: T): Promise<T> {
  return removeTreePhotos(tree);
}

export async function compressAvatarImage(imageSrc: string): Promise<string> {
  return '';
}

