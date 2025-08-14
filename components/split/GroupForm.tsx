import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Group, GroupMember } from "@/types";
import { colors } from "@/constants/colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSplitStore } from "@/store/splitStore";
import { Feather } from "@expo/vector-icons";

interface GroupFormProps {
  group?: Group;
  onComplete?: (groupId: string) => void;
}

export const GroupForm: React.FC<GroupFormProps> = ({ group, onComplete }) => {
  const router = useRouter();
  const { addGroup, updateGroup, addMember, removeMember } = useSplitStore();

  const [name, setName] = useState(group?.name || "");
  const [members, setMembers] = useState<Omit<GroupMember, "id">[]>(
    group
      ? group.members.map(({ id, ...rest }) => rest)
      : [{ name: "You", isCurrentUser: true }]
  );
  const [newMemberName, setNewMemberName] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Group name is required";
    }

    if (members.length < 2) {
      newErrors.members = "Add at least one more person to the group";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (group) {
        // Update existing group
        updateGroup(group.id, {
          name,
        });

        // Handle members separately
        // This is simplified; in a real app, you'd need to track which members were added/removed
      } else {
        // Add new group
        const groupId = addGroup(name, members);

        if (onComplete) {
          onComplete(groupId);
        } else {
          router.back();
        }
      }
    } catch (error) {
      console.error("Error saving group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNewMember = () => {
    if (newMemberName.trim()) {
      if (group) {
        // Add to existing group
        addMember(group.id, {
          name: newMemberName,
          isCurrentUser: false,
        });
      } else {
        // Add to local state for new group
        setMembers([...members, { name: newMemberName, isCurrentUser: false }]);
      }
      setNewMemberName("");
    }
  };

  const removeMemberByIndex = (index: number) => {
    if (members[index].isCurrentUser) return; // Don't remove current user

    if (group) {
      // Remove from existing group
      const memberId = group.members[index].id;
      removeMember(group.id, memberId);
    } else {
      // Remove from local state
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Group Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Roommates"
        error={errors.name}
      />

      <Text style={styles.label}>Members</Text>

      <View style={styles.membersContainer}>
        {members.map((member, index) => (
          <View key={index} style={styles.memberItem}>
            <View
              style={[
                styles.memberAvatar,
                { backgroundColor: getMemberColor(index) },
              ]}
            >
              <Text style={styles.memberInitial}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.memberName}>
              {member.name} {member.isCurrentUser ? "(You)" : ""}
            </Text>
            {!member.isCurrentUser && (
              <TouchableOpacity
                style={styles.removeMemberButton}
                onPress={() => removeMemberByIndex(index)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.addMemberContainer}>
        <Input
          placeholder="Add member name"
          value={newMemberName}
          onChangeText={setNewMemberName}
          containerStyle={styles.addMemberInput}
        />
        <Button
          title="Add"
          onPress={addNewMember}
          disabled={!newMemberName.trim()}
          size="small"
        />
      </View>

      {errors.members && <Text style={styles.errorText}>{errors.members}</Text>}

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={group ? "Update Group" : "Create Group"}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const getMemberColor = (index: number): string => {
  const colors = [
    "#6366f1", // Indigo
    "#f97316", // Orange
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#f59e0b", // Amber
    "#ef4444", // Red
  ];

  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  membersContainer: {
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  removeMemberButton: {
    padding: 8,
  },
  addMemberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addMemberInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default GroupForm;
