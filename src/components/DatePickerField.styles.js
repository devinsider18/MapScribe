import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, MODAL_WIDTH, RADII, SHADOWS, SPACING } from '../constants/theme';

export default StyleSheet.create({
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.white,
  },
  fieldText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.bodyLarge,
  },
  placeholder: {
    color: COLORS.placeholder,
  },
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
    padding: SPACING.lg,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.dialogSurface,
    elevation: SHADOWS.modal.elevation,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: SHADOWS.modal.offsetY },
    shadowOpacity: SHADOWS.modal.opacity,
    shadowRadius: SHADOWS.modal.radius,
  },
  dialogLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedDate: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  monthHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
  },
  monthTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  weekday: {
    width: '14.2857%',
    height: 36,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
  },
  dayCell: {
    width: '14.2857%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
  },
  selectedDay: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.body,
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  actions: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  actionSpacer: {
    flex: 1,
  },
  actionButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill,
  },
  actionText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
  confirmButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
  },
  disabledConfirmButton: {
    backgroundColor: COLORS.handle,
  },
  confirmText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
});
