# Auth Testing Playbook — MAHADEVI FURNITURES

## Credentials
- Admin: admin@mahadevifurnitures.com / Mahadevi@2026 (role: admin)
- No customer accounts exist.

## Step 1: MongoDB verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify: password_hash starts with `$2b$`, unique index on users.email, index on login_attempts.identifier.

## Step 2: API testing
```
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@mahadevifurnitures.com","password":"Mahadevi@2026"}'
curl -b cookies.txt $API/api/auth/me
```
Login returns the admin user object and sets access_token + refresh_token cookies; /me returns the same user.

## Step 3: Protected routes
```
curl -b cookies.txt -X POST $API/api/products -H "Content-Type: application/json" \
  -d '{"name":"Test Chair","category":"Chairs","price":999}'
curl $API/api/orders   # without cookies -> 401
```
