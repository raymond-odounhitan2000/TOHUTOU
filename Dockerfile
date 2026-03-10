FROM node:20-bookworm-slim AS frontend


WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

COPY frontend .
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

COPY backend/app ./app
COPY backend/alembic.ini .

COPY --from=frontend /frontend/.next/standalone ./frontend
COPY --from=frontend /frontend/.next/static ./frontend/.next/static
COPY --from=frontend /frontend/public ./frontend/public

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]