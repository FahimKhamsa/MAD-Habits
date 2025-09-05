import { create } from "zustand";
import { BudgetCategory, Transaction } from "@/types";
import { BudgetService } from "@/services/budgetService";

interface BudgetState {
  // Data
  categories: BudgetCategory[];
  transactions: Transaction[];

  // Loading states
  loading: boolean;
  categoriesLoading: boolean;
  transactionsLoading: boolean;

  // Error states
  error: string | null;

  // User ID for operations
  userId: string | null;

  // Real-time subscriptions
  categoriesSubscription: any;
  transactionsSubscription: any;

  // Actions
  setUserId: (userId: string | null) => void;
  loadData: () => Promise<void>;

  // Category actions
  addCategory: (
    category: Omit<
      BudgetCategory,
      "id" | "userId" | "spent" | "createdAt" | "updatedAt"
    >
  ) => Promise<void>;
  updateCategory: (
    id: string,
    updates: Partial<BudgetCategory>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Transaction actions
  addTransaction: (
    transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Utility functions
  getCategoryById: (id: string) => BudgetCategory | undefined;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByDateRange: (
    startDate: string,
    endDate: string
  ) => Transaction[];
  getTotalSpentByCategory: (categoryId: string) => number;
  getTotalBudget: () => number;
  getTotalSpent: () => number;

  // Cleanup
  cleanup: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  // Initial state
  categories: [],
  transactions: [],
  loading: false,
  categoriesLoading: false,
  transactionsLoading: false,
  error: null,
  userId: null,
  categoriesSubscription: null,
  transactionsSubscription: null,

  // Set user ID and setup subscriptions
  setUserId: (userId: string | null) => {
    const state = get();

    // Cleanup existing subscriptions
    if (state.categoriesSubscription) {
      BudgetService.unsubscribe(state.categoriesSubscription);
    }
    if (state.transactionsSubscription) {
      BudgetService.unsubscribe(state.transactionsSubscription);
    }

    set({
      userId,
      categories: [],
      transactions: [],
      categoriesSubscription: null,
      transactionsSubscription: null,
      error: null,
    });

    if (userId) {
      // Setup real-time subscriptions
      const categoriesSubscription = BudgetService.subscribeToCategories(
        userId,
        (categories) => {
          console.log(
            "[BudgetStore] Categories updated via subscription:",
            categories.length
          );
          set({ categories });
        }
      );

      const transactionsSubscription = BudgetService.subscribeToTransactions(
        userId,
        (transactions) => {
          console.log(
            "[BudgetStore] Transactions updated via subscription:",
            transactions.length
          );
          set({ transactions });
        }
      );

      set({
        categoriesSubscription,
        transactionsSubscription,
      });

      // Load initial data
      get().loadData();
    }
  },

  // Load all data
  loadData: async () => {
    const { userId } = get();
    if (!userId) return;

    set({ loading: true, error: null });

    try {
      // Load categories and transactions in parallel
      const [categoriesResult, transactionsResult] = await Promise.all([
        BudgetService.getCategories(userId),
        BudgetService.getTransactions(userId),
      ]);

      if (categoriesResult.error) {
        throw new Error(`Failed to load categories: ${categoriesResult.error}`);
      }

      if (transactionsResult.error) {
        throw new Error(
          `Failed to load transactions: ${transactionsResult.error}`
        );
      }

      set({
        categories: categoriesResult.data,
        transactions: transactionsResult.data,
        loading: false,
        error: null,
      });

      console.log("[BudgetStore] Data loaded successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to load data:", error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load data",
      });
    }
  },

  // Category actions
  addCategory: async (categoryData) => {
    const { userId } = get();
    if (!userId) return;

    set({ categoriesLoading: true, error: null });

    try {
      const result = await BudgetService.createCategory(userId, categoryData);

      if (result.error) {
        throw new Error(`Failed to create category: ${result.error}`);
      }

      // Optimistically update the UI
      set((state) => ({
        categories: [result.data!, ...state.categories],
        categoriesLoading: false,
      }));

      console.log("[BudgetStore] Category added successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to add category:", error);
      set({
        categoriesLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to add category",
      });
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    set({ categoriesLoading: true, error: null });

    try {
      const result = await BudgetService.updateCategory(id, updates);

      if (result.error) {
        throw new Error(`Failed to update category: ${result.error}`);
      }

      // Optimistically update the UI
      set((state) => ({
        categories: state.categories.map((category) =>
          category.id === id ? result.data! : category
        ),
        categoriesLoading: false,
      }));

      console.log("[BudgetStore] Category updated successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to update category:", error);
      set({
        categoriesLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to update category",
      });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ categoriesLoading: true, error: null });

    try {
      const result = await BudgetService.deleteCategory(id);

      if (result.error) {
        throw new Error(`Failed to delete category: ${result.error}`);
      }

      // Optimistically update the UI
      set((state) => ({
        categories: state.categories.filter((category) => category.id !== id),
        transactions: state.transactions.filter(
          (transaction) => transaction.categoryId !== id
        ),
        categoriesLoading: false,
      }));

      console.log("[BudgetStore] Category deleted successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to delete category:", error);
      set({
        categoriesLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      });
      throw error;
    }
  },

  // Transaction actions
  addTransaction: async (transactionData) => {
    const { userId } = get();
    if (!userId) return;

    set({ transactionsLoading: true, error: null });

    try {
      const result = await BudgetService.createTransaction(
        userId,
        transactionData
      );

      if (result.error) {
        throw new Error(`Failed to create transaction: ${result.error}`);
      }

      // Optimistically update the UI
      set((state) => ({
        transactions: [result.data!, ...state.transactions],
        transactionsLoading: false,
      }));

      console.log("[BudgetStore] Transaction added successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to add transaction:", error);
      set({
        transactionsLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to add transaction",
      });
      throw error;
    }
  },

  updateTransaction: async (id, updates) => {
    set({ transactionsLoading: true, error: null });

    try {
      const result = await BudgetService.updateTransaction(id, updates);

      if (result.error) {
        throw new Error(`Failed to update transaction: ${result.error}`);
      }

      // Optimistically update the UI
      set((state) => ({
        transactions: state.transactions.map((transaction) =>
          transaction.id === id ? result.data! : transaction
        ),
        transactionsLoading: false,
      }));

      console.log("[BudgetStore] Transaction updated successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to update transaction:", error);
      set({
        transactionsLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update transaction",
      });
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    set({ transactionsLoading: true, error: null });

    try {
      const result = await BudgetService.deleteTransaction(id);

      if (result.error) {
        throw new Error(`Failed to delete transaction: ${result.error}`);
      }

      // Optimistically update the UI
      set((state) => ({
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== id
        ),
        transactionsLoading: false,
      }));

      console.log("[BudgetStore] Transaction deleted successfully");
    } catch (error) {
      console.error("[BudgetStore] Failed to delete transaction:", error);
      set({
        transactionsLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete transaction",
      });
      throw error;
    }
  },

  // Utility functions (these remain the same as they work with local state)
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

  // Cleanup subscriptions
  cleanup: () => {
    const state = get();

    if (state.categoriesSubscription) {
      BudgetService.unsubscribe(state.categoriesSubscription);
    }
    if (state.transactionsSubscription) {
      BudgetService.unsubscribe(state.transactionsSubscription);
    }

    set({
      categoriesSubscription: null,
      transactionsSubscription: null,
      categories: [],
      transactions: [],
      userId: null,
    });
  },
}));
