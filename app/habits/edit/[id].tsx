import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useHabitStore } from "@/store/habitStore";
import { HabitForm } from "@/components/habits/HabitForm";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getHabitById } = useHabitStore();

  const habit = getHabitById(id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Edit Habit" }} />
      <HabitForm habit={habit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
