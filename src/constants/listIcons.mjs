export const MAP_ICON_NAMES = [
  'map',
  'place',
  'location-on',
  'pin-drop',
  'my-location',
  'location-searching',
  'near-me',
  'navigation',
  'explore',
  'public',
  'terrain',
  'layers',
  'satellite',
  'directions',
  'directions-walk',
  'directions-bike',
  'directions-car',
  'directions-transit',
  'flight',
  'train',
  'local-parking',
  'streetview',
];

const MATERIAL_ICON_PREFIX = 'material-icon:';
const FIRST_EMOJI_PATTERN = /(?:[#*0-9]\uFE0F?\u20E3|\p{Regional_Indicator}{2}|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?)*)/u;

export function encodeMaterialIcon(iconName) {
  return `${MATERIAL_ICON_PREFIX}${iconName}`;
}

export function getMaterialIconName(value) {
  if (typeof value !== 'string' || !value.startsWith(MATERIAL_ICON_PREFIX)) {
    return null;
  }

  const iconName = value.slice(MATERIAL_ICON_PREFIX.length);
  return MAP_ICON_NAMES.includes(iconName) ? iconName : null;
}

export function getFirstEmoji(value) {
  return FIRST_EMOJI_PATTERN.exec(value)?.[0] ?? '';
}
