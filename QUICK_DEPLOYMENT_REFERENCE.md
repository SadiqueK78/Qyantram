# 🚀 Qyantram Deployment - One-Page Quick Reference

## Essential Commands

### 1️⃣ Before You Start
```bash
# Push code to GitHub
git add .
git commit -m "Deployment: Add Docker & GCP files"
git push

# Get your info ready
# - GCP Project ID: [get from console]
# - OpenRouter API Key: [from openrouter.ai/keys]
# - GitHub Username: [your username]
```

### 2️⃣ GCP Setup (5 minutes)
```bash
# Install gcloud
# macOS: brew install google-cloud-sdk
# Linux/Windows: https://cloud.google.com/sdk/docs/install

# Initialize
gcloud init
gcloud auth login
gcloud config set project YOUR-PROJECT-ID

# Enable APIs (do in Cloud Console - easier)
# Go to APIs & Services → Library
# Search & Enable:
#   - Cloud Run API
#   - Cloud Build API
#   - Container Registry API
#   - Artifact Registry API
```

### 3️⃣ Deploy Backend (10 minutes)

**Via Cloud Console (Easiest):**
1. Go to: https://console.cloud.google.com/run
2. Click **CREATE SERVICE**
3. Source: **GitHub** → Connect & select your repo
4. Dockerfile: `backend/Dockerfile`
5. Service name: `qyantram-backend`
6. Region: `us-central1`
7. Memory: `2 GB`, CPU: `2`
8. Environment vars:
   - `OPENROUTER_API_KEY=your-key`
   - `FLASK_ENV=production`
9. Click **CREATE** → Wait 10 min

**Via CLI:**
```bash
gcloud run deploy qyantram-backend \
  --source . \
  --source-dir backend \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars OPENROUTER_API_KEY=your-key,FLASK_ENV=production

# Save the URL:
# https://qyantram-backend-xxxxx-uc.a.run.app
```

### 4️⃣ Deploy Frontend (10 minutes)

**Via Cloud Console:**
1. Same as backend BUT:
2. Dockerfile: `frontend/Dockerfile`
3. Service name: `qyantram-frontend`
4. Memory: `512 MB`, CPU: `1`
5. Environment vars:
   - `VITE_API_BASE_URL=https://qyantram-backend-xxxxx-uc.a.run.app`

**Via CLI:**
```bash
gcloud run deploy qyantram-frontend \
  --source . \
  --source-dir frontend \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars VITE_API_BASE_URL=https://qyantram-backend-xxxxx-uc.a.run.app
```

### 5️⃣ Enable Public Access

```bash
# For each service (backend & frontend):
gcloud run services add-iam-policy-binding SERVICE_NAME \
  --member=allUsers \
  --role=roles/run.invoker \
  --region us-central1
```

### 6️⃣ Test
```bash
# Backend health check
curl https://qyantram-backend-xxxxx-uc.a.run.app/health

# View logs
gcloud run logs read qyantram-backend --region us-central1 --limit 50
gcloud run logs read qyantram-frontend --region us-central1 --limit 50

# Open frontend
# https://qyantram-frontend-yyyyy-uc.a.run.app
```

---

## Files Created For You

### Dockerfiles (Production-Ready)
- `frontend/Dockerfile` - React/Vite build + serve
- `backend/Dockerfile` - Python/Flask + Gunicorn
- `.dockerignore` files for both (optimized build context)

### Docker Testing
- `docker-compose.yml` - Local development stack
- `DOCKER_QUICKSTART.md` - Testing guide

### Deployment Guides
- **`DEPLOYMENT_START_HERE.md`** ← Read this first!
- **`DEPLOYMENT_CHECKLIST.md`** ← Use this for step-by-step
- `DEPLOYMENT.md` - Comprehensive reference (100+ page)
- `ARCHITECTURE.md` - System design & diagrams
- `DOCKER_QUICKSTART.md` - Local Docker testing

### Configuration
- `backend/requirements.txt` - Updated with gunicorn
- `frontend/.env.example` - Template
- `backend/.env.example` - Template

---

## Environment Variables Needed

### Backend (Google Cloud)
```
OPENROUTER_API_KEY = sk-or-v1-your-actual-key
FLASK_ENV = production
```

### Frontend (Google Cloud)
```
VITE_API_BASE_URL = https://qyantram-backend-xxxxx-uc.a.run.app
```

---

## Key URLs

```
GCP Console:     https://console.cloud.google.com
Cloud Run:       https://console.cloud.google.com/run
Cloud Build:     https://console.cloud.google.com/cloud-build
Artifact Registry: https://console.cloud.google.com/artifacts

After Deployment:
Frontend:  https://qyantram-frontend-yyyyy-uc.a.run.app
Backend:   https://qyantram-backend-xxxxx-uc.a.run.app
```

---

## Useful gcloud Commands

```bash
# List services
gcloud run services list --region us-central1

# View service details
gcloud run services describe qyantram-backend --region us-central1

# Update env vars
gcloud run services update qyantram-backend \
  --update-env-vars KEY=VALUE \
  --region us-central1

# View logs (real-time)
gcloud run logs read qyantram-backend --region us-central1 -f

# Delete service
gcloud run services delete qyantram-backend --region us-central1

# List builds
gcloud builds list

# View build details
gcloud builds log BUILD_ID
```

---

## Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | View build logs: `gcloud builds log <ID>` |
| 503 error | Check service logs, verify env vars set |
| CORS error | Update backend CORS, redeploy |
| Can't reach backend from frontend | Check `VITE_API_BASE_URL` in frontend env vars |
| High memory | Increase allocation or optimize code |
| Slow startup | Check if it's cold start (normal) or crashed (check logs) |

---

## Cost Estimate

```
Free Tier: 2M requests/month + 360k GB-seconds
Typical usage (100k requests/day): $5-15/month
Peak usage (1M requests/day): $50-100/month

Note: OpenRouter API charges separately
```

---

## GitHub Integration (Auto-Deploy)

After first manual deployment, GitHub integration auto-deploys when you:

```bash
git push
# Cloud Build detects changes
# Automatically builds & deploys both services
# ~15 minutes total
```

To set up triggers:
1. Cloud Build → Triggers
2. Create new trigger
3. Connect GitHub repo
4. Set branch: `main`
5. Build config: Dockerfile

---

## Local Testing Before Cloud Deploy

```bash
# Test with Docker Compose
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000

# Check both work
curl http://localhost:8000/health
```

---

## Monitoring & Alerts (Optional)

```bash
# View dashboard
# Cloud Console → Cloud Monitoring → Dashboards

# Create alert
# Monitoring → Alerting Policies → Create Policy
# Alert on:
#   - Error rate > 5%
#   - Latency > 2 seconds
#   - Memory > 80%
```

---

## Security Notes

✅ HTTPS everywhere (auto)
✅ No hardcoded secrets (use env vars)
✅ CORS configured
✅ Auto-restart on failure
❌ DON'T commit .env files
❌ DON'T share API keys in public repos
✓ Use Cloud Secret Manager for prod (advanced)

---

## Next Steps After Going Live

1. Share the frontend URL with users
2. Monitor performance (Cloud Monitoring)
3. Watch logs for errors
4. Gather user feedback
5. Plan improvements

---

## 📚 Read These First

1. **`DEPLOYMENT_START_HERE.md`** - Overview & decision guide
2. **`DEPLOYMENT_CHECKLIST.md`** - Step-by-step deployment
3. **`DEPLOYMENT.md`** - Full reference manual
4. **`ARCHITECTURE.md`** - System design & scaling

---

## Got Questions?

- **"Where do I start?"** → `DEPLOYMENT_START_HERE.md`
- **"Step-by-step please"** → `DEPLOYMENT_CHECKLIST.md`
- **"How does it work?"** → `ARCHITECTURE.md`
- **"I want to test locally first"** → `DOCKER_QUICKSTART.md`
- **"Advanced setup"** → `DEPLOYMENT.md`

---

**Total time to deployment: ~45 minutes ⏱️**

**Let's go! 🚀**
