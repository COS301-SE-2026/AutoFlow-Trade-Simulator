## **4.1 Requirements Specifications**

#### 4.1.1 Introduction

AutoFlow Trade Simulator is a safe, realistic sandbox for students, instructors, researchers, and developers to practice portfolio management, simulated trading, and reporting without financial risk. The system covers user authentication, portfolios, international accounts, transactions, periodic reports, market-data integration, and a Next.js frontend backed by a FastAPI REST API.

Primary goals:

- Support repeatable trade and holdings simulation.
- Generate clear daily and weekly performance reports.
- Provide secure per-user isolation across all data.
- Allow mock or live market-data adapters where permitted.

Primary user:

- Trader: a student or individual learner who creates portfolios, places trades, and reviews holdings and reports.

Key constraints:

- Price and market-data updates must respect provider caching and rate limits.
- Free-tier hosting may impose memory and cold-start limits.
- Any AI features must rely on local or on-premise models.

#### 4.1.2 Domain Model (UML)

Refer to the UML class diagram below. Key elements implemented in `backend/app/models` include:

- `User`: identity and credentials.
- `Portfolio`: owned by `User`; contains `InternationalAccount` entries and a cash balance.
- `InternationalAccount`: currency-denominated account linked to a `Portfolio`.
- `Currency`: code and name for denominations.
- `Asset` / `StockAsset`: tradable instruments; `StockAsset` specializes `Asset`.
- `Transaction`: trade records (direction, quantity, price, timestamp) associated with an `InternationalAccount`.
- `Report`: metadata record for generated reports (`user_id`, `period`, `generated_at`).
- `ReportSection`: one row per ticker in a `Report` holding open/close/high/low/pct_change metrics.

Enumerations:

- `Direction`: BUY / SELL.
- `Period`: daily / weekly.

### Domain Model Diagram

<img width="830" height="1315" alt="DomainModel" src="https://github.com/user-attachments/assets/e4b5df76-9e44-49c7-876e-d03d184ea447" />

#### 4.1.3 User Stories & User Characteristics

Intended Users:

- Primary User (Trader): novice or experienced individual who creates portfolios, places simulated trades, and requests reports to evaluate strategies.

Representative User Stories:

- As a Trader, I want to create a portfolio and execute simulated BUY/SELL orders so I can evaluate strategy performance.
- As a Trader, I want to view my holdings and transaction log so I can reconcile positions.
- As a Trader, I want to generate weekly and daily reports for my portfolio so I can compute performance metrics.
- As a Trader, I want to view report history and trigger new report generation so I can compare periods from the UI.
- As a Trader, I want price alerts and notifications so I can react to market movements.
- As a Trader, I want optional AI-assisted insights so I can improve decision-making.

#### 4.1.4 Use Cases

Actors:

- Trader (primary)
- System (background jobs)

High-level Use Cases:

- Authenticate / Authorize user (login, token refresh).
- Create / Manage Portfolio (create, rename, view).
- Manage International Accounts (create account in currency, deposit/withdraw simulated cash).
- Place Trade (submit BUY/SELL, record Transaction).
- View Holdings & Transaction Log (read endpoints + frontend views).
- Generate Report (user-triggered or scheduled background job; produces Report + ReportSection records).
- Seed / Reset Data (dev/instructor utility).
- Integrate Market Data (plug in mock or live data adapter).

Demo 1 use cases that can currently be shown with the repo:

- Register and log in a user.
- Create or view an authenticated account.
- Fetch market-data summary or price history for a ticker.
- Generate and review report history through the backend API.
- Open the dashboard to view holdings, transactions, and the report placeholder panel.
- Open the report view to list report rows and trigger report generation for daily or weekly periods.


#### 4.1.5 Functional Requirements

Organized by subsystem:

- Auth (API):
	- FR-A1: Provide secure user registration, login, and JWT-based authentication.
	- FR-A2: Enforce per-user authorization for portfolios, accounts, and reports.

- Portfolio / Accounts (API & DB):
	- FR-P1: Create, read, update, and delete portfolios.
	- FR-P2: Create `InternationalAccount` with currency and track balances.
	- FR-P3: Validate and update balances atomically when processing transactions.

- Trading / Transactions (Core):
	- FR-T1: Accept trade requests and persist `Transaction` with direction, quantity, price, executed_at.
	- FR-T2: Update account balances and holdings in ACID transactions.

- Market Data (Service Layer):
	- FR-M1: Provide an adapter interface supporting mock and real market-data providers.
	- FR-M2: Expose historical OHLCV retrieval for a symbol and interval used by report generation.

- Reporting (Background Jobs & API):
	- FR-R1: Create `Report` and related `ReportSection` rows for a user for daily and weekly periods.
	- FR-R2: Provide API endpoints to trigger generation and to retrieve report history.

- Frontend:
	- FR-F1: Allow users to view holdings, place trades, view report history, generate reports, and review transaction logs via the web UI.

- Admin / Dev Tools:
	- FR-D1: Seed and reset environments; provide mock data generation utilities.

Each functional requirement must return appropriate HTTP status codes and validation messages.

#### 4.1.6 Quality Requirements

- Performance:
	- API read latency: 95th percentile < 300 ms under typical classroom load (≤ 200 concurrent users).
	- Report generation per-user: complete within 30s under normal conditions.

- Reliability / Availability:
	- Target uptime: 99.9% for core API (excluding scheduled maintenance).
	- Background jobs must be idempotent and support retry with exponential backoff.

- Scalability:
	- Stateless services (API, frontend) should scale horizontally; database should support vertical/horizontal scaling strategies and batch report processing.

- Security:
	- All transports use HTTPS. Passwords stored with strong hashing (bcrypt/argon2). JWTs issued with reasonable expiry and refresh options. Role-based access prevents cross-user data access.

- Maintainability / Testability:
	- Unit test coverage goal: ≥ 80% for core modules (auth, transactions, reports).
	- CI pipeline includes linting, type checking, and tests for PR validation.

- Data Integrity:
	- All financial updates must be ACID transactional with no partial writes that could leave inconsistent balances.

- Observability:
	- Structured logs, correlation IDs for requests, and metrics for request rates, error rates, and job durations.

#### 4.1.7 API Service Contracts

This section summarizes the primary REST endpoints, expected request/response shapes, and common status codes.

- Auth
	- `POST /auth/register` — body: `{email, password, full_name}`; responses: `201 Created` (user), `400` validation.
	- `POST /auth/login` — body: `{email, password}`; responses: `200 OK` (`{access_token, token_type}`), `401` unauthorized.
	- `POST /auth/refresh` — body: `{refresh_token}`; responses: `200 OK`, `401`.

- Portfolios
	- `GET /portfolios` — responses: `200 OK` (list of portfolios for user).
	- `POST /portfolios` — body: `{name}`; responses: `201 Created` (portfolio), `422` validation.
	- `GET /portfolios/{id}` — responses: `200 OK`, `403` forbidden, `404` not found.

- International Accounts
	- `POST /portfolios/{id}/accounts` — body: `{currency_code, initial_balance}`; responses: `201 Created`.
	- `GET /portfolios/{id}/accounts` — responses: `200 OK`.

- Transactions / Trading
	- `POST /transactions` — body: `{account_id, asset_id, direction, quantity, price}`; responses: `201 Created`, `400/422` validation, `409` insufficient balance.
	- `GET /transactions?portfolio_id={id}` — responses: `200 OK`.

- Reports
	- `POST /reports` — body: `{period}` (daily|weekly); responses: `201 Created` (report section created) or `202 Accepted` if queued.
	- `GET /reports` — responses: `200 OK` (list of `ReportSection` entries for user).

Errors and Validation:

- Use standard HTTP status codes with error bodies: `{detail: string, code?: string}`. Validation errors return `422` with field-level messages; authentication returns `401`.

Security:

- All endpoints require `Authorization: Bearer <token>` except registration/login. Enforce per-user authorization checks on resource access.

API Details and Schemas

Auth

- `POST /auth/register`
	- Request JSON: {"email": "user@example.com", "password": "strongpass", "full_name": "Full Name"}
	- Success Response (201): {"id": 123, "email": "user@example.com", "full_name": "Full Name"}
	- Errors: 400 Bad Request, 422 Unprocessable Entity

- `POST /auth/login`
	- Request JSON: {"email": "user@example.com", "password": "strongpass"}
	- Success Response (200): {"access_token": "<jwt>", "token_type": "bearer", "expires_in": 3600}
	- Errors: 401 Unauthorized

Portfolios

- `GET /portfolios`
	- Success Response (200): [ {"id": 1, "name": "My Portfolio", "cash_balance": "10000.00"}, ... ]

- `POST /portfolios`
	- Request JSON: {"name": "Portfolio Name"}
	- Success Response (201): {"id": 2, "name": "Portfolio Name"}

International Accounts

- `POST /portfolios/{id}/accounts`
	- Request JSON: {"currency_code": "USD", "initial_balance": "1000.00"}
	- Success Response (201): {"id": 5, "portfolio_id": 2, "currency_code": "USD", "balance": "1000.00"}

Transactions

- `POST /transactions`
	- Request JSON: {"account_id": 5, "asset_id": 12, "direction": "BUY", "quantity": 10, "price": "125.50"}
	- Success Response (201): {"id": 42, "account_id": 5, "asset_id": 12, "direction": "BUY", "quantity": 10, "price": "125.50", "executed_at": "2026-05-21T12:34:56Z"}
	- Errors: 409 Conflict for insufficient balance, 422 for invalid payload

Reports

- `POST /reports`
	- Request JSON: {"period": "daily"}
	- Synchronous Success (201): returns created `ReportSection` object
	- Async/Queued Success (202): {"status": "queued", "message": "Report generation queued"}

- `GET /reports`
	- Success Response (200): [ {"report_id": 10, "ticker": "AAPL", "open_price": "150.00", "close_price": "152.50", "pct_change": 1.67, "period_high": "153.00", "period_low": "149.00"}, ... ]

Error format

- Standard error response: {"detail": "Human readable message", "code": "optional_machine_code"}

Security

- All endpoints require `Authorization: Bearer <token>` except registration and login. Authorization must verify that the authenticated user is permitted to access requested resources.


#### 4.1.8 Architectural Patterns

- Layered Architecture: clear separation between API (FastAPI), Service / Business Logic, and Data Access (SQLModel / SQLAlchemy). Frontend (Next.js) communicates with API over REST.
- Hexagonal / Ports-and-Adapters for Market Data: the `MarketDataService` is an adapter implementing a defined interface; allows swapping mock and live providers without changing business logic.
- Background Jobs: report generation and long-running tasks executed via background workers (FastAPI background tasks or a queue worker like RQ/Celery) to keep API responsive.
- Containerization & CI/CD: services packaged in Docker, orchestrated with `docker-compose` for local dev, and CI pipelines run lint/type checks, tests, and builds on PRs.
- Observability: structured logging, correlation IDs, and metrics exported for monitoring.

#### 4.1.9 Design Patterns

- Adapter: used for market-data providers (`MarketDataService`), allowing interchangeable data sources.
- Service Layer: business logic lives in services (e.g., `ReportGenService`) that orchestrate calls to adapters and repositories.
- Repository / DAO: abstract DB operations behind small repositories or via SQLModel models to centralize queries and enable testing.
- Unit of Work / Transactions: ensure atomic financial updates across multiple DB writes when processing trades.
- DTOs / Pydantic Models: define request/response schemas and validation for the API surface.
- Factory: create market-data adapter instances based on configuration (mock vs. live).

#### 4.1.10 Project Proposal Alignment (COS301)

Project Aim:

Provide a learning-focused sandbox where users can practice trading, make mistakes safely, and improve decision-making using real-time market data and virtual currency.

Key Proposal Points:

- Reinforce hands-on learning by designing database schemas, integrating APIs, visualizing interactive results, and optionally building AI agents.
- Core requirements align with the tender: real-time data visualization, time-frame switching, share price and daily high/low, intuitive UI, virtual portfolio management, detailed trade logs, and caching where permitted.
- Architectural and design expectations include secure handling of virtual payments in a sandbox, support for concurrent transactions and API requests, and an availability target of 99.9%.

Design and Delivery Requirements:

- Personal user information stored in a relational DB with a dedicated user service.
- Graphing of asset prices at multiple timestamps and currency switching support.
- Services responsible for querying and processing external API data.
- Delivery as a responsive web application deployed to free cloud hosting (Vercel/Render) with CI/CD via GitHub Actions.

Budget and Client Details:

- A one-time budget of R1000 is available for project expenses; recommended allocation is deployment first, then other materials.
- Project Owner / Mentor: Calvyn van Wyngaardt (calvyn.van.wyngaardt@epiuse.com)

Constraints (reiterated):

- API rate limits impose update frequency limits; use realistic mock data as fallback.
- System must avoid slippage and follow API Terms of Use for caching.
- No external LLM APIs; any AI components must be built from scratch or with local models.

#### 4.1.11 Technology Requirements

- Frontend: Next.js with TailwindCSS and reusable component primitives.
- Backend: FastAPI with SQLModel / SQLAlchemy for API and persistence layers.
- Database: PostgreSQL with Alembic migrations for schema changes.
- Authentication: JWT-based auth with password hashing and per-user authorization checks.
- Background processing: FastAPI background tasks and planned queue-based jobs for longer report work.
- Local development: Docker and Docker Compose for database and supporting services.
- Tooling: GitHub Actions for linting, tests, and build validation.
- Integration style: REST APIs for the frontend, with mock market-data support where live data is unavailable.
