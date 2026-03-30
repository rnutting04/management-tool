from datetime import date, datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from pymongo.database import Database

from auth import get_current_user, require_role
from db import get_db

router = APIRouter(prefix="/achievements", tags=["achievements"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if "member_id" in doc and isinstance(doc["member_id"], ObjectId):
        doc["member_id"] = str(doc["member_id"])
    return doc


# ---------- schemas ----------

class AchievementIn(BaseModel):
    description: str
    month: str = ""           # e.g. "2024-01"
    team_id: str | None = None


class AchievementUpdate(BaseModel):
    description: str | None = None
    month: str | None = None
    team_id: str | None = None


# ---------- routes ----------

@router.get("/")
def list_achievements(
    member_id: str | None = Query(default=None),
    team_id: str | None = Query(default=None),
    db: Database = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    query = {}
    if member_id:
        query["member_id"] = ObjectId(member_id)
    if team_id:
        query["team_id"] = team_id  # stored as plain string name
    return [_serialize(a) for a in db.achievements.find(query)]


@router.post("/", status_code=201)
def create_achievement(
    body: AchievementIn,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),
):
    doc = body.model_dump()
    if doc.get("member_id"):
        doc["member_id"] = ObjectId(doc["member_id"])
    # team_id is stored as a plain string name, not an ObjectId
    result = db.achievements.insert_one(doc)
    return _serialize(db.achievements.find_one({"_id": result.inserted_id}))


@router.get("/{achievement_id}")
def get_achievement(
    achievement_id: str,
    db: Database = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    doc = db.achievements.find_one({"_id": ObjectId(achievement_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return _serialize(doc)


@router.put("/{achievement_id}")
def update_achievement(
    achievement_id: str,
    body: AchievementUpdate,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "member_id" in updates:
        updates["member_id"] = ObjectId(updates["member_id"])
    # team_id stays as a plain string name
    result = db.achievements.update_one({"_id": ObjectId(achievement_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return _serialize(db.achievements.find_one({"_id": ObjectId(achievement_id)}))


@router.delete("/{achievement_id}")
def delete_achievement(
    achievement_id: str,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),
):
    result = db.achievements.delete_one({"_id": ObjectId(achievement_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return {"message": f"Achievement {achievement_id} successfully deleted from database", "deleted_id": achievement_id}
