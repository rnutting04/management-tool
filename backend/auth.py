import base64
import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Callable

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt as _bcrypt
from pydantic import BaseModel
from pymongo.database import Database

from db import get_db

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

ROLES = ("admin", "viewer")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------- helpers ----------

def _prehash(plain: str) -> str:
    """SHA-256 → base64 so bcrypt always receives ≤ 44 bytes (bcrypt limit: 72)."""
    digest = hashlib.sha256(plain.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(_prehash(plain).encode(), _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(_prehash(plain).encode(), hashed.encode())


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": subject, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db),
) -> dict:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = db.users.find_one({"email": email}, {"password": 0})
    if user is None:
        raise credentials_exc

    user["_id"] = str(user["_id"])
    return user


def require_role(*allowed_roles: str) -> Callable:
    """
    Dependency factory for role-based access control.

    Usage:
        @router.delete("/{id}")
        def delete_item(..., _: dict = require_role("admin")):
            ...
    """
    def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {list(allowed_roles)}",
            )
        return current_user

    return Depends(_check)


# ---------- schemas ----------

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "viewer"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- routes ----------

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Database = Depends(get_db)):
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {list(ROLES)}")

    if db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # First user in the system automatically becomes admin.
    role = "admin" if db.users.count_documents({}) == 0 else "viewer"

    db.users.insert_one({
        "email": body.email,
        "name": body.name,
        "password": hash_password(body.password),
        "role": role,
    })
    return TokenResponse(access_token=create_access_token(body.email))


@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_db),
):
    user = db.users.find_one({"email": form.username})
    if not user or not verify_password(form.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_access_token(user["email"]))


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
