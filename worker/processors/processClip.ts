import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { clips } from "../../src/lib/db/schema";
import {
  getProcessedDir,
  getThumbnailPath,
  getSpriteSheetPath,
  getWebVTTPath,
  ensureDir,
} from "../../src/lib/storage";
import { extractMetadata } from "./extractMetadata";
import { generateThumbnail } from "./generateThumbnail";
import { generateSpriteSheet } from "./generateSpriteSheet";
import { generateClipName } from "./generateClipName";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

interface JobData {
  clipId: string;
}

export async function processClip(data: JobData): Promise<void> {
  const { clipId } = data;

  try {
    // 1. Read clip record from DB
    const [clip] = await db
      .select()
      .from(clips)
      .where(eq(clips.id, clipId))
      .limit(1);

    if (!clip) {
      throw new Error(`Clip not found: ${clipId}`);
    }

    const inputPath = clip.originalPath;

    // Update status to processing
    await db
      .update(clips)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(clips.id, clipId));

    // Ensure processed directory exists
    const processedDir = getProcessedDir(clipId);
    await ensureDir(processedDir);

    // 2. Extract metadata
    console.log(`[processClip] Extracting metadata for ${clipId}`);
    const metadata = await extractMetadata(inputPath);
    await db
      .update(clips)
      .set({
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        fps: metadata.fps,
        updatedAt: new Date(),
      })
      .where(eq(clips.id, clipId));

    // 3. Generate thumbnail
    console.log(`[processClip] Generating thumbnail for ${clipId}`);
    const thumbnailPath = getThumbnailPath(clipId);
    await generateThumbnail(inputPath, thumbnailPath, metadata.duration);

    // 4. Generate sprite sheet + WebVTT
    console.log(`[processClip] Generating sprite sheet for ${clipId}`);
    const spritePath = getSpriteSheetPath(clipId);
    const vttPath = getWebVTTPath(clipId);
    await generateSpriteSheet(inputPath, spritePath, vttPath, metadata.duration);

    // 5. Generate AI clip name
    console.log(`[processClip] Generating AI clip name for ${clipId}`);
    let clipName: string;
    try {
      clipName = await generateClipName(inputPath, metadata.duration, clipId);
    } catch (err) {
      console.warn(
        `[processClip] AI naming failed for ${clipId}, using filename:`,
        (err as Error).message
      );
      clipName = clip.originalFilename.replace(/\.[^.]+$/, "");
    }

    // 6. Update clip to ready
    await db
      .update(clips)
      .set({
        name: clipName,
        thumbnailPath,
        spriteSheetPath: spritePath,
        webvttPath: vttPath,
        status: "ready",
        updatedAt: new Date(),
      })
      .where(eq(clips.id, clipId));

    console.log(`[processClip] Clip ${clipId} processing complete: "${clipName}"`);
  } catch (err) {
    console.error(
      `[processClip] Error processing clip ${clipId}:`,
      (err as Error).message
    );

    // Set status to error
    await db
      .update(clips)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(clips.id, clipId));

    throw err;
  }
}
