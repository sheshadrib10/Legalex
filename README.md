# Legalex: Open Enterprise Legal AI Platform

**Legalex** is an open-source, enterprise-grade legal AI platform engineered for document review, contract analysis, and global legal research across **Singapore, India, Europe, and the United States**.

Built as an open-access alternative to proprietary legal tech tools, Legalex empowers law firms, corporate legal departments, and solo practitioners with complete data sovereignty, flexible model routing, and zero-leakage token metering.

---

## Key Capabilities

* **Document Vaults & Legal Chat:** Upload matter files (contracts, pleadings, briefs, depositions) into isolated workspaces and query them with contextual citations.
* **Tabular Contract Review:** Bulk-review 100+ agreements simultaneously, extract key clauses (indemnity, governing law, termination), and flag deviations.
* **Global Legal Research:**
  * **India:** Direct integration points with **Indian Kanoon** and OpenNyAI for Supreme Court & High Court jurisprudence.
  * **Singapore:** Integration with **Singapore Statutes Online (SSO)** and AsianLII.
  * **Europe:** Direct integration with **EUR-Lex API (Cellar)** and HUDOC (ECHR).
  * **United States:** Native **CourtListener** integration for case law search and citation verification.
* **Zero-Leakage AI Metering:** Decoupled **LiteLLM Gateway** architecture for per-user Virtual API keys, budget enforcement, prompt-cache accounting, and Moonshot Kimi K3 integration.
* **Zero Fixed Cloud Cost:** Architected to run on permanent free-tier cloud infrastructure (Supabase, Cloudflare R2, Vercel).

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │             Legalex Next.js UI               │
                      │        (Deployed Free on Vercel)             │
                      └──────────────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────┴───────────────────────┐
                      │            Legalex Express API               │
                      │        (Deployed Free on Render)             │
                      └──────────────┬───────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│  LiteLLM Gateway    │   │ Supabase (Postgres) │   │ Cloudflare R2       │
│  • Virtual API Keys │   │ • Matter Metadata   │   │ • S3 Document Vault │
│  • Token Metering   │   │ • User Auth & RLS   │   │ • $0 Egress Fees    │
│  • Kimi K3 Wrapper  │   │ • pgvector Search   │   │ • 10 GB Free        │
└──────────┬──────────┘   └─────────────────────┘   └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Moonshot Kimi API   │
│  (Single Master Key)│
└─────────────────────┘
```

---

## Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/sheshadrib10/Legalex.git
cd Legalex
```

### 2. Configure Environment Secrets
Copy the sample environment file:
```bash
cp .env.example .env
```
Key variables:
* `DATABASE_URL`: Connection string to your local or Supabase PostgreSQL instance.
* `OPENAI_BASE_URL`: URL of your LiteLLM gateway (`http://localhost:4000/v1` or public URL).
* `COURTLISTENER_API_TOKEN`: Free token from [courtlistener.com](https://www.courtlistener.com/).

### 3. Start with Docker Compose
```bash
docker compose up -d
```
Access the application:
* **Frontend Web App:** `http://localhost:3000`
* **Backend API:** `http://localhost:3001`
* **LiteLLM Admin Dashboard:** `http://localhost:4000/ui`

---

## Global Sources & Integrations

For comprehensive instructions on connecting legal databases across Singapore, India, Europe, and the US, read [`docs/LEGAL_SOURCES_GLOBAL.md`](docs/LEGAL_SOURCES_GLOBAL.md).

## Free-Tier Cloud Deployment

For step-by-step instructions on deploying Legalex at **$0/month** on Supabase, Cloudflare R2, and Vercel, read [`docs/DEPLOYMENT_FREE_TIER.md`](docs/DEPLOYMENT_FREE_TIER.md).

---

## License

Legalex is open-source software licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
