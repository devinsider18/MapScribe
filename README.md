# MapScribe

Сделал это приложение на Expo и React Native, чтобы удобно сохранять места на карте, собирать их в списки и разбираться с поездками, не теряя заметок и дат.

## Что внутри

На карте можно смотреть маркеры и сами места через `MapViewComponent` и `MapMarkers`. Когда хочется добавить точку или поправить детали, открываются `SavePlaceModal` и `PlaceDetailsModal`, к месту можно прикрутить фото в `PlacePhotoGallery` и выбрать дату в `DatePickerField`.

Отдельно собираются списки и поездки. В `SavedListsPanel` удобно крутить списки, менять категории, цвета, иконки и эмодзи, а для поездок есть `TripsSection`. Под капотом всё завязано на локальную базу в `src/api/database.js`, подгрузку фото через `src/api/placePhotos.js`, модели в `src/models/savedMarkers.mjs` и хук `useSavedMarkers.js`. Кое-что уже покрыто тестами в `tests/`.

## Структура проекта

- `app/index.tsx` — главный экран и точка входа
- `src/api/` — работа с локальной базой `database.js` и фото мест `placePhotos.js`
- `src/components/` — карта, списки, поездки, модалки и пикеры
- `src/constants/` — темы, цвета, иконки, категории, даты, прогресс, сообщения и настройки карты
- `src/hooks/` — хук `useSavedMarkers.js`
- `src/models/` — модели данных и логика `savedMarkers.mjs`
- `src/types/domain.ts` — типы сущностей
- `tests/` — тесты для иконок списков, дат и сохранённых маркеров
- `android/` — нативная часть под Android