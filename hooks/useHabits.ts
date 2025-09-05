import { useEffect, useState } from 'react';
import { useHabitStore } from '@/store/habitStore';
import { supabase } from '@/lib/supabase';
import NetInfo from '@react-native-community/netinfo';

export const useHabits = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const store = useHabitStore();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        
        // If authenticated and we haven't synced recently, fetch habits
        if (session && (!store.lastSyncAt || shouldSync(store.lastSyncAt))) {
          await store.fetchHabits();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setIsAuthenticated(!!session);
        
        if (event === 'SIGNED_IN' && session) {
          // User just signed in, fetch their habits
          await store.fetchHabits();
        } else if (event === 'SIGNED_OUT') {
          // User signed out, could clear local data or keep for offline use
          // For now, we'll keep the data for offline functionality
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !store.isOnline;
      const isNowOnline = !!state.isConnected;
      
      store.setOnlineStatus(isNowOnline);
      
      // If we just came back online and user is authenticated, sync
      if (wasOffline && isNowOnline && isAuthenticated) {
        store.syncToCloud().catch(console.error);
      }
    });

    return unsubscribe;
  }, [isAuthenticated, store.isOnline]);

  // Helper function to determine if we should sync
  const shouldSync = (lastSyncAt: string): boolean => {
    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    return lastSync < fiveMinutesAgo;
  };

  // Auto-sync periodically when online and authenticated
  useEffect(() => {
    if (!isAuthenticated || !store.isOnline) return;

    const interval = setInterval(async () => {
      if (store.lastSyncAt && shouldSync(store.lastSyncAt)) {
        try {
          await store.syncToCloud();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, store.isOnline]);

  return {
    ...store,
    isAuthenticated,
    
    // Enhanced methods that handle auth state
    addHabit: async (habitData: Parameters<typeof store.addHabit>[0]) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to add habits');
      }
      return store.addHabit(habitData);
    },

    updateHabit: async (id: string, updates: Parameters<typeof store.updateHabit>[1]) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to update habits');
      }
      return store.updateHabit(id, updates);
    },

    deleteHabit: async (id: string) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to delete habits');
      }
      return store.deleteHabit(id);
    },

    toggleHabitCompletion: async (habitId: string, date: string, note?: string) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to toggle habit completion');
      }
      return store.toggleHabitCompletion(habitId, date, note);
    },
  };
};
      