from fastapi import APIRouter, Depends

from auth import get_current_user

router = APIRouter(prefix="/metadata", tags=["metadata"])

ROLES = [
    "Engineer",
    "Designer",
    "Product Manager",
    "Engineering Manager",
    "Director",
    "QA",
    "DevOps",
    "Data Scientist",
]

ACHIEVEMENT_TYPES = [
    "Award",
    "Certification",
    "Milestone",
    "Recognition",
    "Promotion",
    "Other",
]


@router.get("/roles")
def get_roles(_: dict = Depends(get_current_user)):
    return {"roles": ROLES}


@router.get("/achievement-types")
def get_achievement_types(_: dict = Depends(get_current_user)):
    return {"achievement_types": ACHIEVEMENT_TYPES}
