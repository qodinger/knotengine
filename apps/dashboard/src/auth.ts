import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  // Enable debug logs to see exact session failure reasons
  debug: process.env.NODE_ENV === "development",

  // Explicitly set secret to ensure middleware can always decode the JWT
  secret: process.env.AUTH_SECRET,

  callbacks: {
    /**
     * Called after a successful OAuth sign-in.
     * On first login, creates a Merchant account via the API and stores
     * the generated API key in the JWT so all dashboard requests can use it.
     */
    async jwt({ token, account, profile, trigger, session }) {
      // Helper to fresh fetch merchants
      const fetchMerchants = async (oauthId: string) => {
        try {
          console.log(`[Auth] Syncing merchants for oauthId: ${oauthId}`);
          const lookupRes = await fetch(
            `${API_BASE_URL}/v1/merchants/by-oauth/${encodeURIComponent(oauthId)}`,
            { headers: { "x-internal-secret": process.env.INTERNAL_SECRET! } },
          );
          if (lookupRes.ok) return await lookupRes.json();
          if (lookupRes.status === 404) return [];
        } catch (e) {
          console.error("Fetch merchants failed", e);
        }
        return [];
      };

      // 1. Initial Login
      if (account && profile) {
        const oauthId = `${account.provider}:${account.providerAccountId}`;
        token.oauthId = oauthId;

        const merchants = await fetchMerchants(oauthId);

        if (merchants.length === 0) {
          console.log(
            `[Auth] No merchants found. User must create first store manually.`,
          );
        }

        token.merchants = merchants.map((m: { id: string; name?: string }) => ({
          id: m.id,
          name: m.name || "Untitled App",
        }));
        if (merchants.length > 0) token.merchantId = merchants[0].id;
      }

      // 2. Session Update (Triggered by client update())
      if (trigger === "update" && token.oauthId) {
        // Refresh list to pick up new creations
        const merchants = await fetchMerchants(token.oauthId as string);
        token.merchants = merchants.map((m: { id: string; name?: string }) => ({
          id: m.id,
          name: m.name || "Untitled App",
        }));

        // Switch active ID if requested and valid
        if (session?.merchantId) {
          const isValid = merchants.find(
            (m: { id: string }) => m.id === session.merchantId,
          );
          if (isValid) token.merchantId = session.merchantId;
        }
      }

      return token;
    },

    /** Expose merchant data to the client session */
    async session({ session, token }) {
      session.user.merchantId = token.merchantId as string;
      session.user.oauthId = token.oauthId as string;
      // @ts-expect-error - NextAuth session user type doesn't include merchants by default
      session.user.merchants = token.merchants || [];
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
