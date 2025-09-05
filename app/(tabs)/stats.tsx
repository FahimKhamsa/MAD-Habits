import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useHabits } from "@/hooks/useHabits";
import { useBudgetStore } from "@/store/budgetStore";
import { colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";

type StatTab = "habits" | "budget" | "split";

export default function StatsScreen() {
  const [activeTab, setActiveTab] = useState<StatTab>("habits");
  const { habits } = useHabits();
  const { categories, transactions } = useBudgetStore();
  const { currency } = useSettingsStore();

  // Habit stats
  const totalHabits = habits.length;
  const completedToday = habits.filter((habit) => habit.streak > 0).length;
  const longestStreak = habits.reduce(
    (max, habit) => Math.max(max, habit.bestStreak),
    0
  );
  const averageStreak =
    habits.length > 0
      ? habits.reduce((sum, habit) => sum + habit.streak, 0) / habits.length
      : 0;

  // Budget stats
  const totalBudget = categories.reduce(
    (sum, category) => sum + category.limit,
    0
  );
  const totalSpent = categories.reduce(
    (sum, category) => sum + category.spent,
    0
  );
  const mostExpensiveCategory = [...categories].sort(
    (a, b) => b.spent - a.spent
  )[0];
  const transactionsThisMonth = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    const today = new Date();
    return (
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Stats</Text>
        <Text style={styles.subtitle}>
          Track your progress across all features
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "habits" && styles.activeTab]}
          onPress={() => setActiveTab("habits")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "habits" && styles.activeTabText,
            ]}
          >
            Habits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "budget" && styles.activeTab]}
          onPress={() => setActiveTab("budget")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "budget" && styles.activeTabText,
            ]}
          >
            Budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "split" && styles.activeTab]}
          onPress={() => setActiveTab("split")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "split" && styles.activeTabText,
            ]}
          >
            Split
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "habits" && (
          <View>
            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Habit Overview</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalHabits}</Text>
                  <Text style={styles.statLabel}>Total Habits</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{completedToday}</Text>
                  <Text style={styles.statLabel}>Completed Today</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{longestStreak}</Text>
                  <Text style={styles.statLabel}>Longest Streak</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {averageStreak.toFixed(1)}
                  </Text>
                  <Text style={styles.statLabel}>Average Streak</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Top Habits by Streak</Text>

              {habits.length > 0 ? (
                [...habits]
                  .sort((a, b) => b.streak - a.streak)
                  .slice(0, 3)
                  .map((habit) => (
                    <View key={habit.id} style={styles.habitItem}>
                      <View style={styles.habitInfo}>
                        <Text style={styles.habitName}>{habit.name}</Text>
                        <Text style={styles.habitFrequency}>
                          {habit.frequency === "daily"
                            ? "Daily"
                            : habit.frequency === "weekly"
                            ? "Weekly"
                            : "Monthly"}
                        </Text>
                      </View>
                      <View style={styles.habitStreak}>
                        <Text style={styles.habitStreakValue}>
                          {habit.streak}
                        </Text>
                        <Text style={styles.habitStreakLabel}>day streak</Text>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={styles.emptyText}>No habits created yet</Text>
              )}
            </Card>
          </View>
        )}

        {activeTab === "budget" && (
          <View>
            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Budget Overview</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatCurrency(totalBudget, currency)}
                  </Text>
                  <Text style={styles.statLabel}>Total Budget</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatCurrency(totalSpent, currency)}
                  </Text>
                  <Text style={styles.statLabel}>Total Spent</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{categories.length}</Text>
                  <Text style={styles.statLabel}>Categories</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {transactionsThisMonth.length}
                  </Text>
                  <Text style={styles.statLabel}>Transactions This Month</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Top Spending Categories</Text>

              {categories.length > 0 ? (
                [...categories]
                  .sort((a, b) => b.spent - a.spent)
                  .slice(0, 3)
                  .map((category) => (
                    <View key={category.id} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryPercentage}>
                          {totalSpent > 0
                            ? Math.round((category.spent / totalSpent) * 100)
                            : 0}
                          % of total
                        </Text>
                      </View>
                      <Text style={styles.categoryAmount}>
                        {formatCurrency(category.spent, currency)}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={styles.emptyText}>
                  No budget categories created yet
                </Text>
              )}
            </Card>
          </View>
        )}

        {activeTab === "split" && (
          <View>
            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Split Expenses Coming Soon</Text>
              <Text style={styles.emptyText}>
                Detailed statistics for split expenses will be available in the
                next update.
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
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
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    marginBottom: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  habitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  habitStreak: {
    alignItems: "flex-end",
  },
  habitStreakValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  habitStreakLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 16,
  },
});
