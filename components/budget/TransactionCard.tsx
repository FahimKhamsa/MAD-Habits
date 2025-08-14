import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Transaction } from "@/types";
import { colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";
import { useBudgetStore } from "@/store/budgetStore";

interface TransactionCardProps {
  transaction: Transaction;
  onPress: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
}) => {
  const { currency } = useSettingsStore();
  const { getCategoryById } = useBudgetStore();

  const category = getCategoryById(transaction.categoryId);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card} variant="outlined">
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{transaction.description}</Text>
            <Text style={styles.category}>
              {category?.name || "Uncategorized"}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {formatCurrency(transaction.amount, currency)}
            </Text>
            <Text style={styles.date}>
              {formatDate(transaction.date, "short")}
            </Text>
          </View>
        </View>

        {transaction.tags && transaction.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {transaction.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default TransactionCard;
