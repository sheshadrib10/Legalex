import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
    const user = getUserFromRequest(request);

    if (!user) {
        return NextResponse.json(
            { code: "unauthorized", detail: "Authentication required" },
            { status: 401 },
        );
    }

    return NextResponse.json({
        user: {
            id: user.userId,
            email: user.email,
            pendingEmail: null,
            createdWithGoogle: false,
        },
    });
}
