import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";

import { ErrorBoundary } from "./error-boundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useHabits } from "@/hooks/useHabits";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.log("[RootLayoutNav] Auth state:", {
      user: !!user,
      loading,
      pathname,
    });

    if (loading) {
      console.log("[RootLayoutNav] Still loading, waiting...");
      return;
    }

    const isAuthScreen = ["/login", "/signup", "/forgot-password"].includes(
      pathname
    );
    console.log("[RootLayoutNav] Is auth screen:", isAuthScreen);

    if (!user && !isAuthScreen) {
      console.log("[RootLayoutNav] No user, redirecting to login");
      router.replace("/login");
    } else if (user && isAuthScreen) {
      console.log("[RootLayoutNav] User authenticated, redirecting to tabs");
      router.replace("/(tabs)");
    } else {
      console.log("[RootLayoutNav] No navigation needed");
    }
  }, [user, loading, pathname]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const { isAuthenticated, fetchHabits, isOnline } = useHabits();

  useEffect(() => {
    // Fetch habits when user is authenticated and online
    if (isAuthenticated && isOnline) {
      fetchHabits().catch(console.error);
    }
  }, [isAuthenticated, isOnline]);

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
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}
