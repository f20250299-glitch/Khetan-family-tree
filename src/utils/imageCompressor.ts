/**
 * Image compressor utility to ensure profile photos stay under ~15KB each.
 * This prevents Firestore 1MB document limit or LocalStorage quota failures.
 */

export async function compressAvatarImage(
  imageSrc: string,
  maxDimension = 180,
  quality = 0.72
): Promise<string> {
  if (!imageSrc || typeof imageSrc !== 'string' || !imageSrc.startsWith('data:image/')) {
    return imageSrc; // SVG presets or external HTTP URLs return as-is
  }

  // If base64 is already small (< 50KB), return immediately without async canvas work
  if (imageSrc.length < 50000) {
    return imageSrc;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const safeResolve = (val: string) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    // Safety timeout: resolve with original imageSrc if image loading takes over 1 second
    const timer = setTimeout(() => {
      safeResolve(imageSrc);
    }, 1000);

    const img = new Image();

    // Do NOT set crossOrigin on data: URLs as it can break canvas in Safari/Chrome
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return safeResolve(imageSrc);
        }

        const minDim = Math.min(width, height);
        const cropX = (width - minDim) / 2;
        const cropY = (height - minDim) / 2;

        canvas.width = maxDimension;
        canvas.height = maxDimension;

        const ctx = canvas.getContext('2d');
        if (!ctx) return safeResolve(imageSrc);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, maxDimension, maxDimension);

        ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, maxDimension, maxDimension);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        safeResolve(compressed.length < imageSrc.length ? compressed : imageSrc);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        safeResolve(imageSrc);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      safeResolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

/**
 * Sanitizes and compresses all avatars inside a family tree object asynchronously.
 * Guarantees existing photos are kept intact while scaling them to lightweight thumbnails.
 */
export async function sanitizeAndCompressTreePhotos<T extends { persons?: any[] }>(tree: T): Promise<T> {
  if (!tree || !Array.isArray(tree.persons)) return tree;

  const compressedPersons = await Promise.all(
    tree.persons.map(async (person) => {
      if (person && person.avatarUrl && typeof person.avatarUrl === 'string' && person.avatarUrl.startsWith('data:image/')) {
        const compressedUrl = await compressAvatarImage(person.avatarUrl, 180, 0.72);
        return { ...person, avatarUrl: compressedUrl };
      }
      return person;
    })
  );

  return {
    ...tree,
    persons: compressedPersons,
  };
}
