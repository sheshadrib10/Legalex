/**
 * Global Legal Research Tools for Legalex
 * Includes:
 * 1. United States: CourtListener (Federal & State case law, citations)
 * 2. India: Indian Kanoon API + OpenNyAI + InLegalBERT
 * 3. Singapore: Singapore Statutes Online (SSO) + Supreme Court
 * 4. Deterministic Good Law Verification across all jurisdictions (Zero-LLM)
 */

import { COURTLISTENER_TOOLS } from "./courtlistenerTools";
import { searchIndianKanoon, getIndianKanoonDoc } from "../../../../lib/indianKanoon";
import { searchSingaporeStatutes } from "../../../../lib/singaporeLaw";
import { verifyGoodLawUniversal, type LegalJurisdiction } from "../../../../lib/jurisdictionGuard";

export const GLOBAL_LEGAL_TOOL_NAMES = {
    indianKanoonSearch: "indian_kanoon_search",
    indianKanoonGetDoc: "indian_kanoon_get_doc",
    singaporeStatutesSearch: "singapore_statutes_search",
    verifyGoodLaw: "verify_good_law",
} as const;

export const GLOBAL_LEGAL_SYSTEM_PROMPT = `GLOBAL LEGAL RESEARCH & JURISDICTION INVARIANTS:
You are Legalex, an authoritative legal intelligence platform for the United States, India, Singapore, Europe, and global common-law jurisdictions.

MANDATORY INVARIANTS (SHULO SPEC §38.1):
1. Jurisdiction Lock: You must confirm the governing law / jurisdiction before producing binding legal analysis. Never apply US law principles to Indian or Singaporean disputes or vice versa.
2. Citation Classification:
   - BINDING authority: Statutes and apex court precedents (e.g. Supreme Court of India, Singapore Court of Appeal, SCOTUS) within the governing jurisdiction.
   - PERSUASIVE authority: Foreign common-law judgments or Law Commission reports. You must explicitly label them as persuasive.
   - BACKGROUND: Secondary literature, commentary, or news.
3. Good Law Verification:
   - Before relying on any precedent, verify whether it has been overruled. If a case is overruled, you must stamp it as CONTESTED and explain the overruling authority.
4. Mandatory Page & Paragraph Grounding:
   - Anchor all factual and statutory claims to specific sections, clauses, or paragraph citations. Never state a legal rule without citing the primary text.

AVAILABLE RESEARCH APIS:
- US: CourtListener tools (courtlistener_search_case_law, courtlistener_get_cases, courtlistener_find_in_case, courtlistener_read_case, courtlistener_verify_citations)
- India: indian_kanoon_search (20M+ Indian SC/HC judgments & Central Acts), indian_kanoon_get_doc
- Singapore: singapore_statutes_search (Singapore Statutes Online & Acts of Parliament)
- Universal: verify_good_law (deterministic check if a precedent is overruled)`;

export const REGIONAL_RESEARCH_TOOLS = [
    {
        type: "function",
        function: {
            name: GLOBAL_LEGAL_TOOL_NAMES.indianKanoonSearch,
            description:
                "Search over 20 million Indian court judgments from the Supreme Court of India, all 25 High Courts, Tribunals (NCLT, NCLAT, ITAT), and Indian Central Acts.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search keywords, case title, legal section (e.g. 'Section 138 Negotiable Instruments Act' or 'Kesavananda Bharati').",
                    },
                    page: {
                        type: "integer",
                        description: "Page number (0-indexed). Defaults to 0.",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: GLOBAL_LEGAL_TOOL_NAMES.indianKanoonGetDoc,
            description:
                "Fetch the authoritative full-text judgment or statute from Indian Kanoon using the document ID (tid).",
            parameters: {
                type: "object",
                properties: {
                    docId: {
                        type: "string",
                        description: "The document ID (tid) returned by indian_kanoon_search.",
                    },
                },
                required: ["docId"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: GLOBAL_LEGAL_TOOL_NAMES.singaporeStatutesSearch,
            description:
                "Search Singapore Statutes Online (SSO) and Acts of Parliament (e.g. Companies Act Cap 50, Civil Law Act, PDPA).",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Singapore Act name, provision, or subject matter.",
                    },
                },
                required: ["query"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: GLOBAL_LEGAL_TOOL_NAMES.verifyGoodLaw,
            description:
                "Deterministic Zero-LLM lookup to verify whether a court decision in the US, India, or Singapore has been overruled.",
            parameters: {
                type: "object",
                properties: {
                    citationOrName: {
                        type: "string",
                        description: "The case citation or popular name (e.g., 'ADM Jabalpur', 'Roe v. Wade', 'Spandeck Engineering').",
                    },
                    jurisdiction: {
                        type: "string",
                        enum: ["INDIA", "SINGAPORE", "US", "GLOBAL"],
                        description: "The governing legal jurisdiction of the case.",
                    },
                },
                required: ["citationOrName", "jurisdiction"],
            },
        },
    },
];

export const GLOBAL_LEGAL_TOOLS = [
    ...COURTLISTENER_TOOLS,
    ...REGIONAL_RESEARCH_TOOLS,
];

/**
 * Tool execution dispatcher for Indian & Singaporean legal tools
 */
export async function executeRegionalLegalTool(
    toolName: string,
    args: Record<string, unknown>
): Promise<unknown> {
    if (toolName === GLOBAL_LEGAL_TOOL_NAMES.indianKanoonSearch) {
        return await searchIndianKanoon(String(args.query), Number(args.page || 0));
    }
    if (toolName === GLOBAL_LEGAL_TOOL_NAMES.indianKanoonGetDoc) {
        return await getIndianKanoonDoc(String(args.docId));
    }
    if (toolName === GLOBAL_LEGAL_TOOL_NAMES.singaporeStatutesSearch) {
        return await searchSingaporeStatutes(String(args.query));
    }
    if (toolName === GLOBAL_LEGAL_TOOL_NAMES.verifyGoodLaw) {
        return verifyGoodLawUniversal(
            String(args.citationOrName),
            String(args.jurisdiction).toUpperCase() as LegalJurisdiction
        );
    }
    return { error: `Unknown legal tool: ${toolName}` };
}
