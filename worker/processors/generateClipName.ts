import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { ensureDir } from "../../src/lib/storage";

const anthropic = new Anthropic();

export async function generateClipName(
  inputPath: string,
  duration: number,
  clipId: string
): Promise<string> {
  const tmpDir = path.join("/tmp", `clip-name-${clipId}`);
  await ensureDir(tmpDir);

  const timepoints = [0.25, 0.5, 0.75].map((pct) => pct * duration);
  const framePaths: string[] = [];

  try {
    // Extract 3 frames at 25%, 50%, and 75% of the clip
    for (let i = 0; i < timepoints.length; i++) {
      const framePath = path.join(tmpDir, `frame_${i}.jpg`);
      framePaths.push(framePath);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(timepoints[i])
          .frames(1)
          .outputOptions(["-q:v", "2"])
          .output(framePath)
          .on("end", () => resolve())
          .on("error", (err) =>
            reject(new Error(`Frame extraction failed: ${err.message}`))
          )
          .run();
      });
    }

    // Read frames as base64
    const imageContents: Anthropic.ImageBlockParam[] = [];
    for (const fp of framePaths) {
      const data = await fs.readFile(fp);
      imageContents.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: data.toString("base64"),
        },
      });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            {
              type: "text",
              text: "These are 3 frames from a video clip (at 25%, 50%, and 75% through). Describe what's happening in this video clip in 3-6 words. Be specific and concise. Examples: 'Close-up shave scene', 'Product on marble counter', 'Woman applying sunscreen'. Respond with ONLY the description, nothing else.",
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.text?.trim() ?? "Untitled Clip";
  } finally {
    // Clean up temp files
    for (const fp of framePaths) {
      await fs.unlink(fp).catch(() => {});
    }
    await fs.rmdir(tmpDir).catch(() => {});
  }
}
