/**
 * Re-analyze existing clips to generate scene descriptions.
 * Run with: npx tsx worker/reanalyze.ts
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, isNull } from "drizzle-orm";
import { clips } from "../src/lib/db/schema";
import { generateClipName } from "./processors/generateClipName";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
  // Find clips that don't have descriptions yet
  const toProcess = await db
    .select({
      id: clips.id,
      originalPath: clips.originalPath,
      duration: clips.duration,
      name: clips.name,
    })
    .from(clips)
    .where(isNull(clips.description));

  console.log(`Found ${toProcess.length} clips without descriptions`);

  for (const clip of toProcess) {
    if (!clip.duration || !clip.originalPath) {
      console.log(`Skipping ${clip.id} — missing duration or path`);
      continue;
    }

    console.log(`Analyzing ${clip.id} (${clip.name})...`);
    try {
      const analysis = await generateClipName(clip.originalPath, clip.duration, clip.id);
      await db
        .update(clips)
        .set({
          name: analysis.name,
          description: analysis.description,
          updatedAt: new Date(),
        })
        .where(eq(clips.id, clip.id));
      console.log(`  Title: ${analysis.name}`);
      console.log(`  Description: ${analysis.description.slice(0, 100)}...`);
    } catch (err) {
      console.error(`  Failed: ${(err as Error).message}`);
    }
  }

  console.log("Done!");
  await pool.end();
}

main().catch(console.error);
