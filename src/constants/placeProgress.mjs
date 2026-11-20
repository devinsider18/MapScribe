export const PLACE_PROGRESS = {
  unvisited: 'unvisited',
  planned: 'planned',
  visited: 'visited',
};

export const PLACE_PROGRESS_LABELS = {
  [PLACE_PROGRESS.unvisited]: 'Not visited',
  [PLACE_PROGRESS.planned]: 'Planned',
  [PLACE_PROGRESS.visited]: 'Visited',
};

export const PLACE_PROGRESS_ORDER = [
  PLACE_PROGRESS.unvisited,
  PLACE_PROGRESS.planned,
  PLACE_PROGRESS.visited,
];

export function getNextPlaceProgress(progress) {
  const currentIndex = PLACE_PROGRESS_ORDER.indexOf(progress);
  return PLACE_PROGRESS_ORDER[(currentIndex + 1) % PLACE_PROGRESS_ORDER.length];
}
