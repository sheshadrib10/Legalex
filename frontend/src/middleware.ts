import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "__Host-mike-session";
const LEGACY_AUTH_COOKIE = "mike-session";

const PROTECTED_PREFIXES = [
    "/assistant",
    "/ide",
    "/projects",
    "/history",
    "/tabular-reviews",
    "/workflows",
    "/playbooks",
    "/library",
    "/settings",
    "/organizations",
    "/onboarding",
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const hasSession =
        request.cookies.has(AUTH_COOKIE) ||
        request.cookies.has(LEGACY_AUTH_COOKIE);

    if (pathname === "/") {
        const target = hasSession ? "/assistant" : "/login";
        return NextResponse.redirect(new URL(target, request.url));
    }

    const isProtected = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (isProtected && !hasSession) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, icon.svg, link-image.jpg, apple-touch-icon.png
         * - api/ (API routes handle their own auth responses)
         */
        "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|link-image\\.jpg|apple-touch-icon\\.png|api/).*)",
    ],
};
