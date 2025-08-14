import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BudgetCategory, Transaction } from "@/types";
import { generateId } from "@/utils/helpers";

interface BudgetState {
  categories: BudgetCategory[];
  transactions: Transaction[];
  addCategory: (
    category: Omit<BudgetCategory, "id" | "spent" | "createdAt" | "updatedAt">
  ) => void;
  updateCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  deleteCategory: (id: string) => void;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getCategoryById: (id: string) => BudgetCategory | undefined;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByDateRange: (
    startDate: string,
    endDate: string
  ) => Transaction[];
  getTotalSpentByCategory: (categoryId: string) => number;
  getTotalBudget: () => number;
  getTotalSpent: () => number;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      categories: [],
      transactions: [],

      addCategory: (categoryData) => {
        const now = new Date().toISOString();
        const newCategory: BudgetCategory = {
          id: generateId(),
          ...categoryData,
          spent: 0,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id
              ? { ...category, ...updates, updatedAt: new Date().toISOString() }
              : category
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          // Optionally, also delete all transactions in this category
          transactions: state.transactions.filter(
            (transaction) => transaction.categoryId !== id
          ),
        }));
      },

      addTransaction: (transactionData) => {
        const now = new Date().toISOString();
        const newTransaction: Transaction = {
          id: generateId(),
          ...transactionData,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          // Update the spent amount for the category
          const updatedCategories = state.categories.map((category) => {
            if (category.id === transactionData.categoryId) {
              return {
                ...category,
                spent: category.spent + transactionData.amount,
                updatedAt: now,
              };
            }
            return category;
          });

          return {
            transactions: [...state.transactions, newTransaction],
            categories: updatedCategories,
          };
        });
      },

      updateTransaction: (id, updates) => {
        const { transactions, categories } = get();
        const transaction = transactions.find((t) => t.id === id);

        if (!transaction) return;

        const amountDiff =
          (updates.amount ?? transaction.amount) - transaction.amount;
        const categoryChanged =
          updates.categoryId && updates.categoryId !== transaction.categoryId;

        set((state) => {
          let updatedCategories = [...state.categories];

          // If amount changed, update the spent amount for the category
          if (amountDiff !== 0 || categoryChanged) {
            updatedCategories = updatedCategories.map((category) => {
              if (category.id === transaction.categoryId) {
                // Subtract the old amount if category changed or amount updated
                return {
                  ...category,
                  spent: category.spent - transaction.amount,
                  updatedAt: new Date().toISOString(),
                };
              }
              if (categoryChanged && category.id === updates.categoryId) {
                // Add the new amount to the new category
                return {
                  ...category,
                  spent:
                    category.spent + (updates.amount ?? transaction.amount),
                  updatedAt: new Date().toISOString(),
                };
              }
              if (!categoryChanged && category.id === transaction.categoryId) {
                // Add the difference to the same category
                return {
                  ...category,
                  spent: category.spent + amountDiff,
                  updatedAt: new Date().toISOString(),
                };
              }
              return category;
            });
          }

          return {
            transactions: state.transactions.map((t) =>
              t.id === id
                ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                : t
            ),
            categories: updatedCategories,
          };
        });
      },

      deleteTransaction: (id) => {
        const { transactions } = get();
        const transaction = transactions.find((t) => t.id === id);

        if (!transaction) return;

        set((state) => {
          // Update the spent amount for the category
          const updatedCategories = state.categories.map((category) => {
            if (category.id === transaction.categoryId) {
              return {
                ...category,
                spent: category.spent - transaction.amount,
                updatedAt: new Date().toISOString(),
              };
            }
            return category;
          });

          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            categories: updatedCategories,
          };
        });
      },

      getCategoryById: (id) => {
        return get().categories.find((c) => c.id === id);
      },

      getTransactionsByCategory: (categoryId) => {
        return get().transactions.filter((t) => t.categoryId === categoryId);
      },

      getTransactionsByDateRange: (startDate, endDate) => {
        return get().transactions.filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            transactionDate >= new Date(startDate) &&
            transactionDate <= new Date(endDate)
          );
        });
      },

      getTotalSpentByCategory: (categoryId) => {
        const category = get().categories.find((c) => c.id === categoryId);
        return category ? category.spent : 0;
      },

      getTotalBudget: () => {
        return get().categories.reduce(
          (total, category) => total + category.limit,
          0
        );
      },

      getTotalSpent: () => {
        return get().categories.reduce(
          (total, category) => total + category.spent,
          0
        );
      },
    }),
    {
      name: "madhabits-budget",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
