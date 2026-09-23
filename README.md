# final-capstone

This is a collaborative project to showcase our skills from all 3 phases of the FSE program. It has a custom HTML/CSS landing page, a React + TypeScript single-page application, an Express + TypeScript REST API with MongoDB, Docker containerization, Kubernetes deployment to EKS, and CI/CD with GitHub Actions.

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Running Locally](#running-locally)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Common Issues](#common-issues)

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
└── .github/
    └── workflows/
        └── ci.yml          # CI/CD pipeline
```

## Quick Start

### Prerequisites
- Node.js 18+ (or 20 LTS recommended)
- npm or npm ci
- MongoDB Atlas account or local MongoDB instance

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

### Manual Docker Compose Example

See `docker-compose.yml` for the full configuration. Key features:

- **mongo**: MongoDB 7 with persistent volume
- **api**: Built from `./api`, runs in dev mode with hot reload
- **client**: Built from `./client`, serves via Nginx at port 3000
- **Health checks**: API waits for MongoDB to be healthy before starting



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

See `.github/workflows/ci.yml` for CI/CD configuration. The workflow:
1. Runs linting and tests on every PR
2. Builds Docker images if Dockerfiles exist
3. Can be extended for deployment to EKS or other platforms

## Support

For issues or questions, check the troubleshooting section above or review the source code in the respective directories.
