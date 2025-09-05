import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useHabits } from "@/hooks/useHabits";
import { colors } from "@/constants/colors";
import { HabitCard } from "@/components/habits/HabitCard";
import { Button } from "@/components/ui/Button";
import { getTodayISO } from "@/utils/helpers";

export default function HabitsScreen() {
  const router = useRouter();
  const {
    habits,
    getHabitsForDate,
    getHabitCompletionsForDate,
    toggleHabitCompletion,
  } = useHabits();
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  const habitsForDate = getHabitsForDate(selectedDate);
  const completionsForDate = getHabitCompletionsForDate(selectedDate);

  const isHabitCompleted = (habitId: string) => {
    return completionsForDate.some(
      (completion) => completion.habitId === habitId && completion.completed
    );
  };

  const handleToggleHabit = (habitId: string) => {
    toggleHabitCompletion(habitId, selectedDate);
  };

  const navigateToHabitDetails = (habitId: string) => {
    router.push(`/habits/${habitId}`);
  };

  const navigateToNewHabit = () => {
    router.push("/habits/new");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No habits yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your daily habits to build consistency
      </Text>
      <Button
        title="Create Your First Habit"
        onPress={navigateToNewHabit}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Habits</Text>
        <Text style={styles.subtitle}>
          Track your progress and build consistency
        </Text>
      </View>

      {habits.length > 0 ? (
        <FlatList
          data={habitsForDate}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              isCompleted={isHabitCompleted(item.id)}
              onToggle={() => handleToggleHabit(item.id)}
              onPress={() => navigateToHabitDetails(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.noHabitsContainer}>
              <Text style={styles.noHabitsText}>
                No habits scheduled for today
              </Text>
              <Button
                title="Add a Habit"
                onPress={navigateToNewHabit}
                style={styles.noHabitsButton}
              />
            </View>
          }
        />
      ) : (
        renderEmptyState()
      )}

      {habits.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={navigateToNewHabit}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    width: "80%",
  },
  noHabitsContainer: {
    padding: 24,
    alignItems: "center",
  },
  noHabitsText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  noHabitsButton: {
    width: "60%",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
