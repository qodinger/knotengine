"use server";

import { auth } from "@/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

/**
 * Uploads a base64 image to Cloudinary via the API upload endpoint.
 * Returns the secure Cloudinary URL, or undefined if no image provided.
 */
export async function uploadLogo(
  base64Image: string,
  merchantId?: string,
): Promise<string | undefined> {
  if (!base64Image || !base64Image.startsWith("data:image")) {
    return undefined;
  }

  const session = await auth();
  if (!session?.user?.oauthId) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${API_BASE_URL}/v1/upload/logo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-oauth-id": session.user.oauthId,
      "x-internal-secret": INTERNAL_SECRET!,
    },
    body: JSON.stringify({
      image: base64Image,
      merchantId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload logo");
  }

  const data = await response.json();
  return data.url as string;
}
