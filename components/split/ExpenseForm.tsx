import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SharedExpense, Group, ExpenseSplit } from "@/types";
import { colors } from "@/constants/colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSplitStore } from "@/store/splitStore";
import { useSettingsStore } from "@/store/settingsStore";
import { formatCurrency, getTodayISO } from "@/utils/helpers";

interface ExpenseFormProps {
  groupId: string;
  expense?: SharedExpense;
  onComplete?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  groupId,
  expense,
  onComplete,
}) => {
  const router = useRouter();
  const { getGroupById, addExpense, updateExpense } = useSplitStore();
  const { currency } = useSettingsStore();

  const group = getGroupById(groupId);

  const [description, setDescription] = useState(expense?.description || "");
  const [amount, setAmount] = useState(expense?.amount.toString() || "");
  const [paidById, setPaidById] = useState(expense?.paidById || "");
  const [date, setDate] = useState(expense?.date || getTodayISO());
  const [splitType, setSplitType] = useState<"equal" | "custom">(
    expense?.splits.every((split) => split.amount === expense.splits[0].amount)
      ? "equal"
      : "custom"
  );
  const [splits, setSplits] = useState<ExpenseSplit[]>(expense?.splits || []);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!group) return;

    // Set default payer to current user if not set
    if (!paidById) {
      const currentUser = group.members.find((member) => member.isCurrentUser);
      if (currentUser) {
        setPaidById(currentUser.id);
      }
    }

    // Initialize splits if not set
    if (splits.length === 0 && group.members.length > 0) {
      const equalAmount = amount
        ? parseFloat(amount) / group.members.length
        : 0;
      const initialSplits = group.members.map((member) => ({
        memberId: member.id,
        amount: equalAmount,
        settled: false,
      }));
      setSplits(initialSplits);
    }
  }, [group, paidById, splits.length, amount]);

  // Update splits when amount changes and split type is equal
  useEffect(() => {
    if (splitType === "equal" && amount && group) {
      const equalAmount = parseFloat(amount) / group.members.length;
      setSplits(
        group.members.map((member) => {
          const existingSplit = splits.find((s) => s.memberId === member.id);
          return {
            memberId: member.id,
            amount: equalAmount,
            settled: existingSplit?.settled || false,
          };
        })
      );
    }
  }, [amount, splitType, group, splits]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number";
    }

    if (!paidById) {
      newErrors.paidById = "Please select who paid";
    }

    // Validate that splits add up to total amount
    const totalSplitAmount = splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    if (Math.abs(totalSplitAmount - parseFloat(amount)) > 0.01) {
      newErrors.splits = "Split amounts must add up to the total amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !group) return;

    setIsSubmitting(true);

    try {
      if (expense) {
        // Update existing expense
        updateExpense(expense.id, {
          description,
          amount: parseFloat(amount),
          paidById,
          date,
          splits,
        });
      } else {
        // Add new expense
        addExpense({
          groupId,
          description,
          amount: parseFloat(amount),
          paidById,
          date,
          splits,
          settled: false,
        });
      }

      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error saving expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSplitAmount = (memberId: string, newAmount: string) => {
    if (isNaN(parseFloat(newAmount))) return;

    setSplits(
      splits.map((split) =>
        split.memberId === memberId
          ? { ...split, amount: parseFloat(newAmount) }
          : split
      )
    );
  };

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g., Dinner at Restaurant"
        error={errors.description}
      />

      <Input
        label={`Total Amount (${currency})`}
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g., 120.00"
        keyboardType="numeric"
        error={errors.amount}
      />

      <Text style={styles.label}>Paid By</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.payersContainer}
      >
        {group.members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.payerButton,
              paidById === member.id && styles.payerButtonSelected,
            ]}
            onPress={() => setPaidById(member.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.payerButtonText,
                paidById === member.id && styles.payerButtonTextSelected,
              ]}
            >
              {member.name} {member.isCurrentUser ? "(You)" : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.paidById && (
        <Text style={styles.errorText}>{errors.paidById}</Text>
      )}

      <Text style={styles.label}>Date</Text>
      <Input value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Split Type</Text>
      <View style={styles.splitTypeButtons}>
        <Button
          title="Equal"
          variant={splitType === "equal" ? "primary" : "outline"}
          onPress={() => setSplitType("equal")}
          style={styles.splitTypeButton}
        />
        <Button
          title="Custom"
          variant={splitType === "custom" ? "primary" : "outline"}
          onPress={() => setSplitType("custom")}
          style={styles.splitTypeButton}
        />
      </View>

      <Text style={styles.label}>Split Details</Text>
      {errors.splits && <Text style={styles.errorText}>{errors.splits}</Text>}

      {group.members.map((member) => {
        const split = splits.find((s) => s.memberId === member.id);
        return (
          <View key={member.id} style={styles.splitItem}>
            <Text style={styles.splitName}>
              {member.name} {member.isCurrentUser ? "(You)" : ""}
            </Text>
            {splitType === "equal" ? (
              <Text style={styles.splitAmount}>
                {split
                  ? formatCurrency(split.amount, currency)
                  : formatCurrency(0, currency)}
              </Text>
            ) : (
              <Input
                value={split ? split.amount.toString() : "0"}
                onChangeText={(value) => updateSplitAmount(member.id, value)}
                keyboardType="numeric"
                containerStyle={styles.splitAmountInput}
              />
            )}
          </View>
        );
      })}

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={expense ? "Update Expense" : "Add Expense"}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
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
  payersContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  payerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    marginRight: 8,
  },
  payerButtonSelected: {
    backgroundColor: colors.primary,
  },
  payerButtonText: {
    color: colors.text,
    fontWeight: "500",
  },
  payerButtonTextSelected: {
    color: "white",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  splitTypeButtons: {
    flexDirection: "row",
    marginBottom: 16,
  },
  splitTypeButton: {
    flex: 1,
    marginRight: 8,
  },
  splitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  splitName: {
    fontSize: 16,
    color: colors.text,
  },
  splitAmount: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  splitAmountInput: {
    width: 120,
    marginBottom: 0,
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

export default ExpenseForm;
