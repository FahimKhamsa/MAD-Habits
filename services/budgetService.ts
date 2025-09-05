import { supabase } from "@/lib/supabase";
import { BudgetCategory, Transaction } from "@/types";

export class BudgetService {
  // ==================== CATEGORY OPERATIONS ====================

  static async getCategories(userId: string) {
    try {
      console.log("[BudgetService] Fetching categories for user:", userId);

      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[BudgetService] Error fetching categories:", error);
        throw error;
      }

      // Map database fields to TypeScript interface
      const categories: BudgetCategory[] = data.map((item) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        icon: item.icon,
        color: item.color,
        limit: item.budget_limit,
        spent: item.spent || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      console.log(
        "[BudgetService] Categories fetched successfully:",
        categories.length
      );
      return { data: categories, error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to fetch categories:", error);
      return { data: [], error };
    }
  }

  static async createCategory(
    userId: string,
    categoryData: Omit<
      BudgetCategory,
      "id" | "userId" | "spent" | "createdAt" | "updatedAt"
    >
  ) {
    try {
      console.log("[BudgetService] Creating category for user:", userId);

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("budget_categories")
        .insert({
          user_id: userId,
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          budget_limit: categoryData.limit,
          spent: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error("[BudgetService] Error creating category:", error);
        throw error;
      }

      // Map database response to TypeScript interface
      const category: BudgetCategory = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        limit: data.budget_limit,
        spent: data.spent || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log(
        "[BudgetService] Category created successfully:",
        category.id
      );
      return { data: category, error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to create category:", error);
      return { data: null, error };
    }
  }

  static async updateCategory(
    categoryId: string,
    updates: Partial<BudgetCategory>
  ) {
    try {
      console.log("[BudgetService] Updating category:", categoryId);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map TypeScript fields to database fields
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.limit !== undefined) updateData.budget_limit = updates.limit;
      if (updates.spent !== undefined) updateData.spent = updates.spent;

      const { data, error } = await supabase
        .from("budget_categories")
        .update(updateData)
        .eq("id", categoryId)
        .select()
        .single();

      if (error) {
        console.error("[BudgetService] Error updating category:", error);
        throw error;
      }

      // Map database response to TypeScript interface
      const category: BudgetCategory = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        limit: data.budget_limit,
        spent: data.spent || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log("[BudgetService] Category updated successfully:", categoryId);
      return { data: category, error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to update category:", error);
      return { data: null, error };
    }
  }

  static async deleteCategory(categoryId: string) {
    try {
      console.log("[BudgetService] Deleting category:", categoryId);

      // First delete all transactions in this category
      const { error: transactionError } = await supabase
        .from("transactions")
        .delete()
        .eq("category_id", categoryId);

      if (transactionError) {
        console.error(
          "[BudgetService] Error deleting category transactions:",
          transactionError
        );
        throw transactionError;
      }

      // Then delete the category
      const { error } = await supabase
        .from("budget_categories")
        .delete()
        .eq("id", categoryId);

      if (error) {
        console.error("[BudgetService] Error deleting category:", error);
        throw error;
      }

      console.log("[BudgetService] Category deleted successfully:", categoryId);
      return { error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to delete category:", error);
      return { error };
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  static async getTransactions(userId: string) {
    try {
      console.log("[BudgetService] Fetching transactions for user:", userId);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) {
        console.error("[BudgetService] Error fetching transactions:", error);
        throw error;
      }

      // Map database fields to TypeScript interface
      const transactions: Transaction[] = data.map((item) => ({
        id: item.id,
        userId: item.user_id,
        categoryId: item.category_id,
        amount: item.amount,
        description: item.description,
        date: item.date,
        tags: item.tags || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      console.log(
        "[BudgetService] Transactions fetched successfully:",
        transactions.length
      );
      return { data: transactions, error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to fetch transactions:", error);
      return { data: [], error };
    }
  }

  static async createTransaction(
    userId: string,
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ) {
    try {
      console.log("[BudgetService] Creating transaction for user:", userId);

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          category_id: transactionData.categoryId,
          amount: transactionData.amount,
          description: transactionData.description,
          date: transactionData.date,
          tags: transactionData.tags || [],
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error("[BudgetService] Error creating transaction:", error);
        throw error;
      }

      // Update category spent amount
      await this.updateCategorySpent(
        transactionData.categoryId,
        transactionData.amount
      );

      // Map database response to TypeScript interface
      const transaction: Transaction = {
        id: data.id,
        userId: data.user_id,
        categoryId: data.category_id,
        amount: data.amount,
        description: data.description,
        date: data.date,
        tags: data.tags || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log(
        "[BudgetService] Transaction created successfully:",
        transaction.id
      );
      return { data: transaction, error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to create transaction:", error);
      return { data: null, error };
    }
  }

  static async updateTransaction(
    transactionId: string,
    updates: Partial<Transaction>
  ) {
    try {
      console.log("[BudgetService] Updating transaction:", transactionId);

      // Get the current transaction to calculate spent amount changes
      const { data: currentTransaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (!currentTransaction) {
        throw new Error("Transaction not found");
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map TypeScript fields to database fields
      if (updates.categoryId !== undefined)
        updateData.category_id = updates.categoryId;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", transactionId)
        .select()
        .single();

      if (error) {
        console.error("[BudgetService] Error updating transaction:", error);
        throw error;
      }

      // Update category spent amounts
      const oldAmount = currentTransaction.amount;
      const newAmount = updates.amount ?? oldAmount;
      const oldCategoryId = currentTransaction.category_id;
      const newCategoryId = updates.categoryId ?? oldCategoryId;

      if (oldCategoryId === newCategoryId) {
        // Same category, update the difference
        const amountDiff = newAmount - oldAmount;
        if (amountDiff !== 0) {
          await this.updateCategorySpent(oldCategoryId, amountDiff);
        }
      } else {
        // Different category, subtract from old and add to new
        await this.updateCategorySpent(oldCategoryId, -oldAmount);
        await this.updateCategorySpent(newCategoryId, newAmount);
      }

      // Map database response to TypeScript interface
      const transaction: Transaction = {
        id: data.id,
        userId: data.user_id,
        categoryId: data.category_id,
        amount: data.amount,
        description: data.description,
        date: data.date,
        tags: data.tags || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      console.log(
        "[BudgetService] Transaction updated successfully:",
        transactionId
      );
      return { data: transaction, error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to update transaction:", error);
      return { data: null, error };
    }
  }

  static async deleteTransaction(transactionId: string) {
    try {
      console.log("[BudgetService] Deleting transaction:", transactionId);

      // Get the transaction to update category spent amount
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

      if (error) {
        console.error("[BudgetService] Error deleting transaction:", error);
        throw error;
      }

      // Update category spent amount
      await this.updateCategorySpent(
        transaction.category_id,
        -transaction.amount
      );

      console.log(
        "[BudgetService] Transaction deleted successfully:",
        transactionId
      );
      return { error: null };
    } catch (error) {
      console.error("[BudgetService] Failed to delete transaction:", error);
      return { error };
    }
  }

  // ==================== HELPER METHODS ====================

  private static async updateCategorySpent(
    categoryId: string,
    amountChange: number
  ) {
    try {
      // Get current spent amount
      const { data: category } = await supabase
        .from("budget_categories")
        .select("spent")
        .eq("id", categoryId)
        .single();

      if (!category) {
        throw new Error("Category not found");
      }

      const newSpent = (category.spent || 0) + amountChange;

      // Update spent amount
      const { error } = await supabase
        .from("budget_categories")
        .update({
          spent: Math.max(0, newSpent), // Ensure spent doesn't go negative
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId);

      if (error) {
        throw error;
      }

      console.log(
        "[BudgetService] Category spent updated:",
        categoryId,
        "change:",
        amountChange
      );
    } catch (error) {
      console.error("[BudgetService] Failed to update category spent:", error);
      throw error;
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  static subscribeToCategories(
    userId: string,
    callback: (categories: BudgetCategory[]) => void
  ) {
    console.log(
      "[BudgetService] Setting up categories subscription for user:",
      userId
    );

    const subscription = supabase
      .channel("budget_categories_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budget_categories",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[BudgetService] Categories change detected:", payload);
          // Refetch all categories when changes occur
          const { data } = await this.getCategories(userId);
          callback(data);
        }
      )
      .subscribe();

    return subscription;
  }

  static subscribeToTransactions(
    userId: string,
    callback: (transactions: Transaction[]) => void
  ) {
    console.log(
      "[BudgetService] Setting up transactions subscription for user:",
      userId
    );

    const subscription = supabase
      .channel("transactions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log("[BudgetService] Transactions change detected:", payload);
          // Refetch all transactions when changes occur
          const { data } = await this.getTransactions(userId);
          callback(data);
        }
      )
      .subscribe();

    return subscription;
  }

  static unsubscribe(subscription: any) {
    if (subscription) {
      console.log("[BudgetService] Unsubscribing from real-time updates");
      supabase.removeChannel(subscription);
    }
  }
}
