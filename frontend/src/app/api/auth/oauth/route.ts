import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
    return NextResponse.json(
        {
            code: "provider_disabled",
            detail: "Google sign-in is turned off for this workspace. Use your email and password instead.",
        },
        { status: 400 },
    );
}
