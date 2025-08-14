import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useBudgetStore } from "@/store/budgetStore";
import { colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TransactionCard } from "@/components/budget/TransactionCard";
import { formatCurrency } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getCategoryById, getTransactionsByCategory, deleteCategory } =
    useBudgetStore();
  const { currency } = useSettingsStore();

  const category = getCategoryById(id);
  const transactions = category ? getTransactionsByCategory(id) : [];

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Category not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const progress = category.limit > 0 ? category.spent / category.limit : 0;
  const remaining = category.limit - category.spent;

  const handleEdit = () => {
    router.push(`/budget/edit-category/${id}`);
  };

  const handleDelete = () => {
    deleteCategory(id);
    router.back();
  };

  const handleAddTransaction = () => {
    router.push({
      pathname: "/budget/new-transaction",
      params: { categoryId: id },
    });
  };

  const navigateToTransactionDetails = (transactionId: string) => {
    router.push(`/budget/transaction/${transactionId}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: category.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Feather name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>{category.name}</Text>
          <Text
            style={[
              styles.summaryPercentage,
              progress >= 1
                ? styles.percentageOver
                : progress >= 0.8
                ? styles.percentageWarning
                : styles.percentageNormal,
            ]}
          >
            {Math.round(progress * 100)}%
          </Text>
        </View>

        <ProgressBar
          progress={progress}
          height={8}
          style={styles.progressBar}
        />

        <View style={styles.amountsContainer}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Spent</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(category.spent, currency)}
            </Text>
          </View>

          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Limit</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(category.limit, currency)}
            </Text>
          </View>

          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Remaining</Text>
            <Text
              style={[
                styles.amountValue,
                remaining < 0
                  ? styles.amountNegative
                  : remaining < category.limit * 0.2
                  ? styles.amountWarning
                  : styles.amountPositive,
              ]}
            >
              {formatCurrency(remaining, currency)}
            </Text>
          </View>
        </View>

        <Button
          title="Add Transaction"
          onPress={handleAddTransaction}
          style={styles.addButton}
          icon={<Feather name="plus" size={16} color="white" />}
        />
      </Card>

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Transactions</Text>

        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TransactionCard
                transaction={item}
                onPress={() => navigateToTransactionDetails(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No transactions in this category
            </Text>
            <Button
              title="Add Transaction"
              onPress={handleAddTransaction}
              style={styles.emptyButton}
            />
          </View>
        )}
      </View>

      <View style={styles.deleteContainer}>
        <Button
          title="Delete Category"
          variant="outline"
          onPress={handleDelete}
          style={styles.deleteButton}
          textStyle={{ color: colors.error }}
          icon={<Feather name="trash-2" size={16} color={colors.error} />}
        />
      </View>
    </View>
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
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  summaryPercentage: {
    fontSize: 18,
    fontWeight: "600",
  },
  percentageNormal: {
    color: colors.primary,
  },
  percentageWarning: {
    color: colors.warning,
  },
  percentageOver: {
    color: colors.error,
  },
  progressBar: {
    marginBottom: 16,
  },
  amountsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  amountPositive: {
    color: colors.success,
  },
  amountWarning: {
    color: colors.warning,
  },
  amountNegative: {
    color: colors.error,
  },
  addButton: {
    marginTop: 8,
  },
  transactionsContainer: {
    flex: 1,
    marginTop: 16,
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
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyButton: {
    width: "60%",
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
