from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

import auth
from routes import achievements, members, metadata, teams

app = FastAPI(title="Management App API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(members.router)
app.include_router(achievements.router)
app.include_router(metadata.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


# Lambda entrypoint
handler = Mangum(app)
