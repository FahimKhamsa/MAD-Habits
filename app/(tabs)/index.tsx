import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useHabitStore } from "@/store/habitStore";
import { useHabitWarnings } from "@/hooks/useHabitWarnings";
import { colors } from "@/constants/colors";
import { HabitCard } from "@/components/habits/HabitCard";
import { Button } from "@/components/ui/Button";
import { getTodayISO } from "@/utils/helpers";
import Calendar from "@/components/ui/Calendar"; // Corrected import for Calendar
import { Habit } from "@/types";

export default function HabitsScreen() {
  const router = useRouter();
  const {
    habits,
    getHabitsForDate,
    getHabitCompletionsForDate,
    toggleHabitCompletion,
    setAlternativeCompletionDate,
  } = useHabitStore();
  const { missedWeeklyHabits } = useHabitWarnings();

  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [showAlternativeDateModal, setShowAlternativeDateModal] = useState(false);
  const [currentHabitForAltDate, setCurrentHabitForAltDate] = useState<Habit | null>(null);
  const [missedDateForAltDate, setMissedDateForAltDate] = useState<string | null>(null);

  const habitsForDate = getHabitsForDate(selectedDate);
  const completionsForDate = getHabitCompletionsForDate(selectedDate);

  useEffect(() => {
    if (missedWeeklyHabits.length > 0 && !showAlternativeDateModal) {
      const firstMissed = missedWeeklyHabits[0];
      Alert.alert(
        "Weekly Habit Missed!",
        `You missed your weekly habit "${firstMissed.habit.name}" on ${firstMissed.missedDate}.\n\nWould you like to set an alternative completion date?`,
        [
          {
            text: "No, thanks",
            style: "cancel",
          },
          {
            text: "Set Alternative Date",
            onPress: () => {
              setCurrentHabitForAltDate(firstMissed.habit);
              setMissedDateForAltDate(firstMissed.missedDate);
              setShowAlternativeDateModal(true);
            },
          },
        ]
      );
    }
  }, [missedWeeklyHabits, showAlternativeDateModal]);

  const handleSelectAlternativeDate = async (date: string) => {
    if (currentHabitForAltDate && missedDateForAltDate) {
      try {
        // Calculate the start and end of the immediate next week
        const missedDateObj = new Date(missedDateForAltDate);
        const nextWeekStart = new Date(missedDateObj);
        nextWeekStart.setDate(missedDateObj.getDate() + 1); // Day after missed date
        
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6); // 7 days from nextWeekStart

        const selectedDateObj = new Date(date);
        // Normalize dates to start of day for accurate comparison
        const normalizedSelectedDate = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
        const normalizedNextWeekStart = new Date(nextWeekStart.getFullYear(), nextWeekStart.getMonth(), nextWeekStart.getDate());
        const normalizedNextWeekEnd = new Date(nextWeekEnd.getFullYear(), nextWeekEnd.getMonth(), nextWeekEnd.getDate());

        if (normalizedSelectedDate >= normalizedNextWeekStart && normalizedSelectedDate <= normalizedNextWeekEnd) {
          await setAlternativeCompletionDate(currentHabitForAltDate.id, date);
          Alert.alert("Success", `Alternative date ${date} set for "${currentHabitForAltDate.name}".`);
        } else {
          Alert.alert("Invalid Date", `Please select a date within the immediate next week (${normalizedNextWeekStart.toISOString().split('T')[0]} to ${normalizedNextWeekEnd.toISOString().split('T')[0]}).`);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to set alternative date. Please try again.");
        console.error("Error setting alternative date:", error);
      } finally {
        setShowAlternativeDateModal(false);
        setCurrentHabitForAltDate(null);
        setMissedDateForAltDate(null);
      }
    }
  };

  const isHabitCompleted = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return false;

    const isCompletedOnDate = completionsForDate.some(
      (completion) => completion.habitId === habitId && completion.completed
    );
    const isAlternativeCompletedOnDate = !!habit.alternativeCompletionDates?.includes(selectedDate);

    return isCompletedOnDate || isAlternativeCompletedOnDate;
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

      {currentHabitForAltDate && missedDateForAltDate && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showAlternativeDateModal}
          onRequestClose={() => setShowAlternativeDateModal(false)}
        >
          <View style={modalStyles.centeredView}>
            <View style={modalStyles.modalView}>
              <Text style={modalStyles.modalTitle}>Select Alternative Date for "{currentHabitForAltDate.name}"</Text>
              <Text style={modalStyles.modalSubtitle}>Missed on: {missedDateForAltDate}</Text>
              <Calendar
                habit={currentHabitForAltDate}
                onSelectDate={handleSelectAlternativeDate}
                completedDates={currentHabitForAltDate.completedDates}
                isSettingAlternativeDate={true}
              />
              <Button title="Cancel" onPress={() => setShowAlternativeDateModal(false)} style={modalStyles.cancelButton} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: colors.textSecondary,
  },
  cancelButton: {
    marginTop: 15,
    backgroundColor: colors.error,
  },
});

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
