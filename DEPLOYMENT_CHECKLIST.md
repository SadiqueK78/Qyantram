# GCP Cloud Run Deployment Checklist

Follow this checklist to deploy Qyantram to Google Cloud Run with GitHub integration.

---

## ✅ Pre-Deployment Setup (Do This First)

- [ ] **Create GitHub Repository**
  - Push your entire project to GitHub
  - Ensure `.gitignore` excludes `.env`, `node_modules`, `__pycache__`, `venv`
  - Command: `git add . && git commit -m "Initial commit" && git push`

- [ ] **Create GCP Project**
  - Visit: https://console.cloud.google.com/
  - Create new project named "Qyantram"
  - Note down your `PROJECT_ID`

- [ ] **Enable Required APIs**
  - Go to APIs & Services → Library
  - Enable: **Cloud Run API**
  - Enable: **Cloud Build API**
  - Enable: **Container Registry API**
  - Enable: **Artifact Registry API**

- [ ] **Install gcloud CLI**
  - Download: https://cloud.google.com/sdk/docs/install
  - Run: `gcloud init`
  - Authenticate: `gcloud auth login`

- [ ] **Get OpenRouter API Key**
  - Visit: https://openrouter.ai/keys
  - Create/copy your API key
  - Store securely (you'll need this for env vars)

---

## 📦 Backend Deployment

### Phase 1: Prepare Backend

- [ ] **Update backend/.env**
  ```env
  FLASK_ENV=production
  OPENROUTER_API_KEY=sk-or-v1-your-actual-key
  ```

- [ ] **Verify Dockerfile exists**
  - File: `backend/Dockerfile`
  - Should include Python 3.10, Flask, gunicorn

- [ ] **Verify requirements.txt**
  - Should include `gunicorn==21.2.0`
  - Command: `grep gunicorn requirements.txt`

- [ ] **Test locally with Docker (optional)**
  ```bash
  cd backend
  docker build -t qyantram-backend .
  docker run -p 8080:8080 -e OPENROUTER_API_KEY=your_key qyantram-backend
  curl http://localhost:8080/health
  ```

### Phase 2: Deploy Backend to Cloud Run

**Via Google Cloud Console (Easiest):**

- [ ] **Go to Cloud Run**
  - URL: https://console.cloud.google.com/run
  - Click **CREATE SERVICE**

- [ ] **Configure Deployment Source**
  - Choose: **GitHub**
  - Click: **Set up with Cloud Build**
  - Authenticate with GitHub
  - Select repository: `quntum project`
  - Select branch: `main`

- [ ] **Configure Build**
  - Dockerfile location: `backend/Dockerfile`
  - Build context: `backend/`

- [ ] **Configure Service**
  - Service name: `qyantram-backend`
  - Region: `us-central1`
  - Memory: `2 GB`
  - CPU: `2`
  - Timeout: `3600` seconds
  - Max instances: `100`

- [ ] **Set Environment Variables**
  - `OPENROUTER_API_KEY` = your actual key
  - `FLASK_ENV` = `production`

- [ ] **Deploy**
  - Click **CREATE**
  - Wait for deployment to complete (5-10 minutes)

- [ ] **Get Backend URL**
  - Deployment succeeds → copy service URL
  - Format: `https://qyantram-backend-xxxxx-uc.a.run.app`
  - Save this URL

- [ ] **Enable Public Access (if needed)**
  - Go to service → Permissions
  - Add: `allUsers` with role `Cloud Run Invoker`
  - If private, skip this step

- [ ] **Test Backend**
  ```bash
  BACKEND_URL="https://qyantram-backend-xxxxx-uc.a.run.app"
  curl $BACKEND_URL/health
  ```

---

## 🎨 Frontend Deployment

### Phase 1: Prepare Frontend

- [ ] **Update frontend/.env**
  ```env
  VITE_API_BASE_URL=https://qyantram-backend-xxxxx-uc.a.run.app
  ```
  (Use the backend URL from previous step)

- [ ] **Update CORS in backend app.py**
  - Find: `CORS(app, ...)`
  - Ensure frontend URL is in allowed origins
  - Example: `"origins": ["https://qyantram-frontend-*.a.run.app", "http://localhost:3000"]`

- [ ] **Verify Dockerfile exists**
  - File: `frontend/Dockerfile`
  - Should use Node 18-alpine and serve

- [ ] **Test locally with Docker (optional)**
  ```bash
  cd frontend
  docker build -t qyantram-frontend .
  docker run -p 8080:8080 -e VITE_API_BASE_URL=http://localhost:8000 qyantram-frontend
  # Open http://localhost:8080
  ```

### Phase 2: Deploy Frontend to Cloud Run

- [ ] **Go to Cloud Run**
  - URL: https://console.cloud.google.com/run
  - Click **CREATE SERVICE**

- [ ] **Configure Deployment Source**
  - Choose: **GitHub**
  - Repository: `quntum project`
  - Branch: `main`
  - Dockerfile location: `frontend/Dockerfile`

- [ ] **Configure Service**
  - Service name: `qyantram-frontend`
  - Region: `us-central1` (same as backend!)
  - Memory: `512 MB`
  - CPU: `1`
  - Max instances: `50`

- [ ] **Set Environment Variables**
  - `VITE_API_BASE_URL` = backend URL from previous step

- [ ] **Deploy**
  - Click **CREATE**
  - Wait for completion

- [ ] **Get Frontend URL**
  - Copy service URL
  - Format: `https://qyantram-frontend-yyyyy-uc.a.run.app`

- [ ] **Enable Public Access**
  - Permissions → Add `allUsers` with `Cloud Run Invoker`

---

## 🔗 GitHub Integration Setup

### Option 1: Automatic CI/CD (Recommended)

- [ ] **Enable Cloud Build Integration**
  - Go to: Cloud Build → Settings
  - Enable GitHub app integration
  - Future: Every GitHub push auto-builds and deploys!

- [ ] **Create cloudbuild.yaml** (optional, for custom builds)
  - File location: `/cloudbuild.yaml` in repo root
  - See [DEPLOYMENT.md](./DEPLOYMENT.md) for example

### Option 2: Manual Builds

- [ ] **Build Trigger Setup**
  - Cloud Build → Triggers → Create Trigger
  - Source: GitHub repository
  - Branch: `main`
  - Build config: `Dockerfile`
  - Substitutions: `_DOCKERFILE=backend/Dockerfile`

---

## ✅ Testing & Verification

### Backend Tests

- [ ] **Health Check**
  ```bash
  curl https://qyantram-backend-xxxxx-uc.a.run.app/health
  ```
  Expected: `{"status": "healthy"}`

- [ ] **Simulate Endpoint**
  ```bash
  curl -X POST https://qyantram-backend-xxxxx-uc.a.run.app/simulate \
    -H "Content-Type: application/json" \
    -d '{"qubits": 2, "gates": [{"type": "H", "target": 0, "step": 0}]}'
  ```

- [ ] **Check Logs**
  ```bash
  gcloud run logs read qyantram-backend --region us-central1 --limit 50
  ```

### Frontend Tests

- [ ] **Open Frontend URL**
  - Visit: `https://qyantram-frontend-yyyyy-uc.a.run.app`
  - App should load

- [ ] **Create Simple Circuit**
  - Verify 3D visualization renders
  - Verify no console errors

- [ ] **Run Simulation**
  - Click simulate button
  - Verify results appear
  - Check Network tab → calls go to backend URL

- [ ] **Test Learning Mode**
  - Try learning mode
  - Verify AI explanations work
  - Check speech features

- [ ] **Check Logs**
  ```bash
  gcloud run logs read qyantram-frontend --region us-central1 --limit 50
  ```

---

## 🔒 Security & Production

- [ ] **Use Secret Manager for API Keys**
  ```bash
  # Create secret
  gcloud secrets create openrouter-api-key --data-file=-
  # Then reference in Cloud Run deployment
  ```

- [ ] **Set up Monitoring**
  - Go to Cloud Monitoring
  - Create dashboard
  - Add metrics: request count, latency, errors

- [ ] **Configure Auto-Scaling**
  - Backend: Min 0, Max 100, Timeout 3600s
  - Frontend: Min 0, Max 50, Timeout 60s

- [ ] **Set up Alerts**
  - Alert on error rate > 5%
  - Alert on latency > 2s
  - Alert on memory > 80%

---

## 💾 Maintenance

- [ ] **Monitor Costs**
  - Check Cloud Billing dashboard weekly
  - Set budget alerts

- [ ] **Update Dependencies**
  - Monthly: `pip list --outdated` (backend)
  - Monthly: `npm outdated` (frontend)
  - Rebuild Docker images after updates

- [ ] **Check Logs Regularly**
  - Monitor for errors
  - Watch performance metrics

- [ ] **Scale Configuration**
  - Adjust based on traffic patterns
  - More instances needed? Increase max instances
  - High memory usage? Increase memory allocation

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 503 Service Unavailable | Check backend logs: `gcloud run logs read qyantram-backend` |
| CORS Error | Update backend CORS config, redeploy |
| API calls fail | Verify `VITE_API_BASE_URL` is correct, check Network tab |
| Deployment stuck | Check Cloud Build → Builds for errors |
| High memory usage | Increase instance memory or optimize code |
| Timeouts | Increase timeout value (backend: 3600s for long sims) |

---

## 📊 Post-Deployment

- [ ] **Update README**
  - Add deployed URLs
  - Update getting started guide

- [ ] **Set up Monitoring Dashboard**
  - Track performance
  - Set alerts

- [ ] **Configure Custom Domain** (optional)
  - Add your own domain (e.g., qyantram.com)
  - Cloud Run → Service → Custom domains

- [ ] **Set up Analytics**
  - Track user sessions
  - Monitor feature usage

---

## 🎉 You're Live!

**Frontend**: https://qyantram-frontend-yyyyy-uc.a.run.app
**Backend**: https://qyantram-backend-xxxxx-uc.a.run.app

**Next Steps**:
1. Share the link with users
2. Monitor performance
3. Gather feedback
4. Plan v1.1 features

---

## Quick Reference

```bash
# Set project
gcloud config set project PROJECT_ID

# View services
gcloud run services list --region us-central1

# View logs
gcloud run logs read SERVICE_NAME --region us-central1

# Update environment variables
gcloud run services update SERVICE_NAME \
  --update-env-vars KEY=VALUE \
  --region us-central1

# Delete service
gcloud run services delete SERVICE_NAME --region us-central1

# View build history
gcloud builds list

# View build logs
gcloud builds log BUILD_ID
```

---

**For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)**
