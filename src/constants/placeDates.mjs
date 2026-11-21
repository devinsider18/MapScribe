/** @param {string | null | undefined} value */
export function isValidPlaceDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

/** @param {string | null | undefined} value */
export function formatPlaceDate(value) {
  if (!value) return '';
  if (!isValidPlaceDate(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

/** @param {string} value */
export function parsePlaceDate(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  return isValidPlaceDate(isoDate) ? isoDate : null;
}
