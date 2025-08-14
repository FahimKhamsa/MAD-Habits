import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { ExpenseForm } from "@/components/split/ExpenseForm";

export default function NewExpenseScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const handleComplete = () => {
    router.push(`/split/group/${groupId}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "New Expense" }} />
      <ExpenseForm groupId={groupId} onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
