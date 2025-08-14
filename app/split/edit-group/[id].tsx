import React from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useSplitStore } from "@/store/splitStore";
import { GroupForm } from "@/components/split/GroupForm";

export default function EditGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGroupById } = useSplitStore();

  const group = getGroupById(id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Edit Group" }} />
      <GroupForm group={group} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
