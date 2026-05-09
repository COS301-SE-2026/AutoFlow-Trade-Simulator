import { Card } from "../components/ui/card";
import { getBackendHealth } from "../lib/api";

export default async function HomePage() {
  const health = await getBackendHealth();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">AutoFlow Trade Simulator</p>
          <h1>Local-first setup for a trading app stack.</h1>
          <p className="lead">
            The repo starts with Postgres in Docker, a small FastAPI backend, and a Next.js frontend that can talk to the backend health route.
          </p>
          <div className="actions">
            <a className="button primary" href="/demo">
              Open the demo route
            </a>
            <a className="button secondary" href="http://localhost:8000/health">
              Backend health
            </a>
          </div>
          <div className="status">
            <span className="status-dot" />
            <span>{health ? `Backend online: ${health.status}` : "Backend offline or not started yet"}</span>
          </div>
        </section>

        <section className="grid two">
          <Card>
            <div className="badge">Next.js page routing</div>
            <h2>One home page, one demo route.</h2>
            <p className="muted">
              Keep the first frontend examples small so new pages can copy the pattern instead of inventing one.
            </p>
          </Card>
          <Card>
            <div className="badge">Frontend config</div>
            <h2>NEXT_PUBLIC_API_URL drives backend calls.</h2>
            <p className="muted">
              The app uses environment variables for the backend address, which keeps local Docker and later deployments aligned.
            </p>
            <div className="status" style={{ marginTop: 0 }}>
              <span className="status-dot" />
              <span>Use the shared component flow for every new screen.</span>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
