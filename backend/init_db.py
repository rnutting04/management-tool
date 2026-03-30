from db import get_db
from dotenv import load_dotenv
load_dotenv()

db = next(get_db())

db.teams.drop()
db.members.drop()
db.achievements.drop()
db.metadata.drop()

db.teams.insert_many([
    {
        "name": "Alpha Team",
        "description": "Core product team",
        "location": "New York",
        "leader": {"name": "Jane Smith", "is_direct_staff": True},
        "employee_count": 8,
        "org_leader": "Alice VP",
    },
    {
        "name": "Beta Team",
        "description": "Design and UX team",
        "location": "Austin",
        "leader": {"name": "John Doe", "is_direct_staff": False},
        "employee_count": 12,
        "org_leader": None,
    },
    {
        "name": "Gamma Team",
        "description": "Infrastructure team",
        "location": "New York",
        "leader": {"name": "Sara Lee", "is_direct_staff": True},
        "employee_count": 5,
        "org_leader": "Alice VP",
    },
    {
        "name": "Delta Team",
        "description": "Data analytics team",
        "location": "Remote",
        "leader": {"name": "Mike Chen", "is_direct_staff": False},
        "employee_count": 9,
        "org_leader": "Bob Director",
    },
])

# Leaders are included as members so the dashboard can resolve their co_located status
db.members.insert_many([
    # Alpha Team — leader co-located, 1 non-direct member → 25% non-direct ratio
    {"name": "Jane Smith",  "email": "jane@company.com",   "team_id": "Alpha Team", "role": "team lead",       "co_located": True,  "is_direct_staff": True},
    {"name": "Alice Wong",  "email": "alice@company.com",  "team_id": "Alpha Team", "role": "engineer",        "co_located": True,  "is_direct_staff": True},
    {"name": "Diana Park",  "email": "diana@company.com",  "team_id": "Alpha Team", "role": "engineer",        "co_located": True,  "is_direct_staff": False},
    {"name": "Henry Moore", "email": "henry@company.com",  "team_id": "Alpha Team", "role": "senior engineer", "co_located": True,  "is_direct_staff": True},
    # Beta Team — leader NOT co-located, all non-direct → 100% non-direct ratio
    {"name": "John Doe",    "email": "john@company.com",   "team_id": "Beta Team",  "role": "team lead",       "co_located": False, "is_direct_staff": False},
    {"name": "Bob Kim",     "email": "bob@company.com",    "team_id": "Beta Team",  "role": "designer",        "co_located": False, "is_direct_staff": False},
    {"name": "Eve Turner",  "email": "eve@company.com",    "team_id": "Beta Team",  "role": "developer",       "co_located": False, "is_direct_staff": False},
    # Gamma Team — leader co-located, all direct → 0% non-direct ratio
    {"name": "Sara Lee",    "email": "sara@company.com",   "team_id": "Gamma Team", "role": "team lead",       "co_located": True,  "is_direct_staff": True},
    {"name": "Carlos Ruiz", "email": "carlos@company.com", "team_id": "Gamma Team", "role": "manager",         "co_located": True,  "is_direct_staff": True},
    # Delta Team — leader NOT co-located, all non-direct → 100% non-direct ratio
    {"name": "Mike Chen",   "email": "mike@company.com",   "team_id": "Delta Team", "role": "team lead",       "co_located": False, "is_direct_staff": False},
    {"name": "Frank Hall",  "email": "frank@company.com",  "team_id": "Delta Team", "role": "analyst",         "co_located": True,  "is_direct_staff": False},
    {"name": "Grace Patel", "email": "grace@company.com",  "team_id": "Delta Team", "role": "analyst",         "co_located": False, "is_direct_staff": False},
])

db.achievements.insert_many([
    {"team_id": "Alpha Team", "month": "2024-01", "description": "Launched v2 API"},
    {"team_id": "Beta Team",  "month": "2024-01", "description": "Redesigned dashboard"},
])

db.metadata.insert_many([
    {"type": "role", "value": "engineer"},
    {"type": "role", "value": "designer"},
    {"type": "achievement_type", "value": "launch"},
])

print("DB seeded successfully")
