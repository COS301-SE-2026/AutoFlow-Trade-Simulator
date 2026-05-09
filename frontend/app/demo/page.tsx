"use client";

import { useState } from "react";

import { DemoWidget } from "../../components/demo-widget";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export default function DemoPage() {
  const [name, setName] = useState("analyst");

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Example route</p>
          <h1>Small UI primitives that are easy to copy.</h1>
          <p className="lead">
            This page shows a local component state example, a reusable card and button, and a deterministic mock data widget.
          </p>
          <div className="actions">
            <Button onClick={() => setName((current) => (current === "analyst" ? "trader" : "analyst"))}>
              Switch local state
            </Button>
            <Button variant="secondary" onClick={() => setName("analyst")}>
              Reset
            </Button>
          </div>
        </section>

        <section className="grid two">
          <Card>
            <div className="badge">Local component state</div>
            <h2>Current persona: {name}</h2>
            <p className="muted">Use tiny state examples like this when building new controls and filters.</p>
          </Card>
          <DemoWidget />
        </section>
      </div>
    </main>
  );
}
