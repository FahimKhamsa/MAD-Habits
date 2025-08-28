import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Habit, HabitCompletion } from "@/types";
import { generateId } from "@/utils/helpers";

interface HabitState {
  habits: Habit[];
  completions: HabitCompletion[];
  addHabit: (
    habit: Omit<
      Habit,
      | "id"
      | "streak"
      | "bestStreak"
      | "completedDates"
      | "createdAt"
      | "updatedAt"
    >
  ) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, date: string, note?: string) => void;
  getHabitCompletionsForDate: (date: string) => HabitCompletion[];
  getHabitById: (id: string) => Habit | undefined;
  getHabitsForDate: (date: string) => Habit[];
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],

      addHabit: (habitData) => {
        const now = new Date().toISOString();
        const newHabit: Habit = {
          id: generateId(),
          ...habitData,
          streak: 0,
          bestStreak: 0,
          completedDates: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, ...updates, updatedAt: new Date().toISOString() }
              : habit
          ),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
          completions: state.completions.filter(
            (completion) => completion.habitId !== id
          ),
        }));
      },

      toggleHabitCompletion: (habitId, date, note) => {
        const { habits, completions } = get();
        const habit = habits.find((h) => h.id === habitId);

        if (!habit) return;

        const existingCompletion = completions.find(
          (c) =>
            c.habitId === habitId && c.date.split("T")[0] === date.split("T")[0]
        );

        let newCompletions;

        if (existingCompletion) {
          // Toggle completion status
          newCompletions = completions.map((c) =>
            c.habitId === habitId && c.date.split("T")[0] === date.split("T")[0]
              ? { ...c, completed: !c.completed, note }
              : c
          );
        } else {
          // Create new completion
          newCompletions = [
            ...completions,
            {
              habitId,
              date,
              completed: true,
              note,
            },
          ];
        }

        // Update habit streak
        const completedDates = newCompletions
          .filter((c) => c.habitId === habitId && c.completed)
          .map((c) => c.date.split("T")[0]);

        // Calculate streak
        const sortedDates = [...completedDates].sort();
        let currentStreak = 0;

        // Simple streak calculation (can be improved for more complex frequency rules)
        const today = new Date().toISOString().split("T")[0];
        if (completedDates.includes(today)) {
          currentStreak = 1;

          // Count backwards from yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          let checkDate = yesterday;
          while (true) {
            const checkDateStr = checkDate.toISOString().split("T")[0];
            if (completedDates.includes(checkDateStr)) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }

        const bestStreak = Math.max(habit.bestStreak, currentStreak);

        set({
          completions: newCompletions,
          habits: habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  streak: currentStreak,
                  bestStreak,
                  completedDates,
                  updatedAt: new Date().toISOString(),
                }
              : h
          ),
        });
      },

      getHabitCompletionsForDate: (date) => {
        const dateStr = date.split("T")[0];
        return get().completions.filter(
          (c) => c.date.split("T")[0] === dateStr
        );
      },

      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },

      getHabitsForDate: (date) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

        return get().habits.filter((habit) => {
          if (habit.frequency === "daily") return true;
          if (
            habit.frequency === "weekly" &&
            habit.daysOfWeek?.includes(dayOfWeek)
          )
            return true;
          // For monthly, we could check if it's the same day of month
          return false;
        });
      },
    }),
    {
      name: "madhabits-habits",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
