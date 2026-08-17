import express from "express";
import { runOnce } from "./runOnce.js";

const app = express();
const port = process.env.PORT ?? 3002;

let running = false;

// HTTP trigger alternative to the cron-invoked CLI (run.ts) — same runOnce() logic either way.
app.post("/run", (_req, res) => {
  if (running) {
    res.status(409).json({ error: "a pipeline run is already in progress" });
    return;
  }

  running = true;
  runOnce()
    .then((summary) => res.json(summary))
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: message });
    })
    .finally(() => {
      running = false;
    });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`worker HTTP trigger listening on http://localhost:${port} (POST /run)`);
});
