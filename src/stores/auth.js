import { defineStore } from "pinia";
import { supabase } from "../supabase";
import { getBaseUrl } from "../utils";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    isLoading: false,
  }),
  getters: {
    isAdmin: (state) => state.profile?.role === "admin",
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async fetchUser() {
      this.isLoading = true;
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Session fetch error:", error);
          this.user = null;
          this.profile = null;
          return null;
        }
        this.user = session?.user || null;
        if (this.user) {
          await this.fetchProfile();
        } else {
          this.profile = null;
        }
        return this.user;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchProfile() {
      if (!this.user) {
        this.profile = null;
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", this.user.id)
        .maybeSingle();
      if (error) {
        console.error("Profile fetch error:", error);
        this.profile = null;
      } else {
        this.profile = data;
      }
    },

    async signInWithPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      this.user = data.user;
      await this.fetchProfile();
      return data;
    },

    async forgotPassword(email) {
      // Fixed: Proper template literal syntax
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getBaseUrl()}/update-password`,
      });
      if (error) throw error;
      return data;
    },

    async updatePassword(newPassword) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      // Sign out the user after password update to ensure they log in with new password
      await this.signOut();
    },

    async signUp(email, password, firstName, lastName, role) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
          },
          // Add email redirect URL for email confirmation
          // emailRedirectTo: `${window.location.origin}/login`,
          emailRedirectTo: `${getBaseUrl()}/confirm-email`,
        },
      });
      if (error) throw error;
      this.user = data.user;
      await this.fetchProfile();
      return data;
    },

    async signOut() {
      try {
        // Check if user is already signed out
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          // Only attempt to sign out if there's an active session
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        }
      } catch (error) {
        // If it's a session missing error, we can ignore it since the user is already signed out
        if (error.name !== "AuthSessionMissingError") {
          throw error;
        }
      } finally {
        // Always clear the local state regardless of API call success
        this.user = null;
        this.profile = null;
      }
    },
  },
});
