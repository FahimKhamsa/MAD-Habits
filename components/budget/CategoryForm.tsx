import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { BudgetCategory } from "@/types";
import { colors } from "@/constants/colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBudgetStore } from "@/store/budgetStore";
import { useSettingsStore } from "@/store/settingsStore";

interface CategoryFormProps {
  category?: BudgetCategory;
  onComplete?: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onComplete,
}) => {
  const router = useRouter();
  const { addCategory, updateCategory, categoriesLoading, error } =
    useBudgetStore();
  const { currency } = useSettingsStore();

  const [name, setName] = useState(category?.name || "");
  const [limit, setLimit] = useState(category?.limit.toString() || "");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Category name is required";
    }

    if (!limit.trim()) {
      newErrors.limit = "Budget limit is required";
    } else if (isNaN(Number(limit)) || Number(limit) < 0) {
      newErrors.limit = "Budget limit must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (category) {
        // Update existing category
        await updateCategory(category.id, {
          name,
          limit: Number(limit),
        });
      } else {
        // Add new category
        await addCategory({
          name,
          limit: Number(limit),
        });
      }

      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error saving category:", error);
      // Error is already handled by the store and displayed via the error state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Category Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Groceries"
        error={errors.name}
      />

      <Input
        label={`Budget Limit (${currency})`}
        value={limit}
        onChangeText={setLimit}
        placeholder="e.g., 500"
        keyboardType="numeric"
        error={errors.limit}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={category ? "Update Category" : "Create Category"}
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

export default CategoryForm;
