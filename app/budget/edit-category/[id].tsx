import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useBudgetStore } from "@/store/budgetStore";
import { CategoryForm } from "@/components/budget/CategoryForm";

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCategoryById } = useBudgetStore();

  const category = getCategoryById(id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Edit Category" }} />
      <CategoryForm category={category} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
