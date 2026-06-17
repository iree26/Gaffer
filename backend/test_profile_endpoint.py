"""
Quick smoke-test for the profile endpoints.
Run: python test_profile_endpoint.py
"""
import json, sys

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

ERRORS = []

def check(label, condition, detail=""):
    if condition:
        print(f"  ✅ {label}")
    else:
        print(f"  ❌ {label} — {detail}")
        ERRORS.append(label)

# ── 1. Register a test user ────────────────────────────────────────────────
print("\n[1] Register test user")
r = client.post("/api/users/register", json={
    "username": "_testuser_profile",
    "password": "testpass123",
    "expertise": "beginner",
})
check("register 200 or 409", r.status_code in (200, 409), r.text)

# ── 2. GET /api/profile/{username} ─────────────────────────────────────────
print("\n[2] GET /api/profile/{username}")
r = client.get("/api/profile/_testuser_profile")
check("status 200", r.status_code == 200, r.text)
check("Content-Type is JSON", "application/json" in r.headers.get("content-type", ""))

body = r.json()
check("response is dict (not string)", isinstance(body, dict), type(body).__name__)
check("has 'username' key", "username" in body)
check("has 'display_name' key", "display_name" in body)
check("has 'stars' key", "stars" in body)
check("has 'rank' key", "rank" in body)
check("has 'badges' key", "badges" in body)
check("has 'accuracy' key", "accuracy" in body)
check("accuracy is string ending in %", isinstance(body.get("accuracy"), str) and body["accuracy"].endswith("%"))
check("followers_count is int", isinstance(body.get("followers_count"), int))
check("recent_posts is list", isinstance(body.get("recent_posts"), list))
check("recent_predictions is list", isinstance(body.get("recent_predictions"), list))

print(f"\n  Profile response keys: {list(body.keys())}")

# ── 3. GET /user/{user_id} (was crashing with rank=0) ──────────────────────
print("\n[3] GET /user/{user_id} (rank=0 fix)")
r2 = client.get("/user/_testuser_profile")
check("status 200", r2.status_code == 200, r2.text)
body2 = r2.json()
check("response is dict", isinstance(body2, dict))
check("rank >= 0", body2.get("rank", -1) >= 0)

# ── 4. GET /api/profile/{username}/followers ───────────────────────────────
print("\n[4] GET /api/profile/{username}/followers")
r3 = client.get("/api/profile/_testuser_profile/followers")
check("status 200", r3.status_code == 200, r3.text)
check("has 'followers' list", "followers" in r3.json())

# ── 5. GET /api/profile/{username}/following ───────────────────────────────
print("\n[5] GET /api/profile/{username}/following")
r4 = client.get("/api/profile/_testuser_profile/following")
check("status 200", r4.status_code == 200, r4.text)
check("has 'following' list", "following" in r4.json())

# ── 6. GET /api/profile/{username}/predictions ─────────────────────────────
print("\n[6] GET /api/profile/{username}/predictions")
r5 = client.get("/api/profile/_testuser_profile/predictions")
check("status 200", r5.status_code == 200, r5.text)
check("has 'predictions' list", "predictions" in r5.json())

# ── 7. GET /api/profile/{username}/posts ───────────────────────────────────
print("\n[7] GET /api/profile/{username}/posts")
r6 = client.get("/api/profile/_testuser_profile/posts")
check("status 200", r6.status_code == 200, r6.text)
check("has 'posts' list", "posts" in r6.json())

# ── 8. 404 on unknown username ─────────────────────────────────────────────
print("\n[8] GET /api/profile/unknown_xyz_404")
r7 = client.get("/api/profile/unknown_xyz_404_gaffer")
check("status 404", r7.status_code == 404, r7.text)

# ── 9. OpenAPI schema check ─────────────────────────────────────────────────
print("\n[9] OpenAPI schema — profile endpoint typed")
r8 = client.get("/openapi.json")
check("openapi.json 200", r8.status_code == 200)
schema = r8.json()
paths = schema.get("paths", {})
profile_path = paths.get("/api/profile/{username}", {})
get_op = profile_path.get("get", {})
responses = get_op.get("responses", {})
ok_resp = responses.get("200", {})
content = ok_resp.get("content", {})
json_content = content.get("application/json", {})
schema_ref = json_content.get("schema", {})
check("schema has $ref or properties (not plain string)", "$ref" in schema_ref or "properties" in schema_ref, str(schema_ref))

# ── Summary ────────────────────────────────────────────────────────────────
print(f"\n{'='*50}")
if ERRORS:
    print(f"❌ {len(ERRORS)} check(s) FAILED: {ERRORS}")
    sys.exit(1)
else:
    print(f"✅ All checks passed!")
