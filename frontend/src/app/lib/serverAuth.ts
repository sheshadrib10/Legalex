import { Pool } from "@neondatabase/serverless";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

let pool: Pool | null = null;

export function getDbPool(): Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error("DATABASE_URL is not set");
        }
        pool = new Pool({ connectionString });
    }
    return pool;
}

function getSecretKey(): string {
    return (
        process.env.SESSION_SECRET ||
        process.env.LITELLM_MASTER_KEY ||
        process.env.DATABASE_URL ||
        "legalex-master-production-session-secret-key-32b"
    );
}

export function createSessionToken(userId: string, email: string): string {
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    const payload = Buffer.from(
        JSON.stringify({ sub: userId, email, exp: expiresAt }),
    ).toString("base64url");
    const signature = createHmac("sha256", getSecretKey())
        .update(payload)
        .digest("base64url");
    return `${payload}.${signature}`;
}

export function verifySessionToken(
    token: string,
): { userId: string; email: string } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 2) return null;
        const [payloadB64, signature] = parts;
        const expectedSig = createHmac("sha256", getSecretKey())
            .update(payloadB64)
            .digest("base64url");

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSig);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
            return null;
        }

        const data = JSON.parse(
            Buffer.from(payloadB64, "base64url").toString("utf8"),
        ) as { sub?: string; email?: string; exp?: number };

        if (!data.sub || !data.email || !data.exp || Date.now() > data.exp) {
            return null;
        }

        return { userId: data.sub, email: data.email };
    } catch {
        return null;
    }
}

export const AUTH_COOKIE_NAME =
    process.env.NODE_ENV === "production"
        ? "__Host-mike-session"
        : "mike-session";

export function createAuthCookieHeader(token: string): string {
    const isProd = process.env.NODE_ENV === "production";
    const flags = [
        `${AUTH_COOKIE_NAME}=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Max-Age=${30 * 24 * 60 * 60}`,
    ];
    if (isProd) flags.push("Secure");
    return flags.join("; ");
}

export function clearAuthCookieHeader(): string {
    const isProd = process.env.NODE_ENV === "production";
    const flags = [
        `${AUTH_COOKIE_NAME}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ];
    if (isProd) flags.push("Secure");
    return flags.join("; ");
}

export function getUserFromRequest(
    request: Request,
): { userId: string; email: string } | null {
    const cookieHeader = request.headers.get("cookie") || "";
    const match =
        cookieHeader.match(
            new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`),
        ) || cookieHeader.match(/(?:^|;\s*)mike-session=([^;]+)/);
    if (!match) return null;
    return verifySessionToken(match[1]);
}
