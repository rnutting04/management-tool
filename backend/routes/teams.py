from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from pymongo.database import Database

from auth import get_current_user, require_role
from db import get_db

router = APIRouter(prefix="/teams", tags=["teams"])


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ---------- schemas ----------

class LeaderIn(BaseModel):
    name: str = ""
    is_direct_staff: bool = False


class TeamIn(BaseModel):
    name: str
    description: str = ""
    location: str = ""
    leader: LeaderIn = LeaderIn()
    employee_count: int | None = None
    org_leader: str | None = None


class TeamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    leader: LeaderIn | None = None
    employee_count: int | None = None
    org_leader: str | None = None


# ---------- routes ----------

@router.get("/")
def list_teams(
    db: Database = Depends(get_db),
    _: dict = Depends(get_current_user),          # any authenticated user
):
    return [_serialize(t) for t in db.teams.find()]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_team(
    body: TeamIn,
    db: Database = Depends(get_db),
    _: dict = require_role("admin", "manager"),   # admin or manager
):
    doc = {**body.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = db.teams.insert_one(doc)
    return _serialize(db.teams.find_one({"_id": result.inserted_id}))


@router.get("/{team_id}")
def get_team(
    team_id: str,
    db: Database = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    doc = db.teams.find_one({"_id": ObjectId(team_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Team not found")
    return _serialize(doc)


@router.put("/{team_id}")
def update_team(
    team_id: str,
    body: TeamUpdate,
    db: Database = Depends(get_db),
    _: dict = require_role("admin", "manager"),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = db.teams.update_one({"_id": ObjectId(team_id)}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return _serialize(db.teams.find_one({"_id": ObjectId(team_id)}))


@router.delete("/{team_id}")
def delete_team(
    team_id: str,
    db: Database = Depends(get_db),
    _: dict = require_role("admin"),              # admin only
):
    result = db.teams.delete_one({"_id": ObjectId(team_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": f"Team {team_id} successfully deleted from database", "deleted_id": team_id}
