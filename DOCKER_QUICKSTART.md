# Docker Quick Start Guide - Qyantram

This guide helps you build and run Qyantram locally using Docker.

## Prerequisites

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

## Option 1: Using Docker Compose (Recommended)

### Quick Start

```bash
# Navigate to project root
cd quntum\ project

# Build and run both services
docker-compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000

### Useful Commands

```bash
# Run in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose up --build

# Remove volumes (cleans up all data)
docker-compose down -v
```

---

## Option 2: Manual Docker Commands

### Build Backend

```bash
cd backend
docker build -t qyantram-backend:latest .
```

### Run Backend

```bash
docker run -p 8000:8080 \
  -e OPENROUTER_API_KEY=your_api_key_here \
  -e FLASK_ENV=production \
  qyantram-backend:latest
```

Backend is now available at: http://localhost:8000

### Build Frontend

```bash
cd frontend
docker build -t qyantram-frontend:latest .
```

### Run Frontend

```bash
docker run -p 3000:8080 \
  -e VITE_API_BASE_URL=http://localhost:8000 \
  qyantram-frontend:latest
```

Frontend is now available at: http://localhost:3000

---

## Testing the Deployment

### Test Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

### Test Simulation

```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "qubits": 2,
    "gates": [
      {"type": "H", "target": 0, "step": 0},
      {"type": "CNOT", "target": 1, "control": 0, "step": 1}
    ]
  }'
```

### Test Frontend

Open http://localhost:3000 in your browser and verify:
1. App loads
2. 3D visualization appears
3. You can create and run circuits
4. Learning mode works

---

## Troubleshooting

### Port Already in Use

If ports 3000 or 8000 are already in use:

```bash
# Use different ports
docker run -p 9000:8080 qyantram-backend:latest
docker run -p 9001:8080 qyantram-frontend:latest
```

Then update `docker-compose.yml` accordingly.

### API Connection Error

Frontend getting 403/CORS errors?

1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `VITE_API_BASE_URL` is set correctly
3. Check backend CORS settings in `app.py`

### Docker Build Fails

```bash
# Clear Docker cache and rebuild
docker-compose down -v
docker-compose up --build --force-recreate
```

### Out of Memory

Increase Docker memory in Desktop settings:
- Docker Desktop → Preferences → Resources → Memory (increase to 4GB+)

---

## Environment Variables

### For docker-compose.yml

Edit the file and set:

```yaml
environment:
  - OPENROUTER_API_KEY=your_actual_key_here
  - VITE_API_BASE_URL=http://backend:8080
```

Or use a `.env` file:

```bash
# Create .env file in project root
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Docker-compose will automatically load it
docker-compose up
```

---

## Production Considerations

These Docker images are optimized for **Google Cloud Run** but can run anywhere:

- Backend uses **Gunicorn** (production WSGI server)
- Frontend uses **serve** (production HTTP server)
- Both set to port `8080` (Cloud Run requirement)
- Health checks configured

### For Local Development

For faster iteration locally, use native commands:

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
python app.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## Push to Container Registry

### Google Artifact Registry

```bash
# Configure Docker for GCP
gcloud auth configure-docker gcr.io

# Build and tag
docker build -t gcr.io/PROJECT_ID/qyantram-backend:latest backend/
docker build -t gcr.io/PROJECT_ID/qyantram-frontend:latest frontend/

# Push to registry
docker push gcr.io/PROJECT_ID/qyantram-backend:latest
docker push gcr.io/PROJECT_ID/qyantram-frontend:latest
```

### Docker Hub

```bash
# Tag
docker tag qyantram-backend:latest yourusername/qyantram-backend:latest
docker tag qyantram-frontend:latest yourusername/qyantram-frontend:latest

# Push
docker push yourusername/qyantram-backend:latest
docker push yourusername/qyantram-frontend:latest
```

---

## Next Steps

1. ✅ Test locally with Docker
2. Push images to cloud registry
3. Deploy to Google Cloud Run (see [DEPLOYMENT.md](./DEPLOYMENT.md))
4. Set up CI/CD with GitHub Actions

---

For more information, see [Docker Documentation](https://docs.docker.com/) and [DEPLOYMENT.md](./DEPLOYMENT.md)
