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
  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="List emoji"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={INPUT_LIMITS.emoji}
        onChangeText={onEmojiChange}
        placeholder="Type an emoji"
        placeholderTextColor={COLORS.placeholder}
        value={selectedEmoji}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: CONTROL_SIZE.height,
    paddingHorizontal: SPACING.control,
    borderWidth: 1,
    borderColor: COLORS.placeholder,
    borderRadius: RADII.control,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    fontSize: FONT_SIZE.emoji,
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
