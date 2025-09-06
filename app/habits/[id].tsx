import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useHabits } from "@/hooks/useHabits";
import { colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Calendar from "@/components/ui/Calendar"; // Import Calendar component
import { formatDate } from "@/utils/helpers";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { 
    getHabitById, 
    deleteHabit, 
    toggleHabitCompletion, 
    isLoading, 
    isOnline,
    isAuthenticated 
  } = useHabits();

  const habit = getHabitById(id);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to view your habits</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Habit not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/habits/edit/${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHabit(id);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete habit. Please try again.");
              console.error("Error deleting habit:", error);
            }
          },
        },
      ]
    );
  };

  const handleToggleCompletion = async (date: string) => {
    try {
      await toggleHabitCompletion(id, date);
    } catch (error) {
      Alert.alert("Error", "Failed to update habit completion. Please try again.");
      console.error("Error toggling completion:", error);
    }
  };

  // Get last 7 days for history
  const getLast7Days = () => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: habit.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {!isOnline && (
                <View style={styles.offlineIndicator}>
                  <Feather name="wifi-off" size={16} color={colors.textSecondary} />
                </View>
              )}
              <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                <Feather name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Card style={styles.habitCard}>
        <Text style={styles.habitName}>{habit.name}</Text>
        {habit.description && (
          <Text style={styles.habitDescription}>{habit.description}</Text>
        )}

        <View style={styles.habitMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Frequency</Text>
            <Text style={styles.metaValue}>
              {habit.frequency === "daily"
                ? "Daily"
                : habit.frequency === "weekly"
                ? "Weekly"
                : "Monthly"}
            </Text>
          </View>

          {habit.frequency === "weekly" && habit.daysOfWeek && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Days</Text>
              <Text style={styles.metaValue}>
                {habit.daysOfWeek
                  .map((day) => {
                    const days = [
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ];
                    return days[day];
                  })
                  .join(", ")}
              </Text>
            </View>
          )}

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>{formatDate(habit.createdAt)}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={[styles.metaValue, { color: isOnline ? colors.success : colors.textSecondary }]}>
              {isOnline ? "Synced" : "Offline"}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Stats</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habit.streak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habit.bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habit.completedDates.length}</Text>
            <Text style={styles.statLabel}>Total Completions</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Streak Progress</Text>
          <ProgressBar
            progress={
              habit.bestStreak > 0 ? habit.streak / habit.bestStreak : 0
            }
            height={8}
          />
        </View>
      </Card>

      <Card style={styles.historyCard}>
        <Text style={styles.sectionTitle}>Tracking History</Text>
        <Calendar
          habit={habit}
          onSelectDate={handleToggleCompletion}
          completedDates={habit.completedDates}
        />
      </Card>

      <View style={styles.deleteContainer}>
        <Button
          title="Delete Habit"
          variant="outline"
          onPress={handleDelete}
          style={styles.deleteButton}
          textStyle={{ color: colors.error }}
          icon={<Feather name="trash-2" size={16} color={colors.error} />}
          loading={isLoading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIndicator: {
    marginRight: 8,
    padding: 4,
  },
  editButton: {
    padding: 8,
  },
  habitCard: {
    margin: 16,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  habitDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  habitMeta: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
  },
  metaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  statsCard: {
    margin: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  historyCard: {
    margin: 16,
    marginVertical: 8,
  },
  // Removed historyList, historyItem, historyDate, historyStatusContainer, loadingText, historyStatus, historyCompleted, historyIncomplete styles
  // as they are replaced by the Calendar component
  deleteContainer: {
    padding: 16,
    marginBottom: 32,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  errorButton: {
    alignSelf: "center",
    width: 200,
  },
});
