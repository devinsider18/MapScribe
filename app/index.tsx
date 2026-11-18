import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapViewComponent from '@/components/MapViewComponent';
import SavedListsPanel from '@/components/SavedListsPanel';
import useSavedMarkers from '@/hooks/useSavedMarkers';
import {
  BOTTOM_BAR_MIN_HEIGHT,
  LIST_PANEL_LAYOUT,
  TAB_BAR_LAYOUT,
} from '@/constants/mapConfig';
import { COLORS, FONT_SIZE, ICON_SIZE, RADII, SPACING } from '@/constants/theme';

type TabName = 'explore' | 'lists';
type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function Page() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const savedPlaces = useSavedMarkers();
  const [activeTab, setActiveTab] = useState<TabName>('explore');
  const [bottomBarHeight, setBottomBarHeight] = useState(
    BOTTOM_BAR_MIN_HEIGHT + insets.bottom
  );
  const listsVisible = activeTab === 'lists';
  const panelTop = Math.max(
    insets.top + LIST_PANEL_LAYOUT.topInset,
    screenHeight - bottomBarHeight - Math.min(
      screenHeight * LIST_PANEL_LAYOUT.maxScreenHeightRatio,
      LIST_PANEL_LAYOUT.maxHeight
    )
  );

  const handleTabPress = (tab: TabName) => {
    setActiveTab((current) => (current === tab && tab === 'lists' ? 'explore' : tab));
  };

  return (
    <View style={styles.container}>
      <MapViewComponent savedPlaces={savedPlaces} />
      {listsVisible ? (
        <View style={[styles.panelContainer, { top: panelTop, bottom: bottomBarHeight }]}>
          <SavedListsPanel savedPlaces={savedPlaces} />
        </View>
      ) : null}
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
          label="Explore"
          icon="explore"
          active={!listsVisible}
          onPress={() => handleTabPress('explore')}
        />
        <TabButton
          label="Lists"
          icon="bookmark-border"
          active={listsVisible}
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