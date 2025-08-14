import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useHabitStore } from "@/store/habitStore";
import { colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate } from "@/utils/helpers";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getHabitById, deleteHabit, toggleHabitCompletion } = useHabitStore();

  const habit = getHabitById(id);

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
    deleteHabit(id);
    router.back();
  };

  const handleToggleCompletion = (date: string) => {
    toggleHabitCompletion(id, date);
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

  const last7Days = getLast7Days();

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: habit.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Feather name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
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
        <Text style={styles.sectionTitle}>Recent History</Text>

        <View style={styles.historyList}>
          {last7Days.map((date) => {
            const isCompleted = habit.completedDates.includes(date);
            return (
              <TouchableOpacity
                key={date}
                style={styles.historyItem}
                onPress={() => handleToggleCompletion(date)}
                activeOpacity={0.7}
              >
                <Text style={styles.historyDate}>
                  {formatDate(date, "short")}
                </Text>
                <View
                  style={[
                    styles.historyStatus,
                    isCompleted
                      ? styles.historyCompleted
                      : styles.historyIncomplete,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <View style={styles.deleteContainer}>
        <Button
          title="Delete Habit"
          variant="outline"
          onPress={handleDelete}
          style={styles.deleteButton}
          textStyle={{ color: colors.error }}
          icon={<Feather name="trash-2" size={16} color={colors.error} />}
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
  historyList: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyDate: {
    fontSize: 16,
    color: colors.text,
  },
  historyStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  historyCompleted: {
    backgroundColor: colors.success,
  },
  historyIncomplete: {
    backgroundColor: colors.borderLight,
  },
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
