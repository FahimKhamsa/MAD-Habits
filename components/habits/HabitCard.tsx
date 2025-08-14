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
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{habit.name}</Text>
            <Text style={styles.subtitle}>
              {habit.frequency === "daily"
                ? "Daily"
                : habit.frequency === "weekly"
                ? "Weekly"
                : "Monthly"}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.checkButton,
              isCompleted
                ? styles.checkButtonCompleted
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

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <Text style={styles.statValue}>{habit.streak} days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>{habit.bestStreak} days</Text>
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
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  checkButtonCompleted: {
    backgroundColor: colors.success,
  },
  checkButtonIncomplete: {
    backgroundColor: colors.borderLight,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  statItem: {
    marginRight: 24,
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
