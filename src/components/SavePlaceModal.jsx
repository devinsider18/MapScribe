import { MaterialIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LIST_CATEGORIES } from '../constants/listCategories';
import styles from './SavePlaceModal.styles';

export default function SavePlaceModal({
  visible,
  title,
  selectedListType,
  errorMessage,
  isEditing,
  onTitleChange,
  onListTypeChange,
  onClose,
  onSave,
  onDelete,
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Place' : 'Save Place'}</Text>
          <Text style={styles.modalSubtitle}>
            {isEditing ? 'Update the name or list for this place.' : 'Add custom name and choose a list for this location.'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Place name (e.g., Best Coffee)"
            placeholderTextColor="#74777F"
            value={title}
            onChangeText={onTitleChange}
            autoFocus
          />

          <Text style={styles.sectionLabel}>Select List</Text>

          <ScrollView style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContainer}>
            {LIST_CATEGORIES.map((category) => {
              const isSelected = selectedListType === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: category.bg },
                    isSelected && styles.categoryChipSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onListTypeChange(category.id)}
                >
                  <MaterialIcons name={category.icon} size={16} color={category.color} style={styles.categoryIcon} />
                  <Text style={[styles.categoryChipText, { color: category.color }]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.modalButtons}>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                accessibilityRole="button"
                onPress={onDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              accessibilityRole="button"
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              accessibilityRole="button"
              onPress={onSave}
            >
              <Text style={styles.saveButtonText}>{isEditing ? 'Save changes' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
