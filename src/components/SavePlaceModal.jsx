import { MaterialIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LIST_CATEGORIES } from '../constants/listCategories';

export default function SavePlaceModal({ modalState, setModalState, onSave }) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={modalState.visible}
      onRequestClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setModalState((prev) => ({ ...prev, visible: false }))}
      >
        <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.modalTitle}>Save Place</Text>
          <Text style={styles.modalSubtitle}>Add custom name and choose a list for this location.</Text>

          <TextInput
            style={styles.input}
            placeholder="Place name (e.g., Best Coffee)"
            placeholderTextColor="#74777F"
            value={modalState.title}
            onChangeText={(text) => setModalState((prev) => ({ ...prev, title: text }))}
            autoFocus
          />

          <Text style={styles.sectionLabel}>Select List</Text>

          <ScrollView style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContainer}>
            {LIST_CATEGORIES.map((category) => {
              const isSelected = modalState.listType === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: category.bg },
                    isSelected && styles.categoryChipSelected,
                  ]}
                  onPress={() => setModalState((prev) => ({ ...prev, listType: category.id }))}
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
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setModalState((prev) => ({ ...prev, visible: false }))}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: '#F8F9FA',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#44474F',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1C1E',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#44474F',
    marginBottom: 8,
  },
  categoriesScroll: {
    maxHeight: 180,
    marginBottom: 20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    borderColor: '#0B57D0',
    borderWidth: 2,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#0B57D0',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#0B57D0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
