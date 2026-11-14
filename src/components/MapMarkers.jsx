import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { LIST_CATEGORIES } from '../constants/listCategories';

export default function MapMarkers({ markers }) {
  return markers.map((marker) => {
    const styleConfig = LIST_CATEGORIES.find((category) => category.id === marker.listType) || LIST_CATEGORIES[0];

    return (
      <Marker
        key={`marker-${marker.id}`}
        coordinate={marker.coordinate}
        title={marker.title}
        anchor={{ x: 0.5, y: 1 }}
      >
        <View style={[styles.pillContainer, { backgroundColor: styleConfig.bg }]}>
          <MaterialIcons name={styleConfig.icon} size={14} color={styleConfig.color} style={styles.pillIcon} />
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 100,
  },
});
