import { useEffect, useState } from 'react';
import { Habit } from '@/types';
import { getTodayISO, getYesterdayISO } from '@/utils/helpers';
import { useHabitStore } from '@/store/habitStore'; // Import useHabitStore

interface MissedWeeklyHabit {
  habit: Habit;
  missedDate: string;
}

export const useHabitWarnings = () => {
  const { habits } = useHabitStore();
  const [missedWeeklyHabits, setMissedWeeklyHabits] = useState<MissedWeeklyHabit[]>([]);

  useEffect(() => {
    const today = getTodayISO();
    const yesterday = getYesterdayISO();
    const todayDateObj = new Date(today);
    const yesterdayDateObj = new Date(yesterday);
    const yesterdayDayOfWeek = yesterdayDateObj.getDay();

    const newMissedWeeklyHabits: MissedWeeklyHabit[] = [];

    habits.forEach(habit => {
      // Daily Habit Logic (Alerts will be handled elsewhere or removed if not needed)
      if (habit.frequency === 'daily') {
        const isCompletedYesterday = habit.completedDates.includes(yesterday);
        if (!isCompletedYesterday && yesterdayDateObj < todayDateObj) {
          // This could trigger an alert or be returned for UI handling
          // For now, we'll focus on weekly habits as per the task
        }
      }
      // Weekly Habit Logic
      else if (habit.frequency === 'weekly' && habit.daysOfWeek) {
        const isAllottedYesterday = habit.daysOfWeek.includes(yesterdayDayOfWeek);
        const isCompletedYesterday = habit.completedDates.includes(yesterday) || habit.alternativeCompletionDates?.includes(yesterday);

        // Check if an alternative date has already been set for this specific missed instance
        // This is a more complex check, for now, we'll assume if any alternative date exists, it's handled.
        // A more robust solution might involve linking alternative dates to specific missed instances.
        const hasAlternativeDateForYesterday = habit.alternativeCompletionDates?.some(altDate => {
          // This logic needs to be refined to check if the alternative date was set *because* of yesterday's miss
          // For now, a simpler check: if an alternative date exists for the current week, assume it's handled.
          // This might need further refinement based on how "alternative dates" are linked to "missed instances".
          // For the current task, we'll assume if an alternative date exists, the user has addressed it.
          // A better approach would be to store alternative dates with a reference to the original missed date.
          // For now, we'll check if yesterday's date is in alternativeCompletionDates, which means it was set as an alternative.
          return habit.alternativeCompletionDates?.includes(yesterday);
        });


        if (isAllottedYesterday && !isCompletedYesterday && !hasAlternativeDateForYesterday && yesterdayDateObj < todayDateObj) {
          newMissedWeeklyHabits.push({ habit, missedDate: yesterday });
        }
      }
      // Monthly Habit Logic (Alerts will be handled elsewhere or removed if not needed)
      else if (habit.frequency === 'monthly') {
        // Monthly Upcoming Warning (start of last week)
        // Monthly Missed Warning (first day of next month)
        // Similar to daily, these would be handled by the UI consuming this hook
      }
    });

    setMissedWeeklyHabits(newMissedWeeklyHabits);
  }, [habits]);

  return { missedWeeklyHabits };
};
