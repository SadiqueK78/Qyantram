# Qyantram Cloud Deployment Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Google Cloud Platform (GCP)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Cloud Build                            │  │
│  │  (GitHub Integration - Auto-builds on push)             │  │
│  └────┬──────────────────────┬──────────────────────┬───────┘  │
│       │                      │                      │           │
│       ▼                      ▼                      ▼           │
│  ┌──────────────┐      ┌──────────────┐    ┌──────────────┐   │
│  │  Container   │      │  Container   │    │  Container   │   │
│  │   Registry   │      │   Registry   │    │   Registry   │   │
│  │(Backend IMG) │      │(Frontend IMG)│    │  (Optional)  │   │
│  └──────┬───────┘      └──────┬───────┘    └──────────────┘   │
│         │                     │                                 │
│         ▼                     ▼                                 │
│  ┌────────────────┐  ┌────────────────┐                       │
│  │  Cloud Run     │  │  Cloud Run     │                       │
│  │  Backend Svc   │  │  Frontend Svc  │                       │
│  │  :8080         │  │  :8080         │                       │
│  │  (auto-scale)  │  │  (auto-scale)  │                       │
│  └────────┬───────┘  └────────┬───────┘                       │
│           │                   │                                │
│  ┌────────────────────────────────────────┐                  │
│  │     Cloud Load Balancer (optional)     │                  │
│  │   (custom domain routing)              │                  │
│  └────────┬───────────────────┬───────────┘                  │
│           │                   │                               │
│  Service URLs:               │                               │
│  https://qyantram-           │                               │
│  backend-xxxxx.a.run.app     │                               │
│           │                   │                               │
│           └────────┬──────────┘                              │
│                    │                                         │
│  ┌──────────────────▼──────────────────┐                    │
│  │   Cloud SQL (optional)               │                    │
│  │   Cloud Storage (optional)           │                    │
│  │   Cloud Secret Manager               │                    │
│  └──────────────────────────────────────┘                    │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
         │                                  │
         │ (Public HTTPS)                   │ (Public HTTPS)
         ▼                                  ▼
    ┌─────────┐                    ┌─────────────────┐
    │  GitHub │                    │  User Browser   │
    │  Repo   │                    │  (React App)    │
    └─────────┘                    └─────────────────┘
```

---

## Component Architecture

### 1. Frontend (React/Vite)

```
Frontend Container (port 8080)
├── React App (built)
├── Tailwind CSS
├── Framer Motion
├── Three.js (3D visualization)
├── Zustand (state)
└── serve (HTTP server)

Environment:
  VITE_API_BASE_URL = Backend URL
  
Exposed:
  https://qyantram-frontend-xxxxx-uc.a.run.app
```

**Dockerfile Strategy:**
- Build stage: Compile React with Vite
- Production stage: Serve static files with `serve` package
- Result: ~50MB optimized image

### 2. Backend (Flask/Python)

```
Backend Container (port 8080)
├── Flask App
├── Qiskit (quantum simulation)
├── OpenRouter API integration
├── gunicorn (WSGI server)
└── Health check endpoint

Environment:
  OPENROUTER_API_KEY = API key
  FLASK_ENV = production
  
Exposed:
  https://qyantram-backend-xxxxx-uc.a.run.app
```

**Dockerfile Strategy:**
- Single stage (Python image)
- Install dependencies (qiskit, flask, gunicorn)
- Run with gunicorn (production-grade server)
- Result: ~1.5GB image (Qiskit is large)

### 3. Cloud Build (CI/CD)

```
GitHub Push
    ↓
Cloud Build Trigger
    ├── Detect Dockerfile
    ├── Build image
    ├── Push to Container Registry
    └── Deploy to Cloud Run
    
Auto-deploys when:
  - New commit to main branch
  - Or manual trigger
```

---

## Deployment Flow

### Step 1: Local Development & GitHub Push

```
┌─────────────────────┐
│  Your Local Machine │
│  - code changes     │
│  - git add/commit   │
│  - git push         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Repository  │
│  - stores code      │
│  - triggers webhook │
└──────────┬──────────┘
           │ webhook
           ▼
┌─────────────────────┐
│  Cloud Build Trigger│
│  - detected changes │
│  - starts build     │
└─────────────────────┘
```

### Step 2: Docker Build & Container Registry

```
┌────────────────────────────┐
│  Cloud Build               │
│  - read Dockerfile         │
│  - execute build steps     │
│  - create image layers     │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│  Container Registry (GCR)  │
│  gcr.io/PROJECT_ID/        │
│  - qyantram-backend:latest │
│  - qyantram-frontend:latest│
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│  Cloud Run Service         │
│  - pulls image             │
│  - creates replica         │
│  - assigns URL             │
│  - starts serving          │
└────────────────────────────┘
```

### Step 3: Runtime & Traffic

```
User Browser
    │ HTTPS request
    ▼
Cloud Run Frontend Service (auto-scaled)
    │ Makes API calls
    ▼
Cloud Run Backend Service (auto-scaled)
    │ Processes quantum circuits
    │ Calls OpenRouter API
    ▼
Response returned → Browser displays results
```

---

## Data Flow

### Frontend → Backend API Call

```
React Component
    ↓ (axios)
VITE_API_BASE_URL + /api/simulate
    ↓ (HTTPS)
https://qyantram-backend-xxxxx-uc.a.run.app/simulate
    ↓ (Flask receives)
@app.route('/simulate')
    ├── Parse gates
    ├── Build circuit with Qiskit
    ├── Simulate
    ├── Prepare response
    ↓
JSON response
    ↓ (HTTPS back to frontend)
React updates state → UI renders results
```

### AI Tutor Call (Learning Mode)

```
User Request
    ↓
React (LearningStudioPanel)
    ↓ (fetch to backend)
Backend /learn/explain endpoint
    ├── Format prompt
    ├── Call OpenRouter API
    ├── Stream response
    ↓
Frontend receives explanation
    ├── Parse structured response
    ├── Text-to-speech (optional)
    ├── Display step-by-step
    ↓
User sees AI tutor explanation
```

---

## Environment Variables Flow

### Frontend

```
build time:
  VITE_API_BASE_URL  ← inject during docker build
                       (from Cloud Run env vars)
                       
runtime:
  import.meta.env.VITE_API_BASE_URL
                     ← read from build-time config
```

### Backend

```
runtime:
  OPENROUTER_API_KEY ← Cloud Run passes from env vars
  FLASK_ENV          ← Cloud Run passes from env vars
  
accessed in code:
  os.getenv('OPENROUTER_API_KEY')
  os.getenv('FLASK_ENV')
```

---

## Scaling & Auto-Healing

### Cloud Run Auto-Scaling

```
Traffic Monitoring
    ├── 0 requests → 0 instances (cold start)
    ├── 100 requests/sec → scale up
    └── 10,000 requests/sec → max instances
    
Container Monitoring
    ├── Memory > 80% → mark unhealthy
    ├── Failed health check → restart
    └── Slow response → add more replicas
```

### Health Checks

```
Backend: GET /health
         Returns: {"status": "healthy"}
         Frequency: every 30 seconds
         
Frontend: GET /
          HTTP 200 OK
          Frequency: every 30 seconds
```

---

## Storage & Persistence (Optional)

### Without Database (Stateless)

```
Each request → compute → return
No data stored between requests
✓ Simpler
✓ Cheaper
✓ Scales easily
✗ Can't save user circuits
```

### With Cloud SQL (Optional Upgrade)

```
Cloud Run Backend
    ↓
Cloud SQL (PostgreSQL)
    ├── Save user circuits
    ├── Store results
    └── User authentication
    
Set up:
  1. Create Cloud SQL instance
  2. Update Flask connection string
  3. Migrate database
  4. Deploy
```

---

## Security Considerations

### Current Setup

```
✓ HTTPS everywhere (Cloud Run auto-creates certificates)
✓ CORS configured (whitelist frontend URLs)
✓ API key in environment variables (not in code)
✓ Auto-restart on crash
✓ No public SSH access
```

### Enhanced Security (Optional)

```
1. Use Cloud Secret Manager
   └─ Store API keys encrypted
   
2. Add Cloud Identity
   └─ Authenticate users
   
3. Set up VPC
   └─ Isolate services
   
4. Add DDoS protection
   └─ Cloud Armor rules
   
5. Monitor & log
   └─ Cloud Logging & Monitoring
```

---

## Networking

### CORS (Cross-Origin Resource Sharing)

```
Frontend URL: https://qyantram-frontend-xxxxx-uc.a.run.app
Backend URL:  https://qyantram-backend-yyyyy-uc.a.run.app

Browser Policy:
  Frontend makes request to Backend?
  ✗ Different domains → CORS error
  ✓ Unless Backend allows with CORS headers
  
Backend must return:
  Access-Control-Allow-Origin: https://qyantram-frontend-xxxxx...
  Access-Control-Allow-Methods: GET, POST, OPTIONS
```

### Load Balancing (Optional)

```
Custom Domain: qyantram.com
    ↓
Cloud Load Balancer
    ├── /api/* → Backend service
    └── /* → Frontend service
    
Benefits:
  ✓ Single domain
  ✓ Prettier URLs
  ✓ Route traffic intelligently
```

---

## Cost Breakdown

### Free Tier (2M requests/month)

```
Backend + Frontend = free
Only pay for:
  - OpenRouter API calls (from your OpenRouter account)
  - Database (if added)
  - Custom domain DNS
```

### Paid Tier (Beyond free)

```
Backend (2GB, 2 CPU):
  ~$0.0000315/request
  ~$15-20/1M requests
  
Frontend (512MB, 1 CPU):
  ~$0.0000099/request
  ~$5-10/1M requests
  
Total estimate for 100k requests/day:
  ~$5-10/month
```

---

## Troubleshooting Flowchart

```
User reports issue
    ↓
Is frontend loading?
├─ NO  → Check frontend service logs
│        Verify: memory, CPU, health checks
│        Restart service if needed
│
└─ YES → Can user interact with app?
  ├─ NO  → Check browser console
  │        Network tab → API calls failing?
  │
  └─ YES → Are simulations working?
    ├─ NO  → Check backend service logs
    │        Verify: OpenRouter API key valid
    │        Check quantum circuit validation
    │
    └─ YES → Performance issue?
      ├─ NO  → Check monitoring dashboard
      │        Memory/CPU/latency metrics
      │
      └─ YES → Working as expected! 🎉
```

---

## Deployment Statistics

| Component | Size | Build Time | Start Time |
|-----------|------|-----------|-----------|
| Frontend Image | ~100MB | 3-5 min | 5-10 sec |
| Backend Image | ~1.5GB | 10-15 min | 10-20 sec |
| Cold Start (first request) | - | - | 30-60 sec |
| Warm Response | - | - | 100-500ms |

---

## Next Steps After Deployment

1. **Monitor Performance**
   - Cloud Monitoring dashboard
   - Set up alerts for errors

2. **Optimize**
   - Analyze query logs
   - Optimize hot paths
   - Reduce bundle size

3. **Enhance**
   - Add user authentication
   - Implement circuit saving
   - Add sharing features

4. **Scale**
   - Adjust instance counts
   - Consider multi-region
   - Add CDN for frontend

---

## References

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices)
- [Flask Deployment Guide](https://flask.palletsprojects.com/deployment/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

---

**Ready to deploy? Start with [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)!**
