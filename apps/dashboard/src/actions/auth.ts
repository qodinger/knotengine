"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050";

export async function requestMagicLink(email: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/auth/magic-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json();
      const errorMessage = data.details
        ? `${data.error}: ${data.details}`
        : data.error || "Failed to send magic link";
      throw new Error(errorMessage);
    }

    return { success: true };
  } catch (error) {
    console.error("[Auth Action] Magic link request failed:", error);
    throw error;
  }
}
