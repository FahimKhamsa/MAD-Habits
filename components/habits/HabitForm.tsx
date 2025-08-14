import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Habit } from "@/types";
import { colors } from "@/constants/colors";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useHabitStore } from "@/store/habitStore";

interface HabitFormProps {
  habit?: Habit;
  onComplete?: () => void;
}

export const HabitForm: React.FC<HabitFormProps> = ({ habit, onComplete }) => {
  const router = useRouter();
  const { addHabit, updateHabit } = useHabitStore();

  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
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

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (habit) {
        // Update existing habit
        updateHabit(habit.id, {
          name,
          description,
          frequency,
          daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
        });
      } else {
        // Add new habit
        addHabit({
          name,
          description,
          frequency,
          daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
        });
      }

      if (onComplete) {
        onComplete();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Error saving habit:", error);
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
