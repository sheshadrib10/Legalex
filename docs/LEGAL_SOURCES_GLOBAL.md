# Global Legal Sources Integration Guide

Legalex is engineered to operate across international jurisdictions. Below are established, authoritative, free and open-access legal databases and APIs across **India, Singapore, Europe, and the United States**, along with instructions on how to connect them.

---

## 1. India: Indian Kanoon & Judicial Portals

### A. Indian Kanoon (The Primary Free Database)
* **Website:** [indiankanoon.org](https://indiankanoon.org/)
* **Developer API:** [api.indiankanoon.org](https://api.indiankanoon.org/)
* **What it Covers:**
  * Supreme Court of India judgments (1950–Present).
  * All 25 High Courts across India.
  * Central Acts, Rules, and Law Commission Reports.
  * Tribunals (NCLT, NCLAT, ITAT, CESTAT, Consumer Forums).
* **Integration Pattern:**
  * Use the Indian Kanoon Search API: `GET https://api.indiankanoon.org/search/?formInput={query}&pagenum=0`
  * Citation lookup: `GET https://api.indiankanoon.org/doc/{docid}/`
  * Use this to ground contract clauses against Indian Supreme Court precedents and the Indian Contract Act, 1872.

### B. OpenNyAI (AI for Indian Judiciary)
* **Website:** [opennyai.org](https://opennyai.org/)
* **What it Covers:**
  * Open-source legal NLP models trained specifically on Indian court judgments.
  * Pre-trained models for Legal Named Entity Recognition (NER), Rhetorical Role labeling (Facts, Issue, Argument, Statute, Ratio), and judgment summarization.
  * Completely open-weights and free to use.

### C. India Code (Official Statutes Repository)
* **Website:** [indiacode.nic.in](https://www.indiacode.nic.in/)
* **What it Covers:**
  * Official repository of all Central Acts and State legislation with full-text amendments.
  * Public domain and accessible for statutory validation.

---

## 2. Singapore: Official & Open Legal Repositories

### A. Singapore Statutes Online (SSO)
* **Website:** [sso.agc.gov.sg](https://sso.agc.gov.sg/)
* **Managed by:** Attorney-General's Chambers (AGC) Singapore.
* **What it Covers:**
  * Complete, authoritative repository of Singapore Acts of Parliament and subsidiary legislation in force.
  * Includes point-in-time search and historical amendment tracking.
* **Access Mode:** Public web access with structured HTML/XML data endpoints.

### B. AsianLII & CommonLII (Singapore Portal)
* **Website:** [asianlii.org/sg](https://www.asianlii.org/sg/) / [commonlii.org](http://www.commonlii.org/sg/)
* **Managed by:** Legal Information Institutes consortium (free access to law movement).
* **What it Covers:**
  * Singapore Court of Appeal (SGCA) and High Court (SGHC) decisions.
  * Singapore State Court judgments.
  * Patent and Trademark Decisions.
  * Completely free, open access with searchable indices.

### C. Singapore Law Watch (SLW)
* **Website:** [singaporelawwatch.sg](https://www.singaporelawwatch.sg/)
* **Managed by:** Singapore Academy of Law (SAL).
* **What it Covers:**
  * Free daily judgment digests and summaries from Singapore courts.

---

## 3. Europe (EU & UK): Official Open APIs

### A. EUR-Lex REST & Cellar SPARQL API
* **Website:** [eur-lex.europa.eu](https://eur-lex.europa.eu/)
* **What it Covers:**
  * Official database of all European Union law.
  * EU Treaties, Directives, Regulations, and Decisions.
  * Case-law of the Court of Justice of the European Union (CJEU).
* **API Access:**
  * **Cellar REST API:** Direct document retrieval in PDF, HTML, and XML formats.
  * **SPARQL Endpoint:** Structured semantic queries for cross-referencing EU directives and member-state transposition.
  * 100% free with registration on EU Login.

### B. HUDOC (European Court of Human Rights)
* **Website:** [hudoc.echr.coe.int](https://hudoc.echr.coe.int/)
* **What it Covers:**
  * Case-law of the European Court of Human Rights (ECHR) and Commission.
  * Free REST API endpoint: `https://hudoc.echr.coe.int/app/query/results` for keyword and citation queries.

### C. BAILII (United Kingdom & Ireland)
* **Website:** [bailii.org](https://www.bailii.org/)
* **What it Covers:**
  * UK Supreme Court, Court of Appeal, High Court, and Irish courts.
  * Public legal information archive operated by the Institute of Advanced Legal Studies.

---

## 4. United States: Primary Open Repositories

### A. CourtListener (Free Law Project)
* **Website:** [courtlistener.com](https://www.courtlistener.com/)
* **Supported natively in Legalex:** Set `COURTLISTENER_API_TOKEN` in `backend/.env`.
* **What it Covers:**
  * 400+ jurisdictions, federal and state appellate courts.
  * Over 8 million searchable opinions and complete PACER docket data.
  * Automated citation normalization and citator services.

### B. Caselaw Access Project (CAP)
* **Website:** [case.law](https://case.law/)
* **Maintained by:** Harvard Law School.
* **What it Covers:**
  * 360 years of US legal history (6.7 million cases).
  * Bulk datasets and open API available for academic and commercial legal tech use.
