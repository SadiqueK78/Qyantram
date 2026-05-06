# GCP Cloud Run Deployment Guide - Qyantram

This guide will walk you through deploying both the frontend and backend of Qyantram to Google Cloud Run with GitHub integration.

## Prerequisites

1. **Google Cloud Account** - Create at [google.com/cloud](https://console.cloud.google.com/)
2. **GitHub Repository** - Your project must be pushed to GitHub
3. **Google Cloud CLI** - Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
4. **Docker** (optional) - For local testing

---

## Part 1: Initial GCP Setup

### Step 1: Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **NEW PROJECT**
4. Enter project name: `Qyantram` (or your choice)
5. Click **CREATE**
6. Wait for the project to be created

### Step 2: Enable Required APIs

1. In Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable the following APIs:
   - **Cloud Run API**
   - **Cloud Build API**
   - **Container Registry API**
   - **Artifact Registry API**

To enable each:
- Click on the API
- Click **ENABLE**

### Step 3: Create a Service Account (Optional but Recommended)

1. Go to **APIs & Services** > **Service Accounts**
2. Click **CREATE SERVICE ACCOUNT**
3. Enter service account name: `qyantram-deployer`
4. Click **CREATE AND CONTINUE**
5. Grant roles:
   - Cloud Run Admin
   - Service Account User
6. Click **CONTINUE** and then **DONE**

### Step 4: Set Up Authentication

```bash
gcloud auth login
gcloud config set project PROJECT_ID
```

Replace `PROJECT_ID` with your actual GCP project ID.

---

## Part 2: Deploy Backend (Flask)

### Step 1: Prepare Backend for Cloud Run

1. Update `backend/.env` with production values:
```env
FLASK_ENV=production
OPENROUTER_API_KEY=your_api_key_here
```

2. Verify `app.py` has a health check endpoint:
```python
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200
```

3. Test locally with Docker (optional):
```bash
cd backend
docker build -t qyantram-backend:latest .
docker run -p 8080:8080 -e OPENROUTER_API_KEY=your_key qyantram-backend:latest
```

### Step 2: Deploy to Cloud Run via GitHub

**Option A: Using Cloud Console (Recommended for first-time)**

1. Go to **Cloud Run** in Google Cloud Console
2. Click **CREATE SERVICE**
3. In the deployment settings:
   - **Source**: Select **GitHub**
   - Click **Set up with Cloud Build**
4. **Authenticate with GitHub**:
   - Click **CONNECT** next to your GitHub account
   - Follow OAuth flow
   - Select your repository
   - Click **CONNECT**
5. Configure the service:
   - **Repository**: Select your `quntum project` repo
   - **Branch**: `main` (or your default branch)
   - **Dockerfile location**: `backend/Dockerfile`
6. Service settings:
   - **Service name**: `qyantram-backend`
   - **Region**: `us-central1` (or nearest to you)
   - **Memory**: `2 GB`
   - **CPU**: `2`
   - **Max instances**: `100`
   - **Timeout**: `3600` (for long quantum simulations)
7. Environment variables:
   - Click **Add variable**
   - Add: `OPENROUTER_API_KEY` = your actual key
   - Add: `FLASK_ENV` = `production`
8. Click **CREATE**

**Option B: Using gcloud CLI**

```bash
# Set project
gcloud config set project PROJECT_ID

# Deploy
gcloud run deploy qyantram-backend \
  --source . \
  --source-dir backend \
  --image gcr.io/PROJECT_ID/qyantram-backend \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --set-env-vars OPENROUTER_API_KEY=your_api_key,FLASK_ENV=production
```

### Step 3: Enable Public Access (if needed)

1. After deployment completes, go to **Cloud Run** services
2. Click on `qyantram-backend`
3. Go to **Permissions** tab
4. Click **GRANT ACCESS**
5. Add principal: `allUsers`
6. Role: **Cloud Run Invoker**
7. Click **SAVE**

### Step 4: Get Backend URL

The service URL will be displayed after deployment, e.g.:
```
https://qyantram-backend-abc123def-uc.a.run.app
```

Save this URL for later use in the frontend configuration.

---

## Part 3: Deploy Frontend (React/Vite)

### Step 1: Update Frontend Configuration

1. Update `frontend/.env` with the backend URL:
```env
VITE_API_BASE_URL=https://qyantram-backend-abc123def-uc.a.run.app
```

2. Update `frontend/src/App.jsx` or your API config file to use the environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
```

3. Verify CORS is enabled in backend `app.py`:
```python
CORS(app, resources={
    r"/*": {
        "origins": ["https://qyantram-frontend-*.a.run.app", "http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})
```

### Step 2: Deploy Frontend to Cloud Run

**Using Cloud Console:**

1. Go to **Cloud Run** > **CREATE SERVICE**
2. Select **GitHub** as source
3. Configure:
   - **Repository**: Your repo
   - **Branch**: `main`
   - **Dockerfile location**: `frontend/Dockerfile`
4. Service settings:
   - **Service name**: `qyantram-frontend`
   - **Region**: Same as backend (`us-central1`)
   - **Memory**: `512 MB`
   - **CPU**: `1`
   - **Max instances**: `50`
5. Environment variables:
   - Add: `VITE_API_BASE_URL` = your backend URL
6. Click **CREATE**

**Using gcloud CLI:**

```bash
gcloud run deploy qyantram-frontend \
  --source . \
  --source-dir frontend \
  --image gcr.io/PROJECT_ID/qyantram-frontend \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars VITE_API_BASE_URL=https://qyantram-backend-abc123def-uc.a.run.app
```

### Step 3: Enable Public Access

Repeat the same steps as the backend (Add `allUsers` with Cloud Run Invoker role).

### Step 4: Get Frontend URL

After deployment, you'll get a URL like:
```
https://qyantram-frontend-xyz789-uc.a.run.app
```

---

## Part 4: Configure GitHub Integration for Auto-Deploy

### Enable Cloud Build Integration

1. Go to **Cloud Build** > **Settings**
2. Enable **GitHub** app integration
3. Connect your GitHub repository
4. When you push to GitHub, Cloud Build automatically:
   - Detects the Dockerfile
   - Builds the image
   - Deploys to Cloud Run

### Create cloudbuild.yaml (Optional)

Create a `cloudbuild.yaml` file in your repository root for custom build steps:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/qyantram-backend', '-f', 'backend/Dockerfile', 'backend']
  
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/qyantram-frontend', '-f', 'frontend/Dockerfile', 'frontend']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/qyantram-backend']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/qyantram-frontend']
  
  # Deploy backend
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=gcr.io/$PROJECT_ID/qyantram-backend
      - --location=us-central1
      - --output=/workspace/output
  
  # Deploy frontend
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=gcr.io/$PROJECT_ID/qyantram-frontend
      - --location=us-central1
      - --output=/workspace/output

images:
  - 'gcr.io/$PROJECT_ID/qyantram-backend'
  - 'gcr.io/$PROJECT_ID/qyantram-frontend'

substitutions:
  _REGION: 'us-central1'

options:
  machineType: 'N1_HIGHCPU_8'
```

---

## Part 5: Testing & Verification

### Test Backend

```bash
# Get backend URL from Cloud Run
BACKEND_URL="https://qyantram-backend-abc123def-uc.a.run.app"

# Test health endpoint
curl $BACKEND_URL/health

# Test simulate endpoint
curl -X POST $BACKEND_URL/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "qubits": 2,
    "gates": [
      {"type": "H", "target": 0, "step": 0}
    ]
  }'
```

### Test Frontend

Open the frontend URL in your browser and:
1. Try creating a simple circuit
2. Run a simulation
3. Check browser console for any errors
4. Verify API calls are going to the backend URL

### Check Logs

```bash
# Backend logs
gcloud run logs read qyantram-backend --region us-central1

# Frontend logs
gcloud run logs read qyantram-frontend --region us-central1
```

---

## Part 6: Environment Variables & Secrets

### Set Up Secret Manager for Sensitive Data

```bash
# Create secret
echo -n "your_openrouter_api_key" | gcloud secrets create openrouter-api-key --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding openrouter-api-key \
  --member=serviceAccount:PROJECT_ID@appspot.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

### Update Cloud Run to Use Secret

In Cloud Console or via CLI:
```bash
gcloud run deploy qyantram-backend \
  --set-secrets=OPENROUTER_API_KEY=openrouter-api-key:latest \
  --region us-central1
```

---

## Part 7: Monitoring & Scaling

### Set Up Monitoring

1. Go to **Cloud Monitoring** > **Dashboards**
2. Create a new dashboard
3. Add metrics:
   - Cloud Run request count
   - Request latency
   - Error rate
   - Memory usage

### Auto-Scaling Configuration

Current settings in deployments:
- **Min instances**: `0` (scales down to save costs)
- **Max instances**: `100` (backend) or `50` (frontend)
- **Timeout**: `3600s` (1 hour for backend)

Adjust in Cloud Console:
1. Click service name
2. Go to **Metrics** tab
3. Edit scaling settings

---

## Part 8: Cost Management

### Reduce Costs

1. Use Cloud Run's **Always Allocated CPU** = OFF (to use per-request pricing)
2. Set min instances to `0` (scale down when not in use)
3. Use `us-central1` region (usually cheapest)
4. Monitor with **Cost Management** dashboard

### Estimate Costs

- Free tier: 2 million requests/month, 360,000 GB-seconds
- Beyond: ~$0.24-0.40 per 1M requests

See [Cloud Run Pricing](https://cloud.google.com/run/pricing)

---

## Troubleshooting

### 503 Service Unavailable

- Check backend logs: `gcloud run logs read qyantram-backend`
- Ensure environment variables are set
- Check CORS configuration

### Frontend Can't Reach Backend

- Verify `VITE_API_BASE_URL` is correct
- Check browser console for CORS errors
- Ensure backend service is public

### Build Failures

```bash
# View build logs
gcloud builds log <BUILD_ID>

# Recent builds
gcloud builds list
```

### Deploy Doesn't Update

- GitHub integration may be disabled
- Check **Cloud Build** > **Triggers**
- Manually trigger or push new commit

---

## Useful Commands

```bash
# View all services
gcloud run services list --region us-central1

# View service details
gcloud run services describe qyantram-backend --region us-central1

# Update environment variables
gcloud run services update qyantram-backend \
  --update-env-vars KEY=VALUE \
  --region us-central1

# Delete service
gcloud run services delete qyantram-backend --region us-central1

# View build triggers
gcloud builds triggers list

# Manually trigger build
gcloud builds submit --config=cloudbuild.yaml
```

---

## Next Steps

1. ✅ Deploy backend
2. ✅ Deploy frontend
3. Test thoroughly
4. Monitor performance
5. Set up error notifications
6. Implement CI/CD pipeline

---

**Congratulations! Your Qyantram is now live on Google Cloud Run! 🚀**

For questions, refer to [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
