/**
 * Jurisdiction Guard & Legal Invariants Engine
 * Canonical Implementation of SHULO_ARCHITECTURE_v3_12.md §38.1
 */

import { checkIndianGoodLaw } from "./indianKanoon";
import { checkSingaporeGoodLaw } from "./singaporeLaw";

export type LegalJurisdiction = "INDIA" | "SINGAPORE" | "US" | "UK" | "EU" | "GLOBAL";

export type AuthorityTier = "BINDING" | "PERSUASIVE" | "BACKGROUND";

export interface CitationClassification {
    citation: string;
    jurisdiction: LegalJurisdiction;
    tier: AuthorityTier;
    goodLawStatus: "AFFIRMED" | "CONTESTED";
    contestedNotes?: string;
}

/**
 * Common Overruled SCOTUS Decisions for US Good Law Verification
 */
export const US_OVERRULED_CASES: Record<string, { overruledBy: string; year: number }> = {
    "roe v. wade": { overruledBy: "Dobbs v. Jackson Women's Health Organization", year: 2022 },
    "chevron u.s.a. inc. v. natural resources defense council": { overruledBy: "Loper Bright Enterprises v. Raimondo", year: 2024 },
    "chevron v. nrdc": { overruledBy: "Loper Bright Enterprises v. Raimondo", year: 2024 },
    "korematsu v. united states": { overruledBy: "Trump v. Hawaii", year: 2018 },
    "plessy v. ferguson": { overruledBy: "Brown v. Board of Education", year: 1954 },
    "lochner v. new york": { overruledBy: "West Coast Hotel Co. v. Parrish", year: 1937 },
};

export function checkUSGoodLaw(caseName: string): { status: "AFFIRMED" | "CONTESTED"; details?: string } {
    const normalized = caseName.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
    for (const [key, meta] of Object.entries(US_OVERRULED_CASES)) {
        if (normalized.includes(key)) {
            return {
                status: "CONTESTED",
                details: `OVERRULED by ${meta.overruledBy} (${meta.year}).`,
            };
        }
    }
    return { status: "AFFIRMED" };
}

/**
 * Universal Good Law Verification across India, Singapore, and the US
 * Deterministic Zero-LLM check (from SHULO_ARCHITECTURE_v3_12.md §38.1)
 */
export function verifyGoodLawUniversal(
    citationOrName: string,
    jurisdiction: LegalJurisdiction
): { status: "AFFIRMED" | "CONTESTED"; details?: string } {
    if (jurisdiction === "INDIA") {
        return checkIndianGoodLaw(citationOrName);
    }
    if (jurisdiction === "SINGAPORE") {
        return checkSingaporeGoodLaw(citationOrName);
    }
    if (jurisdiction === "US") {
        return checkUSGoodLaw(citationOrName);
    }
    return { status: "AFFIRMED" };
}

/**
 * Enforce Jurisdiction Lock on queries to avoid cross-jurisdiction contamination
 */
export function buildJurisdictionLockedNamespace(
    jurisdiction: LegalJurisdiction,
    taskType: string = "general"
): string {
    return `legal.${jurisdiction.toUpperCase()}.${taskType.toLowerCase()}.v1`;
}

/**
 * Classify a citation into Binding vs Persuasive authority
 * Prevents conflation of primary governing law with foreign persuasive decisions
 */
export function classifyCitation(
    citation: string,
    citationJurisdiction: LegalJurisdiction,
    lockedJurisdiction: LegalJurisdiction
): CitationClassification {
    const isBinding = citationJurisdiction === lockedJurisdiction;
    const tier: AuthorityTier = isBinding ? "BINDING" : "PERSUASIVE";
    const goodLaw = verifyGoodLawUniversal(citation, citationJurisdiction);

    return {
        citation,
        jurisdiction: citationJurisdiction,
        tier,
        goodLawStatus: goodLaw.status,
        contestedNotes: goodLaw.details,
    };
}
