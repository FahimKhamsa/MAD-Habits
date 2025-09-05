import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Habit } from "@/types";
import { colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { triggerHaptic } from "@/utils/helpers";

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompleted,
  onToggle,
  onPress,
}) => {
  const handleToggle = () => {
    triggerHaptic(isCompleted ? "light" : "success");
    onToggle();
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={StyleSheet.flatten([styles.card, { borderLeftColor: habit.color, borderLeftWidth: 4 }])}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <View style={[styles.iconContainer, { backgroundColor: `${habit.color}20` }]}>
                <Text style={styles.habitIcon}>{habit.icon}</Text>
              </View>
              <View style={styles.titleTextContainer}>
                <Text style={styles.title}>{habit.name}</Text>
                <Text style={styles.subtitle}>
                  {habit.frequency === "daily"
                    ? "Daily"
                    : habit.frequency === "weekly"
                    ? "Weekly"
                    : "Monthly"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.checkButton,
              isCompleted
                ? { backgroundColor: habit.color }
                : styles.checkButtonIncomplete,
            ]}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            {isCompleted ? (
              <Feather name="check" size={20} color="white" />
            ) : (
              <Feather name="x" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {habit.description && (
          <Text style={styles.description} numberOfLines={2}>
            {habit.description}
          </Text>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={[styles.statValue, { color: habit.color }]}>
              {habit.streak} days
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>{habit.bestStreak} days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{habit.completedDates.length}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar
            progress={
              habit.completedDates.length > 0
                ? habit.streak / (habit.bestStreak || 1)
                : 0
            }
            height={6}
            color={habit.color}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 24,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkButtonIncomplete: {
    backgroundColor: colors.borderLight,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  progressContainer: {
    marginTop: 4,
  },
});

export default HabitCard;