import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account, ID, OAuthProvider } from "@/lib/appwrite";
import { normalizeUsername, releaseUsername, reserveAutomaticUsername, reserveUsername } from "@/lib/usernames";
import { sendVerificationEmail as sendUniSporaVerificationEmail, verifyEmailToken } from "@/lib/verification";

type AuthRole = "student" | "consultant";
type UniSporaPreferences = Models.Preferences & {
  role?: AuthRole;
};

type PendingSignup = {
  email: string;
  password: string;
  role: AuthRole;
  expiresAt: number;
};

type AuthContextValue = {
  user?: Models.User<UniSporaPreferences>;
  loading: boolean;
  login: (email: string, password: string) => Promise<Models.User<UniSporaPreferences>>;
  signup: (email: string, password: string, role: AuthRole) => Promise<Models.User<UniSporaPreferences>>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<Models.User<UniSporaPreferences> | undefined>;
  signInWithGoogle: () => void;
  updateUsername: (name: string) => Promise<Models.User<UniSporaPreferences>>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const pendingSignupKey = "unispora-pending-signup";
const pendingSignupTtl = 1000 * 60 * 60 * 24;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<UniSporaPreferences>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

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
        await sendUniSporaVerificationEmail(currentUser.$id, currentUser.email);
        savePendingSignup({
          email,
          password,
          role: currentUser.prefs?.role ?? "student",
          expiresAt: Date.now() + pendingSignupTtl,
        });
        await account.deleteSession("current");
        setUser(undefined);
        throw new Error("Please verify your email first. We sent a new verification link.");
      }

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
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      await sendUniSporaVerificationEmail(currentUser.$id, currentUser.email);
      savePendingSignup({
        email,
        password,
        role,
        expiresAt: Date.now() + pendingSignupTtl,
      });
      await account.deleteSession("current");
      setUser(undefined);
      return currentUser;
    },
    async sendVerificationEmail() {
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      await sendUniSporaVerificationEmail(currentUser.$id, currentUser.email);
    },
    async verifyEmail(token) {
      await verifyEmailToken(token);
      const tokenEmail = readTokenEmail(token);
      const pendingSignup = getPendingSignup();
      if (!pendingSignup || pendingSignup.email.toLowerCase() !== tokenEmail?.toLowerCase()) {
        setUser(undefined);
        return undefined;
      }

      await account.deleteSession("current").catch(() => undefined);
      await account.createEmailPasswordSession(pendingSignup.email, pendingSignup.password);
      await account.updatePrefs({ role: pendingSignup.role }).catch(() => undefined);
      const currentUser = await account.get() as Models.User<UniSporaPreferences>;
      clearPendingSignup();
      setUser(currentUser);
      return currentUser;
    },
    signInWithGoogle() {
      account.createOAuth2Session({
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
    const username = await reserveAutomaticUsername(currentUser.email, {
      email: currentUser.email,
      userId: currentUser.$id,
    });
    return await account.updateName(username) as Models.User<UniSporaPreferences>;
  } catch {
    return currentUser;
  }
}

function savePendingSignup(signup: PendingSignup) {
  window.sessionStorage.setItem(pendingSignupKey, JSON.stringify(signup));
}

function getPendingSignup() {
  try {
    const stored = window.sessionStorage.getItem(pendingSignupKey);
    if (!stored) return undefined;

    const pendingSignup = JSON.parse(stored) as PendingSignup;
    if (!pendingSignup.email || !pendingSignup.password || pendingSignup.expiresAt < Date.now()) {
      clearPendingSignup();
      return undefined;
    }

    return pendingSignup;
  } catch {
    clearPendingSignup();
    return undefined;
  }
}

function clearPendingSignup() {
  window.sessionStorage.removeItem(pendingSignupKey);
}

function readTokenEmail(token: string) {
  try {
    const [body] = token.split(".");
    if (!body) return undefined;

    const payload = JSON.parse(atob(toBase64(body))) as { email?: string };
    return payload.email;
  } catch {
    return undefined;
  }
}

function toBase64(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return padded.replace(/-/g, "+").replace(/_/g, "/");
}
