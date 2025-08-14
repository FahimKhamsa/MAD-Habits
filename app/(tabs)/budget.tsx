import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useBudgetStore } from "@/store/budgetStore";
import { colors } from "@/constants/colors";
import { CategoryCard } from "@/components/budget/CategoryCard";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";

export default function BudgetScreen() {
  const router = useRouter();
  const { categories, getTotalBudget, getTotalSpent } = useBudgetStore();
  const { currency } = useSettingsStore();

  const totalBudget = getTotalBudget();
  const totalSpent = getTotalSpent();
  const remaining = totalBudget - totalSpent;
  const progress = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const navigateToCategoryDetails = (categoryId: string) => {
    router.push(`/budget/category/${categoryId}`);
  };

  const navigateToNewCategory = () => {
    router.push("/budget/new-category");
  };

  const navigateToNewTransaction = () => {
    router.push("/budget/new-transaction");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No budget categories yet</Text>
      <Text style={styles.emptySubtitle}>
        Create budget categories to track your spending
      </Text>
      <Button
        title="Create Your First Category"
        onPress={navigateToNewCategory}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {categories.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Budget</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalBudget, currency)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalSpent, currency)}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text
                style={[
                  styles.summaryValue,
                  remaining < 0 ? styles.negativeAmount : styles.positiveAmount,
                ]}
              >
                {formatCurrency(remaining, currency)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress * 100, 100)}%` },
                  progress > 1 ? styles.progressOverBudget : {},
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}% spent
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <Button
              title="Add Category"
              onPress={navigateToNewCategory}
              style={styles.actionButton}
              size="small"
            />
            <Button
              title="Add Transaction"
              onPress={navigateToNewTransaction}
              style={styles.actionButton}
              size="small"
            />
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Categories</Text>

      {categories.length > 0 ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              onPress={() => navigateToCategoryDetails(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        renderEmptyState()
      )}

      {categories.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={navigateToNewTransaction}
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
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  positiveAmount: {
    color: "#a7f3d0", // Light green
  },
  negativeAmount: {
    color: "#fca5a5", // Light red
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  progressOverBudget: {
    backgroundColor: "#fca5a5", // Light red
  },
  progressText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "right",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
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
