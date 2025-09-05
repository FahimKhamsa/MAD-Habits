import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Habit, HabitCompletion } from "@/types";
import { generateId } from "@/utils/helpers";
import { habitDb } from "@/services/habitDatabase";

interface HabitState {
  habits: Habit[];
  completions: HabitCompletion[];
  isLoading: boolean;
  isOnline: boolean;
  lastSyncAt: string | null;
  
  // Core habit operations
  addHabit: (
    habit: Omit<
      Habit,
      | "id"
      | "streak"
      | "bestStreak"
      | "completedDates"
      | "createdAt"
      | "updatedAt"
    > & { description?: string | null; icon?: string | null; color?: string | null }
  ) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date: string, note?: string) => Promise<void>;
  toggleHabitCompletionOffline: (habitId: string, date: string, note?: string) => void;
  addHabitOffline: (
    habit: Omit<
      Habit,
      | "id"
      | "streak"
      | "bestStreak"
      | "completedDates"
      | "createdAt"
      | "updatedAt"
    >
  ) => Promise<void>;
  
  // Data fetching
  fetchHabits: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  
  // Helper methods
  getHabitCompletionsForDate: (date: string) => HabitCompletion[];
  getHabitById: (id: string) => Habit | undefined;
  getHabitsForDate: (date: string) => Habit[];
  
  // Offline support
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],
      isLoading: false,
      isOnline: true,
      lastSyncAt: null,

      // Set loading state
      setLoading: (isLoading: boolean) => set({ isLoading }),

      // Set online status
      setOnlineStatus: (isOnline: boolean) => set({ isOnline }),

      // Fetch habits from Supabase
      fetchHabits: async () => {
        try {
          set({ isLoading: true });
          
          const { habits, completions } = await habitDb.fetchHabitsAndCompletions();
          
          set({
            habits,
            completions,
            lastSyncAt: new Date().toISOString(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching habits:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Add habit (online/offline)
      addHabit: async (habitData) => {
        const { isOnline } = get();
        
        if (isOnline) {
          try {
            set({ isLoading: true });
            const newHabit = await habitDb.createHabit(habitData);
            
            set((state) => ({
              habits: [...state.habits, newHabit],
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
            console.error('Error adding habit online:', error);
            
            // Fallback to offline mode
            await get().addHabitOffline(habitData);
          }
        } else {
          await get().addHabitOffline(habitData);
        }
      },

      // Offline habit creation
      addHabitOffline: async (habitData) => {
        const now = new Date().toISOString();
        const newHabit: Habit = {
          id: generateId(),
          ...habitData,
          description: habitData.description === null ? undefined : habitData.description || undefined, // Ensure description is optional and matches type
          icon: habitData.icon || '🎯', // Default icon if not provided
          color: habitData.color || '#3B82F6', // Default color if not provided
          streak: 0,
          bestStreak: 0,
          completedDates: [],
          createdAt: now,
          updatedAt: now,
        };
        
        // When adding offline, ensure completedDates is an empty array
        if (!newHabit.completedDates) {
          newHabit.completedDates = [];
        }

        set((state) => ({
          habits: [...state.habits, newHabit],
        }));
      },

      // Update habit (online/offline)
      updateHabit: async (id, updates) => {
        const { isOnline, habits } = get();
        
        if (isOnline) {
          try {
            set({ isLoading: true });
            const updatedHabit = await habitDb.updateHabit(id, updates);
            
            set((state) => ({
              habits: state.habits.map((habit) =>
                habit.id === id ? updatedHabit : habit
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
            console.error('Error updating habit online:', error);
            
            // Fallback to offline update
            set((state) => ({
              habits: state.habits.map((habit) =>
                habit.id === id
                  ? { ...habit, ...updates, updatedAt: new Date().toISOString() }
                  : habit
              ),
            }));
          }
        } else {
          // Offline update
          set((state) => ({
            habits: state.habits.map((habit) =>
              habit.id === id
                ? { ...habit, ...updates, updatedAt: new Date().toISOString() }
                : habit
            ),
          }));
        }
      },

      // Delete habit (online/offline)
      deleteHabit: async (id) => {
        const { isOnline } = get();
        
        if (isOnline) {
          try {
            set({ isLoading: true });
            await habitDb.deleteHabit(id);
            
            set((state) => ({
              habits: state.habits.filter((habit) => habit.id !== id),
              completions: state.completions.filter(
                (completion) => completion.habitId !== id
              ),
              isLoading: false,
            }));
          } catch (error) {
            set({ isLoading: false });
            console.error('Error deleting habit online:', error);
            
            // Fallback to offline delete
            set((state) => ({
              habits: state.habits.filter((habit) => habit.id !== id),
              completions: state.completions.filter(
                (completion) => completion.habitId !== id
              ),
            }));
          }
        } else {
          // Offline delete
          set((state) => ({
            habits: state.habits.filter((habit) => habit.id !== id),
            completions: state.completions.filter(
              (completion) => completion.habitId !== id
            ),
          }));
        }
      },

      // Toggle habit completion (online/offline)
      toggleHabitCompletion: async (habitId, date, note) => {
        const { isOnline } = get();
        
        if (isOnline) {
          try {
            const { habit, completion } = await habitDb.toggleHabitCompletion(habitId, date, note);
            
            set((state) => ({
              habits: state.habits.map((h) => (h.id === habitId ? habit : h)),
              completions: [
                ...state.completions.filter(
                  (c) => !(c.habitId === habitId && c.date.split('T')[0] === date.split('T')[0])
                ),
                completion,
              ],
            }));
          } catch (error) {
            console.error('Error toggling completion online:', error);
            
            // Fallback to offline toggle
            get().toggleHabitCompletionOffline(habitId, date, note);
          }
        } else {
          get().toggleHabitCompletionOffline(habitId, date, note);
        }
      },

      // Offline habit completion toggle
      toggleHabitCompletionOffline: (habitId, date, note) => {
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

        // Update habit streak (simplified offline calculation)
        const completedDates = newCompletions
          .filter((c) => c.habitId === habitId && c.completed)
          .map((c) => c.date.split("T")[0]);

        // Simple streak calculation
        const sortedDates = [...completedDates].sort();
        let currentStreak = 0;

        const today = new Date().toISOString().split("T")[0];
        if (completedDates.includes(today)) {
          currentStreak = 1;

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

      // Sync local data to cloud
      syncToCloud: async () => {
        try {
          set({ isLoading: true });
          
          // This would implement a more sophisticated sync mechanism
          // For now, we'll just fetch the latest from the server
          await get().fetchHabits();
          
          set({ 
            lastSyncAt: new Date().toISOString(),
            isLoading: false 
          });
        } catch (error) {
          console.error('Error syncing to cloud:', error);
          set({ isLoading: false });
        }
      },

      // Get completions for a specific date
      getHabitCompletionsForDate: (date) => {
        const dateStr = date.split("T")[0];
        return get().completions.filter(
          (c) => c.date.split("T")[0] === dateStr
        );
      },

      // Get habit by ID
      getHabitById: (id) => {
        return get().habits.find((h) => h.id === id);
      },

      // Get habits for a specific date (considering frequency rules)
      getHabitsForDate: (date) => {
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();

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
      partialize: (state) => ({
        // Only persist these fields
        habits: state.habits,
        completions: state.completions,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
