#!/bin/sh
set -e

echo "Starting TOHUTOU..."

cd /app
uv run python -m alembic upgrade head
echo "Database migrations applied."

uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend started on :8000 (PID $BACKEND_PID)"

cd /app/frontend
node server.js &
FRONTEND_PID=$!
echo "Frontend started on :3000 (PID $FRONTEND_PID)"

while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
  sleep 1
done
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
exit 2
