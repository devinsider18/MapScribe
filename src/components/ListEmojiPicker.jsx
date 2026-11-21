import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  COLORS,
  CONTROL_SIZE,
  ICON_SIZE,
  RADII,
  SPACING,
} from '../constants/theme';
import {
  encodeMaterialIcon,
  getMaterialIconName,
  MAP_ICON_NAMES,
} from '../constants/listIcons.mjs';

/**
 * @param {{
 *   selectedEmoji: string,
 *   onEmojiChange: (emoji: string) => void,
 *   defaultIcon?: import('react').ComponentProps<typeof MaterialIcons>['name'],
 *   defaultColor?: string
 * }} props
 */
export default function ListEmojiPicker({
  selectedEmoji,
  onEmojiChange,
  defaultIcon = 'folder',
  defaultColor = COLORS.textSecondary,
}) {
  const selectedMaterialIcon = getMaterialIconName(selectedEmoji);

  return (
    <View style={styles.container}>
      <View style={styles.mapIconList}>
        {MAP_ICON_NAMES.map((iconName) => {
          const isSelected = selectedMaterialIcon === iconName;
          return (
            <TouchableOpacity
              key={iconName}
              accessibilityRole="button"
              accessibilityLabel={`${iconName} map icon`}
              accessibilityState={{ selected: isSelected }}
              onPress={() => onEmojiChange(encodeMaterialIcon(iconName))}
              style={[styles.mapIconButton, isSelected && styles.mapIconButtonSelected]}
            >
              <MaterialIcons
                name={iconName}
                size={ICON_SIZE.medium}
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.defaultRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Use default list icon"
          onPress={() => onEmojiChange('')}
          style={styles.defaultButton}
        >
          <MaterialIcons name={defaultIcon} size={ICON_SIZE.medium} color={defaultColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  mapIconList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING.xs,
  },
  mapIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.control,
    backgroundColor: COLORS.raisedSurface,
  },
  mapIconButtonSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryContainer,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  defaultButton: {
    width: CONTROL_SIZE.iconButton,
    height: CONTROL_SIZE.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.control,
    backgroundColor: COLORS.raisedSurface,
  },
});
