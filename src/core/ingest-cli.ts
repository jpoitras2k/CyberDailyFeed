import { ingestAllSources, defaultFetcher } from "./ingestion";
import { formatRelativeTime } from "./freshness";

const live = process.argv.includes("--live");

async function main(): Promise<void> {
  if (!live) {
    console.log("Usage: npm run ingest:live");
    console.log("Runs RSS ingestion against official endpoints and prints the 24h window.");
    console.log("Fixture-backed parser tests live in npm test — run those first.");
    process.exit(0);
  }

  const snapshot = await ingestAllSources(defaultFetcher, { now: new Date() });

  console.log(`CyberDailyFeed ingest  ${snapshot.generatedAt}`);
  console.log("source                         fetched  fresh  stale  undated  status");
  for (const source of snapshot.sources) {
    const status = source.error ? `ERROR ${source.error}` : "ok";
    console.log(
      `${source.sourceName.padEnd(30)} ${String(source.fetched).padStart(7)} ${String(source.fresh.length).padStart(6)} ${String(source.stale).padStart(6)} ${String(source.droppedUndated).padStart(8)}  ${status}`,
    );
  }
  console.log("");
  console.log(`Today-only headlines: ${snapshot.headlines.length}`);
  for (const headline of snapshot.headlines.slice(0, 25)) {
    const tags = headline.categories.length
      ? ` [${headline.categories.join(",")}]`
      : "";
    console.log(
      `- ${formatRelativeTime(headline.publishedAt)}  ${headline.sourceName}  ${headline.title}${tags}`,
    );
    console.log(`  ${headline.url}`);
  }
  if (snapshot.errors.length > 0) {
    console.log("\nSource errors (non-fatal):");
    for (const error of snapshot.errors) {
      console.log(`- ${error.sourceName}: ${error.message}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
