// One-shot CLI entrypoint: intended to be invoked by cron / a scheduled HTTP trigger, not left running.
async function run(): Promise<void> {
  console.log("pipeline run started", new Date().toISOString());
  // Fetch -> normalize -> persist lands in Iteration 2.
  console.log("pipeline run finished");
}

run().catch((err) => {
  console.error("pipeline run failed", err);
  process.exitCode = 1;
});
