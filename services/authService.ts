import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export class AuthService {
  static async signInWithEmail(email: string, password: string) {
    try {
      console.log("[AuthService] Starting email sign in for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[AuthService] Sign in response data:", data);
      console.log("[AuthService] Sign in response error:", error);

      if (error) {
        console.error("[AuthService] Sign in error:", error);

        // Provide better error messages for common issues
        if (error.message === "Invalid login credentials") {
          throw new Error(
            "Invalid email or password. If you just signed up, please check your email and verify your account first."
          );
        } else if (error.message === "Email not confirmed") {
          throw new Error(
            "Please verify your email address before signing in. Check your inbox for a verification email."
          );
        }

        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("[AuthService] Sign in error:", error);
      return { data: null, error };
    }
  }

  static async signUpWithEmail(email: string, password: string) {
    try {
      console.log("[AuthService] Starting email sign up for:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("[AuthService] Sign up response data:", data);
      console.log("[AuthService] Sign up response error:", error);

      if (error) {
        console.error("[AuthService] Sign up error:", error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("[AuthService] Sign up error:", error);
      return { data: null, error };
    }
  }

  static async signInWithGoogle() {
    try {
      console.log("[AuthService] Starting Google OAuth...");

      // Use Supabase's default OAuth flow without custom redirectTo
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Let Supabase handle the redirect automatically
          // This should work better for mobile apps
        },
      });

      console.log("[AuthService] OAuth response data:", data);
      console.log("[AuthService] OAuth response error:", error);

      if (error) {
        console.error("[AuthService] OAuth error:", error);
        throw error;
      }

      if (!data?.url) {
        throw new Error("No OAuth URL received from Supabase");
      }

      console.log("[AuthService] Opening OAuth URL in browser:", data.url);

      // Open the OAuth URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        // Use a more stable redirect URL
        "https://nivmerakcbksfljhpdrw.supabase.co/auth/v1/callback"
      );

      console.log("[AuthService] Browser result:", result);

      if (result.type === "success") {
        console.log("[AuthService] OAuth completed successfully");
        // The session should be automatically handled by Supabase
        return { data: result, error: null };
      } else if (result.type === "cancel") {
        console.log("[AuthService] User cancelled OAuth");
        return {
          data: null,
          error: new Error("User cancelled authentication"),
        };
      } else {
        throw new Error("OAuth failed or was dismissed");
      }
    } catch (error) {
      console.error("[AuthService] Google OAuth error:", error);
      return { data: null, error };
    }
  }

  static async resetPassword(email: string) {
    try {
      console.log("[AuthService] Starting password reset for:", email);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      console.log("[AuthService] Password reset response data:", data);
      console.log("[AuthService] Password reset response error:", error);

      if (error) {
        console.error("[AuthService] Password reset error:", error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("[AuthService] Password reset error:", error);
      return { data: null, error };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}
