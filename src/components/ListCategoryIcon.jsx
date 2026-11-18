import { MaterialIcons } from '@expo/vector-icons';
import { Text } from 'react-native';

export default function ListCategoryIcon({ category, size = 22, color, style }) {
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
