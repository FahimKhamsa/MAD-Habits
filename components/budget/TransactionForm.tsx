import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Transaction, BudgetCategory } from "@/types";
import { colors } from "@/constants/colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBudgetStore } from "@/store/budgetStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Card } from "@/components/ui/Card";
import { getTodayISO } from "@/utils/helpers";

interface TransactionFormProps {
  transaction?: Transaction;
  onComplete?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onComplete,
}) => {
  const router = useRouter();
  const { addTransaction, updateTransaction, categories } = useBudgetStore();
  const { currency } = useSettingsStore();

  const [description, setDescription] = useState(
    transaction?.description || ""
  );
  const [amount, setAmount] = useState(transaction?.amount.toString() || "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "");
  const [date, setDate] = useState(transaction?.date || getTodayISO());
  const [tags, setTags] = useState<string[]>(transaction?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set default category if none selected and categories exist
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

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

    if (!categoryId) {
      newErrors.categoryId = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (transaction) {
        // Update existing transaction
        updateTransaction(transaction.id, {
          description,
          amount: Number(amount),
          categoryId,
          date,
          tags,
        });
      } else {
        // Add new transaction
        addTransaction({
          description,
          amount: Number(amount),
          categoryId,
          date,
          tags,
        });
      }

      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g., Grocery shopping"
        error={errors.description}
      />

      <Input
        label={`Amount (${currency})`}
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g., 45.99"
        keyboardType="numeric"
        error={errors.amount}
      />

      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              categoryId === category.id && styles.categoryButtonSelected,
            ]}
            onPress={() => setCategoryId(category.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryButtonText,
                categoryId === category.id && styles.categoryButtonTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.categoryId && (
        <Text style={styles.errorText}>{errors.categoryId}</Text>
      )}

      <Text style={styles.label}>Date</Text>
      <Input value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Tags (Optional)</Text>
      <View style={styles.tagsInputContainer}>
        <Input
          value={newTag}
          onChangeText={setNewTag}
          placeholder="Add a tag"
          containerStyle={styles.tagInput}
        />
        <Button
          title="Add"
          onPress={addTag}
          disabled={!newTag.trim()}
          size="small"
        />
      </View>

      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => removeTag(tag)}
              activeOpacity={0.7}
            >
              <Text style={styles.tagText}>{tag}</Text>
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={transaction ? "Update Transaction" : "Add Transaction"}
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
  categoriesContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    color: colors.text,
    fontWeight: "500",
  },
  categoryButtonTextSelected: {
    color: "white",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  tagsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.borderLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.text,
    marginRight: 4,
  },
  tagRemove: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: -2,
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

export default TransactionForm;
