import asyncio
import motor.motor_asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27018")
    db = client.rxresolve
    total = await db.refill_cases.count_documents({})
    users = await db.users.count_documents({})
    events = await db.case_events.count_documents({})
    audits = await db.audit_logs.count_documents({})
    hero = await db.refill_cases.find_one({"id": "RX-10482"})
    print(f"DATABASE VERIFICATION:")
    print(f" - Cases in DB: {total}")
    print(f" - Users in DB: {users}")
    print(f" - Events in DB: {events}")
    print(f" - Audits in DB: {audits}")
    print(f" - Canonical Hero Case: {hero['id']} | Patient: {hero['patient_name']} | Status: {hero['status']} | Blocker: {hero['blocker']}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
