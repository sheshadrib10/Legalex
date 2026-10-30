import { NextResponse } from "next/server";
import { getDbPool, getUserFromRequest } from "@/app/lib/serverAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatProfile(row: Record<string, any>) {
    const creditsUsed = row.message_credits_used ?? 0;
    const MONTHLY_LIMIT = 500;
    return {
        displayName: row.display_name ?? null,
        profilePhoto: row.profile_photo ?? null,
        organisation: row.organisation ?? null,
        jurisdiction: row.jurisdiction ?? null,
        practiceSetting: row.practice_setting ?? null,
        professionalTitle: row.professional_title ?? null,
        practiceAreas: Array.isArray(row.practice_areas) ? row.practice_areas : [],
        onboardingVersion: row.onboarding_version === undefined ? 1 : row.onboarding_version,
        onboardingComplete: row.onboarding_version !== null && row.onboarding_version !== undefined,
        passwordSet: !!row.password_set_at,
        messageCreditsUsed: creditsUsed,
        creditsResetDate: row.credits_reset_date || new Date().toISOString(),
        creditsRemaining: Math.max(MONTHLY_LIMIT - creditsUsed, 0),
        tier: row.tier || "Free",
        titleModel: row.title_model ?? null,
        tabularModel: row.tabular_model ?? null,
        memoryCuratorModel: row.memory_curator_model ?? null,
        subagentModel: row.subagent_model ?? null,
        subagentReasoning: row.subagent_reasoning ?? null,
        lastSelectedChatModel: row.last_selected_chat_model ?? null,
        lastSelectedReasoningLevel: row.last_selected_reasoning_level ?? "high",
        mfaOnLogin: row.mfa_on_login === true,
        courtlistenerBulkData: false,
        quickActionsVisible: row.quick_actions_visible !== false,
        responseDetailsVisible: row.response_details_visible === true,
        darkMode: row.dark_mode === true,
        projectMemoryDefault: row.project_memory_default !== false,
        apiKeyStatus: "none",
    };
}

export async function GET(request: Request) {
    const user = getUserFromRequest(request);
    if (!user) {
        return NextResponse.json(
            { code: "unauthorized", detail: "Authentication required" },
            { status: 401 },
        );
    }

    try {
        const pool = getDbPool();
        let res = await pool.query(
            "SELECT * FROM public.user_profiles WHERE user_id = $1",
            [user.userId],
        );

        if (res.rows.length === 0) {
            // Ensure profile exists
            await pool.query(
                `INSERT INTO public.user_profiles (user_id, email, display_name)
                 VALUES ($1, $2, '')
                 ON CONFLICT (user_id) DO NOTHING`,
                [user.userId, user.email],
            );
            res = await pool.query(
                "SELECT * FROM public.user_profiles WHERE user_id = $1",
                [user.userId],
            );
        }

        return NextResponse.json(formatProfile(res.rows[0]));
    } catch (error) {
        console.error("[user/profile GET] failed:", error);
        return NextResponse.json(
            { code: "database_error", detail: "Could not load user profile" },
            { status: 500 },
        );
    }
}

export async function PATCH(request: Request) {
    const user = getUserFromRequest(request);
    if (!user) {
        return NextResponse.json(
            { code: "unauthorized", detail: "Authentication required" },
            { status: 401 },
        );
    }

    try {
        const body = await request.json().catch(() => ({}));
        const pool = getDbPool();

        const updates: string[] = ["updated_at = now()"];
        const values: any[] = [user.userId];
        let idx = 2;

        if (body.displayName !== undefined) {
            updates.push(`display_name = $${idx++}`);
            values.push(body.displayName);
        }
        if (body.organisation !== undefined) {
            updates.push(`organisation = $${idx++}`);
            values.push(body.organisation);
        }
        if (body.jurisdiction !== undefined) {
            updates.push(`jurisdiction = $${idx++}`);
            values.push(body.jurisdiction);
        }
        if (body.practiceSetting !== undefined) {
            updates.push(`practice_setting = $${idx++}`);
            values.push(body.practiceSetting);
        }
        if (body.professionalTitle !== undefined) {
            updates.push(`professional_title = $${idx++}`);
            values.push(body.professionalTitle);
        }
        if (body.practiceAreas !== undefined) {
            updates.push(`practice_areas = $${idx++}`);
            values.push(body.practiceAreas);
        }
        if (body.onboardingComplete) {
            updates.push(`onboarding_version = $${idx++}`);
            values.push(1);
        }

        const query = `
            UPDATE public.user_profiles
            SET ${updates.join(", ")}
            WHERE user_id = $1
            RETURNING *
        `;

        const res = await pool.query(query, values);
        if (res.rows.length === 0) {
            return NextResponse.json(
                { code: "not_found", detail: "Profile not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(formatProfile(res.rows[0]));
    } catch (error) {
        console.error("[user/profile PATCH] failed:", error);
        return NextResponse.json(
            { code: "update_failed", detail: "Could not update user profile" },
            { status: 500 },
        );
    }
}

export const POST = PATCH;
