#!/bin/sh
set -e

echo "Starting TOHUTOU..."

# Run Alembic migrations (backend est à la racine /app dans l'image)
cd /app
python -m alembic upgrade head
echo "Database migrations applied."

# Start backend (background, depuis /app)
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend started on :8000 (PID $BACKEND_PID)"

# Start frontend (Next.js standalone)
cd /app/frontend
node server.js &
FRONTEND_PID=$!
echo "Frontend started on :3000 (PID $FRONTEND_PID)"

# Wait for either process to exit
wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?

# If one exits, kill the other
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
exit $EXIT_CODE
