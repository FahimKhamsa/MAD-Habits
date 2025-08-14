import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { useSettingsStore } from "@/store/settingsStore";
import { colors } from "@/constants/colors";
import { Card } from "@/components/ui/Card";

export default function SettingsScreen() {
  const { currency, notifications, updateSettings } = useSettingsStore();

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  ];

  const handleCurrencyChange = (newCurrency: string) => {
    updateSettings({ currency: newCurrency });
  };

  const toggleNotifications = () => {
    updateSettings({ notifications: !notifications });
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Settings" }} />

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{
              false: colors.borderLight,
              true: colors.primaryLight,
            }}
            thumbColor={notifications ? colors.primary : "#f4f3f4"}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <Text style={styles.sectionDescription}>
          Select the currency to use throughout the app
        </Text>

        {currencies.map((curr) => (
          <TouchableOpacity
            key={curr.code}
            style={[
              styles.currencyItem,
              currency === curr.code && styles.selectedCurrency,
            ]}
            onPress={() => handleCurrencyChange(curr.code)}
            activeOpacity={0.7}
          >
            <View style={styles.currencyInfo}>
              <Text style={styles.currencySymbol}>{curr.symbol}</Text>
              <Text style={styles.currencyName}>{curr.name}</Text>
            </View>
            <Text style={styles.currencyCode}>{curr.code}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          MadHabits is an all-in-one app for students to track habits, manage
          budgets, and split expenses with friends.
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  currencyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectedCurrency: {
    backgroundColor: colors.primary + "10", // 10% opacity
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  currencyName: {
    fontSize: 16,
    color: colors.text,
  },
  currencyCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  aboutText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
