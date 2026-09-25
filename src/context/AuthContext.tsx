import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    nome: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProfile = React.useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Erro ao carregar perfil:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? traduzirErroAuth(error.message) : null };
  };

  const signUp: AuthContextValue["signUp"] = async (email, password, nome) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    return { error: error ? traduzirErroAuth(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sendPasswordReset: AuthContextValue["sendPasswordReset"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // BASE_URL já contém a barra inicial e final (ex.: "/" na Vercel,
      // "/projeto-elo/" no GitHub Pages), então basta concatenar.
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}redefinir-senha`,
    });
    return { error: error ? traduzirErroAuth(error.message) : null };
  };

  const updatePassword: AuthContextValue["updatePassword"] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? traduzirErroAuth(error.message) : null };
  };

  const refreshProfile = React.useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isAdmin: profile?.perfil === "administrador",
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}

function traduzirErroAuth(message: string): string {
  const mapa: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha inválidos.",
    "User already registered": "Este e-mail já está cadastrado.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
    "For security purposes, you can only request this after 60 seconds":
      "Por segurança, aguarde 60 segundos antes de tentar novamente.",
  };
  return mapa[message] ?? message;
}
