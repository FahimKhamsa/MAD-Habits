import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useBudgetStore } from "@/store/budgetStore";
import { TransactionForm } from "@/components/budget/TransactionForm";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useBudgetStore();

  const transaction = transactions.find((t) => t.id === id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Edit Transaction" }} />
      <TransactionForm transaction={transaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
