#!/usr/bin/env bash
# Test the AI timetable generation endpoint
# Usage: OPENAI_API_KEY=sk-xxx bash test-generate.sh

BASE_URL="${BASE_URL:-http://localhost:4000}"

echo "=== Testing AI Timetable Generation ==="
echo "Base URL: $BASE_URL"
echo ""

PROMPT='Generate a timetable for Department of Information Technology, IT (VIII-Sem), Room: IT Data Base Centre. Time Table for Jan-2026, effective from 12-01-2026. Working days: Monday to Friday. Time slots: 10:30am to 11:30am, 11:30am to 12:30pm, 12:30pm to 01:30pm, then Lunch 01:30pm to 02:30pm, then 02:30pm to 03:30pm, 03:30pm to 04:30pm, 04:30pm to 05:30pm. Subject: IT801 Major Project. Faculty members: SKS (Prof. S.K. Sharma), RRA (Prof. Ramratan Ahirwal), AM (Prof. A. Mishra), SS (Prof. S. Singh), HS (Prof. H. Sharma), AS (Prof. A. Singh), AB (Prof. A. Bajpai), Anil.S (Prof. Anil Survanshi). Class Coordinator: Prof. Ramratan Ahirwal (RRA), phone 9424458047. Class Co-coordinator: Prof. Anil Survanshi (Anil.S), phone 7566460723. Distribute the project sessions across the week with 2-3 faculty per session. Some sessions can span multiple hours (2-3 hours). Not all days need to be fully packed since it is 8th semester with just the major project.'

echo "Sending generation request..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/timetable/generate-ai" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": $(echo "$PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Timetable generated successfully!"
  echo ""
  
  # Extract ID from response
  ID=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['id'])" 2>/dev/null)
  
  if [ -n "$ID" ]; then
    echo "Timetable ID: $ID"
    echo ""
    
    # Fetch the HTML version
    echo "Fetching HTML view..."
    curl -s "$BASE_URL/api/timetable/generated/$ID/html" > /tmp/timetable_output.html
    echo "✅ HTML saved to /tmp/timetable_output.html"
    echo ""
    
    # Fetch all generated timetables
    echo "Fetching all generated timetables..."
    curl -s "$BASE_URL/api/timetable/generated" | python3 -m json.tool 2>/dev/null | head -20
  fi
  
  echo ""
  echo "=== Timetable JSON Data ==="
  echo "$BODY" | python3 -m json.tool 2>/dev/null | head -80
else
  echo "❌ Error generating timetable"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi
