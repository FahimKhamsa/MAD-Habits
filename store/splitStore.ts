import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Group, GroupMember, SharedExpense, ExpenseSplit } from "@/types";
import { generateId } from "@/utils/helpers";

interface SplitState {
  groups: Group[];
  expenses: SharedExpense[];
  addGroup: (name: string, members: Omit<GroupMember, "id">[]) => string;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addMember: (groupId: string, member: Omit<GroupMember, "id">) => void;
  removeMember: (groupId: string, memberId: string) => void;
  addExpense: (
    expense: Omit<SharedExpense, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateExpense: (id: string, updates: Partial<SharedExpense>) => void;
  deleteExpense: (id: string) => void;
  settleExpense: (expenseId: string) => void;
  settleExpenseSplit: (expenseId: string, memberId: string) => void;
  getGroupById: (id: string) => Group | undefined;
  getExpensesByGroup: (groupId: string) => SharedExpense[];
  getBalances: (groupId: string) => { [memberId: string]: number };
}

export const useSplitStore = create<SplitState>()(
  persist(
    (set, get) => ({
      groups: [],
      expenses: [],

      addGroup: (name, members) => {
        const now = new Date().toISOString();
        const membersWithIds: GroupMember[] = members.map((member) => ({
          ...member,
          id: generateId(),
        }));

        const newGroup: Group = {
          id: generateId(),
          name,
          members: membersWithIds,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          groups: [...state.groups, newGroup],
        }));

        return newGroup.id;
      },

      updateGroup: (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, ...updates, updatedAt: new Date().toISOString() }
              : group
          ),
        }));
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
          expenses: state.expenses.filter((expense) => expense.groupId !== id),
        }));
      },

      addMember: (groupId, member) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                members: [...group.members, { ...member, id: generateId() }],
                updatedAt: new Date().toISOString(),
              };
            }
            return group;
          }),
        }));
      },

      removeMember: (groupId, memberId) => {
        set((state) => ({
          groups: state.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                members: group.members.filter(
                  (member) => member.id !== memberId
                ),
                updatedAt: new Date().toISOString(),
              };
            }
            return group;
          }),
        }));
      },

      addExpense: (expenseData) => {
        const now = new Date().toISOString();
        const newExpense: SharedExpense = {
          id: generateId(),
          ...expenseData,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          expenses: [...state.expenses, newExpense],
        }));
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id
              ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
              : expense
          ),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },

      settleExpense: (expenseId) => {
        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.id === expenseId) {
              return {
                ...expense,
                settled: true,
                splits: expense.splits.map((split) => ({
                  ...split,
                  settled: true,
                })),
                updatedAt: new Date().toISOString(),
              };
            }
            return expense;
          }),
        }));
      },

      settleExpenseSplit: (expenseId, memberId) => {
        set((state) => ({
          expenses: state.expenses.map((expense) => {
            if (expense.id === expenseId) {
              const updatedSplits = expense.splits.map((split) => {
                if (split.memberId === memberId) {
                  return { ...split, settled: true };
                }
                return split;
              });

              // Check if all splits are settled
              const allSettled = updatedSplits.every((split) => split.settled);

              return {
                ...expense,
                splits: updatedSplits,
                settled: allSettled,
                updatedAt: new Date().toISOString(),
              };
            }
            return expense;
          }),
        }));
      },

      getGroupById: (id) => {
        return get().groups.find((g) => g.id === id);
      },

      getExpensesByGroup: (groupId) => {
        return get().expenses.filter((e) => e.groupId === groupId);
      },

      getBalances: (groupId) => {
        const { expenses } = get();
        const groupExpenses = expenses.filter((e) => e.groupId === groupId);

        const balances: { [memberId: string]: number } = {};

        groupExpenses.forEach((expense) => {
          // Add amount to the person who paid
          balances[expense.paidById] =
            (balances[expense.paidById] || 0) + expense.amount;

          // Subtract amounts from people who owe
          expense.splits.forEach((split) => {
            if (!split.settled) {
              balances[split.memberId] =
                (balances[split.memberId] || 0) - split.amount;
            }
          });
        });

        return balances;
      },
    }),
    {
      name: "madhabits-split",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
