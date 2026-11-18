import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapViewComponent from '@/components/MapViewComponent';
import SavedListsPanel from '../src/components/SavedListsPanel';

type TabName = 'explore' | 'lists';
type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export default function Page() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabName>('explore');
  const [bottomBarHeight, setBottomBarHeight] = useState(72 + insets.bottom);
  const listsVisible = activeTab === 'lists';
  const panelTop = Math.max(
    insets.top + 8,
    screenHeight - bottomBarHeight - Math.min(screenHeight * 0.68, 620)
  );

  const handleTabPress = (tab: TabName) => {
    setActiveTab((current) => (current === tab && tab === 'lists' ? 'explore' : tab));
  };

  return (
    <View style={styles.container}>
      <MapViewComponent />
      {listsVisible ? (
        <View style={[styles.panelContainer, { top: panelTop, bottom: bottomBarHeight }]}>
          <SavedListsPanel />
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
        <MaterialIcons name={icon} size={24} color={active ? '#1D1B20' : '#49454F'} />
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
    minHeight: 72,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F7F2FA',
  },
  tabButton: {
    minWidth: 132,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 28,
    backgroundColor: '#F3EFF7',
  },
  activeTabButton: {
    backgroundColor: '#D3E3FD',
  },
  tabIcon: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: '#49454F',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#1D1B20',
    fontWeight: '600',
  },
});