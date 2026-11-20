import { StyleSheet } from 'react-native';
import {
  COLORS,
  FONT_SIZE,
  MODAL_WIDTH,
  RADII,
  SHADOWS,
  SPACING,
} from '../constants/theme';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modalScrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: MODAL_WIDTH.place,
    maxHeight: '90%',
    flexShrink: 1,
    backgroundColor: COLORS.dialogSurface,
    borderRadius: RADII.xl,
    padding: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: SHADOWS.modal.offsetY },
    shadowOpacity: SHADOWS.modal.opacity,
    shadowRadius: SHADOWS.modal.radius,
    elevation: SHADOWS.modal.elevation,
  },
  modalTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    color: COLORS.textStrong,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textSubtle,
    marginBottom: SPACING.lg,
  },
  modalBody: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  modalBodyContent: {
    paddingBottom: SPACING.sm,
  },
  errorMessage: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.body,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.placeholder,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.bodyLarge,
    color: COLORS.textStrong,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
    color: COLORS.textSubtle,
    marginBottom: SPACING.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  categoryIcon: {
    marginRight: SPACING.tight,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: SPACING.md,
  },
  progressOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  progressOption: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.raisedSurface,
  },
  progressOptionSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  progressOptionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.small,
  },
  progressOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
  },
  button: {
    paddingVertical: SPACING.compact,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    backgroundColor: COLORS.dangerContainer,
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: FONT_SIZE.body,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONT_SIZE.body,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZE.body,
  },
});

export default styles;
