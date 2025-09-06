import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SharedExpense, ExpenseSplit } from '@/types'
import { colors } from '@/constants/colors'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useSplitStore } from '@/store/splitStore'
import { useSettingsStore } from '@/store/settingsStore'
import { formatCurrency, getTodayISO } from '@/utils/helpers'
// 🔗 Supabase sync helpers
import {
  createExpenseRemote,
  updateExpenseRemote,
  rememberExpenseId,
} from '@/services/splitSync'

interface ExpenseFormProps {
  groupId: string
  expense?: SharedExpense
  onComplete?: () => void
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  groupId,
  expense,
  onComplete,
}) => {
  const router = useRouter()
  const { getGroupById, addExpense, updateExpense } = useSplitStore()
  const { currency } = useSettingsStore()
  const group = getGroupById(groupId)

  const [description, setDescription] = useState(expense?.description || '')
  const [amount, setAmount] = useState(expense?.amount.toString() || '')
  const [paidById, setPaidById] = useState(expense?.paidById || '')
  const [date, setDate] = useState(expense?.date || getTodayISO())
  const [splitType, setSplitType] = useState<'equal' | 'custom'>(
    expense?.splits?.length &&
      expense.splits.every((s) => s.amount === expense.splits[0].amount)
      ? 'equal'
      : 'custom'
  )
  const [splits, setSplits] = useState<ExpenseSplit[]>(expense?.splits || [])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!group) return
    if (!paidById) {
      const me = group.members.find((m) => m.isCurrentUser)
      if (me) setPaidById(me.id)
    }
    if (splits.length === 0 && group.members.length > 0) {
      const equal = amount ? parseFloat(amount) / group.members.length : 0
      setSplits(
        group.members.map((m) => ({
          memberId: m.id,
          amount: equal,
          settled: false,
        }))
      )
    }
  }, [group, paidById, splits.length, amount])

  useEffect(() => {
    if (splitType === 'equal' && amount && group) {
      const equal = parseFloat(amount) / group.members.length
      setSplits((prevSplits) =>
        group.members.map((m) => {
          const prev = prevSplits.find((s) => s.memberId === m.id)
          return {
            memberId: m.id,
            amount: Number.isFinite(equal) ? equal : 0,
            settled: !!prev?.settled,
          }
        })
      )
    }
  }, [amount, splitType, group])

  const validateForm = (): boolean => {
    const e: Record<string, string> = {}
    if (!description.trim()) e.description = 'Description is required'
    if (!amount.trim()) e.amount = 'Amount is required'
    else if (isNaN(Number(amount)) || Number(amount) <= 0)
      e.amount = 'Amount must be a positive number'
    if (!paidById) e.paidById = 'Please select who paid'
    const total = splits.reduce((sum, s) => sum + s.amount, 0)
    if (Math.abs(total - parseFloat(amount || '0')) > 0.01)
      e.splits = 'Split amounts must add up to the total amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm() || !group) return
    setIsSubmitting(true)
    try {
      const payload = {
        groupId,
        description,
        amount: parseFloat(amount),
        paidById,
        date,
        splits,
        settled: false,
      }

      if (expense) {
        // 🔗 Sync update to Supabase (upsert-like)
        await updateExpenseRemote({
          localExpenseId: expense.id,
          group,
          description,
          amount: parseFloat(amount),
          paidByLocalId: paidById,
          date,
          splits,
        })

        // ✅ Update local store
        updateExpense(expense.id, {
          description,
          amount: parseFloat(amount),
          paidById,
          date,
          splits,
        })
      } else {
        // ✅ First update local store to get the new local id
        // (your store generates the id)
        const beforeAdd = Date.now()
        useSplitStore.getState().addExpense(payload)
        const newExpense = useSplitStore
          .getState()
          .expenses.slice()
          .reverse()
          .find(
            (e) => e.createdAt && new Date(e.createdAt).getTime() >= beforeAdd
          ) // quick pick of just-added

        // 🔗 Create remote & remember mapping
        if (newExpense) {
          const { supaExpenseId } = await createExpenseRemote({
            group,
            description,
            amount: parseFloat(amount),
            paidByLocalId: paidById,
            date,
            splits,
          })
          await rememberExpenseId(newExpense.id, supaExpenseId)
        }
      }

      onComplete ? onComplete() : router.back()
    } catch (err) {
      console.error('Error saving expense:', err)
      setErrors((prev) => ({
        ...prev,
        submit: 'Failed to save. Please try again.',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label='Description'
        value={description}
        onChangeText={setDescription}
        placeholder='e.g., Dinner at Restaurant'
        error={errors.description}
      />
      <Input
        label={`Total Amount (${currency})`}
        value={amount}
        onChangeText={setAmount}
        placeholder='e.g., 120.00'
        keyboardType='numeric'
        error={errors.amount}
      />

      <Text style={styles.label}>Paid By</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.payersContainer}
      >
        {group.members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.payerButton,
              paidById === member.id && styles.payerButtonSelected,
            ]}
            onPress={() => setPaidById(member.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.payerButtonText,
                paidById === member.id && styles.payerButtonTextSelected,
              ]}
            >
              {member.name} {member.isCurrentUser ? '(You)' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.paidById ? (
        <Text style={styles.errorText}>{errors.paidById}</Text>
      ) : null}

      <Text style={styles.label}>Date</Text>
      <Input value={date} onChangeText={setDate} placeholder='YYYY-MM-DD' />

      <Text style={styles.label}>Split Type</Text>
      <View style={styles.splitTypeButtons}>
        <Button
          title='Equal'
          variant={splitType === 'equal' ? 'primary' : 'outline'}
          onPress={() => setSplitType('equal')}
          style={styles.splitTypeButton}
        />
        <Button
          title='Custom'
          variant={splitType === 'custom' ? 'primary' : 'outline'}
          onPress={() => setSplitType('custom')}
          style={styles.splitTypeButton}
        />
      </View>

      <Text style={styles.label}>Split Details</Text>
      {errors.splits ? (
        <Text style={styles.errorText}>{errors.splits}</Text>
      ) : null}

      {group.members.map((member) => {
        const split = splits.find((s) => s.memberId === member.id)
        return (
          <View key={member.id} style={styles.splitItem}>
            <Text style={styles.splitName}>
              {member.name} {member.isCurrentUser ? '(You)' : ''}
            </Text>
            {splitType === 'equal' ? (
              <Text style={styles.splitAmount}>
                {formatCurrency(split ? split.amount : 0, currency)}
              </Text>
            ) : (
              <Input
                value={(split?.amount ?? 0).toString()}
                onChangeText={(v) => {
                  if (isNaN(parseFloat(v))) return
                  setSplits(
                    splits.map((s) =>
                      s.memberId === member.id
                        ? { ...s, amount: parseFloat(v) }
                        : s
                    )
                  )
                }}
                keyboardType='numeric'
                containerStyle={styles.splitAmountInput}
              />
            )}
          </View>
        )
      })}

      {errors.submit ? (
        <Text style={[styles.errorText, { marginTop: 8 }]}>
          {errors.submit}
        </Text>
      ) : null}

      <View style={styles.buttonContainer}>
        <Button
          title='Cancel'
          variant='outline'
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={expense ? 'Update Expense' : 'Add Expense'}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  payersContainer: { flexDirection: 'row', marginBottom: 16 },
  payerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    marginRight: 8,
  },
  payerButtonSelected: { backgroundColor: colors.primary },
  payerButtonText: { color: colors.text, fontWeight: '500' },
  payerButtonTextSelected: { color: 'white' },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  splitTypeButtons: { flexDirection: 'row', marginBottom: 16 },
  splitTypeButton: { flex: 1, marginRight: 8 },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  splitName: { fontSize: 16, color: colors.text },
  splitAmount: { fontSize: 16, fontWeight: '500', color: colors.text },
  splitAmountInput: { width: 120, marginBottom: 0 },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  button: { flex: 1, marginHorizontal: 4 },
})

export default ExpenseForm
