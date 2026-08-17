import express from "express";

const app = express();
const port = process.env.PORT ?? 3001;

// Stub endpoint; real snapshot/expected-state logic lands in Iteration 3.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
