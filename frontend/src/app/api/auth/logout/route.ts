import { NextResponse } from "next/server";
import { clearAuthCookieHeader } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Set-Cookie": clearAuthCookieHeader(),
        },
    });
}
