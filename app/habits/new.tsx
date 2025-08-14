import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { HabitForm } from "@/components/habits/HabitForm";

export default function NewHabitScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "New Habit" }} />
      <HabitForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
