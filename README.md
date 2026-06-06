# AuditFlow

AuditFlow is a compliance intelligence platform built for financial institutions operating under Indian regulatory frameworks. It automates the most time consuming parts of compliance work gap analysis, regulatory monitoring, document management, and audit trail generation through a combination of large language models, semantic search, and structured data pipelines.

The system is designed around the assumption that compliance teams spend most of their time doing things machines can do faster: reading circulars, cross referencing policy clauses, flagging gaps, and maintaining records. AuditFlow handles all of that, leaving analysts free for higher-order judgment.

---

## What it does

**Policy Gap Analyzer**

Upload a regulatory amendment (PDF, DOCX, or plain text) and select a target department. The system parses the document, runs each clause through a semantic similarity search against your indexed internal SOPs, and returns a section-by-section comparison flagging what is covered, what is partially addressed, and what is missing entirely. Results are exportable as structured PDF reports and logged to the audit ledger automatically.

**Regulatory Feeds**

A live feed of regulatory updates from SEBI and RBI, scraped and categorized by severity. Each item can be bookmarked, marked as reviewed, or run through the impact analysis engine, which uses Groq's llama-3.3-70b to assess how a given circular affects your organization's current compliance posture.

**Ask AI**

A conversational interface backed by Groq's language model. Analysts can ask natural-language questions about regulatory requirements, get plain-English summaries of complex circulars, or request draft responses to compliance queries. Every conversation is logged to the audit trail.

**Document Management**

Upload, tag, and manage internal compliance documents. All uploads are stored in Supabase object storage, chunked, embedded using Gemini's embedding model, and indexed in Qdrant for semantic retrieval. Documents are organized by department, tags, and expiry status.

**Audit Trail**

An append-only ledger of every action taken in the system document uploads, gap analyses, AI queries, feed reviews, and user management events. Designed for external auditor access and internal accountability.

**Admin Panel**

User management, role assignment, and system-level audit log inspection. Administrators can view per-user activity, retrieval latency metrics, and token usage across AI interactions.

---

## Authentication and roles

Registration is open but each new account defaults to read-only access. An administrator must promote the user to the appropriate role (`compliance`, `audit`, `legal`, `accounting`, or `global`) before they can perform write operations. The admin panel is accessible only to users with admin privileges, which must be set directly in the database.

## Folder Structure

```
AuditFlow/
├── backend/
│   ├── routers/          
│   ├── services/         
│   ├── models/         
│   ├── database/         
│   ├── utils/          
│   ├── config.py        
│   ├── main.py           
│   └── run.py           
└── frontend/
    ├── src/app/          
    ├── src/components/   
    ├── src/contexts/    
    ├── src/hooks/       
    └── src/lib/          
```

---

## Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| File storage | Supabase Storage |
| Vector search | Qdrant Cloud |
| Language model (chat, impact analysis) | Groq / llama-3.3-70b-versatile |
| Embeddings and OCR | Google Gemini (gemini-embedding-001, gemini-2.5-flash) |
| Frontend framework | Next.js 16 (TypeScript) |
| Authentication | JWT (access + refresh tokens) |

---

## Clone repository

```bash
git clone https://github.com/Daksh1685/AuditFlow.git
cd AuditFlow
```

---

## Running locally

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in your credentials
python run.py
```

The API will start at `http://localhost:8000`. Interactive docs are available at `/docs`.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

The development server starts at `http://localhost:3000`. API requests are proxied to the backend automatically via Next.js rewrites.

---
