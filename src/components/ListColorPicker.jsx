import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LIST_COLOR_OPTIONS } from '../constants/listColors.mjs';
import { COLORS, FONT_SIZE, ICON_SIZE, RADII, SPACING } from '../constants/theme';

/**
 * @param {{
 *   selectedColorId: string | null,
 *   onColorChange: (
 *     color: { id: string, label: string, color: string, bg: string } | null
 *   ) => void
 * }} props
 */
export default function ListColorPicker({ selectedColorId, onColorChange }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Use default list color"
        accessibilityState={{ selected: selectedColorId === null }}
        onPress={() => onColorChange(null)}
        style={[styles.colorOption, selectedColorId === null && styles.selectedOption]}
      >
        <MaterialIcons name="format-color-reset" size={ICON_SIZE.medium} color={COLORS.textSecondary} />
        <Text style={styles.defaultLabel}>Default</Text>
      </TouchableOpacity>
      {LIST_COLOR_OPTIONS.map((option) => {
        const selected = selectedColorId === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} list color`}
            accessibilityState={{ selected }}
            onPress={() => onColorChange(option)}
            style={[styles.colorOption, selected && styles.selectedOption]}
          >
            <View style={[styles.swatch, { backgroundColor: option.color }]}>
              {selected ? (
                <MaterialIcons name="check" size={ICON_SIZE.small} color={COLORS.white} />
              ) : null}
            </View>
            <Text style={styles.defaultLabel}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  colorOption: {
    minWidth: 62,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
    borderRadius: RADII.control,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.raisedSurface,
  },
  selectedOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryContainer,
  },
  swatch: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
  },
  defaultLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.caption,
  },
});
