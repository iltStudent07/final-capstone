# ARCHITECTURE

## 1. System Diagram

```text
Users / Browser
       |
       v
AWS Load Balancer / Nginx
  |                |
  |                +--> Landing page at /
  |
  +--------------------> React SPA at /app/
                           |
                           v
                     /api requests
                           |
                           v
                    Express API (Node.js)
                           |
                           v
                        MongoDB
```

## 2. Technology Stack

| Layer | Technology | Version / Image |
|---|---|---|
| Frontend | React | 19.2.8 |
| Frontend build tool | Vite | 8.3.0 |
| Frontend language | TypeScript | 6.0.2 |
| Routing | React Router DOM | 7.18.4 |
| HTTP client | Axios | 1.20.0 |
| Backend runtime | Node.js | 20-alpine in Docker |
| Backend framework | Express | 5.2.1 |
| Backend language | TypeScript | 7.0.2 |
| Database | MongoDB | 7 |
| ODM | Mongoose | 9.10.2 |
| Auth | JSON Web Tokens | 9.0.3 |
| Password hashing | bcryptjs | 3.0.3 |
| Web server | Nginx | 1.27-alpine |
| Container platform | Docker / Docker Compose | current local engine |
| Orchestration | Kubernetes on Amazon EKS | cluster observed at v1.34.11 |
| CI | GitHub Actions | workflow-based |

## 3. Application Components

### Client

- Static marketing site served at `/`
- React SPA served at `/app/`
- Uses Axios for `/api` requests
- Uses protected routes for authenticated pages

### API

- Express server exposes REST endpoints under `/api`
- JWT middleware protects secured routes
- Mongoose models manage users, projects, tasks, and resources
- Health endpoint exposed at `/health`

### Data Layer

- `User` stores account profile and role
- `Project` stores planning and execution metadata
- `Task` stores assigned work items and status
- `Resource` stores project resources, owners, collaborators, and sprint window

## 4. API Endpoint Table

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Authenticate and return JWT |
| GET | `/api/projects` | No | List projects with filters and pagination |
| POST | `/api/projects` | Yes | Create a project |
| GET | `/api/projects/:id` | No | Get project detail |
| PUT | `/api/projects/:id` | Yes | Update a project |
| DELETE | `/api/projects/:id` | Yes | Delete a project |
| GET | `/api/resources` | No | List resources |
| POST | `/api/resources` | Yes | Create a resource for a project |
| GET | `/api/resources/:id` | No | Get resource detail |
| PUT | `/api/resources/:id` | Yes | Update a resource |
| DELETE | `/api/resources/:id` | Yes | Delete a resource |
| GET | `/api/tasks` | Yes | List tasks, filtered by role and query |
| POST | `/api/tasks` | Yes | Create a task |
| GET | `/api/tasks/:id` | Yes | Get task detail |
| PUT | `/api/tasks/:id` | Yes | Update a task |
| DELETE | `/api/tasks/:id` | Yes | Delete a task |
| GET | `/api/dashboard` | Yes | Dashboard summary |
| GET | `/api/dashboard/stats` | Yes | Dashboard summary alias |
| GET | `/api/users` | Yes | List users for assignment and admin views |

## 5. Role Model

| Role | Capabilities |
|---|---|
| Admin | Full create, update, delete access across projects, resources, and tasks |
| Member | Limited task visibility and status updates, restricted from admin-only actions |

## 6. Deployment Architecture

```text
Local Development
-----------------
Browser
  -> docker compose client :3000
  -> docker compose api :4000
  -> docker compose mongo :27017 (host mapped to 27018 locally)

AWS Deployment
--------------
Internet
  -> AWS LoadBalancer service (client)
      -> Nginx container
          -> /            static landing page
          -> /app/        React SPA assets
          -> /api/*       Kubernetes service for API
                            -> API deployment (2 replicas)
                               -> MongoDB service
                                  -> MongoDB deployment
```

## 7. Kubernetes Resources

| File | Resource Summary |
|---|---|
| `k8s/namespace.yaml` | Dedicated `capstone` namespace |
| `k8s/secrets.yaml` | Application secrets for MongoDB URI and JWT secret |
| `k8s/mongo.yaml` | MongoDB deployment and internal service |
| `k8s/api.yaml` | API deployment with 2 replicas and ClusterIP service |
| `k8s/client.yaml` | Client deployment with 2 replicas and LoadBalancer service |

## 8. Operational Notes

- Local Docker Compose maps MongoDB to host port `27018` to avoid common local conflicts on `27017`
- The live app is exposed through the current LoadBalancer URL referenced in the README
- CI validates API lint/test, client lint/test, and both Docker image builds
