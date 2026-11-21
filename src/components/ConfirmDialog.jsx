import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import styles from './ConfirmDialog.styles';

/**
 * @param {{
 *   visible: boolean,
 *   title: string,
 *   message: string,
 *   confirmLabel?: string,
 *   onCancel: () => void,
 *   onConfirm: () => void
 * }} props
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.actionButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.actionButton}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
