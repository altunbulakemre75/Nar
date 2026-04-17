import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { track } from "./analytics";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;      // oturum ilk kez yüklendi mi
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  restoreSession: () => Promise<void>;

  clearError: () => void;
}

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-posta veya Şifre hatalı";
  if (m.includes("user already registered")) return "Bu e-posta ile zaten hesap var";
  if (m.includes("email not confirmed")) return "E-postanı onaylamalısın";
  if (m.includes("password should be at least")) return "Şifre en az 8 karakter olmalı";
  if (m.includes("unable to validate email address")) return "Geçerli bir e-posta gir";
  if (m.includes("network")) return "İnternet bağlantını kontrol et";
  return message;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
      track("login");
    } catch (e: any) {
      set({ loading: false, error: translateError(e.message ?? "Bilinmeyen hata") });
      throw e;
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
      track("signup");
    } catch (e: any) {
      set({ loading: false, error: translateError(e.message ?? "Bilinmeyen hata") });
      throw e;
    }
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, loading: false, error: null });
    track("logout");
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ loading: false });
    } catch (e: any) {
      set({ loading: false, error: translateError(e.message ?? "Bilinmeyen hata") });
      throw e;
    }
  },

  restoreSession: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      initialized: true,
    });
  },

  clearError: () => set({ error: null }),
}));

// Oturum değişikliklerini dinle - uygulama içinde her yerde reaktif kalsın
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({
    session,
    user: session?.user ?? null,
  });
});
