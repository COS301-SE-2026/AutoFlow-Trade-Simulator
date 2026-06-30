# Performance Baseline Report

**Task:** TEST-S1.5 – Performance testing baseline (Lighthouse, k6)

## 1. Executive Summary

This report establishes the performance baseline for the AutoFlow Trade Simulator application. The baseline covers:

- **Lighthouse audits** for key frontend pages
- **k6 load testing** for critical API endpoints

All tests were run against the local environment (`http://localhost:8000` for the API). Frontend Lighthouse audits were originally run against the frontend started with `npm run dev` (Next.js development mode), which is unoptimised and unminified and therefore not representative of real-world performance. The Lighthouse audits were re-run against the frontend started with `npm run start` (production build, `http://localhost:3000`), and the results below have been updated accordingly. The k6 API load test results are unaffected by the frontend serving mode, since they test the backend directly, and have been left as originally measured (re-confirmed by a second run, see §3.4–3.6).

**Overall Status:** ⚠️ Frontend performance is now strong on production build, but the API still has significant reliability and latency issues under load that require attention.

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
| Frontend serving mode | Production build (`npm run start`), `http://localhost:3000` |

> **Note:** An initial round of audits was run against `npm run dev` (development mode). Development mode serves unminified, unbundled JavaScript with extra dev-only instrumentation, which inflated bundle sizes and main-thread work and produced misleadingly poor scores (e.g. Dashboard Performance score of 38). All scores below reflect the corrected, production-build re-run.

### 2.2 Score Summary

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Home (`/`) | 100 | 95 | 100 | 100 |
| Login (`/login`) | 100 | 96 | 100 | 100 |
| Register (`/register`) | 100 | 96 | 100 | 100 |
| Dashboard (`/dashboard`) | 83 | 91 | 100 | 100 |

### 2.3 Core Web Vitals

| Page | FCP (ms) | LCP (ms) | TBT (ms) | CLS |
|------|----------|----------|----------|-----|
| Home (`/`) | 224 | 344 | 42 | 0.00 |
| Login (`/login`) | 235 | 574 | 47 | 0.00 |
| Register (`/register`) | 230 | 582 | 58 | 0.00 |
| Dashboard (`/dashboard`) | 218 | **983** | **317** | 0.087 |

### 2.4 Dashboard Performance Breakdown

The Dashboard page (`/dashboard`) is still the weakest-performing page, though the picture is far less severe than the original dev-mode audit suggested:

| Subpart | Duration |
|---------|----------|
| Time to First Byte | 10ms |
| Element Render Delay | **1,030ms** |

**Root Causes Identified:**

| Issue | Impact |
|-------|--------|
| Unused JavaScript | 71 KiB estimated savings |
| Main-thread work | 2.1s total main-thread work (script evaluation, style/layout) |
| Total page weight | 345 KiB (down from the 7.6MB seen under `npm run dev`) |
| Layout shift (CLS) | 0.087 — still within "needs improvement" range, caused by late-loading chart/select elements |

The previously reported issues (7.6MB JS bundles, 1.4s+ long tasks, missing source maps, render-blocking CSS, legacy polyfills) were artifacts of running Lighthouse against the unoptimised `npm run dev` server and are **not present** in the production build. The remaining Dashboard bottleneck is the **~1s element render delay** on the LCP element (a chart timeframe selector), most likely caused by client-side data fetching/hydration before the chart can render — this should still be optimised via code-splitting and lazy loading of chart components.

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

*Reports listed above reflect the production-build (`npm run start`) re-run, captured 2026-06-30.*

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

**Confirmation re-run:** The k6 test was re-run independently of the Lighthouse frontend-mode fix (since k6 hits the backend directly at `localhost:8000` and is unaffected by `npm run dev` vs `npm run start`). Results were consistent with — and slightly worse than — the original run:

| Metric | Average | Median | p90 | p95 | Max |
|--------|---------|--------|-----|-----|-----|
| HTTP Request Duration | 435.91ms | 210.99ms | 1.2s | **1.64s** | 3.3s |
| Expected Response | 484.73ms | 261.92ms | 1.29s | **1.78s** | 3.3s |

This confirms the API latency and error-rate issues are a genuine backend problem, not an artifact of how the frontend was started.

### 3.5 Error Rate

| Metric | Actual | Threshold | Status |
|--------|--------|-----------|--------|
| Error Rate | **15.78%** (both runs) | < 1% | ❌ **FAILED** |
| Successful Checks | 100% | - | ✅ |

### 3.6 Threshold Status

| Threshold | Target | Actual (Run 1) | Actual (Run 2) | Status |
|-----------|--------|-----------------|-----------------|--------|
| p95 Response Time | < 500ms | 924.44ms | 1.64s | ❌ **FAILED** |
| Error Rate | < 1% | 15.78% | 15.78% | ❌ **FAILED** |

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
| Lighthouse Performance | 83-100 | > 85 | < 70 |
| Lighthouse Accessibility | 91-96 | > 95 | < 85 |
| Lighthouse Best Practices | 100 | > 90 | < 80 |
| Lighthouse SEO | 100 | > 90 | < 80 |
| LCP (Dashboard) | 983ms | < 2,500ms | > 4,000ms |
| LCP (Other pages) | 344-582ms | < 2,500ms | > 4,000ms |
| TBT (Dashboard) | 317ms | < 300ms | > 600ms |
| TBT (Other pages) | 42-58ms | < 300ms | > 600ms |
| CLS | 0-0.087 | < 0.1 | > 0.25 |
| API p95 Response Time | 924ms-1.64s | < 500ms | > 1,000ms |
| API Error Rate | 15.78% | < 1% | > 5% |

These thresholds will be enforced in CI/CD pipelines starting Sprint 4.

---

## 5. Recommendations

### 5.1 Immediate Actions (Sprint 2-3)

| Priority | Issue | Recommendation | Owner |
|----------|-------|----------------|-------|
| **Critical** | API error rate 15.78% | Debug auth failures under load; verify account_id=6 exists | Backend (Grant) |
| **Critical** | API p95 924ms-1.64s | Identify slow endpoints; add caching; optimise queries | Backend (Caitanyah) |
| **High** | Dashboard render delay ~1s | Code-split chart components; lazy load Recharts | Frontend (Michael) |
| **High** | Dashboard TBT 317ms | Reduce client-side script work on Dashboard; defer non-critical scripts | Frontend (Michael) |
| **Medium** | Colour contrast failures | Update colour palette to meet WCAG AA standards | Frontend (Michael) |
| **Medium** | Unused JavaScript (Dashboard) | Tree-shake unused code; remove unused dependencies | Frontend (Michael) |
| ~~Resolved~~ | ~~Lighthouse scores measured on `npm run dev`~~ | Always benchmark Lighthouse against `npm run start` (production build), never `npm run dev` | N/A |

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

The baseline has been successfully established (and corrected after discovering the original Lighthouse audits were run against `npm run dev` instead of the production build):

| Category | Status | Summary |
|----------|--------|---------|
| **Lighthouse (Home/Login/Register)** | ✅ | Perfect Performance scores of 100 on production build |
| **Lighthouse (Dashboard)** | ⚠️ | Score of 83 — good, but still the weakest page; ~1s render delay on chart element |
| **k6 API Tests** | ❌ | 15.78% error rate, p95 924ms–1.64s across two runs |

**Key Takeaways:**
- The original Dashboard score of 38 and the 7.6MB bundle figures were measurement artifacts of testing against `npm run dev`; on the production build (`npm run start`) the Dashboard scores 83 with a 345 KiB total page weight
- The **Dashboard page is still the relative frontend bottleneck**, but the remaining issue is a ~1s element render delay, not bundle size — code-splitting/lazy-loading the chart is still recommended
- **API error rate and latency under load are unacceptable** and are confirmed to be a genuine backend issue, independent of frontend serving mode — needs investigation and fixes
- **Performance thresholds should be enforced in CI** from Sprint 4 onwards
- **Accessibility issues** (colour contrast) need addressing

**Next Steps:**
1. Debug k6 failures (investigate 15.78% error rate and rising p95 latency under load)
2. Optimise Dashboard chart render delay (lazy load Recharts)
3. Integrate performance tests into CI/CD pipeline (Sprint 4), always using a production build for Lighthouse
4. Re-run baseline after major feature additions

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