import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const next = typeof body.next === "string" ? body.next : "/onboarding/profile";

        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        if (!clientId) {
            return NextResponse.json(
                {
                    code: "provider_disabled",
                    detail:
                        "Google sign-in is not configured yet. Please use your email and password, or set GOOGLE_CLIENT_ID in settings.",
                },
                { status: 400 },
            );
        }

        const origin =
            request.headers.get("origin") ||
            (process.env.NODE_ENV === "production"
                ? "https://legalex-psi.vercel.app"
                : "http://localhost:3000");

        const redirectUri = `${origin}/auth/callback`;
        const state = Buffer.from(JSON.stringify({ next })).toString("base64url");

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid email profile",
            access_type: "offline",
            prompt: "select_account",
            state,
        });

        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error("[auth/oauth] error:", error);
        return NextResponse.json(
            { code: "unexpected_failure", detail: "Could not initiate Google sign-in." },
            { status: 500 },
        );
    }
}
