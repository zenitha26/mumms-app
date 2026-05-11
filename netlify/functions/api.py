from fastapi import FastAPI, HTTPException, Body, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import os
from bson import ObjectId
from mangum import Mangum

app = FastAPI(title="MUMMS API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/mumms_inventory")
client = AsyncIOMotorClient(MONGO_URI)
db = client.mumms_inventory

# Helper to serialize MongoDB docs
def serialize_doc(doc):
    if not doc:
        return None
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Models
class Equipment(BaseModel):
    customId: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)

class Member(BaseModel):
    name: Optional[str] = None
    className: Optional[str] = None
    admissionNumber: Optional[str] = None
    birthday: Optional[str] = None
    whatsapp: Optional[str] = None
    role: Optional[str] = None
    boardType: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)

class Event(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    venue: Optional[str] = None
    dutyTeam: Optional[str] = None
    assignedMembers: List[str] = []
    mic: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)

class Log(BaseModel):
    equipmentId: Optional[str] = None
    equipmentName: Optional[str] = None
    memberDetails: Optional[str] = None
    purpose: Optional[str] = None
    date: Optional[str] = None
    checkoutTime: Optional[datetime] = None
    returnTime: Optional[datetime] = None
    signature: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)

class Attendance(BaseModel):
    eventId: Optional[str] = None
    eventTitle: Optional[str] = None
    userId: Optional[str] = None
    userName: Optional[str] = None
    type: Optional[str] = None # 'check-in' or 'check-out'
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)

class User(BaseModel):
    email: str
    password: str
    displayName: Optional[str] = None
    role: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)

class DutyAppeal(BaseModel):
    eventId: Optional[str] = None
    eventTitle: Optional[str] = None
    eventDate: Optional[str] = None
    memberName: Optional[str] = None
    memberEmail: Optional[str] = None
    reason: Optional[str] = None
    status: str = "Pending"
    monthKey: Optional[str] = None
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.now)

# Routes

@app.get('/api/equipment')
async def get_equipment():
    cursor = db.equipment.find().sort("name", 1)
    items = await cursor.to_list(length=1000)
    return [serialize_doc(item) for item in items]

@app.get('/api/members')
async def get_members():
    cursor = db.members.find().sort("name", 1)
    items = await cursor.to_list(length=1000)
    return [serialize_doc(item) for item in items]

@app.get('/api/events')
async def get_events():
    cursor = db.events.find().sort("date", 1)
    items = await cursor.to_list(length=1000)
    return [serialize_doc(item) for item in items]

@app.post('/api/events', status_code=status.HTTP_201_CREATED)
async def create_event(event: Event):
    event_dict = event.dict(exclude_unset=True)
    result = await db.events.insert_one(event_dict)
    event_dict["_id"] = str(result.inserted_id)
    return event_dict

@app.put('/api/events/{id}')
async def update_event(id: str, event: dict = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = await db.events.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": event},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(result)

@app.get('/api/duty_appeals')
async def get_duty_appeals():
    cursor = db.duty_appeals.find().sort("createdAt", -1)
    items = await cursor.to_list(length=1000)
    return [serialize_doc(item) for item in items]

@app.post('/api/duty_appeals', status_code=status.HTTP_201_CREATED)
async def create_duty_appeal(appeal: DutyAppeal):
    appeal_dict = appeal.dict(exclude_unset=True)
    result = await db.duty_appeals.insert_one(appeal_dict)
    appeal_dict["_id"] = str(result.inserted_id)
    return appeal_dict

@app.put('/api/duty_appeals/{id}')
async def update_duty_appeal(id: str, appeal: dict = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = await db.duty_appeals.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": appeal},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(result)

@app.get('/api/equipment/{id}')
async def get_equipment_by_id(id: str):
    item = await db.equipment.find_one({"customId": id})
    if not item and ObjectId.is_valid(id):
        item = await db.equipment.find_one({"_id": ObjectId(id)})
    if item:
        return serialize_doc(item)
    raise HTTPException(status_code=404, detail="Not found")

@app.post('/api/equipment/bulk', status_code=status.HTTP_201_CREATED)
async def create_equipment_bulk(items: List[dict] = Body(...)):
    try:
        result = await db.equipment.insert_many(items)
        return {"message": "Success", "count": len(result.inserted_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put('/api/equipment/{id}')
async def update_equipment(id: str, equipment: dict = Body(...)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = await db.equipment.find_one_and_update(
        {"_id": ObjectId(id)},
        {"$set": equipment},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return serialize_doc(result)

@app.get('/api/logs')
async def get_logs():
    cursor = db.logs.find().sort("createdAt", -1).limit(10)
    items = await cursor.to_list(length=10)
    return [serialize_doc(item) for item in items]

@app.post('/api/logs', status_code=status.HTTP_201_CREATED)
async def create_log(log: Log):
    log_dict = log.dict(exclude_unset=True)
    result = await db.logs.insert_one(log_dict)
    log_dict["_id"] = str(result.inserted_id)
    return log_dict

@app.put('/api/logs/return/{equipmentId}')
async def return_equipment(equipmentId: str):
    result = await db.logs.find_one_and_update(
        {"equipmentId": equipmentId, "returnTime": None},
        {"$set": {"returnTime": datetime.now()}},
        sort=[("createdAt", -1)],
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="No open log found for this equipment")
    return serialize_doc(result)

@app.delete('/api/equipment/{id}')
async def delete_equipment(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    result = await db.equipment.delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"message": "Deleted"}

@app.post('/api/attendance', status_code=status.HTTP_201_CREATED)
async def create_attendance(attendance: Attendance):
    attendance_dict = attendance.dict(exclude_unset=True)
    result = await db.attendance.insert_one(attendance_dict)
    attendance_dict["_id"] = str(result.inserted_id)
    return attendance_dict

@app.post('/api/auth/login')
async def login(credentials: dict = Body(...)):
    email = credentials.get("email")
    password = credentials.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    user = await db.users.find_one({"email": email.lower(), "password": password})
    if user:
        return {"success": True, "role": user.get("role"), "name": user.get("displayName")}
    else:
        raise HTTPException(status_code=401, detail="වැරදි ඊමේල් එකක් හෝ පාස්වර්ඩ් එකක්")

@app.post('/api/auth/seed')
async def seed_users():
    await db.users.delete_many({})
    users = [
        {'email': 'revdilshanstbenedictscollegemedia@gmail.com', 'password': 'Dilshan2026@', 'displayName': 'Rev. Bro. Dilshan', 'role': 'MIC'},
        {'email': 'senithastbenedictscollegemedia@gmail.com', 'password': 'Senitha2026@', 'displayName': 'Master Senitha', 'role': 'President'},
        {'email': 'thisumstbenedictscollegemedia@gmail.com', 'password': 'Thisum2026@', 'displayName': 'Master Thisum', 'role': 'Photographer'},
        {'email': 'dabarestbenedictscollegemedia@gmail.com', 'password': 'Dabare2026@', 'displayName': 'Master Dabare', 'role': 'Photographer'},
        {'email': 'mihinulastbenedictscollegemedia@gmail.com', 'password': 'Mihinula2026@', 'displayName': 'Master Mihinula', 'role': 'Photographer'},
        {'email': 'ashenstbenedictscollegemedia@gmail.com', 'password': 'Ashen2026@', 'displayName': 'Master Ashen', 'role': 'Vice President'},
        {'email': 'jovelstbenedictscolllegemedia@gmail.com', 'password': 'Jovel2026@', 'displayName': 'Master Jovel Adisha', 'role': 'Co-ordinator'},
        {'email': 'nethulastbenedictscollegemedia@gmail.com', 'password': 'Nethula2026@', 'displayName': 'Master Nethula Silva', 'role': 'Photographer'}
    ]
    for u in users:
        u["createdAt"] = datetime.now()
    result = await db.users.insert_many(users)
    return {"message": "Users seeded", "count": len(result.inserted_ids)}

# Mangum handler for Netlify
handler = Mangum(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
