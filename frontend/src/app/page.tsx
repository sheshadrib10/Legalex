import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME } from "@/app/lib/serverAuth";

export default async function RootPage() {
    const cookieStore = await cookies();
    const token =
        cookieStore.get(AUTH_COOKIE_NAME)?.value ||
        cookieStore.get(LEGACY_AUTH_COOKIE_NAME)?.value;

    if (!token) {
        redirect("/login");
    }

    redirect("/assistant");
}
