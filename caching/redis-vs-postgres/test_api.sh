#!/bin/bash

# A script to test API endpoints.
# It prints headers to Standard Error (>&2) and JSON to Standard Output,
# so you can pipe the output to `jq` for pretty-printing.
# Usage: ./test_api.sh | jq

# Redirect headers and spacing to stderr, so it doesn't interfere with the jq pipe
echo " " >&2
echo "=================================" >&2
echo "  API Performance Test Started   " >&2
echo "=================================" >&2
echo " " >&2

# 1. Health Check
echo "--- [1/6] Testing Health Check Endpoint ---" >&2
curl -s http://localhost:3000/health
echo -e "\n\n" >&2

# 2. Cache a new key-value pair
echo "--- [2/6] Caching a new key-value pair (POST /cache) ---" >&2
curl -s -X POST -H "Content-Type: application/json" \
-d '{"key": "user:profile:123", "value": "This is a sample user profile."}' \
http://localhost:3000/cache
echo -e "\n\n" >&2

# 3. Retrieve the cached key-value pair (Cache Hit)
echo "--- [3/6] Retrieving the cached value (GET /cache/:key - Cache Hit) ---" >&2
curl -s http://localhost:3000/cache/user:profile:123
echo -e "\n\n" >&2

# 4. Attempt to retrieve a non-existent key (Cache Miss)
echo "--- [4/6] Retrieving a non-existent value (GET /cache/:key - Cache Miss) ---" >&2
curl -s http://localhost:3000/cache/non-existent-key
echo -e "\n\n" >&2


# 5. Create a new user in the database
echo "--- [5/6] Creating a new user (POST /users) ---" >&2
# The output of this curl is captured by the variable, not piped, so it's safe.
USER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
-d '{"name": "Jane Doe", "email": "jane.doe@example.com"}' \
http://localhost:3000/users)

# We echo the variable's content to stdout so it CAN be piped to jq
echo "$USER_RESPONSE"

USER_ID=$(echo "$USER_RESPONSE" | jq '.user.id')
echo -e "\n>> User created with ID: $USER_ID\n\n" >&2


# 6. Retrieve the newly created user
echo "--- [6/6] Retrieving the new user (GET /users/:id) ---" >&2
if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
    echo "Could not get user ID from previous step. Skipping user retrieval test." >&2
    echo "This might be due to an error in user creation or jq not being installed." >&2
else
    # This curl's output goes to stdout so it can be piped to jq
    curl -s http://localhost:3000/users/$USER_ID
fi

echo -e "\n" >&2
echo "=================================" >&2
echo "       Test Run Complete         " >&2
echo "=================================" >&2
echo " " >&2