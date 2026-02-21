import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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
     * On first login, creates a Merchant account via the API and saves
     * the generated API key in the JWT so all dashboard requests can use it.
     */
    async jwt({ token, account, profile, trigger, session }) {
      // Helper to fresh fetch merchants
      const fetchMerchants = async (oauthId: string) => {
        try {
          console.log(`[Auth] Syncing merchants for oauthId: ${oauthId}`);
          const lookupRes = await fetch(
            `${API_BASE_URL}/v1/merchants/by-oauth/${encodeURIComponent(oauthId)}`,
            { headers: { "x-internal-secret": INTERNAL_SECRET! } },
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
            `[Auth] No merchants found. User must create first merchant manually.`,
          );
        }

        token.merchants = merchants.map(
          (m: {
            id: string;
            merchantId: string;
            name?: string;
            twoFactorEnabled?: boolean;
          }) => ({
            id: m.id,
            merchantId: m.merchantId,
            name: m.name || "Untitled Merchant",
          }),
        );
        if (merchants.length > 0) {
          if (!token.merchantId) token.merchantId = merchants[0].id;
          if (!token.publicMerchantId)
            token.publicMerchantId = merchants[0].merchantId;
          // Track if the active merchant requires 2FA
          const activeMerchant =
            merchants.find((m: { id: string }) => m.id === token.merchantId) ||
            merchants[0];
          token.twoFactorRequired = activeMerchant.twoFactorEnabled || false;
          token.twoFactorVerified = false; // Needs verification on fresh login
        }
      }

      // 2. Session Update (Triggered by client update())
      if (trigger === "update" && token.oauthId) {
        // Refresh list to pick up new creations
        const merchants = await fetchMerchants(token.oauthId as string);
        token.merchants = merchants.map((m: { id: string; name?: string }) => ({
          id: m.id,
          name: m.name || "Untitled Merchant",
        }));

        // Switch active ID if requested and valid
        if (session?.merchantId) {
          const isValid = merchants.find(
            (m: { id: string }) => m.id === session.merchantId,
          );
          if (isValid) token.merchantId = session.merchantId;
        } else {
          // No specific switch requested — check if current active merchant still exists
          const currentStillExists = merchants.find(
            (m: { id: string }) => m.id === token.merchantId,
          );
          if (!currentStillExists && merchants.length > 0) {
            // Active merchant was deleted — fall back to first remaining merchant
            token.merchantId = merchants[0].id;
            token.publicMerchantId = merchants[0].merchantId;
          } else if (currentStillExists) {
            token.publicMerchantId = currentStillExists.merchantId;
          } else if (merchants.length === 0) {
            token.merchantId = undefined;
            token.publicMerchantId = undefined;
          }
        }

        if (session?.apiKey) {
          token.apiKey = session.apiKey;
        }

        // Handle 2FA verification flag from client
        if (session?.twoFactorVerified === true) {
          token.twoFactorVerified = true;
        }

        // Refresh 2FA status from merchant data
        if (token.merchantId) {
          const activeMerchant = merchants.find(
            (m: { id: string; twoFactorEnabled?: boolean }) =>
              m.id === token.merchantId,
          );
          token.twoFactorRequired = activeMerchant?.twoFactorEnabled || false;
        }
      }

      return token;
    },

    /** Expose merchant data to the client session */
    async session({ session, token }) {
      session.user.merchantId = token.merchantId as string;
      // @ts-expect-error - Custom public ID field
      session.user.publicMerchantId = token.publicMerchantId as string;
      session.user.oauthId = token.oauthId as string;
      // @ts-expect-error - NextAuth session user type doesn't include merchants by default
      session.user.merchants = token.merchants || [];
      session.user.apiKey = token.apiKey as string;
      // @ts-expect-error - 2FA fields
      session.user.twoFactorRequired = token.twoFactorRequired || false;
      // @ts-expect-error - 2FA fields
      session.user.twoFactorVerified = token.twoFactorVerified || false;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
