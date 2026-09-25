# final-capstone

This is a collaborative project to showcase our skills from all 3 phases of the FSE program. It has a custom HTML/CSS landing page, a React + TypeScript single-page application, an Express + TypeScript REST API with MongoDB, Docker containerization, Kubernetes deployment to EKS, and CI/CD with GitHub Actions.

## Table of Contents

- [Live Deployment](#live-deployment)
- [Feature List](#feature-list)
- [Team Members](#team-members)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Running Locally](#running-locally)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [API Test Scenarios](#api-test-scenarios)
- [Architecture Documentation](#architecture-documentation)
- [Troubleshooting](#troubleshooting)
- [Common Issues](#common-issues)

## Feature List

- User registration and login with JWT-based authentication
- Protected dashboard with project, task, resource, and user summaries
- Project management with filtering, pagination, role-based permissions, and detail views
- Task management with assignment, status updates, priority tracking, and member restrictions
- Resource management linked to projects with owners, collaborators, budgets, and sprint windows
- Static marketing site served at `/` and React SPA served at `/app/`
- Containerized local development with Docker Compose
- Kubernetes deployment to Amazon EKS with ECR-hosted images

## Team Members

- Malik Campbell-Greene — Project Manager, back-end development, API/data modeling, deployment support
- Josh Gaudet — Front-end development, React UI, landing pages, client integration

## Project Structure

```
├── api/                    # Express + TypeScript backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   └── routes/         # API endpoints
│   ├── Dockerfile
│   └── package.json
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API client
│   │   ├── context/        # Auth context
│   │   └── types/          # TypeScript types
│   ├── public/             # Static landing page & assets
│   ├── Dockerfile
│   ├── nginx/              # Nginx configuration
│   └── package.json
├── docker-compose.yml      # Local development setup
└── .github/
    └── workflows/
        └── ci.yml          # CI/CD pipeline
```

## Quick Start

### Prerequisites
- Node.js 20+ (CI runs on Node 20 and 22)
- npm or npm ci
- MongoDB Atlas account or local MongoDB instance
- Docker & Docker Compose (for containerized setup)

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/iltStudent07/final-capstone.git
cd final-capstone

# Install API dependencies
cd api
npm ci
# or npm install

# Install client dependencies
cd ../client
npm ci
# or npm install
```

## Setup Instructions

### 1. Environment Configuration

**API (.env in `api/` directory):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
PORT=4000
```

**Client:**
No `.env` needed for development (uses proxy to `/api`). In production, ensure API is accessible at `/api/`.

### 2. MongoDB Setup

- Create a MongoDB Atlas instance or run MongoDB locally
- Create a database for the project
- Add your connection URL to `api/.env`

## Running Locally

### Development Mode

**Terminal 1 - API:**
```bash
cd api
npm run dev
# Starts on http://localhost:4000
# API health check: http://localhost:4000/health
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
# Starts on http://localhost:5173
# Automatically proxies /api requests to http://localhost:4000
```

### Production Build

```bash
# Build API
cd api
npm run build
npm run start

# Build Client
cd client
npm run build
npm run preview
```

## Docker Setup

### Build Docker Images

```bash
# Build API image
docker build -t final-capstone-api ./api

# Build Client image
docker build -t final-capstone-client ./client
```

### Run with Docker Compose (Recommended)

The `docker-compose.yml` in the project root sets up all services for local development:

**Start all services:**
```bash
docker compose up --build
```

**Access the app:**
- Landing page: http://localhost:3000
- React app: http://localhost:3000/app
- API health check: http://localhost:4000/health

**Stop all services:**
```bash
docker compose down
```

**View logs:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f client
docker compose logs -f mongo
```

#### Port Conflicts

If you get an error like `failed to bind host port 0.0.0.0:27017/tcp: address already in use`, another process is using that port.

**Option 1: Stop the conflicting service (Linux/macOS)**
```bash
# Stop local MongoDB
sudo systemctl stop mongod
# or
brew services stop mongodb-community

# Windows PowerShell (admin)
Stop-Service MongoDB
```

**Option 2: Use different host ports in docker-compose.yml**

Edit `docker-compose.yml` and change the port mapping (format: `host:container`):

```yaml
services:
  mongo:
    ports:
      - "27018:27017"   # Use port 27018 instead of 27017

  api:
    ports:
      - "4001:4000"     # Use port 4001 instead of 4000

  client:
    ports:
      - "3001:80"       # Use port 3001 instead of 3000
```

**Find what's using a port:**
```bash
# Linux/macOS
lsof -i :27017
lsof -i :3000

# Windows PowerShell
Get-NetTCPConnection -LocalPort 27017
```

## Environment Variables

### API (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `1d` | JWT token expiration time |
| `PORT` | No | `4000` | API server port |

### Client

- Uses `import.meta.env.BASE_URL` (set in `vite.config.ts`)
- In production: set `base: '/app/'` in vite.config.ts

## API Test Scenarios

The following API scenarios are covered as documented acceptance tests for manual or automated validation:

1. **GET returns correct data**
  - Request: `GET /api/projects?page=1&limit=10`
  - Expected: `200 OK` with a JSON payload containing `data` and `pagination`
  - Validation: returned records match applied filters, pagination values are present, and each project includes populated related data when available

2. **POST creates resources with valid data**
  - Request: `POST /api/projects` with a valid admin token and a body containing a title, description, status, and priority
  - Expected: `201 Created`
  - Validation: response contains the created project and trimmed values are persisted

3. **POST rejects invalid data**
  - Request: `POST /api/auth/register` with an invalid email or short password
  - Expected: `400 Bad Request`
  - Validation: response includes `Validation failed` details explaining why the payload was rejected

4. **Auth endpoints work**
  - Requests: `POST /api/auth/register` followed by `POST /api/auth/login`
  - Expected: `201 Created` for register and `200 OK` for login
  - Validation: both responses return a JWT and normalized user payload

5. **Protected endpoints require valid tokens**
  - Request: `GET /api/dashboard` or `GET /api/tasks` without a bearer token
  - Expected: `401 Unauthorized`
  - Validation: protected routes deny access until a valid JWT is sent

6. **Role restrictions are enforced**
  - Request: `POST /api/projects` or `DELETE /api/tasks/:id` using a member token
  - Expected: `403 Forbidden`
  - Validation: member users cannot create projects, resources, or delete tasks reserved for admins

## Architecture Documentation

See [ARCHITECTURE.md](ARCHITECTURE.md) for:

- system diagrams
- technology stack and versions
- API endpoint reference
- deployment architecture

## Troubleshooting

### API Won't Start

**Error: "MONGODB_URI is not defined"**
- Solution: Check `api/.env` has `MONGODB_URI` set
- Verify MongoDB connection string is valid
- Test connection: `mongosh "mongodb+srv://..."`

**Error: "JWT_SECRET is not defined"**
- Solution: Add `JWT_SECRET=your_secret_key` to `api/.env`

**Error: Port 4000 already in use**
```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9
# Or specify different port
PORT=5000 npm run dev
```

### Client Won't Load

**Blank page or routes not working**
- Clear browser cache (Ctrl+Shift+Del)
- Check development console for errors (F12)
- Verify API is running: `curl http://localhost:4000/health`

**API requests return 401**
- Login again - token may have expired
- Check `localStorage` in browser DevTools
- Verify JWT_SECRET in API matches

### Docker Build Fails

**If docker build fails:**
- Pre-compiled fallback is in `api/dist/` (already included)
- Try rebuilding:
  ```bash
  docker build --no-cache -t final-capstone-api ./api
  ```
- Check Docker disk space: `docker system df`

**Nginx not routing correctly**
- Verify `client/nginx/default.conf` exists
- Check Nginx error logs: `docker logs <container_id>`
- Test routes:
  - `/` → Landing page (Nginx root)
  - `/app/` → React SPA
  - `/api/*` → Proxied to API service

## Common Issues

### "Cannot find module 'bcryptjs'" or similar

**Solution:**
```bash
cd api
npm ci  # Clean install
# or
npm install
# Rebuild
npm run build
```

### TypeScript errors during build

**Solution:**
```bash
# Type check without building
npm run lint

# Force rebuild
rm -rf dist
npm run build
```

### 401 Unauthorized on /dashboard

**Reasons:**
1. Not logged in - go to `/login`
2. Token expired - logout and login again
3. JWT_SECRET mismatch between API sessions

**Solution:**
- Ensure you're authenticated
- Clear localStorage and re-login:
  ```javascript
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Then navigate to /login
  ```

### CORS errors

**If seeing CORS errors in console:**
- Verify API has CORS enabled (should be in `api/src/server.ts`)
- In development, Vite proxy should handle this
- In production, Nginx proxy handles it

### MongoDB Connection Timeout

**Solution:**
```bash
# Test connection
mongosh "your_connection_string"

# Common causes:
# - Wrong password in connection string
# - IP not whitelisted in MongoDB Atlas
# - Network connectivity issue
```

## Development Scripts

### API

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript
npm run start    # Start production server
npm run lint     # Type check with TypeScript
npm test         # Run tests (empty by default)
```

### Client

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Deployment

### Docker Compose (Local)

See the [Docker Setup](#docker-setup) section above.

### GitHub Actions Deployment to Main

Changes from `dev` should be merged into `main` through a pull request. After the PR is merged into `main`, the deploy workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs automatically.

It will:
- build the API and client Docker images
- push both images to ECR
- update the EKS cluster
- apply the Kubernetes manifests in [k8s/](k8s)
- update the `api` and `client` deployments to the new image tags

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `EKS_CLUSTER_NAME`
- `MONGODB_URI`
- `JWT_SECRET`

The client and API images are published with both the commit SHA and `latest` tags, so the EKS deployment always picks up the newest main build.

### EKS (Kubernetes) Deployment

#### Prerequisites

1. **AWS Account** with appropriate credentials and permissions
2. **AWS CLI** installed and configured
3. **eksctl** installed
4. **kubectl** installed

**Install on Linux:**
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

#### Step 1: Configure AWS Credentials

```bash
aws configure
```

When prompted, enter:
- **AWS Access Key ID**: [Get from AWS IAM Console]
- **AWS Secret Access Key**: [Get from AWS IAM Console]
- **Default region name**: us-east-1
- **Default output format**: json

**Get credentials from AWS:**
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click Users → Select your user
3. Click Security credentials → Create access key
4. Copy the Access Key ID and Secret Access Key

Or use environment variables:
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
```

#### Step 2: Create EKS Cluster

```bash
eksctl create cluster --name capstone --region us-east-1 --nodes 2 --node-type t3.medium
```

This will take ~15-20 minutes. While waiting, you can build Docker images:
```bash
# In another terminal
cd api && docker build -t final-capstone-api:latest .
cd ../client && docker build -t final-capstone-client:latest .
```

#### Step 3: Verify Cluster Connection

```bash
# Update kubeconfig
aws eks update-kubeconfig --name capstone --region us-east-1

# Verify connection
kubectl get nodes
kubectl get pods --all-namespaces
```

#### Step 4: Push Docker Images to ECR

Before deploying, push your Docker images to Amazon ECR:

```bash
# Create ECR repositories
aws ecr create-repository --repository-name capstone-api --region us-east-1
aws ecr create-repository --repository-name capstone-client --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

# Tag and push API image
docker tag final-capstone-api:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/capstone-api:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/capstone-api:latest

# Tag and push Client image
docker tag final-capstone-client:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/capstone-client:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/capstone-client:latest
```

Then update the image names in `k8s/api.yaml` and `k8s/client.yaml`:
```yaml
image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/capstone-api:latest
image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/capstone-client:latest
```

#### Step 5: Deploy to EKS

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Verify deployments
kubectl get pods -n capstone
kubectl get svc -n capstone

# Check pod logs
kubectl logs -n capstone deployment/api
kubectl logs -n capstone deployment/client
```

#### Step 6: Access Your Application

```bash
# Get LoadBalancer external IP
kubectl get svc -n capstone client

# Wait for LoadBalancer to get an External IP (may take a few minutes)
# Then access:
# http://<EXTERNAL-IP>        → Landing page
# http://<EXTERNAL-IP>/app/   → React application
```

#### Step 7: Update MongoDB Connection

If using MongoDB Atlas instead of in-cluster:

```bash
# Update the secret with your MongoDB Atlas connection string
kubectl create secret generic capstone-secrets \
  --from-literal=MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/capstone" \
  --from-literal=JWT_SECRET="your-production-secret" \
  -n capstone --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secret
kubectl rollout restart deployment/api -n capstone
```

#### Kubernetes Manifests

The `k8s/` directory contains:

- **namespace.yaml** - `capstone` namespace for isolation
- **secrets.yaml** - MongoDB URI and JWT secret
- **mongo.yaml** - MongoDB deployment + persistent storage
- **api.yaml** - API deployment (2 replicas) with health checks
- **client.yaml** - Client deployment (2 replicas) with LoadBalancer

#### Troubleshooting EKS

**Cluster won't create:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check IAM permissions (user needs EKS permissions)
# See: https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html
```

**Pods stuck in Pending:**
```bash
kubectl describe pod <pod-name> -n capstone
kubectl logs <pod-name> -n capstone
```

**ImagePullBackOff error:**
- Images must be in ECR or publicly available
- Ensure image tags in manifests are correct
- Check ECR login: `aws ecr get-login-password --region us-east-1 | docker login ...`

**LoadBalancer stuck in Pending:**
```bash
# Wait a few minutes for AWS to provision the load balancer
kubectl get svc -n capstone --watch
```

#### Cleanup

Delete the EKS cluster when done:
```bash
eksctl delete cluster --name capstone --region us-east-1
```

See `.github/workflows/ci.yml` for CI/CD configuration. The workflow:
1. Runs linting and tests on every PR
2. Builds Docker images if Dockerfiles exist
3. Runs the client job on Node 20 and 22 to match the supported CI matrix
4. Can be extended for automatic EKS deployment


## Support

For issues or questions, check the troubleshooting section above or review the source code in the respective directories.
