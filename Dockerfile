# =========================================================================
# Hugging Face Spaces (Docker SDK) — single container serving both:
#   - the built React (Vite) frontend as static files
#   - the FastAPI backend API
# on the ONE port HF Spaces exposes (7860).
# =========================================================================

# ---- Stage 1: build the frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /frontend

COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci

COPY Frontend/ .

# Built as same-origin: empty string means the frontend calls relative
# paths ("/api/v1/..."), which resolve to this same container/domain.
# See the client.js fix — "" must NOT fall back to localhost.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Stage 2: backend + serve the built frontend ----
FROM python:3.11-slim
WORKDIR /app

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/ .

# Drop the built frontend into ./static — main.py serves it from there
COPY --from=frontend-build /frontend/dist ./static

# HF Spaces (Docker SDK) always routes traffic to port 7860
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
