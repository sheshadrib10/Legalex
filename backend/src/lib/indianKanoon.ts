/**
 * Indian Kanoon & Indian Legal Sources Adapter
 * Spec derived from SHULO_ARCHITECTURE_v3_12.md §38.2
 * Stack: Indian Kanoon API + OpenNyAI + InLegalBERT + IndicLegalQA
 */

export interface IndianKanoonDoc {
    tid: number;
    title: string;
    doc: string;
    author?: string;
    court: string;
    publishDate?: string;
    citation?: string;
    isOverruled?: boolean;
    overruledBy?: string;
}

export interface IndianKanoonSearchResult {
    found: number;
    docs: Array<{
        tid: number;
        title: string;
        headline: string;
        docsize: number;
    }>;
}

/**
 * Deterministic Good Law Verification Dictionary for Indian Jurisprudence
 * Zero-LLM Python/TS dict lookup (from SHULO_ARCHITECTURE_v3_12.md §38.2b)
 * Overruled cases must be flagged CONTESTED automatically.
 */
export const INDIAN_OVERRULED_CASES: Record<string, { overruledBy: string; year: number; notes: string }> = {
    "a.d.m. jabalpur v. shivkant shukla": {
        overruledBy: "K.S. Puttaswamy v. Union of India (2017) 10 SCC 1",
        year: 2017,
        notes: "Overruled by 9-judge constitutional bench on Right to Privacy / Article 21.",
    },
    "adm jabalpur": {
        overruledBy: "K.S. Puttaswamy v. Union of India (2017) 10 SCC 1",
        year: 2017,
        notes: "Overruled by 9-judge constitutional bench on Right to Privacy / Article 21.",
    },
    "p. rathinam v. union of india": {
        overruledBy: "Gian Kaur v. State of Punjab (1996) 2 SCC 648",
        year: 1996,
        notes: "Section 309 IPC constitutionality reinstated by Constitution Bench.",
    },
    "suresh kumar koushal v. naz foundation": {
        overruledBy: "Navtej Singh Johar v. Union of India (2018) 10 SCC 1",
        year: 2018,
        notes: "Section 377 IPC decriminalisation of consensual adult acts.",
    },
    "babulal v. state of maharashtra": {
        overruledBy: "Maneka Gandhi v. Union of India (1978) 1 SCC 248",
        year: 1978,
        notes: "Expansion of Article 21 'procedure established by law' to include substantive due process.",
    },
    "a.k. gopalan v. state of madras": {
        overruledBy: "Maneka Gandhi v. Union of India (1978) 1 SCC 248",
        year: 1978,
        notes: "Mutual exclusivity doctrine of Articles 19 and 21 rejected.",
    },
    "shankari prasad v. union of india": {
        overruledBy: "Golak Nath (1967) and Kesavananda Bharati (1973) 4 SCC 225",
        year: 1973,
        notes: "Basic Structure Doctrine supersedes unlimited amending power under Article 368.",
    },
};

const KANOON_BASE = "https://api.indiankanoon.org";

/**
 * Check if an Indian legal case has been overruled (Deterministic Zero-LLM)
 */
export function checkIndianGoodLaw(citationOrName: string): { status: "AFFIRMED" | "CONTESTED"; details?: string } {
    const normalized = citationOrName.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
    for (const [key, meta] of Object.entries(INDIAN_OVERRULED_CASES)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return {
                status: "CONTESTED",
                details: `OVERRULED by ${meta.overruledBy} (${meta.year}). Note: ${meta.notes}`,
            };
        }
    }
    return { status: "AFFIRMED" };
}

/**
 * Search Indian Kanoon for judgments, High Courts, and Central Acts
 */
export async function searchIndianKanoon(
    query: string,
    page: number = 0,
    apiToken?: string | null
): Promise<IndianKanoonSearchResult> {
    const token = apiToken || process.env.INDIAN_KANOON_API_TOKEN;
    const headers: HeadersInit = {
        "Accept": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    const url = `${KANOON_BASE}/search/?formInput=${encodeURIComponent(query)}&pagenum=${page}`;
    try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
        if (!res.ok) {
            return { found: 0, docs: [] };
        }
        return await res.json();
    } catch {
        return { found: 0, docs: [] };
    }
}

/**
 * Fetch full judgment text by document ID from Indian Kanoon
 */
export async function getIndianKanoonDoc(
    docId: number | string,
    apiToken?: string | null
): Promise<IndianKanoonDoc | null> {
    const token = apiToken || process.env.INDIAN_KANOON_API_TOKEN;
    const headers: HeadersInit = { "Accept": "application/json" };
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    const url = `${KANOON_BASE}/doc/${docId}/`;
    try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (!res.ok) return null;
        const data = await res.json();
        
        // Check Good Law status on fetched document
        const goodLaw = checkIndianGoodLaw(data.title || "");
        return {
            tid: data.tid || Number(docId),
            title: data.title,
            doc: data.doc,
            court: data.court || "Supreme Court of India",
            author: data.author,
            publishDate: data.publishdate,
            isOverruled: goodLaw.status === "CONTESTED",
            overruledBy: goodLaw.details,
        };
    } catch {
        return null;
    }
}
