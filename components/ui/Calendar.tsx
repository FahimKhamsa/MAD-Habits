import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { Habit } from '@/types';

interface CalendarProps {
  habit: Habit;
  onSelectDate: (date: string) => void;
  completedDates: string[];
  isSettingAlternativeDate?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ habit, onSelectDate, completedDates, isSettingAlternativeDate = false }) => {
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
    // Ensure todayISO is based on local date to match calendar display
    const todayLocalISO = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
    
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
          const dateLocalISO = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
          const isToday = dateLocalISO === todayLocalISO;
          const isCompleted = completedDates.includes(dateLocalISO);
          const isAlternativeCompleted = habit.alternativeCompletionDates?.includes(dateLocalISO);
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
            isSelectable = isToday && !isCompleted; // Only today is selectable if not already completed
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

            if (isSettingAlternativeDate) {
              // When setting an alternative date, only dates *not* in daysOfWeek should be selectable
              // and they must be within the immediate next week from the missed date.
              const yesterdayDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
              const missedDate = new Date(yesterdayDateObj.getFullYear(), yesterdayDateObj.getMonth(), yesterdayDateObj.getDate());
              
              const nextWeekStart = new Date(missedDate);
              nextWeekStart.setDate(missedDate.getDate() + 1);
              
              const nextWeekEnd = new Date(nextWeekStart);
              nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

              // Selectable if NOT an allotted day, NOT completed, NOT alternative completed, and within next week
              isSelectable = !isAllottedDay && !isCompleted && !isAlternativeCompleted && (date >= nextWeekStart && date <= nextWeekEnd);
            } else {
              // For normal completion, it must be today, an allotted day, and not already completed
              isSelectable = isToday && isAllottedDay && !isCompleted && !isAlternativeCompleted;
            }

            if (isCompleted || isAlternativeCompleted) {
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
            if (isSettingAlternativeDate) {
              // When setting alternative date, any date in the current month is selectable if not already completed
              isSelectable = !isCompleted && date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
            } else {
              // For normal completion, only today's date is selectable if not already completed for the month
              isSelectable = isToday && !isCompleted && !firstCompletionDate;
            }
            
            if (isCompleted) {
              dayStyle = { backgroundColor: colors.success, borderColor: colors.success };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            } else if (isSelectable) {
              dayStyle = { backgroundColor: habit.color, borderColor: habit.color };
              textStyle = { color: colors.white, fontWeight: 'bold' };
            } else if (date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()) {
              // Highlight days in the current month even if not selectable for completion
              dayStyle = { borderColor: colors.borderLight, borderWidth: 1 };
              textStyle = { color: colors.text };
            }
          }

          return (
            <TouchableOpacity
              key={dateLocalISO}
              style={[
                styles.dayCell,
                dayStyle,
              ]}
              onPress={() => isSelectable && onSelectDate(dateLocalISO)}
              disabled={!isSelectable} // Disable if not selectable
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
