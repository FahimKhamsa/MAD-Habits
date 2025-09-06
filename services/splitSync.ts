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

  if (!foundId) {
    throw new Error('Failed to create or find member')
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
    userId?: string
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

  // Create group members - use user UUID as the id
  const membersPayload = await Promise.all(
    members.map(async (member) => {
      let userId = member.userId

      // If no userId provided, look it up by email
      if (!userId && member.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', member.email)
          .single()
        userId = profile?.id
      }

      // If still no userId, use a generated ID (for local-only members)
      if (!userId) {
        userId = `local_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`
      }

      return {
        id: userId, // Use user UUID as the primary key
        group_id: groupRow.id,
        name: member.name,
        email: member.email,
        is_current_user: member.isCurrentUser,
      }
    })
  )

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

// Load groups for the current user from database
export async function loadUserGroups(): Promise<Group[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('User not authenticated')
  }

  // Get groups where the current user is a member
  const { data: groupMembers, error: membersError } = await supabase
    .from('group_members')
    .select(
      `
      group_id,
      groups!inner (
        id,
        name,
        creator_id,
        created_at,
        updated_at
      )
    `
    )
    .eq('id', auth.user.id) // Filter by current user's UUID

  if (membersError) {
    throw membersError
  }

  if (!groupMembers || groupMembers.length === 0) {
    return []
  }

  // Get all members for each group
  const groupIds = groupMembers.map((gm) => (gm.groups as any).id)
  const { data: allMembers, error: allMembersError } = await supabase
    .from('group_members')
    .select('id, group_id, name, email, is_current_user')
    .in('group_id', groupIds)

  if (allMembersError) {
    throw allMembersError
  }

  // Transform to Group objects
  const groups: Group[] = groupMembers.map((gm) => {
    const group = gm.groups as any
    const groupMembers =
      allMembers?.filter((m) => m.group_id === group.id) || []

    return {
      id: group.id,
      name: group.name,
      creatorId: group.creator_id,
      members: groupMembers.map((member) => ({
        id: member.id, // This is now the user UUID
        name: member.name,
        email: member.email,
        isCurrentUser: member.is_current_user,
      })),
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    }
  })

  return groups
}

// Get user profile by UUID
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}
