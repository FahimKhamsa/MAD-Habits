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
import { useBudgetStore } from "@/store/budgetStore";
import { colors } from "@/constants/colors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { transactions, getCategoryById, deleteTransaction } = useBudgetStore();
  const { currency } = useSettingsStore();

  const transaction = transactions.find((t) => t.id === id);
  const category = transaction
    ? getCategoryById(transaction.categoryId)
    : undefined;

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Transaction not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/budget/edit-transaction/${id}`);
  };

  const handleDelete = () => {
    deleteTransaction(id);
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Transaction Details",
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Feather name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <Card style={styles.transactionCard}>
        <Text style={styles.transactionDescription}>
          {transaction.description}
        </Text>
        <Text style={styles.transactionAmount}>
          {formatCurrency(transaction.amount, currency)}
        </Text>

        <View style={styles.transactionMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>
              {category?.name || "Uncategorized"}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(transaction.date)}</Text>
          </View>

          {transaction.tags && transaction.tags.length > 0 && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {transaction.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Card>

      <View style={styles.deleteContainer}>
        <Button
          title="Delete Transaction"
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
  transactionCard: {
    margin: 16,
    marginBottom: 8,
  },
  transactionDescription: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  transactionMeta: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
  },
  metaItem: {
    marginBottom: 16,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.text,
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
