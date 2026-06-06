import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account, ID } from "@/lib/appwrite";

type AuthRole = "student" | "consultant";
type UniSporaPreferences = Models.Preferences & {
  role?: AuthRole;
};

type AuthContextValue = {
  user?: Models.User<UniSporaPreferences>;
  loading: boolean;
  login: (email: string, password: string) => Promise<Models.User<UniSporaPreferences>>;
  signup: (email: string, password: string, role: AuthRole) => Promise<Models.User<UniSporaPreferences>>;
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
      await account.create(ID.unique(), email, password);
      await account.createEmailPasswordSession(email, password);
      await account.updatePrefs({ role });
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      setUser(currentUser);
      return currentUser;
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
