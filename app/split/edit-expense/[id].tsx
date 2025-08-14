import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSplitStore } from "@/store/splitStore";
import { ExpenseForm } from "@/components/split/ExpenseForm";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses } = useSplitStore();

  const expense = expenses.find((e) => e.id === id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Edit Expense" }} />
      {expense && <ExpenseForm groupId={expense.groupId} expense={expense} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
