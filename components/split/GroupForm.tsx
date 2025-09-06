import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Group, GroupMember } from '@/types'
import { colors } from '@/constants/colors'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useSplitStore } from '@/store/splitStore'
import { supabase } from '@/lib/supabase'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile } from '@/services/splitSync'

interface GroupFormProps {
  group?: Group
  onComplete?: (groupId: string) => void
}

type MemberDraft = {
  email: string
  isCurrentUser?: boolean
  name?: string // resolved from profiles
  userId?: string // profiles.id / auth.users.id
}

export const GroupForm: React.FC<GroupFormProps> = ({ group, onComplete }) => {
  const router = useRouter()
  const { addGroup, updateGroup, addMember, removeMember } = useSplitStore()
  const { user } = useAuth()

  const [name, setName] = useState(group?.name || '')

  // ★ Members now stored as emails; we’ll resolve name/userId from profiles
  const [members, setMembers] = useState<MemberDraft[]>(
    group
      ? group.members.map((m) => ({
          email: m.email ?? '',
          isCurrentUser: m.isCurrentUser,
          name: m.name,
          // userId: ??? (not present in your GroupMember type)
        }))
      : [{ email: '', isCurrentUser: true }] // we’ll hydrate current user from Supabase below
  )

  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ★ Hydrate current user's email/name from profiles table
  useEffect(() => {
    if (group || !user) return

    const hydrateCurrentUser = async () => {
      try {
        // First try to get name from profiles table
        const profile = await getUserProfile(user.id)
        const userEmail = user.email || ''
        const userName =
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          'You'

        setMembers((prev) => {
          const idx = prev.findIndex((m) => m.isCurrentUser)
          if (idx === -1) {
            return [
              {
                email: userEmail,
                isCurrentUser: true,
                name: userName,
                userId: user.id,
              },
              ...prev,
            ]
          }
          const copy = [...prev]
          copy[idx] = {
            ...copy[idx],
            email: userEmail,
            name: userName,
            userId: user.id,
          }
          return copy
        })
      } catch (error) {
        console.error('Error fetching user profile:', error)
        // Fallback to auth metadata
        const userEmail = user.email || ''
        const userName =
          user.user_metadata?.full_name || user.user_metadata?.name || 'You'

        setMembers((prev) => {
          const idx = prev.findIndex((m) => m.isCurrentUser)
          if (idx === -1) {
            return [
              {
                email: userEmail,
                isCurrentUser: true,
                name: userName,
                userId: user.id,
              },
              ...prev,
            ]
          }
          const copy = [...prev]
          copy[idx] = {
            ...copy[idx],
            email: userEmail,
            name: userName,
            userId: user.id,
          }
          return copy
        })
      }
    }

    hydrateCurrentUser()
  }, [group, user])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Group name is required'

    const count = members.length
    if (count < 2) newErrors.members = 'Add at least one more member email'

    // basic email check - skip current user if they don't have an email yet
    members.forEach((m, i) => {
      if (m.isCurrentUser && !m.email) {
        // Current user without email - this is OK, they'll be hydrated
        return
      }
      if (!m.email || !/^\S+@\S+\.\S+$/.test(m.email)) {
        newErrors[`member_${i}`] = 'Enter a valid email'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ★ Resolve a single email against profiles
  const lookupProfileByEmail = async (email: string) => {
    // normalize/trim
    const value = email.trim().toLowerCase()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', value)
      .maybeSingle()

    if (error) {
      // Surface RLS or other failures
      console.error('Profile lookup error:', error)
      throw new Error(error.message || 'Profile lookup failed')
    }
    return data // null if not found
  }

  // ★ Add a member by email (must exist in profiles)
  const addNewMember = async () => {
    const email = newMemberEmail.trim().toLowerCase()

    if (!email) {
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErrors((e) => ({ ...e, addEmail: 'Enter a valid email' }))
      return
    }

    try {
      const profile = await lookupProfileByEmail(email)

      if (!profile) {
        Alert.alert('Not found', 'No user with this email exists.')
        return
      }

      // Prevent duplicates
      if (members.some((m) => m.email.toLowerCase() === email)) {
        Alert.alert('Duplicate', 'This email is already in the list.')
        return
      }

      setMembers((prev) => [
        ...prev,
        {
          email: profile.email ?? email,
          name: profile.full_name ?? email,
          userId: profile.id,
          isCurrentUser: false,
        },
      ])
      setNewMemberEmail('')
      setErrors((e) => {
        const { addEmail, ...rest } = e
        return rest
      })
    } catch (err) {
      console.error('lookup error', err)
      Alert.alert('Error', 'Could not verify user email. Try again.')
    }
  }

  const removeMemberByIndex = (index: number) => {
    if (members[index]?.isCurrentUser) return // Don’t remove current user
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      if (group) {
        // Update name locally for existing group
        updateGroup(group.id, { name })
        // You could also update Supabase groups.name here if you want:
        // await supabase.from('groups').update({ name }).eq('id', <supa_group_id>)
      } else {
        // 1) All members must exist in profiles (we already checked per-add, but re-validate here)
        //    Also fill in display names
        const resolvedMembers: MemberDraft[] = []
        for (const m of members) {
          // Handle current user specially - they might not have an email yet
          if (m.isCurrentUser && !m.email) {
            // Get current user info from auth context
            if (!user) {
              throw new Error('Current user not authenticated')
            }

            const userEmail = user.email || ''
            // Try to get name from profiles table first
            const profile = await getUserProfile(user.id)
            const userName =
              profile?.full_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              'You'

            resolvedMembers.push({
              email: userEmail,
              isCurrentUser: true,
              name: userName,
              userId: user.id,
            })
            continue
          }

          // re-lookup if userId missing (e.g., someone typed current-user email manually)
          let userId = m.userId
          let dispName = m.name
          if (!userId) {
            const profile = await lookupProfileByEmail(m.email.toLowerCase())
            if (!profile) {
              throw new Error(`No user with email ${m.email}`)
            }
            userId = profile.id
            dispName = dispName ?? profile.full_name ?? m.email
          }
          resolvedMembers.push({
            email: m.email,
            isCurrentUser: !!m.isCurrentUser,
            name: dispName ?? m.email,
            userId,
          })
        }

        // 2) Add to local store (this will also sync to database)
        //    We must map back to your local GroupMember shape (needs name)
        const localMembers = resolvedMembers.map((m) => ({
          name: m.name ?? m.email,
          email: m.email,
          isCurrentUser: !!m.isCurrentUser,
        }))
        const localGroupId = await addGroup(name, localMembers)

        onComplete ? onComplete(localGroupId) : router.back()
      }
    } catch (error) {
      console.error('Error saving group:', error)
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create group'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Input
        label='Group Name'
        value={name}
        onChangeText={setName}
        placeholder='e.g., Roommates'
        error={errors.name}
      />

      <Text style={styles.label}>Members</Text>

      <View style={styles.membersContainer}>
        {members.map((member, index) => (
          <View key={index} style={styles.memberItem}>
            <View
              style={[
                styles.memberAvatar,
                { backgroundColor: getMemberColor(index) },
              ]}
            >
              <Text style={styles.memberInitial}>
                {(member.name ?? member.email ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>
                {member.name ?? member.email}{' '}
                {member.isCurrentUser ? '(You)' : ''}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {member.email}
              </Text>
              {errors[`member_${index}`] ? (
                <Text style={[styles.errorText, { marginTop: 4 }]}>
                  {errors[`member_${index}`]}
                </Text>
              ) : null}
            </View>
            {!member.isCurrentUser && (
              <TouchableOpacity
                style={styles.removeMemberButton}
                onPress={() => removeMemberByIndex(index)}
                activeOpacity={0.7}
              >
                <Feather name='x' size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.addMemberContainer}>
        <Input
          placeholder='Add member email'
          value={newMemberEmail}
          onChangeText={(t) => {
            setNewMemberEmail(t)
            if (errors.addEmail)
              setErrors((e) => {
                const { addEmail, ...rest } = e
                return rest
              })
          }}
          containerStyle={styles.addMemberInput}
          keyboardType='email-address'
          autoCapitalize='none'
        />
        <Button
          title='Add'
          onPress={addNewMember}
          disabled={!newMemberEmail.trim()}
          size='small'
        />
      </View>

      {errors.members && <Text style={styles.errorText}>{errors.members}</Text>}

      <View style={styles.buttonContainer}>
        <Button
          title='Cancel'
          variant='outline'
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={group ? 'Update Group' : 'Create Group'}
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.button}
        />
      </View>
    </ScrollView>
  )
}

const getMemberColor = (index: number): string => {
  const colorsArr = [
    '#6366f1',
    '#f97316',
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
  ]
  return colorsArr[index % colorsArr.length]
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
  membersContainer: { marginBottom: 16 },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: { color: 'white', fontWeight: '600', fontSize: 16 },
  memberName: { flex: 1, fontSize: 16, color: colors.text },
  removeMemberButton: { padding: 8 },
  addMemberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addMemberInput: { flex: 1, marginRight: 8, marginBottom: 0 },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  button: { flex: 1, marginHorizontal: 4 },
})

export default GroupForm
