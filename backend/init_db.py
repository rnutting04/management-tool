from db import get_db
from dotenv import load_dotenv
load_dotenv()

db = next(get_db())

db.teams.drop()
db.members.drop()
db.achievements.drop()
db.metadata.drop()

db.teams.insert_many([
    {"name": "Alpha Team", "location": "New York", "leader": {"name": "Jane Smith", "is_direct_staff": True}, "employee_count": 8},
    {"name": "Beta Team", "location": "Austin", "leader": {"name": "John Doe", "is_direct_staff": False}, "employee_count": 12},
    {"name": "Gamma Team", "location": "New York", "leader": {"name": "Sara Lee", "is_direct_staff": True}, "employee_count": 5},
])

db.members.insert_many([
    {"name": "Alice", "team_id": "Alpha Team", "role": "engineer", "co_located": True},
    {"name": "Bob", "team_id": "Beta Team", "role": "designer", "co_located": False},
    {"name": "Carlos", "team_id": "Gamma Team", "role": "manager", "co_located": True},
])

db.achievements.insert_many([
    {"team_id": "Alpha Team", "month": "2024-01", "description": "Launched v2 API"},
    {"team_id": "Beta Team", "month": "2024-01", "description": "Redesigned dashboard"},
])

db.metadata.insert_many([
    {"type": "role", "value": "engineer"},
    {"type": "role", "value": "designer"},
    {"type": "achievement_type", "value": "launch"},
])

print("DB seeded successfully")