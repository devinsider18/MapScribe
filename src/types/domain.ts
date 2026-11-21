import type { ComponentProps } from 'react';
import { MaterialIcons } from '@expo/vector-icons';

import { PLACE_PROGRESS } from '../constants/placeProgress.mjs';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type PlaceProgress = typeof PLACE_PROGRESS[keyof typeof PLACE_PROGRESS];

export type MarkerRow = {
  id: number;
  latitude: number;
  longitude: number;
  title: string | null;
  listType?: string | null;
  photos?: string | null;
  progress?: string | null;
  notes?: string | null;
  visitedAt?: string | null;
};

export type SavedMarker = {
  id: number;
  coordinate: Coordinate;
  title: string;
  listType: string;
  photos: string[];
  progress: PlaceProgress;
  notes: string;
  visitedAt: string | null;
};

export type SavedListRow = {
  id: number;
  name: string;
};

export type SavedListCategory = {
  id: string;
  label: string;
  icon: ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  bg: string;
  emoji?: string | null;
};

export type SavedTrip = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  markerIds: number[];
};

export type SavedMarkerStorage = {
  initialize: () => void;
  getAll: () => MarkerRow[];
  getLists: () => SavedListRow[];
  getListIconOverrides?: () => { list_id: string; emoji: string }[];
  getListColorOverrides?: () => { list_id: string; color: string; bg: string }[];
  getTrips?: () => SavedTrip[];
  insert: (
    coordinate: Coordinate,
    title: string,
    listType: string,
    notes: string,
    visitedAt: string | null
  ) => number;
  insertList: (name: string) => number;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  insertTrip: (name: string, startDate: string, endDate: string) => number;
  updateTrip: (id: number, name: string, startDate: string, endDate: string) => void;
  deleteTrip: (id: number) => void;
  setTripStops: (tripId: number, markerIds: number[]) => void;
  setListIcon: (listId: string, emoji: string | null) => void;
  setListColor: (
    listId: string,
    colors: { color: string; bg: string } | null
  ) => void;
  update: (
    id: number,
    coordinate: Coordinate,
    title: string,
    listType: string,
    photos: string[],
    progress: PlaceProgress,
    notes: string,
    visitedAt: string | null
  ) => void;
  updatePhotos: (id: number, photos: string[]) => void;
  updateProgress: (id: number, progress: PlaceProgress) => void;
  delete: (id: number) => void;
};

export type SavedMarkersState = {
  markers: SavedMarker[];
  customLists: SavedListCategory[];
  trips: SavedTrip[];
  listIconOverrides: Record<string, string>;
  listColorOverrides: Record<string, { color: string; bg: string }>;
  loadError: string | null;
};
