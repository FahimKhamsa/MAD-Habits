import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { useSplitStore } from '@/store/splitStore'
import { colors } from '@/constants/colors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useSettingsStore } from '@/store/settingsStore'

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const {
    expenses,
    getGroupById,
    deleteExpense,
    settleExpense,
    settleExpenseSplit,
  } = useSplitStore()
  const { currency } = useSettingsStore()

  const expense = expenses.find((e) => e.id === id)
  const group = expense ? getGroupById(expense.groupId) : undefined

  if (!expense || !group) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Expense not found</Text>
        <Button
          title='Go Back'
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    )
  }

  const paidByMember = group.members.find(
    (member) => member.id === expense.paidById
  )
  const currentUserMember = group.members.find((member) => member.isCurrentUser)

  const handleEdit = () => {
    router.push(`/split/edit-expense/${id}`)
  }

  const handleDelete = async () => {
    try {
      await deleteExpense(id)
      router.back()
    } catch (error) {
      console.error('Failed to delete expense:', error)
      // Still navigate back even if database operation fails
      router.back()
    }
  }

  const handleSettleExpense = () => {
    settleExpense(id)
  }

  const handleSettleSplit = (memberId: string) => {
    settleExpenseSplit(id, memberId)
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Expense Details',
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Feather name='edit' size={20} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <Card style={styles.expenseCard}>
        <Text style={styles.expenseDescription}>{expense.description}</Text>
        <Text style={styles.expenseAmount}>
          {formatCurrency(expense.amount, currency)}
        </Text>

        <View style={styles.expenseMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Paid by</Text>
            <Text style={styles.metaValue}>
              {paidByMember
                ? paidByMember.isCurrentUser
                  ? 'You'
                  : paidByMember.name
                : 'Unknown'}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(expense.date)}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <View
              style={
                expense.settled ? styles.settledBadge : styles.unsettledBadge
              }
            >
              <Text
                style={
                  expense.settled ? styles.settledText : styles.unsettledText
                }
              >
                {expense.settled ? 'Settled' : 'Unsettled'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.splitsCard}>
        <Text style={styles.sectionTitle}>Split Details</Text>

        {expense.splits.map((split) => {
          const member = group.members.find((m) => m.id === split.memberId)
          if (!member) return null

          return (
            <View key={split.memberId} style={styles.splitItem}>
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
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.name} {member.isCurrentUser ? '(You)' : ''}
                  </Text>
                  <Text style={styles.splitAmount}>
                    {formatCurrency(split.amount, currency)}
                  </Text>
                </View>
              </View>

              {!expense.settled &&
                !split.settled &&
                expense.paidById === currentUserMember?.id &&
                !member.isCurrentUser && (
                  <Button
                    title='Mark Paid'
                    size='small'
                    onPress={() => handleSettleSplit(split.memberId)}
                    icon={<Feather name='check' size={16} color='white' />}
                  />
                )}

              {split.settled && (
                <View style={styles.settledBadge}>
                  <Text style={styles.settledText}>Paid</Text>
                </View>
              )}
            </View>
          )
        })}
      </Card>

      <View style={styles.actionsContainer}>
        {!expense.settled && (
          <Button
            title='Mark as Settled'
            onPress={handleSettleExpense}
            style={styles.settleButton}
            icon={<Feather name='check' size={16} color='white' />}
          />
        )}

        <Button
          title='Delete Expense'
          variant='outline'
          onPress={handleDelete}
          style={styles.deleteButton}
          textStyle={{ color: colors.error }}
          icon={<Feather name='trash-2' size={16} color={colors.error} />}
        />
      </View>
    </ScrollView>
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
  expenseCard: {
    margin: 16,
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  expenseMeta: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  settledBadge: {
    backgroundColor: colors.success + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  settledText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '500',
  },
  unsettledBadge: {
    backgroundColor: colors.warning + '20', // 20% opacity
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unsettledText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '500',
  },
  splitsCard: {
    margin: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  splitAmount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionsContainer: {
    padding: 16,
    marginBottom: 32,
  },
  settleButton: {
    marginBottom: 12,
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
