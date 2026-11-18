import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { LIST_CATEGORIES } from '../constants/listCategories';
import { MAP_MARKER_LAYOUT } from '../constants/mapConfig';
import { COLORS, FONT_SIZE, ICON_SIZE, RADII, SPACING } from '../constants/theme';
import ListCategoryIcon from './ListCategoryIcon';

/**
 * @param {{
 *   markers: Array<{
 *     id: number,
 *     coordinate: { latitude: number, longitude: number },
 *     title: string,
 *     listType: string
 *   }>,
 *   onMarkerPress: (marker: object) => void,
 *   listCategories?: Array<{
 *     id: string,
 *     label: string,
 *     icon: string,
 *     color: string,
 *     bg: string,
 *     emoji?: string | null
 *   }>
 * }} props
 */
export default function MapMarkers({ markers, onMarkerPress, listCategories = LIST_CATEGORIES }) {
  return markers.map((marker) => {
    const styleConfig = listCategories.find(
      (category) => category.id === marker.listType
    ) || listCategories[0];

    return (
      <Marker
        key={`marker-${marker.id}`}
        coordinate={marker.coordinate}
        anchor={{ x: 0.5, y: 1 }}
        onPress={() => onMarkerPress(marker)}
      >
        <View style={[styles.pillContainer, { backgroundColor: styleConfig.bg }]}>
          <ListCategoryIcon
            category={styleConfig}
            size={ICON_SIZE.marker}
            color={styleConfig.color}
            style={styles.pillIcon}
          />
          <Text style={[styles.pillText, { color: styleConfig.color }]} numberOfLines={1}>
            {marker.title}
          </Text>
        </View>
      </Marker>
    );
  });
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MAP_MARKER_LAYOUT.horizontalPadding,
    paddingVertical: MAP_MARKER_LAYOUT.verticalPadding,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.markerBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: SPACING.xs },
    shadowOpacity: MAP_MARKER_LAYOUT.shadowOpacity,
    shadowRadius: MAP_MARKER_LAYOUT.shadowRadius,
    elevation: MAP_MARKER_LAYOUT.elevation,
  },
  pillIcon: {
    marginRight: MAP_MARKER_LAYOUT.iconGap,
  },
  pillText: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '600',
    maxWidth: MAP_MARKER_LAYOUT.maxTitleWidth,
  },
});
