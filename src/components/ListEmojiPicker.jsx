import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function ListEmojiPicker({
  selectedEmoji,
  onEmojiChange,
  defaultIcon = 'folder',
  defaultColor = '#49454F',
}) {
  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="List emoji"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={16}
        onChangeText={onEmojiChange}
        placeholder="Type an emoji"
        placeholderTextColor="#74777F"
        value={selectedEmoji}
        style={styles.input}
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Use default list icon"
        onPress={() => onEmojiChange('')}
        style={styles.defaultButton}
      >
        <MaterialIcons name={defaultIcon} size={22} color={defaultColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 14,
    color: '#1D1B20',
    backgroundColor: '#FFFFFF',
    fontSize: 18,
  },
  defaultButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EAE6EF',
  },
});
