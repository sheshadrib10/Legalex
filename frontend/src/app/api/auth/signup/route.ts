import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { code: "invalid_request", detail: "Please provide a valid email address." },
                { status: 400 },
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { code: "validation_failed", detail: "Password must be at least 8 characters long." },
                { status: 400 },
            );
        }

        const pool = getDbPool();

        // Check if user already exists
        const existing = await pool.query(
            "SELECT id FROM auth.users WHERE lower(email) = $1",
            [email],
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                {
                    code: "user_already_exists",
                    detail: "An account with this email address already exists. Please log in instead.",
                },
                { status: 400 },
            );
        }

        const userId = randomUUID();
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Insert into auth.users — this automatically triggers handle_new_user() in Neon
        await pool.query(
            `INSERT INTO auth.users (
                id, email, encrypted_password, email_confirmed_at, role,
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at
            ) VALUES (
                $1, $2, $3, now(), 'authenticated',
                '{"provider": "email", "providers": ["email"]}',
                '{"display_name": ""}', now(), now()
            )`,
            [userId, email, encryptedPassword],
        );

        // Ensure user wallet with 1,000,000 tokens / $1,000 credits
        const virtualApiKey = `lex_${randomBytes(24).toString("hex")}`;
        await pool.query(
            `INSERT INTO public.user_wallets (user_id, virtual_api_key, balance_usd, is_active)
             VALUES ($1, $2, 1000.000000, true)
             ON CONFLICT (user_id) DO NOTHING`,
            [userId, virtualApiKey],
        );

        const token = createSessionToken(userId, email);
        const cookieHeader = createAuthCookieHeader(token);

        return NextResponse.json(
            {
                user: {
                    id: userId,
                    email,
                    pendingEmail: null,
                    createdWithGoogle: false,
                },
                requiresEmailConfirmation: false,
            },
            {
                status: 200,
                headers: {
                    "Set-Cookie": cookieHeader,
                },
            },
        );
    } catch (error) {
        console.error("[auth/signup] failed:", error);
        return NextResponse.json(
            {
                code: "unexpected_failure",
                detail: "Unable to create your account right now. Please try again.",
            },
            { status: 500 },
        );
    }
}
