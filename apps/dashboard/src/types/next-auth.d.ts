import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      merchantId?: string;
      apiKey?: string;
      oauthId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    merchantId?: string;
    apiKey?: string;
    oauthId?: string;
  }
}
