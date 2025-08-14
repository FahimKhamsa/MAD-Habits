import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSplitStore } from "@/store/splitStore";
import { colors } from "@/constants/colors";
import { GroupCard } from "@/components/split/GroupCard";
import { Button } from "@/components/ui/Button";

export default function SplitScreen() {
  const router = useRouter();
  const { groups } = useSplitStore();

  const navigateToGroupDetails = (groupId: string) => {
    router.push(`/split/group/${groupId}`);
  };

  const navigateToNewGroup = () => {
    router.push("/split/new-group");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No expense groups yet</Text>
      <Text style={styles.emptySubtitle}>
        Create a group to start splitting expenses with friends
      </Text>
      <Button
        title="Create Your First Group"
        onPress={navigateToNewGroup}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Split Expenses</Text>
        <Text style={styles.subtitle}>
          Manage shared expenses with friends and roommates
        </Text>
      </View>

      {groups.length > 0 ? (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => navigateToGroupDetails(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        renderEmptyState()
      )}

      {groups.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={navigateToNewGroup}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    width: "80%",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
