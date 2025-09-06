import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useSplitStore } from '@/store/splitStore'
import { colors } from '@/constants/colors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ExpenseCard } from '@/components/split/ExpenseCard'
import { formatCurrency } from '@/utils/helpers'
import { useSettingsStore } from '@/store/settingsStore'

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { getGroupById, getExpensesByGroup, getBalances, deleteGroup } =
    useSplitStore()
  const { currency } = useSettingsStore()

  const group = getGroupById(id)
  const expenses = group ? getExpensesByGroup(id) : []
  const balances = group ? getBalances(id) : {}

  if (!group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Group not found</Text>
        <Button
          title='Go Back'
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    )
  }

  const handleEdit = () => {
    router.push(`/split/edit-group/${id}`)
  }

  const handleDelete = async () => {
    try {
      await deleteGroup(id)
      router.back()
    } catch (error) {
      console.error('Failed to delete group:', error)
      // Still navigate back even if database operation fails
      router.back()
    }
  }

  const handleAddExpense = () => {
    router.push(`/split/new-expense/${id}`)
  }

  const navigateToExpenseDetails = (expenseId: string) => {
    router.push(`/split/expense/${expenseId}`)
  }

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  )

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Feather name='edit' size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{group.name}</Text>
        <Text style={styles.summarySubtitle}>
          {group.members.length} members
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>
              {formatCurrency(totalExpenses, currency)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>{expenses.length}</Text>
          </View>
        </View>

        <Button
          title='Add Expense'
          onPress={handleAddExpense}
          style={styles.addButton}
          icon={<Feather name='plus' size={16} color='white' />}
        />
      </Card>

      <Card style={styles.balancesCard}>
        <Text style={styles.sectionTitle}>Balances</Text>

        {group.members.map((member) => {
          const memberBalance = balances[member.id] || 0
          return (
            <View key={member.id} style={styles.balanceItem}>
              <View style={styles.memberInfo}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: getMemberColor(member.id) },
                  ]}
                >
                  <Text style={styles.memberInitial}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>
                  {member.name} {member.isCurrentUser ? '(You)' : ''}
                </Text>
              </View>
              <Text
                style={[
                  styles.balanceAmount,
                  memberBalance > 0
                    ? styles.positiveBalance
                    : memberBalance < 0
                    ? styles.negativeBalance
                    : styles.neutralBalance,
                ]}
              >
                {formatCurrency(memberBalance, currency)}
              </Text>
            </View>
          )
        })}
      </Card>

      <View style={styles.expensesContainer}>
        <Text style={styles.sectionTitle}>Expenses</Text>

        {expenses.length > 0 ? (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExpenseCard
                expense={item}
                group={group}
                onPress={() => navigateToExpenseDetails(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses in this group</Text>
            <Button
              title='Add Expense'
              onPress={handleAddExpense}
              style={styles.emptyButton}
            />
          </View>
        )}
      </View>

      <View style={styles.deleteContainer}>
        <Button
          title='Delete Group'
          variant='outline'
          onPress={handleDelete}
          style={styles.deleteButton}
          textStyle={{ color: colors.error }}
          icon={<Feather name='trash-2' size={16} color={colors.error} />}
        />
      </View>
    </View>
  )
}

const getMemberColor = (id: string): string => {
  const colors = [
    '#6366f1', // Indigo
    '#f97316', // Orange
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#f59e0b', // Amber
    '#ef4444', // Red
  ]

  // Simple hash function to get consistent colors
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editButton: {
    padding: 8,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    marginRight: 24,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    marginTop: 8,
  },
  balancesCard: {
    margin: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  memberName: {
    fontSize: 16,
    color: colors.text,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveBalance: {
    color: colors.success,
  },
  negativeBalance: {
    color: colors.error,
  },
  neutralBalance: {
    color: colors.text,
  },
  expensesContainer: {
    flex: 1,
    marginTop: 8,
    marginHorizontal: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    width: '60%',
  },
  deleteContainer: {
    padding: 16,
    marginBottom: 32,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  errorButton: {
    alignSelf: 'center',
    width: 200,
  },
})
