import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";

import { ErrorBoundary } from "./error-boundary";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="habits/new"
        options={{ title: "New Habit", presentation: "modal" }}
      />
      <Stack.Screen name="habits/[id]" options={{ title: "Habit Details" }} />
      <Stack.Screen
        name="habits/edit/[id]"
        options={{ title: "Edit Habit", presentation: "modal" }}
      />
      <Stack.Screen
        name="budget/new-category"
        options={{ title: "New Category", presentation: "modal" }}
      />
      <Stack.Screen
        name="budget/category/[id]"
        options={{ title: "Category Details" }}
      />
      <Stack.Screen
        name="budget/edit-category/[id]"
        options={{ title: "Edit Category", presentation: "modal" }}
      />
      <Stack.Screen
        name="budget/new-transaction"
        options={{ title: "New Transaction", presentation: "modal" }}
      />
      <Stack.Screen
        name="budget/transaction/[id]"
        options={{ title: "Transaction Details" }}
      />
      <Stack.Screen
        name="budget/edit-transaction/[id]"
        options={{ title: "Edit Transaction", presentation: "modal" }}
      />
      <Stack.Screen
        name="split/new-group"
        options={{ title: "New Group", presentation: "modal" }}
      />
      <Stack.Screen
        name="split/group/[id]"
        options={{ title: "Group Details" }}
      />
      <Stack.Screen
        name="split/edit-group/[id]"
        options={{ title: "Edit Group", presentation: "modal" }}
      />
      <Stack.Screen
        name="split/new-expense/[groupId]"
        options={{ title: "New Expense", presentation: "modal" }}
      />
      <Stack.Screen
        name="split/expense/[id]"
        options={{ title: "Expense Details" }}
      />
      <Stack.Screen
        name="split/edit-expense/[id]"
        options={{ title: "Edit Expense", presentation: "modal" }}
      />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}
