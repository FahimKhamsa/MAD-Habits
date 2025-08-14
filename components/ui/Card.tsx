import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
}) => {
  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = { ...styles.card };

    if (variant === "elevated") {
      cardStyle = { ...cardStyle, ...styles.cardElevated };
    } else if (variant === "outlined") {
      cardStyle = { ...cardStyle, ...styles.cardOutlined };
    }

    return cardStyle;
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  cardElevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Card;
