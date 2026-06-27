# Performance Baseline Report

**Task:** TEST-S1.5 – Performance testing baseline (Lighthouse, k6)

## 1. Executive Summary

This report establishes the performance baseline for the AutoFlow Trade Simulator application. The baseline covers:

- **Lighthouse audits** for key frontend pages
- **k6 load testing** for critical API endpoints

All tests were run against the local development environment (`http://localhost:3001` for frontend, `http://localhost:8000` for API).

**Overall Status:** ⚠️ Several performance issues identified that require attention in future sprints.

---

## 2. Lighthouse Audit Results

### 2.1 Test Configuration

| Setting | Value |
|---------|-------|
| Device | Desktop |
| Categories | Performance, Accessibility, Best Practices, SEO |
| Throttling | Simulated |
| Mode | Navigation |
| Lighthouse Version | 13.4.0 |

### 2.2 Score Summary

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Home (`/`) | 70 | 95 | 100 | 100 |
| Login (`/login`) | 70 | 96 | 100 | 100 |
| Register (`/register`) | 70 | 96 | 100 | 100 |
| Dashboard (`/dashboard`) | 38 | 91 | 100 | 100 |

### 2.3 Core Web Vitals

| Page | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|------|----------|----------|----------|-----|
| Home (`/`) | 261 | 408 | 1,492 | 0.00 |
| Login (`/login`) | 250 | 393 | 1,504 | 0.00 |
| Register (`/register`) | 267 | 610 | 1,564 | 0.00 |
| Dashboard (`/dashboard`) | 294 | **6,257** | **3,537** | 0.087 |

### 2.4 Dashboard Performance Breakdown

The Dashboard page (`/dashboard`) shows significant performance issues:

| Subpart | Duration |
|---------|----------|
| Time to First Byte | 127ms |
| Element Render Delay | **5,431ms** |

**Root Causes Identified:**

| Issue | Impact |
|-------|--------|
| Large JavaScript bundles | 7.6MB (main-app.js + dashboard/page.js) |
| Long main-thread tasks | 1,451ms and 1,392ms tasks |
| Unused JavaScript | 145 KiB estimated savings |
| Missing source maps | Large first-party JS files lack source maps |
| Render-blocking CSS | Layout CSS blocks initial render (82ms wasted) |
| Legacy JavaScript | ~22 KiB of polyfills/transforms for modern features |

### 2.5 Accessibility Issues

All pages have colour contrast failures:

- **Nav links** (Dashboard, Portfolio, Markets, Leaderboard, AI Assistant): Contrast ratio 3.04 (requires 4.5:1)
- **Log out button**: Contrast ratio 1.84 (requires 4.5:1)
- **Form labels and inputs** (Login/Register pages): Contrast ratio 2.34 (requires 4.5:1)
- **Dashboard badges**: Contrast ratio 3.42 (requires 4.5:1)

### 2.6 Lighthouse Report Files

| Page | HTML Report | JSON Report |
|------|-------------|-------------|
| Home (`/`) | `lighthouse-home.html` | `lighthouse-home.json` |
| Login (`/login`) | `lighthouse-login.html` | `lighthouse-login.json` |
| Register (`/register`) | `lighthouse-register.html` | `lighthouse-register.json` |
| Dashboard (`/dashboard`) | `lighthouse-dashboard.html` | `lighthouse-dashboard.json` |

---

## 3. k6 Performance Test Results

### 3.1 Test Configuration

| Setting | Value |
|---------|-------|
| Test Environment | Local (`http://localhost:8000`) |
| Test Duration | 3m30s |
| Virtual Users | Ramp: 5 → 10 → 20 → 20 → 0 |
| Auth Required | Yes (JWT token from `/auth/login`) |
| Test User | `user@example.com` / `1234567890` |
| Account ID | 6 |

### 3.2 Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authentication (gets JWT token) |
| GET | `/health` | Health check |
| GET | `/demo` | Demo endpoint |
| GET | `/market-data/status` | Market data status |
| GET | `/market-data/assets` | Get available assets |
| GET | `/market-data/assets/{ticker}/summary` | Get asset summary (AAPL, GOOGL) |
| GET | `/market-data/assets/{ticker}/prices` | Get asset prices (AAPL, GOOGL) |
| GET | `/portfolio/status` | Portfolio status |
| GET | `/portfolio/accounts/6/holdings` | Get holdings |
| GET | `/portfolio/accounts/6/transactions` | Get trade history |
| GET | `/accounts/status` | Accounts status |
| GET | `/accounts` | Get all accounts |
| GET | `/accounts/6` | Get specific account |
| GET | `/reports/` | Get report history |
| POST | `/reports/` | Create report |
| GET | `/ui/status` | UI status |
| GET | `/auth/status` | Auth status |
| POST | `/portfolio/accounts/6` | Execute trade (buy → sell) |

### 3.3 Results Summary

| Metric | Value |
|--------|-------|
| Total Requests | 9,329 |
| Total Iterations | 491 |
| Test Duration | 3m31.9s |
| Requests per Second | 44.02 |

### 3.4 Response Times

| Metric | Average | Median | p90 | p95 | Max |
|--------|---------|--------|-----|-----|-----|
| HTTP Request Duration | 213.94ms | 73.64ms | 696.53ms | **924.44ms** | 2.76s |
| Expected Response | 240.85ms | 90.62ms | 751.72ms | **975.5ms** | 2.76s |

### 3.5 Error Rate

| Metric | Actual | Threshold | Status |
|--------|--------|-----------|--------|
| Error Rate | **15.78%** | < 1% | ❌ **FAILED** |
| Successful Checks | 100% | - | ✅ |

### 3.6 Threshold Status

| Threshold | Target | Actual | Status |
|-----------|--------|--------|--------|
| p95 Response Time | < 500ms | 924.44ms | ❌ **FAILED** |
| Error Rate | < 1% | 15.78% | ❌ **FAILED** |

### 3.7 Observations

**Strengths:**
- Login authentication works consistently
- Trade execution (buy/sell) succeeds
- All endpoints return expected responses

**Areas for Improvement:**
- **High error rate (15.78%)** — likely due to:
  - Failed login attempts (rate limiting or invalid credentials under load?)
  - Account ID 6 may not exist or may have insufficient permissions
  - Rate limiting on certain endpoints
- **p95 response time exceeds 500ms** — slower endpoints need optimisation
- API performance degrades significantly under 20 concurrent users

**Potential Issues:**
- Many `/market-data/assets/*/prices` requests were made — consider caching or reducing frequency
- The 15.78% failure rate suggests authentication or authorisation problems under load

### 3.8 k6 Files

| File | Description |
|------|-------------|
| `performance-baseline.js` | k6 test script |
| `performance-summary.json` | Test results summary |

---

## 4. Recommended Performance Thresholds

Based on baseline results and industry standards, the following thresholds are recommended for future sprints (Sprint 4+ CI integration):

| Metric | Current | Target | Critical |
|--------|---------|--------|----------|
| Lighthouse Performance | 38-70 | > 85 | < 70 |
| Lighthouse Accessibility | 91-96 | > 95 | < 85 |
| Lighthouse Best Practices | 100 | > 90 | < 80 |
| Lighthouse SEO | 100 | > 90 | < 80 |
| LCP (Dashboard) | 6,257ms | < 2,500ms | > 4,000ms |
| LCP (Other pages) | 393-610ms | < 2,500ms | > 4,000ms |
| TBT (Dashboard) | 3,537ms | < 300ms | > 600ms |
| TBT (Other pages) | 1,492-1,564ms | < 300ms | > 600ms |
| CLS | 0-0.087 | < 0.1 | > 0.25 |
| API p95 Response Time | 924ms | < 500ms | > 1,000ms |
| API Error Rate | 15.78% | < 1% | > 5% |

These thresholds will be enforced in CI/CD pipelines starting Sprint 4.

---

## 5. Recommendations

### 5.1 Immediate Actions (Sprint 2-3)

| Priority | Issue | Recommendation | Owner |
|----------|-------|----------------|-------|
| **Critical** | Dashboard LCP 6.3s | Code-split chart components; lazy load Recharts | Frontend (Michael) |
| **Critical** | API error rate 15.78% | Debug auth failures under load; verify account_id=6 exists | Backend (Grant) |
| **High** | TBT high on all pages | Reduce JavaScript bundle size; defer non-critical scripts | Frontend (Michael) |
| **High** | API p95 > 500ms | Identify slow endpoints; add caching; optimise queries | Backend (Caitanyah) |
| **Medium** | Colour contrast failures | Update colour palette to meet WCAG AA standards | Frontend (Michael) |
| **Medium** | Unused JavaScript | Tree-shake unused code; remove unused dependencies | Frontend (Michael) |

### 5.2 Sprint 4 Actions (CI/CD Integration)

- Integrate Lighthouse CI into GitHub Actions
- Automate k6 performance tests in CI pipeline
- Enforce performance thresholds (fail build if thresholds not met)
- Set up performance regression monitoring

### 5.3 Long-term Improvements

- Consider using a CDN for static assets
- Implement service worker for offline caching
- Add loading skeletons to improve perceived performance
- Optimise images with next/image
- Enable compression (gzip/brotli) for all assets

---

## 6. Conclusion

The baseline has been successfully established:

| Category | Status | Summary |
|----------|--------|---------|
| **Lighthouse (Home/Login/Register)** | ⚠️ | Scores of 70 — needs improvement |
| **Lighthouse (Dashboard)** | ❌ | Score of 38 — poor performance, LCP 6.3s |
| **k6 API Tests** | ❌ | 15.78% error rate, p95 924ms |

**Key Takeaways:**
- The **Dashboard page is the biggest performance bottleneck** — requires immediate attention
- **API error rate under load is unacceptable** — needs investigation and fixes
- **Performance thresholds should be enforced in CI** from Sprint 4 onwards
- **Accessibility issues** (colour contrast) need addressing

**Next Steps:**
1. Debug k6 failures (investigate 15.78% error rate)
2. Optimise Dashboard page load (LCP, TBT)
3. Implement code splitting and lazy loading
4. Integrate performance tests into CI/CD pipeline (Sprint 4)
5. Re-run baseline after major feature additions

---

## 7. References

- [Lighthouse Reports - local files]
- [k6 Test Script - `backend/tests/performance/performance-baseline.js`]
- [Demo 2 Sprint Plan - `PlanForCalvyn.md`]
- [Sprint 1 Team Plan - `demo2Plan.md`]

---

## Appendix A: Environment Details

| Component | Version |
|-----------|---------|
| Frontend | Next.js 15.5.18 |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Docker) |
| Cache | Redis (Docker) |
| OS | Linux (Ubuntu) |
| Browser | Chrome 151 |
| Lighthouse Version | 13.4.0 |
| k6 Version | Latest (via Docker) |

---

## Appendix B: k6 Test Stages

| Stage | Duration | Target VUs |
|-------|----------|------------|
| Ramp-up | 30s | 0 → 5 |
| Ramp-up | 1m | 5 → 10 |
| Ramp-up | 30s | 10 → 20 |
| Steady state | 1m | 20 |
| Ramp-down | 30s | 20 → 0 |

---

*Report prepared for Sprint 1 deliverable – June 27, 2026*