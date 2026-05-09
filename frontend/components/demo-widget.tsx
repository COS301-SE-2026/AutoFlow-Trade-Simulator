"use client";

import { useState } from "react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { getMockPrices } from "../lib/mock";

export function DemoWidget() {
  const [prices, setPrices] = useState(() => getMockPrices());

  return (
    <Card>
      <div className="badge">Local state example</div>
      <h3>Mock price feed</h3>
      <p className="muted">
        This widget uses local component state and deterministic sample data so new screens can start with a visible pattern.
      </p>
      <div className="grid" style={{ margin: "16px 0" }}>
        {prices.map((price, index) => (
          <div key={`${price}-${index}`}>{`Tick ${index + 1}: $${price.toFixed(2)}`}</div>
        ))}
      </div>
      <Button
        onClick={() => setPrices(getMockPrices(Date.now() % 1000, 4))}
        variant="secondary"
      >
        Refresh sample data
      </Button>
    </Card>
  );
}
