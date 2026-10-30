import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

        if (!email || !password) {
            return NextResponse.json(
                { code: "invalid_credentials", detail: "Please provide both email and password." },
                { status: 400 },
            );
        }

        const pool = getDbPool();

        const result = await pool.query(
            "SELECT id, email, encrypted_password FROM auth.users WHERE lower(email) = $1",
            [email],
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { code: "invalid_credentials", detail: "Incorrect email or password." },
                { status: 401 },
            );
        }

        const userRow = result.rows[0];
        const match = await bcrypt.compare(password, userRow.encrypted_password || "");
        if (!match) {
            return NextResponse.json(
                { code: "invalid_credentials", detail: "Incorrect email or password." },
                { status: 401 },
            );
        }

        // Update last_sign_in_at
        await pool.query(
            "UPDATE auth.users SET last_sign_in_at = now() WHERE id = $1",
            [userRow.id],
        );

        const token = createSessionToken(userRow.id, userRow.email);
        const cookieHeader = createAuthCookieHeader(token);

        return NextResponse.json(
            {
                user: {
                    id: userRow.id,
                    email: userRow.email,
                    pendingEmail: null,
                    createdWithGoogle: false,
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
        console.error("[auth/login] failed:", error);
        return NextResponse.json(
            { code: "unexpected_failure", detail: "Authentication could not be completed." },
            { status: 500 },
        );
    }
}
