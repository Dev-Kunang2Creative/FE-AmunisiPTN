import NextAuth, { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAuthApiHandler } from "@/http/auth/get-user";
import { loginApiHandler } from "@/http/auth/login";
import { User as Auth } from "@/types/user/user";
import { LoginType } from "@/validators/auth/login-validator";

declare module "next-auth" {
  interface User {
    id: string;
    token?: string;
    role?: string;
    refresh_token?: string;
    expires_in?: number;
  }

  interface Session {
    user: Auth;
    access_token: string;
    authError?: "TOKEN_INVALID" | "AUTH_UNAVAILABLE" | "REFRESH_TOKEN_ERROR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    error?: string;
    role?: string;
    userOverrides?: Partial<Auth>;
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL + "/auth/refresh";
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token.refresh_token}`,
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      access_token: refreshedTokens.token,
      refresh_token: refreshedTokens.refresh_token ?? token.refresh_token,
      expires_at: Date.now() + (refreshedTokens.expires_in || 3600) * 1000,
    };
  } catch (error) {
    console.error("[auth] Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days — matches backend token lifetime
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        token: { label: "Token", type: "text" },
        refresh_token: { label: "Refresh Token", type: "text" },
        expires_in: { label: "Expires In", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials) return null;

        try {
          // Google OAuth callback — token already obtained from BE
          if (credentials.token) {
            const auth = await getAuthApiHandler(credentials.token);

            return {
              id: auth.id,
              token: credentials.token,
              refresh_token: credentials.refresh_token || undefined,
              expires_in: credentials.expires_in
                ? Number(credentials.expires_in)
                : undefined,
              role: auth.role,
            };
          }

          const { email, password } = credentials as LoginType;

          if (!email || !password) return null;

          const res = await loginApiHandler({ email, password });

          if (!res?.user) return null;

          return {
            id: res.user.id,
            token: res.token,
            refresh_token: res.refresh_token,
            expires_in: res.expires_in,
            role: res.user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      // Intercept purely front-end fields on session update and store them in the JWT token.
      // Exclude server-managed fields (ticket_balance, id, role, email) so they always come
      // fresh from BE and are never frozen by an optimistic session update.
      if (trigger === "update" && session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ticket_balance, id, role, email, ...safeOverrides } =
          session.user as Auth & { ticket_balance?: number };
        token.userOverrides = {
          ...(token.userOverrides || {}),
          ...safeOverrides,
        };
      }

      if (trigger === "update" && session?.forceRefresh) {
        if (token.refresh_token) {
          return refreshAccessToken(token);
        }
      }

      if (user) {
        token.access_token = user.token;
        token.refresh_token = user.refresh_token;
        token.expires_at = user.expires_in
          ? Date.now() + user.expires_in * 1000
          : Date.now() + 3600 * 1000;
        token.sub = String(user.id);
        token.role = user.role;
      }

      // Refresh proactively 5 minutes before expiry to avoid mid-session logouts
      const BUFFER_MS = 5 * 60 * 1000;
      if (!token.expires_at || Date.now() < token.expires_at - BUFFER_MS) {
        return token;
      }

      if (token.refresh_token) {
        return refreshAccessToken(token);
      }

      return token;
    },
    session: async ({ session, token }) => {
      const access_token = token.access_token as string;

      try {
        const auth = await getAuthApiHandler(access_token);

        // Merge fresh backend data with any front-end only overrides (like province, city) we stored
        const overrides = token.userOverrides || {};
        const mergedUser = { ...auth, ...overrides };

        return { ...session, user: mergedUser, access_token };
      } catch (error: unknown) {
        // If BE returns 401 or is unreachable, return a degraded session
        // This prevents the entire app from crashing
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        let authError = status === 401 ? "TOKEN_INVALID" : "AUTH_UNAVAILABLE";
        if (token.error === "RefreshAccessTokenError") {
          authError = "REFRESH_TOKEN_ERROR";
        }
        const message = error instanceof Error ? error.message : String(error);
        console.warn("[auth] Failed to fetch user from BE:", message);

        const overrides = token.userOverrides || {};
        return {
          ...session,
          user: {
            id: token.sub || "",
            name: overrides?.name || session?.user?.name || "Amunisian",
            email: overrides?.email || session?.user?.email || "",
            role: overrides?.role || token.role || "user",
            ...overrides,
          } as Auth,
          access_token,
          authError,
        };
      }
    },
  },
};

const authHandler = NextAuth(authOptions);
export default authHandler;
