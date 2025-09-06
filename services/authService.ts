import { supabase } from '@/lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

WebBrowser.maybeCompleteAuthSession()

export class AuthService {
  static async signInWithEmail(email: string, password: string) {
    try {
      console.log('[AuthService] Starting email sign in for:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('[AuthService] Sign in response data:', data)
      console.log('[AuthService] Sign in response error:', error)

      if (error) {
        console.error('[AuthService] Sign in error:', error)

        // Provide better error messages for common issues
        if (error.message === 'Invalid login credentials') {
          throw new Error(
            'Invalid email or password. If you just signed up, please check your email and verify your account first.'
          )
        } else if (error.message === 'Email not confirmed') {
          throw new Error(
            'Please verify your email address before signing in. Check your inbox for a verification email.'
          )
        }

        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('[AuthService] Sign in error:', error)
      return { data: null, error }
    }
  }

  static async signUpWithEmail(email: string, password: string) {
    try {
      console.log('[AuthService] Starting email sign up for:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('[AuthService] Sign up response data:', data)
      console.log('[AuthService] Sign up response error:', error)

      if (error) {
        console.error('[AuthService] Sign up error:', error)
        throw error
      }

      // If signup successful and user exists, create profile and settings
      if (data.user) {
        console.log('[AuthService] Creating profile and settings for new user')
        try {
          const fullName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            null
          await this.createCompleteUserProfile(data.user.id, email, fullName)
          console.log('[AuthService] Profile and settings created successfully')
        } catch (profileError) {
          // Log the error but don't fail the signup process
          console.error(
            '[AuthService] Profile creation failed, but signup succeeded:',
            profileError
          )
          // You might want to store this in a queue for retry later
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('[AuthService] Sign up error:', error)
      return { data: null, error }
    }
  }

  static async signInWithGoogle() {
    try {
      console.log('[AuthService] Starting Google OAuth...')

      // Use Supabase's default OAuth flow without custom redirectTo
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Let Supabase handle the redirect automatically
          // This should work better for mobile apps
        },
      })

      console.log('[AuthService] OAuth response data:', data)
      console.log('[AuthService] OAuth response error:', error)

      if (error) {
        console.error('[AuthService] OAuth error:', error)
        throw error
      }

      if (!data?.url) {
        throw new Error('No OAuth URL received from Supabase')
      }

      console.log('[AuthService] Opening OAuth URL in browser:', data.url)

      // Open the OAuth URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        // Use a more stable redirect URL
        'https://nivmerakcbksfljhpdrw.supabase.co/auth/v1/callback'
      )

      console.log('[AuthService] Browser result:', result)

      if (result.type === 'success') {
        console.log('[AuthService] OAuth completed successfully')

        // Check if this is a new user and create profile if needed
        try {
          // Get the current user after OAuth
          const { user } = await this.getCurrentUser()
          if (user) {
            // Check if profile exists
            const profileCheck = await this.checkUserProfile(user.id)
            if (!profileCheck.exists) {
              console.log(
                '[AuthService] New Google user, creating profile and settings'
              )
              const fullName =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                null
              await this.createCompleteUserProfile(
                user.id,
                user.email || '',
                fullName
              )
              console.log(
                '[AuthService] Profile and settings created for Google user'
              )
            } else {
              console.log(
                '[AuthService] Existing Google user, profile already exists'
              )
            }
          }
        } catch (profileError) {
          // Log the error but don't fail the OAuth process
          console.error(
            '[AuthService] Profile creation failed for Google user:',
            profileError
          )
        }

        // The session should be automatically handled by Supabase
        return { data: result, error: null }
      } else if (result.type === 'cancel') {
        console.log('[AuthService] User cancelled OAuth')
        return {
          data: null,
          error: new Error('User cancelled authentication'),
        }
      } else {
        throw new Error('OAuth failed or was dismissed')
      }
    } catch (error) {
      console.error('[AuthService] Google OAuth error:', error)
      return { data: null, error }
    }
  }

  static async resetPassword(email: string) {
    try {
      console.log('[AuthService] Starting password reset for:', email)

      const { data, error } = await supabase.auth.resetPasswordForEmail(email)

      console.log('[AuthService] Password reset response data:', data)
      console.log('[AuthService] Password reset response error:', error)

      if (error) {
        console.error('[AuthService] Password reset error:', error)
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('[AuthService] Password reset error:', error)
      return { data: null, error }
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error
      return { user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Create user profile in profiles table
  static async createUserProfile(
    userId: string,
    email: string,
    fullName?: string
  ) {
    try {
      console.log('[AuthService] Creating user profile for:', userId)

      const { data, error } = await supabase.from('profiles').insert({
        id: userId, // Same as auth.users.id
        email: email,
        full_name: fullName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error('[AuthService] Profile creation error:', error)
        throw error
      }

      console.log('[AuthService] Profile created successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('[AuthService] Profile creation failed:', error)
      return { data: null, error }
    }
  }

  // Create user settings with defaults
  static async createUserSettings(userId: string) {
    try {
      console.log('[AuthService] Creating user settings for:', userId)

      const { data, error } = await supabase.from('user_settings').insert({
        user_id: userId,
        theme: 'light',
        currency: 'BDT',
        notifications: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.error('[AuthService] Settings creation error:', error)
        throw error
      }

      console.log('[AuthService] Settings created successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('[AuthService] Settings creation failed:', error)
      return { data: null, error }
    }
  }

  // Check if user profile exists
  static async checkUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw error
      }

      return { exists: !!data, error: null }
    } catch (error) {
      console.error('[AuthService] Profile check failed:', error)
      return { exists: false, error }
    }
  }

  // Create complete user profile (profile + settings)
  static async createCompleteUserProfile(
    userId: string,
    email: string,
    fullName?: string
  ) {
    try {
      console.log('[AuthService] Creating complete profile for:', userId)

      // Create profile
      const profileResult = await this.createUserProfile(
        userId,
        email,
        fullName
      )
      if (profileResult.error) {
        throw new Error(
          `Profile creation failed: ${
            profileResult.error instanceof Error
              ? profileResult.error.message
              : 'Unknown error'
          }`
        )
      }

      // Create settings
      const settingsResult = await this.createUserSettings(userId)
      if (settingsResult.error) {
        throw new Error(
          `Settings creation failed: ${
            settingsResult.error instanceof Error
              ? settingsResult.error.message
              : 'Unknown error'
          }`
        )
      }

      console.log('[AuthService] Complete profile created successfully')
      return { success: true, error: null }
    } catch (error) {
      console.error('[AuthService] Complete profile creation failed:', error)
      return { success: false, error }
    }
  }
}
