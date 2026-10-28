import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account, getAppwriteEndpoint, getAppwriteProjectId, ID, OAuthProvider } from "@/lib/appwrite";
import { normalizeUsername, releaseUsername, reserveAutomaticUsername, reserveUsername } from "@/lib/usernames";
import { sendVerificationEmail as sendUniSporaVerificationEmail, verifyEmailToken } from "@/lib/verification";

type AuthRole = "student" | "consultant";
type UniSporaPreferences = Models.Preferences & {
  role?: AuthRole;
  fullName?: string;
  country?: string;
};

type AuthContextValue = {
  user?: Models.User<UniSporaPreferences>;
  loading: boolean;
  login: (email: string, password: string) => Promise<Models.User<UniSporaPreferences>>;
  signup: (email: string, password: string, role: AuthRole, fullName: string, country: string) => Promise<Models.User<UniSporaPreferences>>;
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
    // Remove credentials saved by the previous verification flow.
    window.sessionStorage.removeItem("unispora-pending-signup");

    loadCurrentUser()
      .then(async (currentUser) => {
        if (!currentUser) {
          if (!cancelled) setUser(undefined);
          return;
        }

        if (!currentUser.user.emailVerification && currentUser.session.provider === "email") {
          await account.deleteSession("current").catch(() => undefined);
          if (!cancelled) setUser(undefined);
          return;
        }

        const readyUser = await finalizeCurrentUser(currentUser.user as Models.User<UniSporaPreferences>, currentUser.session);
        if (!cancelled) setUser(readyUser);
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
      if (!currentUser.emailVerification) {
        try {
          await sendUniSporaVerificationEmail();
        } finally {
          await account.deleteSession("current");
          setUser(undefined);
        }
        throw new Error("Please verify your email first. We sent a new verification link.");
      }

      setUser(currentUser);
      return currentUser;
    },
    async signup(email, password, role, fullName, country) {
      if (!fullName.trim() || !country.trim()) throw new Error("Enter your name and country.");
      // Signup must not publish email addresses or create anonymous reservations.
      const accountId = ID.unique();
      const initialName = `user-${accountId}`.slice(0, 36);
      await account.create({ userId: accountId, email, password, name: initialName });
      await account.createEmailPasswordSession(email, password);
      try {
        await account.updatePrefs({ prefs: { role, fullName: fullName.trim(), country: country.trim() } });
        const currentUser = await account.get() as Models.User<UniSporaPreferences>;
        try {
          await sendUniSporaVerificationEmail();
        } catch {
          throw new Error("Your account was created, but the verification email could not be sent. Try logging in to request a new link.");
        }
        return currentUser;
      } finally {
        await account.deleteSession("current");
        setUser(undefined);
      }
    },
    async sendVerificationEmail() {
      await sendUniSporaVerificationEmail();
    },
    async verifyEmail(userId, secret) {
      await verifyEmailToken(userId, secret);
    },
    signInWithGoogle() {
      window.location.href = getOAuthUrl({
        provider: OAuthProvider.Google,
        success: `${window.location.origin}/login?oauth=success`,
        failure: `${window.location.origin}/login?oauth=failed`,
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

      const newUsername = await reserveUsername(name);
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

async function loadCurrentUser() {
  const [user, session] = await Promise.all([
    account.get(),
    account.getSession("current"),
  ]);

  return {
    user: user as Models.User<UniSporaPreferences>,
    session,
  };
}

async function finalizeCurrentUser(currentUser: Models.User<UniSporaPreferences>, session: Models.Session) {
  if (session.provider !== "google") return currentUser;

  const normalizedName = normalizeUsername(currentUser.name);
  if (normalizedName && normalizedName === currentUser.name) return currentUser;

  try {
    const username = await reserveAutomaticUsername(currentUser.email);
    return await account.updateName(username) as Models.User<UniSporaPreferences>;
  } catch {
    return currentUser;
  }
}

function getOAuthUrl({
  provider,
  success,
  failure,
  scopes,
}: {
  provider: OAuthProvider;
  success: string;
  failure: string;
  scopes: string[];
}) {
  const endpoint = getAppwriteEndpoint().replace(/\/$/, "");
  const url = new URL(`${endpoint}/account/sessions/oauth2/${provider}`);

  url.searchParams.set("project", getAppwriteProjectId());
  url.searchParams.set("success", success);
  url.searchParams.set("failure", failure);
  scopes.forEach((scope) => url.searchParams.append("scopes[]", scope));

  return url.toString();
}
