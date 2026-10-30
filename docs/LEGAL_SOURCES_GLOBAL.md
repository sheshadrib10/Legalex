# Legalex Global Legal Intelligence Architecture

This document specifies the authoritative legal research, agent invariants, and jurisdictional source routing for **Legalex**, derived from the battle-tested specifications in `SHULO_ARCHITECTURE_v3_12.md` (§38.1, §38.2, §38.2a, §38.2b).

---

## 1. The Three Mandatory Agent Invariants (§38.1)

To prevent hallucinations, legal malpractice, and cross-border contamination, all Legalex agents operate under three non-negotiable architectural invariants:

### A. Jurisdiction Lock
* Every legal session is locked to a specific jurisdiction namespace:
  ```
  legal.{JURISDICTION}.{task_type}.v1
  ```
* **Contamination Prevention:** US legal rules (e.g., UCC or federal common law) must **never** be cited to resolve an Indian Contract Act dispute or a Singapore Companies Act issue, and vice versa.
* **Ambiguity Handling:** If a user brief does not specify the governing law and inference is ambiguous, the agent **never assumes**. It halts and surfaces a `CONFIDENCE_INSUFFICIENT` card: *"Please confirm the governing jurisdiction before I proceed."*

### B. Citation Classification (Binding vs. Persuasive vs. Background)
Every case citation is categorized into three strict tiers:
1. **Binding Authority:** Statutes, regulations, and apex court decisions (Supreme Court of India, Singapore Court of Appeal, SCOTUS) within the locked jurisdiction.
2. **Persuasive Authority:** Decisions from foreign common-law jurisdictions (e.g., UK House of Lords or Australian High Court cited in Singapore or India) or Law Commission reports. Agents must explicitly identify them as persuasive.
3. **Background:** Secondary commentaries, law review articles, and legal digests.
> Conflating binding and persuasive authority triggers an immediate quality failure.

### C. Deterministic Good Law Verification (Zero-LLM)
* Before any precedent enters the synthesis context, it passes through a deterministic dictionary lookup against a pre-indexed list of overruled decisions.
* Overruled cases are automatically stamped **`CONTESTED`** with the overruling authority attached.
* Implementation: [`backend/src/lib/jurisdictionGuard.ts`](../backend/src/lib/jurisdictionGuard.ts).

### D. Mandatory Page-Level & Paragraph Grounding
Every legal proposition must anchor to:
* `source_page`
* `source_paragraph`
* Exact verbatim quotation from primary statutory or judicial text.

---

## 2. Jurisdiction Sources: Free-First Stack (§38.2b)

Legalex follows a **Free-First Retrieval Order**:
1. Query free open-access legal databases first.
2. Only escalate to paid databases via **BYO-MCP** if the free tier returns `CONFIDENCE_INSUFFICIENT`.
3. Never hallucinate case law or scrape paywalled repositories.

---

### 🇮🇳 INDIA (Primary Market)

```python
LEGAL_SOURCES_FREE_INDIA = "indian_kanoon_opennyai_inlegalbert_indiclegalqa"
```

| Component | Role in Legalex | Source / Implementation |
| :--- | :--- | :--- |
| **`InLegalBERT`** | **Domain-Specific Embeddings Router** | Pre-trained on Indian legal judgments. Used for vector indexing in `pgvector` so similarity searches understand Indian statutory phrasing. |
| **`OpenNyAI`** | **Judicial NLP Models** | Open-source models for Legal Named Entity Recognition (NER), Rhetorical Role Labeling (*Facts, Issues, Arguments, Ratio Decidendi*), and headnote generation. |
| **`IndicLegalQA`** | **Legal Q&A Synthesis** | Domain-tuned QA model for direct statutory synthesis over Central & State Acts. |
| **`Indian Kanoon API`** | **Primary Case Law & Statutes (20M+)** | Live API client: [`backend/src/lib/indianKanoon.ts`](../backend/src/lib/indianKanoon.ts). Covers Supreme Court of India (1950–Present), all 25 High Courts, Tribunals (NCLT, NCLAT, ITAT), and Central Acts. |
| **Enterprise Fallback** | **Manupatra & SCC Online** | Integrated via **BYO-MCP** (Bring-Your-Own Model Context Protocol). Law firms provide their own enterprise keys; Legalex never incurs per-seat database costs. |

#### Deterministic Overruled List (India)
* *A.D.M. Jabalpur v. Shivkant Shukla* → Overruled by *K.S. Puttaswamy v. Union of India (2017) 10 SCC 1* (Right to Privacy).
* *P. Rathinam v. Union of India* → Overruled by *Gian Kaur v. State of Punjab (1996) 2 SCC 648* (Section 309 IPC).
* *Suresh Kumar Koushal v. Naz Foundation* → Overruled by *Navtej Singh Johar v. Union of India (2018) 10 SCC 1*.
* *A.K. Gopalan v. State of Madras* → Overruled by *Maneka Gandhi v. Union of India (1978) 1 SCC 248*.

---

### 🇸🇬 SINGAPORE

```python
LEGAL_SOURCES_FREE_SG = "singapore_statutes_online_supreme_court"
```

| Component | Role in Legalex | Source / Implementation |
| :--- | :--- | :--- |
| **Singapore Statutes Online (SSO)** | Authoritative public database for all Singapore Acts of Parliament and subsidiary legislation in force. | Scraped/parsed deterministically via Scrapling / structured XML. Adapter: [`backend/src/lib/singaporeLaw.ts`](../backend/src/lib/singaporeLaw.ts). |
| **Supreme Court Open Judgments** | Decisions from the Court of Appeal (`SGCA`) and High Court (`SGHC`). | Harvested via AsianLII Singapore & Judiciary portal. |
| **Enterprise Fallback** | **LexisNexis Singapore** | Integrated via BYO-MCP if the law firm holds an active enterprise subscription. |
| **Data Sovereignty & Compliance** | **PDPA & MAS TRM** | Singapore legal instances route strictly to AWS `ap-southeast-1` to comply with the Personal Data Protection Act and MAS Technology Risk Management guidelines. |

#### Deterministic Overruled List (Singapore)
* *Royal Bank of Scotland v. Pekin* → Overruled by *OCBC v. Sin Ann Builders [2008] SGCA 25*.
* *Lim Chin San v. Michael* → Overruled by *Spandeck Engineering v. DSTA [2007] SGCA 37* (Two-stage duty of care test).

---

### 🇪🇺 EUROPE (EU & UK)

```python
LEGAL_SOURCES_FREE_EU = "eur_lex_curia"
LEGAL_SOURCES_FREE_UK = "bailii_legislation_gov_uk_law_commission"
```

* **EUR-Lex (Cellar REST & SPARQL API):** Official EU law repository covering EU Treaties, Directives, Regulations, and Court of Justice of the European Union (CJEU) jurisprudence.
* **HUDOC API:** European Court of Human Rights (ECHR) open-access database and REST search API.
* **BAILII & legislation.gov.uk:** Free access to UK Supreme Court (`UKSC`), Court of Appeal (`EWCA`), High Court (`EWHC`), and all UK Acts of Parliament.

---

### 🇺🇸 UNITED STATES

```python
LEGAL_SOURCES_FREE_US = "courtlistener_cornell_lii_sec_edgar"
```

* **CourtListener (Free Law Project):** Live API client natively integrated in [`backend/src/lib/courtlistener.ts`](../backend/src/lib/courtlistener.ts). Over 8 million searchable opinions, citation normalization, and citator feeds.
* **Cornell LII:** Primary source for US Code (statutes) and Code of Federal Regulations (CFR).
* **SEC EDGAR:** Full access to public company filings, 10-Ks, M&A agreements, and material corporate disclosures.

---

## 3. Tool Dispatching in Legalex Engine

All global research tools are bundled together and made available to the assistant turn engine via [`backend/src/modules/chat/engine/tools/globalLegalTools.ts`](../backend/src/modules/chat/engine/tools/globalLegalTools.ts):

* `courtlistener_search_case_law`
* `courtlistener_get_cases`
* `courtlistener_find_in_case`
* `courtlistener_read_case`
* `courtlistener_verify_citations`
* `indian_kanoon_search`
* `indian_kanoon_get_doc`
* `singapore_statutes_search`
* `verify_good_law` (Zero-LLM verification)
