import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Habits",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color }) => (
            <Feather name="dollar-sign" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="split"
        options={{
          title: "Split",
          tabBarIcon: ({ color }) => (
            <Feather name="users" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <Feather name="bar-chart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default TabLayout;

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 5,
  },
});
