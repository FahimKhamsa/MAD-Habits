import { Platform } from "react-native";

// Generate a unique ID
export const generateId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Format currency
export const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (
  date: string | Date,
  format: "short" | "medium" | "long" = "medium"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "short") {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } else if (format === "medium") {
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } else {
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
};

// Get day name
export const getDayName = (
  date: string | Date,
  short: boolean = false
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    weekday: short ? "short" : "long",
  });
};

// Get month name
export const getMonthName = (
  date: string | Date,
  short: boolean = false
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    month: short ? "short" : "long",
  });
};

// Get days in month
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Get today's date as ISO string (YYYY-MM-DD)
export const getTodayISO = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Get yesterday's date as ISO string (YYYY-MM-DD)
export const getYesterdayISO = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
};

// Get the first day of the next month as ISO string (YYYY-MM-DD)
export const getFirstDayOfNextMonthISO = (date: string | Date = new Date()): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const nextMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 1);
  return nextMonth.toISOString().split("T")[0];
};

// Check if a date is today
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

// Check if a date is in the past
export const isPast = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};

// Check if a date is in the future
export const isFuture = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj > today;
};

// Get a date range (array of ISO date strings)
export const getDateRange = (
  startDate: string | Date,
  endDate: string | Date
): string[] => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const dates: string[] = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

// Haptic feedback (with web fallback)
export const triggerHaptic = async (
  type: "success" | "warning" | "error" | "light" = "light"
) => {
  if (Platform.OS !== "web") {
    try {
      const Haptics = require("expo-haptics");

      switch (type) {
        case "success":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          break;
        case "warning":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          break;
        case "error":
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          break;
        case "light":
        default:
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      console.log("Haptics not available");
    }
  }
};

// Group array by key
export const groupBy = <T>(
  array: T[],
  key: keyof T
): { [key: string]: T[] } => {
  return array.reduce((result, currentValue) => {
    const groupKey = String(currentValue[key]);
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as { [key: string]: T[] });
};
