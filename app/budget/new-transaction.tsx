import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { TransactionForm } from "@/components/budget/TransactionForm";

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "New Transaction" }} />
      <TransactionForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
