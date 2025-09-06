export const colors = {
  primary: "#6366f1", // Indigo
  primaryLight: "#818cf8",
  secondary: "#f97316", // Orange
  secondaryLight: "#fb923c",
  success: "#10b981", // Emerald
  error: "#ef4444", // Red
  warning: "#f59e0b", // Amber
  info: "#3b82f6", // Blue
  background: "#ffffff",
  card: "#f9fafb",
  text: "#1f2937",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  borderLight: "#f3f4f6",
  white: "#ffffff", // Added white color
  cardBackground: "#f9fafb", // Added cardBackground for clarity
};

export const theme = {
  light: {
    text: colors.text,
    textSecondary: colors.textSecondary,
    background: colors.background,
    tint: colors.primary,
    tabIconDefault: "#d1d5db",
    tabIconSelected: colors.primary,
    card: colors.card,
    border: colors.border,
  },
};

export default theme;
