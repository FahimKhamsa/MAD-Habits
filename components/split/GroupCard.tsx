import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Group } from "@/types";
import { colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";
import { useSplitStore } from "@/store/splitStore";
import { formatCurrency } from "@/utils/helpers";
import { useSettingsStore } from "@/store/settingsStore";

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onPress }) => {
  const { getBalances, getExpensesByGroup } = useSplitStore();
  const { currency } = useSettingsStore();

  const balances = getBalances(group.id);
  const expenses = getExpensesByGroup(group.id);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const currentUserMember = group.members.find(
    (member) => member.isCurrentUser
  );
  const currentUserBalance = currentUserMember
    ? balances[currentUserMember.id] || 0
    : 0;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.memberCount}>{group.members.length} members</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>
              {formatCurrency(totalExpenses, currency)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Your Balance</Text>
            <Text
              style={[
                styles.statValue,
                currentUserBalance > 0
                  ? styles.positiveBalance
                  : currentUserBalance < 0
                  ? styles.negativeBalance
                  : styles.neutralBalance,
              ]}
            >
              {formatCurrency(currentUserBalance, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.membersContainer}>
          {group.members.slice(0, 3).map((member, index) => (
            <View key={member.id} style={styles.memberItem}>
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
              <Text style={styles.memberName} numberOfLines={1}>
                {member.name} {member.isCurrentUser ? "(You)" : ""}
              </Text>
            </View>
          ))}

          {group.members.length > 3 && (
            <View style={styles.memberItem}>
              <View style={[styles.memberAvatar, styles.memberAvatarMore]}>
                <Text style={styles.memberInitial}>
                  +{group.members.length - 3}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
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
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  memberCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  positiveBalance: {
    color: colors.success,
  },
  negativeBalance: {
    color: colors.error,
  },
  neutralBalance: {
    color: colors.text,
  },
  membersContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  memberAvatarMore: {
    backgroundColor: colors.borderLight,
  },
  memberInitial: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  memberName: {
    fontSize: 14,
    color: colors.text,
    maxWidth: 80,
  },
});

export default GroupCard;
