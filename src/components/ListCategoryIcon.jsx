import { MaterialIcons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { ICON_SIZE } from '../constants/theme';

/**
 * @param {{
 *   category: { icon: string, color: string, emoji?: string | null },
 *   size?: number,
 *   color?: string,
 *   style?: import('react-native').StyleProp<import('react-native').TextStyle>
 * }} props
 */
export default function ListCategoryIcon({ category, size = ICON_SIZE.medium, color, style }) {
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
