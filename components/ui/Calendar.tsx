import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { Habit } from '@/types';

interface CalendarProps {
  habit: Habit;
  onSelectDate: (date: string) => void;
  completedDates: string[];
}

const Calendar: React.FC<CalendarProps> = ({ habit, onSelectDate, completedDates }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 for Sunday, 6 for Saturday

  const renderHeader = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
          <Feather name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDayNames = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <View style={styles.dayNames}>
        {dayNames.map((day, index) => (
          <Text key={day} style={styles.dayNameText}>{day}</Text>
        ))}
      </View>
    );
  };

  const renderDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days: (number | null)[] = Array(startDay).fill(null);
    for (let i = 1; i <= numDays; i++) {
      days.push(i);
    }

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const habitCreatedAtDay = new Date(habit.createdAt).getDate();
    const firstCompletionDate = habit.frequency === 'monthly' && completedDates.length > 0
      ? completedDates[0]
      : null;

    return (
      <View style={styles.daysGrid}>
        {days.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const date = new Date(year, month, day);
          const dateISO = date.toISOString().split('T')[0];
          const isToday = dateISO === todayISO;
          const isCompleted = completedDates.includes(dateISO);
          let isSelectable = false;
          let dayStyle: any = {};
          let textStyle: any = { color: colors.text };

          // Today's date highlighting (independent of habit frequency/selectability)
          if (isToday) {
            dayStyle = { ...dayStyle, borderColor: colors.info, borderWidth: 2 };
            textStyle = { ...textStyle, color: colors.info, fontWeight: 'bold' };
          }

          // Daily Habit Logic
          if (habit.frequency === 'daily') {
            isSelectable = isToday; // Only today is selectable
            if (isCompleted) {
              dayStyle = { backgroundColor: colors.success, borderColor: colors.success };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            } else if (isSelectable) {
              dayStyle = { backgroundColor: habit.color, borderColor: habit.color };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            }
          }
          // Weekly Habit Logic
          else if (habit.frequency === 'weekly') {
            const dayOfWeek = date.getDay();
            const isAllottedDay = habit.daysOfWeek?.includes(dayOfWeek) || false;
            isSelectable = isToday && isAllottedDay; // Only today, if it's an allotted day, is selectable

            if (isCompleted) {
              dayStyle = { backgroundColor: colors.success, borderColor: colors.success };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            } else if (isSelectable) {
              dayStyle = { backgroundColor: habit.color, borderColor: habit.color };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            } else if (isAllottedDay) { // Highlight allotted days even if not today
              dayStyle = { borderColor: habit.color, borderWidth: 1 };
              textStyle = { color: habit.color };
            }
          }
          // Monthly Habit Logic
          else if (habit.frequency === 'monthly') {
            // Selectable if no completion yet, or if it's the already completed date
            isSelectable = !firstCompletionDate || firstCompletionDate === dateISO;
            
            if (isCompleted) {
              dayStyle = { backgroundColor: colors.success, borderColor: colors.success };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            } else if (isSelectable && !isToday) { // No color boxes for unselected dates, unless it's today
              dayStyle = { borderColor: colors.borderLight, borderWidth: 1 };
              textStyle = { color: colors.text };
            }
          }

          return (
            <TouchableOpacity
              key={dateISO}
              style={[
                styles.dayCell,
                dayStyle,
              ]}
              onPress={() => isSelectable && onSelectDate(dateISO)}
              disabled={!isSelectable || isCompleted}
            >
              <Text style={[
                styles.dayText,
                textStyle,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [currentMonth, habit, completedDates, onSelectDate]);

  return (
    <View style={styles.calendarContainer}>
      {renderHeader()}
      {renderDayNames()}
      {renderDays}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dayNames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayNameText: {
    fontSize: 12,
    color: colors.textSecondary,
    width: '14%', // Approx 1/7th width
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14%', // Approx 1/7th width
    aspectRatio: 1, // Make it square
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  daySelectable: {
    backgroundColor: colors.primary, // Default selectable color
    borderColor: colors.primary,
  },
  dayCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dayText: {
    fontSize: 16,
    color: colors.text,
  },
  dayTextSelectable: {
    color: colors.white,
    fontWeight: 'bold',
  },
  dayTextCompleted: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default Calendar;
