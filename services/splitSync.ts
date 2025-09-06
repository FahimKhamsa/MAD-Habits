import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import type { Group, GroupMember, SharedExpense, ExpenseSplit } from '@/types'

const MAP_KEY = 'madhabits-split-supabase-map'
// shape: { groups: { [localGroupId]: supaGroupId }, members: { [localMemberId]: supaMemberId }, expenses: { [localExpenseId]: supaExpenseId } }
type IdMap = {
  groups: Record<string, string>
  members: Record<string, string>
  expenses: Record<string, string>
}

async function loadMap(): Promise<IdMap> {
  const raw = await AsyncStorage.getItem(MAP_KEY)
  if (!raw) return { groups: {}, members: {}, expenses: {} }
  try {
    return JSON.parse(raw)
  } catch {
    return { groups: {}, members: {}, expenses: {} }
  }
}
async function saveMap(map: IdMap) {
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map))
}

async function ensureGroup(group: Group): Promise<string> {
  const map = await loadMap()
  if (map.groups[group.id]) return map.groups[group.id]

  // create minimal group row (creator_id is nullable in your schema)
  const { data, error } = await supabase
    .from('groups')
    .insert([{ name: group.name }])
    .select('id')
    .single()
  if (error) throw error

  map.groups[group.id] = data.id
  await saveMap(map)
  return data.id
}

async function ensureMember(
  supaGroupId: string,
  member: GroupMember
): Promise<string> {
  const map = await loadMap()
  if (map.members[member.id]) return map.members[member.id]

  // Attempt a best-effort "find or create" by (group_id + email or name)
  let foundId: string | null = null
  if (member.email) {
    const { data: found, error: findErr } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', supaGroupId)
      .eq('email', member.email)
      .maybeSingle()
    if (!findErr && found) foundId = found.id
  }

  if (!foundId) {
    const { data, error } = await supabase
      .from('group_members')
      .insert([
        {
          group_id: supaGroupId,
          name: member.name,
          email: member.email ?? null,
          is_current_user: member.isCurrentUser ?? false,
        },
      ])
      .select('id')
      .single()
    if (error) throw error
    foundId = data.id
  }

  map.members[member.id] = foundId
  await saveMap(map)
  return foundId
}

export async function createExpenseRemote(params: {
  group: Group
  description: string
  amount: number
  paidByLocalId: string
  date: string // YYYY-MM-DD
  splits: ExpenseSplit[]
}): Promise<{ supaExpenseId: string }> {
  const { group, description, amount, paidByLocalId, date, splits } = params
  const map = await loadMap()

  // 1) ensure group
  const supaGroupId = await ensureGroup(group)

  // 2) ensure all members + payer mapping
  const localMembersById: Record<string, GroupMember> = Object.fromEntries(
    group.members.map((m) => [m.id, m])
  )
  const supaMembers: Record<string, string> = {}
  for (const m of group.members) {
    supaMembers[m.id] = await ensureMember(supaGroupId, m)
  }
  const supaPayerId = supaMembers[paidByLocalId]

  // 3) create shared_expenses
  const { data: expense, error: expErr } = await supabase
    .from('shared_expenses')
    .insert([
      {
        group_id: supaGroupId,
        description,
        amount,
        paid_by_id: supaPayerId,
        date, // date column in schema
        settled: false,
      },
    ])
    .select('id')
    .single()
  if (expErr) throw expErr

  // 4) create expense_splits
  const rows = splits.map((s) => ({
    expense_id: expense.id,
    member_id: supaMembers[s.memberId],
    amount: s.amount,
    settled: !!s.settled,
  }))
  const { error: splitErr } = await supabase.from('expense_splits').insert(rows)
  if (splitErr) {
    // best-effort cleanup (ignore error)
    await supabase.from('shared_expenses').delete().eq('id', expense.id)
    throw splitErr
  }

  // remember id mapping for this expense (we only have it after local add, so we return supa id)
  return { supaExpenseId: expense.id }
}

export async function updateExpenseRemote(params: {
  localExpenseId: string
  supaExpenseId?: string // if known
  group: Group
  description: string
  amount: number
  paidByLocalId: string
  date: string
  splits: ExpenseSplit[]
}) {
  const map = await loadMap()
  const supaExpenseId =
    params.supaExpenseId ?? map.expenses[params.localExpenseId]
  if (!supaExpenseId) {
    // No remote id yet — create anew
    const { supaExpenseId: createdId } = await createExpenseRemote({
      group: params.group,
      description: params.description,
      amount: params.amount,
      paidByLocalId: params.paidByLocalId,
      date: params.date,
      splits: params.splits,
    })
    map.expenses[params.localExpenseId] = createdId
    await saveMap(map)
    return
  }

  // ensure group + members (in case membership changed)
  const supaGroupId = await ensureGroup(params.group)
  const supaMembers: Record<string, string> = {}
  for (const m of params.group.members) {
    supaMembers[m.id] = await ensureMember(supaGroupId, m)
  }
  const supaPayerId = supaMembers[params.paidByLocalId]

  // 1) update expense
  const { error: updErr } = await supabase
    .from('shared_expenses')
    .update({
      group_id: supaGroupId,
      description: params.description,
      amount: params.amount,
      paid_by_id: supaPayerId,
      date: params.date,
    })
    .eq('id', supaExpenseId)
  if (updErr) throw updErr

  // 2) replace splits (simplest & safe)
  await supabase.from('expense_splits').delete().eq('expense_id', supaExpenseId)
  const rows = params.splits.map((s) => ({
    expense_id: supaExpenseId,
    member_id: supaMembers[s.memberId],
    amount: s.amount,
    settled: !!s.settled,
  }))
  const { error: insErr } = await supabase.from('expense_splits').insert(rows)
  if (insErr) throw insErr
}

export async function settleExpenseRemote(params: {
  expense: SharedExpense
  group: Group
}) {
  const { expense, group } = params
  const map = await loadMap()

  let supaExpenseId = map.expenses[expense.id]

  // If we don't have a remote ID yet, create/ensure it first (upsert-ish)
  if (!supaExpenseId) {
    const { supaExpenseId: createdId } = await createExpenseRemote({
      group,
      description: expense.description,
      amount: expense.amount,
      paidByLocalId: expense.paidById,
      date: expense.date,
      splits: expense.splits,
    })
    await rememberExpenseId(expense.id, createdId)
    supaExpenseId = createdId
  }

  // 1) Mark the expense as settled
  const { error: updErr } = await supabase
    .from('shared_expenses')
    .update({ settled: true })
    .eq('id', supaExpenseId)
  if (updErr) throw updErr

  // 2) Mark all splits as settled
  const { error: splitErr } = await supabase
    .from('expense_splits')
    .update({ settled: true })
    .eq('expense_id', supaExpenseId)
  if (splitErr) throw splitErr
}

export async function rememberExpenseId(
  localExpenseId: string,
  supaExpenseId: string
) {
  const map = await loadMap()
  map.expenses[localExpenseId] = supaExpenseId
  await saveMap(map)
}

// Delete group from database
export async function deleteGroupRemote(groupId: string) {
  const map = await loadMap()
  const supaGroupId = map.groups[groupId]

  if (!supaGroupId) {
    console.warn('No remote group ID found for local group:', groupId)
    return
  }

  // First get all expense IDs for this group
  const { data: expenseIds, error: expenseIdsErr } = await supabase
    .from('shared_expenses')
    .select('id')
    .eq('group_id', supaGroupId)

  if (expenseIdsErr) throw expenseIdsErr

  // Delete expense splits first (foreign key constraint)
  if (expenseIds && expenseIds.length > 0) {
    const { error: splitsErr } = await supabase
      .from('expense_splits')
      .delete()
      .in(
        'expense_id',
        expenseIds.map((e) => e.id)
      )

    if (splitsErr) throw splitsErr
  }

  // Delete shared expenses
  const { error: expensesErr } = await supabase
    .from('shared_expenses')
    .delete()
    .eq('group_id', supaGroupId)

  if (expensesErr) throw expensesErr

  // Delete group members
  const { error: membersErr } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', supaGroupId)

  if (membersErr) throw membersErr

  // Delete group
  const { error: groupErr } = await supabase
    .from('groups')
    .delete()
    .eq('id', supaGroupId)

  if (groupErr) throw groupErr

  // Clean up mapping
  delete map.groups[groupId]
  await saveMap(map)
}

// Delete expense from database
export async function deleteExpenseRemote(expenseId: string) {
  const map = await loadMap()
  const supaExpenseId = map.expenses[expenseId]

  if (!supaExpenseId) {
    console.warn('No remote expense ID found for local expense:', expenseId)
    return
  }

  // Delete expense splits first
  const { error: splitsErr } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', supaExpenseId)

  if (splitsErr) throw splitsErr

  // Delete shared expense
  const { error: expenseErr } = await supabase
    .from('shared_expenses')
    .delete()
    .eq('id', supaExpenseId)

  if (expenseErr) throw expenseErr

  // Clean up mapping
  delete map.expenses[expenseId]
  await saveMap(map)
}

// Create group in database and return the mapping
export async function createGroupRemote(
  localGroupId: string,
  name: string,
  members: Array<{
    name: string
    email: string
    isCurrentUser: boolean
  }>
): Promise<string> {
  const map = await loadMap()

  // Create group
  const { data: auth } = await supabase.auth.getUser()
  const creatorId = auth.user?.id ?? null

  const { data: groupRow, error: groupErr } = await supabase
    .from('groups')
    .insert({ name, creator_id: creatorId })
    .select('id')
    .single()

  if (groupErr || !groupRow) {
    throw groupErr || new Error('Group creation failed')
  }

  // Create group members
  const membersPayload = members.map((member) => ({
    group_id: groupRow.id,
    name: member.name,
    email: member.email,
    is_current_user: member.isCurrentUser,
  }))

  const { error: membersErr } = await supabase
    .from('group_members')
    .insert(membersPayload)

  if (membersErr) {
    // Clean up group if members creation fails
    await supabase.from('groups').delete().eq('id', groupRow.id)
    throw membersErr
  }

  // Store mapping
  map.groups[localGroupId] = groupRow.id
  await saveMap(map)

  return groupRow.id
}
