import { MaterialIcons } from '@expo/vector-icons';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ComponentProps } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapViewComponent from '@/components/MapViewComponent';
import SavedListsPanel from '@/components/SavedListsPanel';
import TripsSection from '@/components/TripsSection';
import useSavedMarkers from '@/hooks/useSavedMarkers';
import {
  BOTTOM_BAR_MIN_HEIGHT,
  LIST_PANEL_LAYOUT,
  TAB_BAR_LAYOUT,
} from '@/constants/mapConfig';
import { COLORS, FONT_SIZE, ICON_SIZE, RADII, SPACING } from '@/constants/theme';

type TabName = 'trips' | 'lists';
type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type SavedPlace = ReturnType<typeof useSavedMarkers>['markers'][number];

export default function Page() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const savedPlaces = useSavedMarkers();
  const [activeTab, setActiveTab] = useState<TabName>('trips');
  const [panelVisible, setPanelVisible] = useState(true);
  const [panelProgress] = useState(() => new Animated.Value(0));
  const [locationAvailable, setLocationAvailable] = useState(false);
  const [locationRequestId, setLocationRequestId] = useState(0);
  const [mapFilters, setMapFilters] = useState({ listType: 'all', progress: 'all' });
  const [focusPlace, setFocusPlace] = useState<(SavedPlace & { focusKey: number }) | null>(null);
  const [bottomBarHeight, setBottomBarHeight] = useState(
    BOTTOM_BAR_MIN_HEIGHT + insets.bottom
  );
  const listsVisible = panelVisible && activeTab === 'lists';
  const tripsVisible = panelVisible && activeTab === 'trips';
  const panelTop = Math.max(
    insets.top + LIST_PANEL_LAYOUT.topInset,
    screenHeight - bottomBarHeight - Math.min(
      screenHeight * LIST_PANEL_LAYOUT.maxScreenHeightRatio,
      LIST_PANEL_LAYOUT.maxHeight
    )
  );
  const panelHeight = Math.max(0, screenHeight - panelTop - bottomBarHeight);

  useEffect(() => {
    if (!panelVisible) return;
    Animated.spring(panelProgress, {
      toValue: 1,
      damping: 26,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [panelProgress, panelVisible]);

  const closePanel = (afterClose?: () => void) => {
    panelProgress.stopAnimation();
    Animated.timing(panelProgress, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setPanelVisible(false);
      afterClose?.();
    });
  };

  const handlePanelDragStart = () => {
    panelProgress.stopAnimation();
  };

  const handlePanelDrag = (distance: number) => {
    panelProgress.setValue(Math.max(0, Math.min(1, 1 - distance / Math.max(panelHeight, 1))));
  };

  const handlePanelDragEnd = (distance: number, velocity: number) => {
    if (distance > panelHeight * 0.2 || (distance > 30 && velocity > 0.8)) {
      closePanel();
      return;
    }

    Animated.spring(panelProgress, {
      toValue: 1,
      damping: 26,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const openPanel = (tab: TabName) => {
    setActiveTab(tab);
    panelProgress.stopAnimation();
    panelProgress.setValue(0);
    setPanelVisible(true);
  };

  const handleTabPress = (tab: TabName) => {
    if (activeTab === tab) {
      if (panelVisible) {
        closePanel();
      } else {
        openPanel(tab);
      }
      return;
    }

    if (!panelVisible) {
      openPanel(tab);
      return;
    }

    panelProgress.stopAnimation();
    Animated.timing(panelProgress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setActiveTab(tab);
      panelProgress.setValue(0);
      Animated.spring(panelProgress, {
        toValue: 1,
        damping: 26,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleFocusPlace = (place: SavedPlace) => {
    setMapFilters({ listType: 'all', progress: 'all' });
    setFocusPlace({ ...place, focusKey: Date.now() });
    closePanel();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <NavigationBar style="light" />
      <MapViewComponent
        savedPlaces={savedPlaces}
        filters={mapFilters}
        onFiltersChange={setMapFilters}
        focusPlace={focusPlace}
        onFocusPlaceHandled={() => setFocusPlace(null)}
        locationRequestId={locationRequestId}
        onLocationAvailabilityChange={setLocationAvailable}
      />
      {listsVisible ? (
        <Animated.View
          style={[
            styles.panelContainer,
            {
              top: panelTop,
              bottom: bottomBarHeight,
              transform: [{
                translateY: panelProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelHeight, 0],
                }),
              }],
            },
          ]}
        >
          <SavedListsPanel
            savedPlaces={savedPlaces}
            filters={mapFilters}
            onFocusPlace={handleFocusPlace}
            onDismiss={closePanel}
            onDragStart={handlePanelDragStart}
            onDrag={handlePanelDrag}
            onDragEnd={handlePanelDragEnd}
          />
        </Animated.View>
      ) : null}
      {tripsVisible ? (
        <Animated.View
          style={[
            styles.panelContainer,
            {
              top: panelTop,
              bottom: bottomBarHeight,
              transform: [{
                translateY: panelProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelHeight, 0],
                }),
              }],
            },
          ]}
        >
          <TripsSection
            trips={savedPlaces.trips}
            markers={savedPlaces.markers}
            createTrip={savedPlaces.createTrip}
            updateTrip={savedPlaces.updateTrip}
            deleteTrip={savedPlaces.deleteTrip}
            updateTripStops={savedPlaces.updateTripStops}
            onFocusPlace={handleFocusPlace}
            onDismiss={closePanel}
            onDragStart={handlePanelDragStart}
            onDrag={handlePanelDrag}
            onDragEnd={handlePanelDragEnd}
          />
        </Animated.View>
      ) : null}
      <Animated.View
        style={[
          styles.locationButtonPosition,
          {
            bottom: bottomBarHeight + SPACING.md,
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={locationAvailable
            ? 'Center map on current location'
            : 'Current location unavailable'}
          accessibilityState={{ disabled: !locationAvailable }}
          disabled={!locationAvailable}
          onPress={() => setLocationRequestId((current) => current + 1)}
          style={[
            styles.locationButton,
            !locationAvailable && styles.locationButtonDisabled,
          ]}
        >
          <MaterialIcons
            name={locationAvailable ? 'my-location' : 'location-disabled'}
            size={ICON_SIZE.medium}
            color={locationAvailable ? COLORS.primary : COLORS.textMuted}
          />
        </TouchableOpacity>
      </Animated.View>
      <View
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          setBottomBarHeight((currentHeight) => (
            currentHeight === nextHeight ? currentHeight : nextHeight
          ));
        }}
        style={[styles.bottomBar, { paddingBottom: insets.bottom }]}
      >
        <TabButton
          label="Trip plans"
          icon="event-note"
          active={activeTab === 'trips'}
          onPress={() => handleTabPress('trips')}
        />
        <TabButton
          label="Lists"
          icon="bookmark-border"
          active={activeTab === 'lists'}
          onPress={() => handleTabPress('lists')}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: MaterialIconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tabButton, active && styles.activeTabButton]}
    >
      <View style={styles.tabIcon}>
        <MaterialIcons
          name={icon}
          size={ICON_SIZE.large}
          color={active ? COLORS.textPrimary : COLORS.textSecondary}
        />
      </View>
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  locationButtonPosition: {
    position: 'absolute',
    right: SPACING.lg,
  },
  locationButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.white,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  locationButtonDisabled: {
    backgroundColor: COLORS.cardSurface,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: BOTTOM_BAR_MIN_HEIGHT,
    paddingTop: SPACING.tight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.appBarSurface,
  },
  tabButton: {
    minWidth: TAB_BAR_LAYOUT.buttonWidth,
    minHeight: TAB_BAR_LAYOUT.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxs,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.cardSurface,
  },
  activeTabButton: {
    backgroundColor: COLORS.primaryContainer,
  },
  tabIcon: {
    width: TAB_BAR_LAYOUT.iconWidth,
    height: TAB_BAR_LAYOUT.iconHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.caption,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
});