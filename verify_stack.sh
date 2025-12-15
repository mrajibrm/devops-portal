#!/bin/bash

BASE_URL="http://localhost"

echo "🧪 Starting DevOps Portal Verification..."
echo "----------------------------------------"

# 1. Health Checks
echo "Checking Health Endpoints..."
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/auth/health | grep 200 > /dev/null && echo "✅ Auth Service: UP" || echo "❌ Auth Service: DOWN"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/catalog/health | grep 200 > /dev/null && echo "✅ Catalog Service: UP" || echo "❌ Catalog Service: DOWN"
curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/tickets/health | grep 200 > /dev/null && echo "✅ Ticket Service: UP" || echo "❌ Ticket Service: DOWN"

echo "----------------------------------------"

# 2. Login Flow
echo "Attempting Login (alice)..."
LOGIN_RES=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "user123"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ Login Successful! Token acquired."
else
  echo "❌ Login Failed."
  echo "Response: $LOGIN_RES"
  exit 1
fi

echo "----------------------------------------"

# 3. Create Ticket Flow
echo "Creating a Test Ticket..."
CREATE_RES=$(curl -s -X POST $BASE_URL/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Ticket", "description": "Verified via Script", "severity": "LOW"}')

TICKET_ID=$(echo $CREATE_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -n "$TICKET_ID" ]; then
  echo "✅ Ticket Created! ID: $TICKET_ID"
else
  echo "❌ Ticket Creation Failed."
  echo "Response: $CREATE_RES"
  exit 1
fi

echo "----------------------------------------"

# 4. List Tickets Flow
echo "Listing Tickets..."
LIST_RES=$(curl -s -X GET $BASE_URL/api/tickets \
  -H "Authorization: Bearer $TOKEN")

if [[ $LIST_RES == *"$TICKET_ID"* ]]; then
  echo "✅ Ticket verified in List."
else
  echo "❌ New Ticket not found in list."
  echo "Response: $LIST_RES"
fi

echo "----------------------------------------"
echo "🎉 Verification Complete!"
