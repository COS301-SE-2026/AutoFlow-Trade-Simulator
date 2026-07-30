# 3.2.2 Technology Requirements

---

## 3.2.2.1 Overview

AutoFlow Trade Simulator is a virtual trading and investment platform with gamified learning features. This section
defines the technology stack, platforms, environments, and infrastructure required to build, deploy, and operate the
system.

---

## 3.2.2.2 Platform Requirements

| Requirement               | Description                                      |
|---------------------------|--------------------------------------------------|
| Target Platform(s)        | Web (SPA)                                        |
| Supported Browsers        | Chrome 110+, Firefox 100+, Safari 16+, Edge 110+ |
| Minimum Screen Resolution | 1280x720                                         |
| Responsive/Mobile Support | No                                               |

---

## 3.2.2.3 Software Architecture

- **Architecture Style:** N-tier
- **Deployment Model:** Cloud (Vercel frontend, AWS backend)
- **Client-Server Model:** REST API with async request/response

---

## 3.2.2.4 Technology Stack

### Frontend

| Component        | Technology/Framework      | Version        |
|------------------|---------------------------|----------------|
| Framework        | Next.js                   | 15.0.0         |
| Language         | TypeScript                | 5.9.3          |
| Styling          | Tailwind CSS + shadcn     | 3.4.19 + 4.7.0 |
| State Management | React Context API         | 19.0.0         |
| UI Components    | Radix UI                  | 1.4.3          |
| Charting         | Recharts                  | 3.8.1          |
| Icons            | Lucide React, React Icons | 1.16.0, 5.6.0  |

### Backend

| Component   | Technology/Framework | Version |
|-------------|----------------------|---------|
| Language    | Python               | 3.x     |
| Framework   | FastAPI              | 0.136.1 |
| API Style   | REST                 | N/A     |
| ORM         | SQLModel             | 0.0.38  |
| Task Queue  | Celery               | 5.6.3   |
| ASGI Server | Uvicorn              | 0.46.0  |

### Database

| Component           | Technology | Version   |
|---------------------|------------|-----------|
| Primary Database    | PostgreSQL | 16-alpine |
| Caching Layer       | Redis      | 7-alpine  |
| Database Migrations | Alembic    | 1.18.4    |

### Infrastructure & DevOps

| Component        | Technology                       | Notes                                  |
|------------------|----------------------------------|----------------------------------------|
| Cloud Provider   | Vercel (frontend), AWS (backend) | Multi-cloud                            |
| Hosting/Compute  | AWS Fargate and EC2 containers   | Ephemeral + Persistent                 |
| CI/CD            | GitHub Actions                   | Automated testing, linting, deployment |
| Containerization | Docker                           | Alpine-based images for services       |
| Orchestration    | Docker Compose                   | Local development                      |
| Version Control  | GitHub                           | COS301-SE-2026 organization            |

---

## 3.2.2.5 Third-Party Integrations & APIs

| Integration      | Purpose                                                                               | Provider                                                                                      |
|------------------|---------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Live Market Data | Acquisition of stocks, options, indices, commodities, forex and cryptocurrencies data | Massive, TwelveData, FCS, CoinMarketCap, CoinGecko, EOD Historical Data, Vectrade and Finnhub |
| Authentication   | OAuth 2.0 / JWT tokens                                                                | Custom (backend-managed)                                                                      |

---

## 3.2.2.6 Development Environment & Tools

| Tool                 | Purpose                                  |
|----------------------|------------------------------------------|
| IDE                  | VS Code, Jetbrains Webstorm, Vim         |
| Package Manager      | npm (root), pip (backend)                |
| Testing Frameworks   | pytest (backend)                         |
| Code Quality/Linting | ESLint (frontend), Ruff (backend)        |
| Type Checking        | TypeScript (frontend), Pyright (backend) |
| API Documentation    | Swagger/OpenAPI                          |

---

## 3.2.2.7 Security & Compliance Technology Requirements

- **Encryption Standards:** TLS 1.2+ (HTTPS in transit)
- **Authentication/Authorization:** JWT (Bearer tokens), bcrypt password hashing
- **Database Security:** PostgreSQL user/password, sessionStorage token storage
- **Vulnerability Scanning Tools:** SonarQube

---

## 3.2.2.8 Performance & Scalability Requirements

| Requirement          | Target                                                               |
|----------------------|----------------------------------------------------------------------|
| Response Time        | TBD (target < 200ms for API calls)                                   |
| Uptime/Availability  | 99.9% (target)                                                       |
| Scalability Approach | Horizontal scaling via cloud providers (Vercel, Render auto-scaling) |

---

## 3.2.2.9 Compatibility & Interoperability

- **Data Exchange Formats:** JSON (REST API)
- **Interoperability Standards:** REST, OpenAPI 3.0

---