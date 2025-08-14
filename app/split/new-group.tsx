import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { GroupForm } from "@/components/split/GroupForm";

export default function NewGroupScreen() {
  const router = useRouter();

  const handleComplete = (groupId: string) => {
    router.push(`/split/group/${groupId}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "New Group" }} />
      <GroupForm onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
