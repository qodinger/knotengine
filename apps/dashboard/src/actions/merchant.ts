"use server";

import { auth } from "@/auth";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

export async function createMerchant(name: string, logoUrl?: string) {
  const session = await auth();
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("knot_affiliate_id")?.value;

  if (!session?.user?.oauthId) {
    throw new Error("Unauthorized");
  }

  // Create new merchant via internal API call
  // We use the SECRET to authorize creating a merchant for this OAuth ID
  const response = await fetch(`${API_BASE_URL}/v1/merchants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET!,
    },
    body: JSON.stringify({
      name,
      logoUrl,
      oauthId: session.user.oauthId,
      referredBy: referralCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create merchant");
  }

  const data = await response.json();
  return data;
}
