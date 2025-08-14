import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BudgetCategory } from "@/types";
import { colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";

interface CategoryCardProps {
  category: BudgetCategory;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onPress,
}) => {
  const { currency } = useSettingsStore();
  const progress = category.limit > 0 ? category.spent / category.limit : 0;
  const remaining = category.limit - category.spent;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{category.name}</Text>
          <Text
            style={[
              styles.percentage,
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  percentage: {
    fontSize: 16,
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
    marginBottom: 12,
  },
  amountsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
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
});

export default CategoryCard;
