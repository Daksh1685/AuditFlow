# AuditFlow

AuditFlow is a compliance intelligence platform built for financial institutions operating under Indian regulatory frameworks. It automates the most time-consuming parts of compliance work — gap analysis, regulatory monitoring, document management, and audit trail generation — through a combination of large language models, semantic search, and structured data pipelines.

The system is designed around the assumption that compliance teams spend most of their time doing things machines can do faster: reading circulars, cross-referencing policy clauses, flagging gaps, and maintaining records. AuditFlow handles all of that, leaving analysts free for higher-order judgment.

---

# File Structure
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
venv\Scripts\activate       
pip install -r requirements.txt
cp .env.example .env         
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


## Deployment

Deploy the backend to Render first. Set all environment variables in the Render dashboard, use `backend` as the root directory, `pip install -r requirements.txt` as the build command, and `python run.py` as the start command.

Once the backend is live, take the Render URL and set it as `BACKEND_URL` in your Vercel project. Also update `CORS_ORIGINS` on the Render side to include your Vercel domain. Then deploy the frontend to Vercel with `frontend` as the root directory.

---


