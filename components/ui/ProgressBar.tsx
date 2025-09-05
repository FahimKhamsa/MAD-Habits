import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/constants/colors";

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: ViewStyle;
  color?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = colors.borderLight,
  progressColor = colors.primary,
  style,
  animated = true,
}) => {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  // Determine color based on progress
  const getColor = () => {
    if (progress >= 1) return colors.success;
    if (progress >= 0.7) return colors.primary;
    if (progress >= 0.3) return colors.warning;
    return colors.error;
  };

  const finalProgressColor =
    progressColor === colors.primary ? getColor() : progressColor;

  return (
    <View style={[styles.container, { height }, style]}>
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: finalProgressColor,
          },
          animated && styles.animated,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 4,
  },
  animated: {
    transition: "width 0.3s ease-in-out",
  },
});

export default ProgressBar;
