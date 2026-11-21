# MapScribe

I built this app with Expo and React Native to save spots on a map, group them into lists, and organize trips without losing notes or dates.

## What's inside

You can view markers and saved places on the map through `MapViewComponent` and `MapMarkers`. When you want to add a spot or edit its details, `SavePlaceModal` and `PlaceDetailsModal` handle that, while `PlacePhotoGallery` attaches photos and `DatePickerField` lets you pick dates.

Lists and trips live separately. `SavedListsPanel` handles browsing lists and tweaking categories, colors, icons, and emojis, while `TripsSection` keeps trips organized. Under the hood, everything runs on a local database in `src/api/database.js`, photo fetching in `src/api/placePhotos.js`, data models in `src/models/savedMarkers.mjs`, and the `useSavedMarkers.js` hook. Core logic is covered by tests in `tests/`.

## Project structure

- `app/index.tsx` - main screen and entry point
- `src/api/` - local database `database.js` and place photos `placePhotos.js`
- `src/components/` - map, lists, trips, modals, and pickers
- `src/constants/` - themes, colors, icons, categories, dates, progress, messages, and map config
- `src/hooks/` - `useSavedMarkers.js` hook
- `src/models/` - data models and logic `savedMarkers.mjs`
- `src/types/domain.ts` - entity type definitions
- `tests/` - tests for list icons, dates, and saved markers
- `android/` - native Android project files