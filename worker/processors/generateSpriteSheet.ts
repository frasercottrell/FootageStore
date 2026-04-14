import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { ensureDir } from "../../src/lib/storage";

const GRID_COLS = 11;
const GRID_ROWS = 11;
const TOTAL_FRAMES = GRID_COLS * GRID_ROWS; // 121
const FRAME_WIDTH = 320;

export async function generateSpriteSheet(
  inputPath: string,
  spritePath: string,
  vttPath: string,
  duration: number,
  sourceWidth?: number,
  sourceHeight?: number
): Promise<void> {
  await ensureDir(path.dirname(spritePath));

  // Calculate frame height preserving aspect ratio
  const frameHeight =
    sourceWidth && sourceHeight
      ? Math.round((FRAME_WIDTH / sourceWidth) * sourceHeight)
      : Math.round((FRAME_WIDTH / 16) * 9); // fallback to 16:9

  // Make height even (required by some codecs)
  const evenHeight = frameHeight % 2 === 0 ? frameHeight : frameHeight + 1;

  // Calculate fps to extract exactly 121 frames spread evenly across the clip
  const extractFps = TOTAL_FRAMES / duration;

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vf",
        `fps=${extractFps},scale=${FRAME_WIDTH}:${evenHeight},tile=${GRID_COLS}x${GRID_ROWS}`,
        "-frames:v",
        "1",
        "-q:v",
        "3",
      ])
      .output(spritePath)
      .on("end", () => resolve())
      .on("error", (err) =>
        reject(new Error(`Sprite sheet generation failed: ${err.message}`))
      )
      .run();
  });

  // Generate WebVTT file
  const interval = duration / TOTAL_FRAMES;
  const spriteFilename = path.basename(spritePath);

  let vttContent = "WEBVTT\n\n";

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const startTime = i * interval;
    const endTime = (i + 1) * interval;

    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);

    const x = col * FRAME_WIDTH;
    const y = row * evenHeight;

    vttContent += `${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}\n`;
    vttContent += `${spriteFilename}#xywh=${x},${y},${FRAME_WIDTH},${evenHeight}\n\n`;
  }

  await fs.writeFile(vttPath, vttContent, "utf-8");
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad3(ms)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function pad3(n: number): string {
  return n.toString().padStart(3, "0");
}
