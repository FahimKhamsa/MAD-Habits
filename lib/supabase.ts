import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log("[Supabase] URL:", supabaseUrl);
console.log(
  "[Supabase] Anon Key:",
  supabaseAnonKey ? "✓ Present" : "✗ Missing"
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Add auth state debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log("[Supabase] Auth event:", event);
  console.log("[Supabase] Session:", session ? "✓ Present" : "✗ None");
  if (session?.user) {
    console.log("[Supabase] User ID:", session.user.id);
    console.log("[Supabase] User email:", session.user.email);
  }
});
