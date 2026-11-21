import { MaterialIcons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { getMaterialIconName } from '../constants/listIcons.mjs';
import { ICON_SIZE } from '../constants/theme';

/**
 * @param {{
 *   category: {
 *     icon: import('react').ComponentProps<typeof MaterialIcons>['name'],
 *     color: string,
 *     emoji?: string | null
 *   },
 *   size?: number,
 *   color?: string,
 *   style?: import('react-native').StyleProp<import('react-native').TextStyle>
 * }} props
 */
export default function ListCategoryIcon({ category, size = ICON_SIZE.medium, color, style }) {
  const materialIcon = getMaterialIconName(category.emoji ?? '');

  if (materialIcon) {
    return (
      <MaterialIcons
        name={materialIcon}
        size={size}
        color={color || category.color}
        style={style}
      />
    );
  }

  if (category.emoji) {
    return <Text style={[{ fontSize: size }, style]}>{category.emoji}</Text>;
  }

  return (
    <MaterialIcons
      name={category.icon}
      size={size}
      color={color || category.color}
      style={style}
    />
  );
}
