import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { SharedExpense, Group } from '@/types'
import { colors } from '@/constants/colors'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { useSettingsStore } from '@/store/settingsStore'
import { useSplitStore } from '@/store/splitStore'
// ⬇️ add this import
import { settleExpenseRemote } from '@/services/splitSync'

interface ExpenseCardProps {
  expense: SharedExpense
  group: Group
  onPress: () => void
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  group,
  onPress,
}) => {
  const { currency } = useSettingsStore()
  const { settleExpense, updateExpense } = useSplitStore()

  const paidByMember = group.members.find(
    (member) => member.id === expense.paidById
  )
  const currentUserMember = group.members.find((member) => member.isCurrentUser)

  const currentUserSplit = expense.splits.find(
    (split) => currentUserMember && split.memberId === currentUserMember.id
  )

  const isCurrentUserPayer =
    currentUserMember && expense.paidById === currentUserMember.id

  // 🔗 tap on status badge to toggle settled -> sync to Supabase
  const onPressSettle = async () => {
    if (expense.settled) {
      // (Optional) If you want to support un-settling, implement a remote revert here.
      return
    }

    // optimistic: remember previous state to rollback on failure
    const prev = {
      settled: expense.settled,
      splits: expense.splits.map((s) => ({ ...s })),
    }

    try {
      // 1) local optimistic update
      settleExpense(expense.id)

      // 2) remote
      await settleExpenseRemote({
        expense: {
          ...expense,
          settled: true,
          splits: expense.splits.map((s) => ({ ...s, settled: true })),
        },
        group,
      })
    } catch (e) {
      // rollback local
      updateExpense(expense.id, { settled: prev.settled, splits: prev.splits })
      console.error('Failed to settle on Supabase:', e)
      Alert.alert(
        'Sync failed',
        'Couldn’t update the server. Please try again.'
      )
    }
  }

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card
        // @ts-ignore
        style={[styles.card, expense.settled && styles.settledCard]}
        variant='outlined'
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{expense.description}</Text>
            <Text style={styles.subtitle}>
              Paid by{' '}
              {paidByMember
                ? paidByMember.isCurrentUser
                  ? 'You'
                  : paidByMember.name
                : 'Unknown'}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {formatCurrency(expense.amount, currency)}
            </Text>
            <Text style={styles.date}>{formatDate(expense.date, 'short')}</Text>
          </View>
        </View>

        {currentUserMember && !isCurrentUserPayer && currentUserSplit && (
          <View style={styles.userSplitContainer}>
            <Text style={styles.userSplitLabel}>
              {currentUserSplit.settled ? 'You paid' : 'You owe'}
            </Text>
            <Text
              style={[
                styles.userSplitAmount,
                currentUserSplit.settled
                  ? styles.paidAmount
                  : styles.owedAmount,
              ]}
            >
              {formatCurrency(currentUserSplit.amount, currency)}
            </Text>
          </View>
        )}

        <View style={styles.statusContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPressSettle}
            // You can disable tapping if already settled:
            // disabled={expense.settled}
          >
            {expense.settled ? (
              <View style={styles.settledBadge}>
                <Text style={styles.settledText}>Settled</Text>
              </View>
            ) : (
              <View style={styles.unsettledBadge}>
                <Text style={styles.unsettledText}>Unsettled</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingVertical: 12,
  },
  settledCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  userSplitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  userSplitLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userSplitAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  owedAmount: {
    color: colors.error,
  },
  paidAmount: {
    color: colors.success,
  },
  statusContainer: {
    marginTop: 8,
    flexDirection: 'row',
  },
  settledBadge: {
    backgroundColor: colors.success + '20',
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
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unsettledText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '500',
  },
})

export default ExpenseCard
