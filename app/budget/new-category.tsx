import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { CategoryForm } from "@/components/budget/CategoryForm";

export default function NewCategoryScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "New Category" }} />
      <CategoryForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
