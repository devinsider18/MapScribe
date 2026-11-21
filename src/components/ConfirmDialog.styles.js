import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, MODAL_WIDTH, RADII, SHADOWS, SPACING } from '../constants/theme';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.panelScrim,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialog: {
    width: '100%',
    maxWidth: MODAL_WIDTH.place,
    padding: SPACING.xxl,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.dialogSurface,
    elevation: SHADOWS.modal.elevation,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: SHADOWS.modal.offsetY },
    shadowOpacity: SHADOWS.modal.opacity,
    shadowRadius: SHADOWS.modal.radius,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
  },
  message: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.body,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xl,
  },
  actionButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill,
  },
  cancelText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
  confirmText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.body,
    fontWeight: '700',
  },
});
