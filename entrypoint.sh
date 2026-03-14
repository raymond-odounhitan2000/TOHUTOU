#!/bin/sh
set -e

echo "Starting TOHUTOU..."

cd /app
uv run python -m alembic upgrade head
echo "Database migrations applied."

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend started on :8000 (PID $BACKEND_PID)"

echo "Waiting for backend to be ready..."
python3 -c "
import urllib.request
import time
for i in range(10):
  try:
    urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)
    print('Backend ready.')
    break
  except Exception:
    if i == 9:
      print('WARNING: Backend did not respond after 30s (continuing anyway).')
    time.sleep(3)
"

cd /app/frontend
node server.js &
FRONTEND_PID=$!
echo "Frontend started on :3000 (PID $FRONTEND_PID)"

wait $BACKEND_PID $FRONTEND_PID
