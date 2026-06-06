"""Seed: Creates admin users + sample regulatory feeds via Supabase REST."""
import asyncio, sys, uuid
from datetime import datetime, timezone

sys.path.insert(0, ".")
from database import get_db_client
from services.auth import hash_password

ADMIN_USERS = [
    {"username": "admin",       "email": "admin@auditflow.ai",  "password": "Admin@1234",   "role": "admin", "dept": "global"},
    {"username": "smoke_admin", "email": "smoke@auditflow.ai",  "password": "SmokeTest99!", "role": "admin", "dept": "global"},
]

SAMPLE_FEEDS = [
    {"title": "SEBI Master Circular on Stock Brokers 2024", "summary": "Comprehensive circular consolidating all regulations for registered stock brokers.", "source": "SEBI", "source_short": "SEBI", "category": "Securities Regulation", "url": "https://www.sebi.gov.in/", "is_critical": True, "severity": "high"},
    {"title": "RBI Digital Lending Guidelines Update", "summary": "Updated framework requiring FLDG caps and mandatory loan servicing account disclosures.", "source": "RBI", "source_short": "RBI", "category": "Digital Banking", "url": "https://www.rbi.org.in/", "is_critical": True, "severity": "high"},
    {"title": "FIU-IND Advisory on Virtual Digital Assets", "summary": "New reporting obligations for Virtual Digital Asset Service Providers including enhanced KYC.", "source": "FIU-IND", "source_short": "FIU-IND", "category": "AML/CFT", "url": "https://fiuindia.gov.in/", "is_critical": False, "severity": "medium"},
    {"title": "IRDAI Insurance Regulatory Framework Amendments", "summary": "Amendments to insurance product approval process and solvency margin requirements.", "source": "IRDAI", "source_short": "IRDAI", "category": "Insurance", "url": "https://www.irdai.gov.in/", "is_critical": False, "severity": "medium"},
    {"title": "SEBI Insider Trading Regulations Amendment 2024", "summary": "Mandatory structured digital databases for UPSI with access logs.", "source": "SEBI", "source_short": "SEBI", "category": "Market Integrity", "url": "https://www.sebi.gov.in/", "is_critical": True, "severity": "high"},
]


def seed():
    print("Connecting to Supabase...")
    db = get_db_client()
    now = datetime.now(timezone.utc).isoformat()

    print("\n→ Creating admin users...")
    for u in ADMIN_USERS:
        existing = db.table("users").select("id").eq("username", u["username"]).execute()
        if existing.data:
            print(f"  [SKIP] {u['username']} already exists")
            continue
        db.table("users").insert({
            "id": str(uuid.uuid4()),
            "username": u["username"],
            "email": u["email"],
            "hashed_password": hash_password(u["password"]),
            "role": u["role"],
            "department": u["dept"],
            "full_name": u["username"].replace("_", " ").title(),
            "is_active": True,
            "created_at": now,
        }).execute()
        print(f"  [CREATE] {u['username']} ({u['role']}) — password: {u['password']}")

    print("\n→ Creating regulatory feeds...")
    for f in SAMPLE_FEEDS:
        existing = db.table("regulatory_feeds").select("id").eq("title", f["title"]).execute()
        if existing.data:
            print(f"  [SKIP] {f['title'][:55]}...")
            continue
        db.table("regulatory_feeds").insert({
            "id": str(uuid.uuid4()),
            "created_at": now,
            "published_at": now,
            **f,
        }).execute()
        print(f"  [CREATE] {f['title'][:55]}...")

    print("\n✅ Seed complete!")
    print("\nAdmin credentials:")
    for u in ADMIN_USERS:
        print(f"  {u['username']} / {u['password']}")


if __name__ == "__main__":
    seed()
