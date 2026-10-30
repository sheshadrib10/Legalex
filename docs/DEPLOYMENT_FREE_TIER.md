# 100% Free-Tier Deployment Blueprint for Legalex

You can deploy the complete Legalex platform (Frontend, Backend, Database, Storage, and AI Metering Gateway) with **$0 in fixed hosting infrastructure costs** by leveraging the permanent free tiers of established cloud providers.

---

## Architecture Breakdown

| Component | Provider & Free Tier | Limits & Capabilities |
| :--- | :--- | :--- |
| **Database & Auth** | **Supabase Free Tier** | • 500 MB PostgreSQL with `pgvector`<br>• 50,000 monthly active users for Auth<br>• Automated daily backups |
| **Object Storage (Files/Vaults)** | **Cloudflare R2 Free Tier** | • 10 GB free S3-compatible storage<br>• **$0 egress fees** (no surprise bandwidth bills)<br>• 1M write operations / month |
| **Frontend UI (Next.js)** | **Vercel or Cloudflare Pages** | • 100% free hosting with global Edge CDN<br>• Unlimited automatic SSL certificates<br>• Continuous deployment from GitHub |
| **Backend & LiteLLM Gateway** | **Render / Koyeb / Fly.io** | • Free instance with HTTPS endpoint<br>• Dockerized container execution |

---

## Step 1: Set Up Supabase (Database & Auth)

1. Sign up for free at [supabase.com](https://supabase.com).
2. Create a new project (e.g., `legalex-db`).
3. Under **Project Settings > Database**, copy your `DATABASE_URL` (Connection URI) and `SUPABASE_SERVICE_ROLE_KEY`.
4. Run the schema migrations from `Legalex/backend/schema.sql` inside the Supabase SQL Editor.

---

## Step 2: Set Up Cloudflare R2 (Document Storage)

1. Sign up for free at [cloudflare.com](https://dash.cloudflare.com) and navigate to **R2**.
2. Create a bucket named `legalex-vaults`.
3. Generate an S3-compatible API token (Access Key ID and Secret Access Key).
4. Save the endpoint URL: `https://<account-id>.r2.cloudflarestorage.com`.

---

## Step 3: Deploy LiteLLM Gateway (AI Metering & Virtual Keys)

You can run LiteLLM Proxy on Render or Fly.io:

```bash
# Using Fly.io free tier
fly launch --image ghcr.io/berriai/litellm:main-latest

# Set Secrets
fly secrets set \
  LITELLM_MASTER_KEY="sk-legalex-master-secret" \
  DATABASE_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres" \
  MOONSHOT_API_KEY="your-moonshot-kimi-api-key"
```

Once deployed, LiteLLM provides:
* OpenAI-compatible endpoint: `https://your-gateway.fly.dev/v1`
* Built-in Admin Dashboard: `https://your-gateway.fly.dev/ui` (for issuing virtual keys with credit budgets).

---

## Step 4: Deploy the Legalex Backend

Deploy `backend/` as a Node.js web service on Render or Koyeb:
* Build Command: `npm install && npm run build`
* Start Command: `npm start`
* Configure Environment Variables:
  * `DATABASE_URL`: Supabase connection string.
  * `R2_ACCESS_KEY_ID`: Cloudflare R2 key.
  * `R2_SECRET_ACCESS_KEY`: Cloudflare R2 secret.
  * `OPENAI_BASE_URL`: `https://your-gateway.fly.dev/v1` (Points directly to LiteLLM).
  * `COURTLISTENER_API_TOKEN`: Free token from courtlistener.com.

---

## Step 5: Deploy the Legalex Frontend

Deploy `frontend/` on Vercel:
1. Connect your GitHub repository: `sheshadrib10/Legalex`.
2. Set Root Directory to `frontend`.
3. Set Framework Preset to **Next.js**.
4. Configure environment variable:
   * `NEXT_PUBLIC_API_URL`: URL of your deployed backend service.
5. Click **Deploy**. Vercel will build and assign you a free `https://legalex-*.vercel.app` domain.
