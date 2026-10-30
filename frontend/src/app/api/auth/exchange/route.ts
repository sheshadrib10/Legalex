import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "node:crypto";
import {
    createAuthCookieHeader,
    createSessionToken,
    getDbPool,
} from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const code = typeof body.code === "string" ? body.code.trim() : "";

        if (!code) {
            return NextResponse.json(
                { code: "invalid_request", detail: "Authorization code is required." },
                { status: 400 },
            );
        }

        const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { code: "provider_disabled", detail: "Google sign-in credentials are not configured." },
                { status: 400 },
            );
        }

        const origin =
            request.headers.get("origin") ||
            (process.env.NODE_ENV === "production"
                ? "https://legalex-psi.vercel.app"
                : "http://localhost:3000");
        const redirectUri = `${origin}/auth/callback`;

        // Exchange code with Google token endpoint
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            console.error("[auth/exchange] Google token exchange error:", err);
            return NextResponse.json(
                { code: "exchange_failed", detail: "Failed to verify Google sign-in." },
                { status: 400 },
            );
        }

        const tokens = (await tokenResponse.json()) as { access_token: string };

        // Fetch user profile from Google
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoRes.ok) {
            return NextResponse.json(
                { code: "exchange_failed", detail: "Failed to retrieve Google profile." },
                { status: 400 },
            );
        }

        const profile = (await userInfoRes.json()) as {
            email?: string;
            name?: string;
            picture?: string;
        };

        const email = profile.email?.trim().toLowerCase();
        if (!email) {
            return NextResponse.json(
                { code: "exchange_failed", detail: "Google account did not provide an email." },
                { status: 400 },
            );
        }

        const pool = getDbPool();

        // Check if user exists
        let userResult = await pool.query(
            "SELECT id, email FROM auth.users WHERE lower(email) = $1",
            [email],
        );

        let userId: string;
        if (userResult.rows.length === 0) {
            userId = randomUUID();
            await pool.query(
                `INSERT INTO auth.users (
                    id, email, encrypted_password, email_confirmed_at, role,
                    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
                ) VALUES (
                    $1, $2, '', now(), 'authenticated',
                    '{"provider": "google", "providers": ["google"]}',
                    $3, now(), now()
                )`,
                [userId, email, JSON.stringify({ display_name: profile.name || "", avatar_url: profile.picture || "" })],
            );

            // Provision initial wallet
            const virtualApiKey = `vak_${randomBytes(24).toString("hex")}`;
            await pool.query(
                `INSERT INTO public.user_wallets (user_id, virtual_api_key, balance_usd, is_active)
                 VALUES ($1, $2, 1000.000000, true)
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId, virtualApiKey],
            );
        } else {
            userId = userResult.rows[0].id;
            await pool.query(
                "UPDATE auth.users SET last_sign_in_at = now() WHERE id = $1",
                [userId],
            );
        }

        const token = createSessionToken(userId, email);
        const cookieHeader = createAuthCookieHeader(token);

        return NextResponse.json(
            {
                user: {
                    id: userId,
                    email,
                    pendingEmail: null,
                    createdWithGoogle: true,
                },
            },
            {
                status: 200,
                headers: {
                    "Set-Cookie": cookieHeader,
                },
            },
        );
    } catch (error) {
        console.error("[auth/exchange] error:", error);
        return NextResponse.json(
            { code: "unexpected_failure", detail: "Could not complete authentication." },
            { status: 500 },
        );
    }
}
