import * as FileSystem from 'expo-file-system/legacy';

const PLACE_PHOTO_DIRECTORY = 'place-photos/';
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic']);

function getPhotoDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error('Persistent photo storage is unavailable on this device.');
  }

  return `${FileSystem.documentDirectory}${PLACE_PHOTO_DIRECTORY}`;
}

async function ensurePhotoDirectory() {
  const directory = getPhotoDirectory();
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }
  return directory;
}

/**
 * @param {{ uri: string, fileName?: string | null }} asset
 * @returns {Promise<string>}
 */
export async function copyPhotoToPlaceStorage(asset, placeId) {
  const directory = await ensurePhotoDirectory();
  const sourceName = asset.fileName || asset.uri;
  const extension = sourceName.match(/\.([a-zA-Z0-9]{1,5})(?:[?#].*)?$/)?.[1]?.toLowerCase();
  const safeExtension = extension && SUPPORTED_IMAGE_EXTENSIONS.has(extension)
    ? extension
    : 'jpg';
  const fileName = `place-${placeId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;
  const destination = `${directory}${fileName}`;

  await FileSystem.copyAsync({ from: asset.uri, to: destination });
  return destination;
}

/**
 * @param {string[]} photoUris
 */
export async function deletePlacePhotoFiles(photoUris) {
  if (!photoUris.length) return;

  const directory = getPhotoDirectory();
  const deletions = await Promise.allSettled(
    photoUris
      .filter((uri) => uri.startsWith(directory))
      .map((uri) => FileSystem.deleteAsync(uri, { idempotent: true }))
  );
  const failure = deletions.find((result) => result.status === 'rejected');
  if (failure) {
    throw new Error('One or more saved place photos could not be deleted.', {
      cause: failure.reason,
    });
  }
}
