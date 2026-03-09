# --- Stage 1: Build frontend ---
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./

ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# --- Stage 2: Final image ---
FROM python:3.12-slim

# Install Node.js runtime for Next.js
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get purge -y curl && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# --- Backend ---
WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/alembic.ini ./
COPY backend/app/ ./app/

# --- Frontend (from build stage) ---
WORKDIR /app/frontend

COPY --from=frontend-build /app/frontend/.next/standalone/. ./
COPY --from=frontend-build /app/frontend/.next/static ./.next/static
COPY --from=frontend-build /app/frontend/public ./public

# --- Entrypoint ---
WORKDIR /app
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 8000 3000

CMD ["./entrypoint.sh"]
