import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account, ID, OAuthProvider } from "@/lib/appwrite";
import { normalizeUsername, releaseUsername, reserveAutomaticUsername, reserveUsername } from "@/lib/usernames";

type AuthRole = "student" | "consultant";
type UniSporaPreferences = Models.Preferences & {
  role?: AuthRole;
};

type AuthContextValue = {
  user?: Models.User<UniSporaPreferences>;
  loading: boolean;
  login: (email: string, password: string) => Promise<Models.User<UniSporaPreferences>>;
  signup: (email: string, password: string, role: AuthRole) => Promise<Models.User<UniSporaPreferences>>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (userId: string, secret: string) => Promise<void>;
  signInWithGoogle: () => void;
  updateUsername: (name: string) => Promise<Models.User<UniSporaPreferences>>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<UniSporaPreferences>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    account.get()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser as Models.User<UniSporaPreferences>);
      })
      .catch(() => {
        if (!cancelled) setUser(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      setUser(currentUser);
      return currentUser;
    },
    async signup(email, password, role) {
      const reservedUsername = await reserveAutomaticUsername(email);
      try {
        await account.create({ userId: ID.unique(), email, password, name: reservedUsername });
      } catch (error) {
        releaseUsername(reservedUsername).catch(() => undefined);
        throw error;
      }
      await account.createEmailPasswordSession(email, password);
      await account.updatePrefs({ role });
      await account.createEmailVerification({ url: `${window.location.origin}/verify` });
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      setUser(currentUser);
      return currentUser;
    },
    async sendVerificationEmail() {
      await account.createEmailVerification({ url: `${window.location.origin}/verify` });
    },
    async verifyEmail(userId, secret) {
      await account.updateEmailVerification({ userId, secret });
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      setUser(currentUser);
    },
    signInWithGoogle() {
      account.createOAuth2Session({
        provider: OAuthProvider.Google,
        success: `${window.location.origin}/`,
        failure: `${window.location.origin}/login`,
        scopes: ["email", "profile"],
      });
    },
    async updateUsername(name) {
      const oldUsername = normalizeUsername(user?.name ?? "");
      const requestedUsername = normalizeUsername(name);
      if (oldUsername && oldUsername === requestedUsername) {
        const currentUser = await account.updateName(oldUsername);
        setUser(currentUser as Models.User<UniSporaPreferences>);
        return currentUser as Models.User<UniSporaPreferences>;
      }

      const newUsername = await reserveUsername(name, {
        email: user?.email,
        userId: user?.$id,
      });
      const currentUser = await account.updateName(newUsername);
      setUser(currentUser as Models.User<UniSporaPreferences>);
      if (oldUsername && oldUsername !== newUsername) {
        releaseUsername(oldUsername).catch(() => undefined);
      }
      return currentUser as Models.User<UniSporaPreferences>;
    },
    async logout() {
      await account.deleteSession("current");
      setUser(undefined);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
