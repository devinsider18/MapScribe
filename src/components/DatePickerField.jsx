import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatPlaceDate, parsePlaceDate } from '../constants/placeDates.mjs';
import { COLORS, ICON_SIZE } from '../constants/theme';
import styles from './DatePickerField.styles';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   onChangeText?: (value: string) => void,
 *   allowClear?: boolean
 * }} props
 */
export default function DatePickerField({ label, value, onChangeText, allowClear = false }) {
  const [visible, setVisible] = useState(false);
  const parsedValue = parsePlaceDate(value);
  const initialDate = parsedValue ? new Date(`${parsedValue}T12:00:00`) : new Date();
  const [month, setMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(parsedValue);

  const openPicker = () => {
    const date = parsePlaceDate(value);
    const initial = date ? new Date(`${date}T12:00:00`) : new Date();
    setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setSelectedDate(date);
    setVisible(true);
  };

  /** @param {number} offset */
  const changeMonth = (offset) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const monthTitle = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(month);
  const firstDayOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dayCells = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (dayCells.length % 7 !== 0) dayCells.push(null);

  /** @param {number} day */
  const selectDay = (day) => {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    setSelectedDate([
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-'));
  };

  /** @param {string | null} date */
  const finish = (date) => {
    onChangeText?.(date ? formatPlaceDate(date) : '');
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={openPicker}
        style={styles.field}
      >
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value || 'Select date'}
        </Text>
        <MaterialIcons name="calendar-today" size={ICON_SIZE.small} color={COLORS.primary} />
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogLabel}>{label}</Text>
            <Text style={styles.selectedDate}>
              {selectedDate ? formatPlaceDate(selectedDate) : 'Select date'}
            </Text>
            <View style={styles.monthHeader}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={() => changeMonth(-1)}
                style={styles.monthButton}
              >
                <MaterialIcons name="chevron-left" size={ICON_SIZE.medium} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthTitle}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={() => changeMonth(1)}
                style={styles.monthButton}
              >
                <MaterialIcons name="chevron-right" size={ICON_SIZE.medium} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {WEEKDAYS.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
              ))}
              {dayCells.map((day, index) => {
                if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const isoDate = [
                  date.getFullYear(),
                  String(date.getMonth() + 1).padStart(2, '0'),
                  String(date.getDate()).padStart(2, '0'),
                ].join('-');
                const selected = selectedDate === isoDate;
                return (
                  <TouchableOpacity
                    key={isoDate}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={formatPlaceDate(isoDate)}
                    onPress={() => selectDay(day)}
                    style={[styles.dayCell, selected && styles.selectedDay]}
                  >
                    <Text style={[styles.dayText, selected && styles.selectedDayText]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.actions}>
              {allowClear && value ? (
                <TouchableOpacity onPress={() => finish(null)} style={styles.actionButton}>
                  <Text style={styles.actionText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.actionSpacer} />
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.actionButton}>
                <Text style={styles.actionText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!selectedDate}
                onPress={() => finish(selectedDate)}
                style={[styles.confirmButton, !selectedDate && styles.disabledConfirmButton]}
              >
                <Text style={styles.confirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
