import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LIST_CATEGORIES } from '../constants/listCategories';
import useSavedMarkers from '../hooks/useSavedMarkers';

export default function SavedListsPanel() {
  const { markers, loadError, reloadSavedMarkers } = useSavedMarkers();
  const [expandedList, setExpandedList] = useState(null);

  useEffect(() => {
    reloadSavedMarkers();
  }, [reloadSavedMarkers]);

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />
      <Text style={styles.title}>Your lists</Text>
      <Text style={styles.subtitle}>Saved places, organized your way.</Text>

      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      <ScrollView contentContainerStyle={styles.listContainer}>
        {LIST_CATEGORIES.map((category) => {
          const places = markers.filter((marker) => marker.listType === category.id);
          const isExpanded = expandedList === category.id;

          return (
            <View key={category.id} style={styles.listCard}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                onPress={() => setExpandedList(isExpanded ? null : category.id)}
                style={styles.listHeader}
              >
                <View style={[styles.listIcon, { backgroundColor: category.bg }]}>
                  <MaterialIcons name={category.icon} size={22} color={category.color} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{category.label}</Text>
                  <Text style={styles.placeCount}>
                    {places.length} {places.length === 1 ? 'place' : 'places'}
                  </Text>
                </View>
                <MaterialIcons
                  name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color="#49454F"
                />
              </TouchableOpacity>

              {isExpanded ? (
                <View style={styles.places}>
                  {places.length ? (
                    places.map((place) => (
                      <View key={place.id} style={styles.placeRow}>
                        <MaterialIcons name="place" size={18} color={category.color} />
                        <Text style={styles.placeName}>{place.title}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyList}>No places yet</Text>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#FEF7FF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C8C5D0',
    marginBottom: 12,
  },
  title: {
    color: '#1D1B20',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#625D67',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  error: {
    color: '#B3261E',
    backgroundColor: '#FCE8E6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 12,
  },
  listCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#F3EFF7',
  },
  listHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    color: '#1D1B20',
    fontSize: 15,
    fontWeight: '600',
  },
  placeCount: {
    color: '#625D67',
    fontSize: 13,
    marginTop: 3,
  },
  places: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9D4DE',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  placeRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeName: {
    color: '#1D1B20',
    fontSize: 14,
  },
  emptyList: {
    color: '#625D67',
    fontSize: 14,
    paddingVertical: 10,
    paddingLeft: 30,
  },
});
