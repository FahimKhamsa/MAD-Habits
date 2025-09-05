import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Habit } from "@/types";
import { colors } from "@/constants/colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useHabits } from "@/hooks/useHabits";

interface HabitFormProps {
  habit?: Habit;
  onComplete?: () => void;
}

// Common habit icons
const HABIT_ICONS = [
  '🎯', '💪', '📚', '🏃‍♀️', '🧘‍♀️', '💧', '🍎', '🌅', '✍️', '🎵',
  '🏋️‍♂️', '🚶‍♂️', '🛏️', '🧠', '📖', '🎨', '🎸', '📱', '💻', '🌱',
  '🏊‍♂️', '🚴‍♂️', '🧘‍♂️', '📝', '🥗', '☕', '🌙', '⏰', '🎲', '🎪'
];

// Common habit colors
const HABIT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6B7280', // Gray
  '#DC2626', // Red 600
  '#059669', // Green 600
];

export const HabitForm: React.FC<HabitFormProps> = ({ habit, onComplete }) => {
  const router = useRouter();
  const { addHabit, updateHabit, isLoading } = useHabits();

  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [icon, setIcon] = useState(habit?.icon || "🎯");
  const [color, setColor] = useState(habit?.color || "#3B82F6");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    habit?.frequency || "daily"
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    habit?.daysOfWeek || [1, 2, 3, 4, 5]
  ); // Mon-Fri by default
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = "Habit name is required";
    }

    if (frequency === "weekly" && daysOfWeek.length === 0) {
      newErrors.daysOfWeek = "Please select at least one day of the week";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const habitData = {
        name,
        description,
        icon,
        color,
        frequency,
        daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
      };

      if (habit) {
        // Update existing habit
        await updateHabit(habit.id, habitData);
      } else {
        // Add new habit
        await addHabit(habitData);
      }

      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error saving habit:", error);
      Alert.alert("Error", "Failed to save habit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const dayButtons = [
    { day: 0, label: "S" },
    { day: 1, label: "M" },
    { day: 2, label: "T" },
    { day: 3, label: "W" },
    { day: 4, label: "T" },
    { day: 5, label: "F" },
    { day: 6, label: "S" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Habit Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Morning Meditation"
        error={errors.name}
      />

      <Input
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g., 10 minutes of mindfulness"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Icon Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.iconGrid}>
          {HABIT_ICONS.map((iconOption) => (
            <TouchableOpacity
              key={iconOption}
              style={[
                styles.iconButton,
                icon === iconOption && styles.iconButtonSelected,
                { borderColor: icon === iconOption ? color : colors.borderLight }
              ]}
              onPress={() => setIcon(iconOption)}
            >
              <Text style={styles.iconText}>{iconOption}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {HABIT_COLORS.map((colorOption) => (
            <TouchableOpacity
              key={colorOption}
              style={[
                styles.colorButton,
                { backgroundColor: colorOption },
                color === colorOption && styles.colorButtonSelected,
              ]}
              onPress={() => setColor(colorOption)}
            />
          ))}
        </View>
      </View>

      {/* Preview */}
      <View style={styles.section}>
        <Text style={styles.label}>Preview</Text>
        <View style={[styles.previewCard, { borderColor: color }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewIcon}>{icon}</Text>
            <Text style={styles.previewName}>{name || "Habit Name"}</Text>
          </View>
          {description && (
            <Text style={styles.previewDescription}>{description}</Text>
          )}
        </View>
      </View>

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.frequencyButtons}>
        <Button
          title="Daily"
          variant={frequency === "daily" ? "primary" : "outline"}
          onPress={() => setFrequency("daily")}
          style={styles.frequencyButton}
        />
        <Button
          title="Weekly"
          variant={frequency === "weekly" ? "primary" : "outline"}
          onPress={() => setFrequency("weekly")}
          style={styles.frequencyButton}
        />
        <Button
          title="Monthly"
          variant={frequency === "monthly" ? "primary" : "outline"}
          onPress={() => setFrequency("monthly")}
          style={styles.frequencyButton}
        />
      </View>

      {frequency === "weekly" && (
        <View style={styles.daysContainer}>
          <Text style={styles.label}>Days of the Week</Text>
          <View style={styles.daysButtons}>
            {dayButtons.map((item) => (
              <Button
                key={item.day}
                title={item.label}
                variant={daysOfWeek.includes(item.day) ? "primary" : "outline"}
                onPress={() => toggleDay(item.day)}
                style={styles.dayButton}
                size="small"
              />
            ))}
          </View>
          {errors.daysOfWeek && (
            <Text style={styles.errorText}>{errors.daysOfWeek}</Text>
          )}
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
          title={habit ? "Update Habit" : "Create Habit"}
          onPress={handleSubmit}
          loading={isSubmitting || isLoading}
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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  iconButtonSelected: {
    borderWidth: 3,
  },
  iconText: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: colors.text,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.background,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  previewDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  frequencyButtons: {
    flexDirection: "row",
    marginBottom: 16,
  },
  frequencyButton: {
    flex: 1,
    marginRight: 8,
  },
  daysContainer: {
    marginBottom: 16,
  },
  daysButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayButton: {
    width: 40,
    height: 40,
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
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

export default HabitForm;