from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from pymongo.database import Database

from auth import get_current_user, require_role
from db import get_db

router = APIRouter(prefix="/members", tags=["members"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ---------- schemas ----------

class MemberIn(BaseModel):
    name: str
    email: str
    role: str = ""
    team_id: str | None = None


class MemberUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    team_id: str | None = None


# ---------- routes ----------

@router.get("/")
def list_members(
    team_id: str | None = Query(default=None),
    db: Database = Depends(get_db),
    _: dict = Depends(get_current_user),          # any authenticated user
):
    query = {}
    if team_id:
        query["team_id"] = team_id  # stored as plain string name
    return [_serialize(m) for m in db.members.find(query)]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_member(
    body: MemberIn,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),
):
    if db.members.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already in use")
    doc = body.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = db.members.insert_one(doc)
    return _serialize(db.members.find_one({"_id": result.inserted_id}))


@router.get("/{member_id}")
def get_member(
    member_id: str,
    db: Database = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    doc = db.members.find_one({"_id": ObjectId(member_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Member not found")
    return _serialize(doc)


@router.put("/{member_id}")
def update_member(
    member_id: str,
    body: MemberUpdate,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    # team_id is a plain string name, no conversion needed
    result = db.members.update_one({"_id": ObjectId(member_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return _serialize(db.members.find_one({"_id": ObjectId(member_id)}))


@router.delete("/{member_id}")
def delete_member(
    member_id: str,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),              # admin only
):
    result = db.members.delete_one({"_id": ObjectId(member_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": f"Member {member_id} successfully deleted from database", "deleted_id": member_id}
