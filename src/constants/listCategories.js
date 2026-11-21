import { COLORS } from './theme';

export const DEFAULT_LIST_TYPE = 'want_to_go';

/** @type {Array<{
 *   id: string,
 *   label: string,
 *   icon: import('react').ComponentProps<typeof import('@expo/vector-icons').MaterialIcons>['name'],
 *   color: string,
 *   bg: string
 * }>} */
export const LIST_CATEGORIES = [
  {
    id: DEFAULT_LIST_TYPE,
    label: 'Want to go',
    icon: 'bookmark-border',
    color: COLORS.listWantToGo,
    bg: COLORS.listWantToGoSurface,
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: 'favorite',
    color: COLORS.listFavorite,
    bg: COLORS.dangerContainer,
  },
  {
    id: 'starred_places',
    label: 'Starred places',
    icon: 'star',
    color: COLORS.listStarred,
    bg: COLORS.listStarredSurface,
  },
  {
    id: 'labeled',
    label: 'Labeled',
    icon: 'label',
    color: COLORS.listLabeled,
    bg: COLORS.listLabeledSurface,
  },
  {
    id: 'travel_plans',
    label: 'Travel Plans',
    icon: 'flight',
    color: COLORS.listTravel,
    bg: COLORS.listTravelSurface,
  },
  {
    id: 'saved_trips',
    label: 'Saved trips',
    icon: 'card-travel',
    color: COLORS.listTrips,
    bg: COLORS.listTripsSurface,
  },
];
