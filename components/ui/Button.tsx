import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from "react-native";
import { colors } from "@/constants/colors";
import { triggerHaptic } from "@/utils/helpers";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  style,
  textStyle,
  haptic = true,
  ...rest
}) => {
  const handlePress = () => {
    if (haptic) {
      triggerHaptic();
    }
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = { ...styles.button };

    // Size
    if (size === "small") {
      buttonStyle = { ...buttonStyle, ...styles.buttonSmall };
    } else if (size === "large") {
      buttonStyle = { ...buttonStyle, ...styles.buttonLarge };
    }

    // Variant
    if (variant === "primary") {
      buttonStyle = { ...buttonStyle, ...styles.buttonPrimary };
    } else if (variant === "secondary") {
      buttonStyle = { ...buttonStyle, ...styles.buttonSecondary };
    } else if (variant === "outline") {
      buttonStyle = { ...buttonStyle, ...styles.buttonOutline };
    } else if (variant === "ghost") {
      buttonStyle = { ...buttonStyle, ...styles.buttonGhost };
    }

    // Disabled
    if (disabled || loading) {
      buttonStyle = { ...buttonStyle, ...styles.buttonDisabled };
    }

    return buttonStyle;
  };

  const getTextStyle = (): TextStyle => {
    let textStyle: TextStyle = { ...styles.text };

    // Size
    if (size === "small") {
      textStyle = { ...textStyle, ...styles.textSmall };
    } else if (size === "large") {
      textStyle = { ...textStyle, ...styles.textLarge };
    }

    // Variant
    if (variant === "primary") {
      textStyle = { ...textStyle, ...styles.textPrimary };
    } else if (variant === "secondary") {
      textStyle = { ...textStyle, ...styles.textSecondary };
    } else if (variant === "outline") {
      textStyle = { ...textStyle, ...styles.textOutline };
    } else if (variant === "ghost") {
      textStyle = { ...textStyle, ...styles.textGhost };
    }

    // Disabled
    if (disabled || loading) {
      textStyle = { ...textStyle, ...styles.textDisabled };
    }

    return textStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? colors.primary
              : "white"
          }
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  textSmall: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 18,
  },
  textPrimary: {
    color: "white",
  },
  textSecondary: {
    color: "white",
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: "#999",
  },
});

export default Button;
