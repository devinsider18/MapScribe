import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import {
  COLORS,
  CONTROL_SIZE,
  FONT_SIZE,
  ICON_SIZE,
  INPUT_LIMITS,
  RADII,
  SPACING,
} from '../constants/theme';
import {
  encodeMaterialIcon,
  getFirstEmoji,
  getMaterialIconName,
  MAP_ICON_NAMES,
} from '../constants/listIcons.mjs';

/**
 * @param {{
 *   selectedEmoji: string,
 *   onEmojiChange: (emoji: string) => void,
 *   defaultIcon?: string,
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
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="List emoji, one emoji only"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={INPUT_LIMITS.emoji}
          onChangeText={(value) => onEmojiChange(getFirstEmoji(value))}
          placeholder="😀"
          placeholderTextColor={COLORS.placeholder}
          value={selectedMaterialIcon ? '' : selectedEmoji}
          style={styles.input}
        />
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    width: CONTROL_SIZE.height,
    minHeight: CONTROL_SIZE.height,
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: COLORS.placeholder,
    borderRadius: RADII.control,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    fontSize: FONT_SIZE.emoji,
    textAlign: 'center',
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
