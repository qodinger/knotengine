import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

async function proxy(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rewrite /api/... to /...
  const path = req.nextUrl.pathname.replace(/^\/api/, "");
  const search = req.nextUrl.search;
  const targetUrl = `${API_BASE_URL}${path}${search}`;

  const headers = new Headers(req.headers);
  headers.set("x-oauth-id", session.user.oauthId as string);
  headers.set("x-internal-secret", INTERNAL_SECRET!);

  if (session.user.merchantId) {
    headers.set("x-merchant-id", session.user.merchantId);
  }

  // Clean up headers that might conflict or leak
  headers.delete("host");
  headers.delete("connection");
  headers.delete("cookie");
  // Remove API Key if client sent it (we use internal auth now)
  headers.delete("x-api-key");

  const init: RequestInit = {
    method: req.method,
    headers,
    // @ts-ignore - Required for passing body correctly in newer Node/Next versions
    duplex: "half",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    // Forward the body
    const blob = await req.blob();
    init.body = blob;
  }

  try {
    const backendRes = await fetch(targetUrl, init);

    // Stream the response back
    const data = await backendRes.blob();

    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: backendRes.headers,
    });
  } catch (err) {
    console.error("Proxy Error:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};
