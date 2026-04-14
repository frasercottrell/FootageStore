import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { ensureDir } from "../../src/lib/storage";

const anthropic = new Anthropic();

const FRAME_COUNT = 12;

interface SceneAnalysis {
  name: string;
  description: string;
}

export async function generateClipName(
  inputPath: string,
  duration: number,
  clipId: string
): Promise<SceneAnalysis> {
  const tmpDir = path.join("/tmp", `clip-analysis-${clipId}`);
  await ensureDir(tmpDir);

  // Extract 12 frames evenly spaced through the clip
  const timepoints = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const pct = (i + 0.5) / FRAME_COUNT;
    return pct * duration;
  });

  const framePaths: string[] = [];

  try {
    for (let i = 0; i < timepoints.length; i++) {
      const framePath = path.join(tmpDir, `frame_${i.toString().padStart(2, "0")}.jpg`);
      framePaths.push(framePath);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(timepoints[i])
          .frames(1)
          .outputOptions(["-vf", "scale=720:-1", "-q:v", "3"])
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
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            {
              type: "text",
              text: `These are ${FRAME_COUNT} frames extracted in sequence from a video clip (evenly spaced from start to end). Analyze the full sequence as if you're watching the video.

Respond in EXACTLY this format:

TITLE: [3-8 word descriptive title]
DESCRIPTION: [Detailed paragraph describing the scene]

For the DESCRIPTION, include:
- What subjects/people are doing (actions, movements, gestures)
- Objects, products, or items visible and how they're used
- Camera movement (pan, zoom, static, tracking, close-up, wide shot)
- Scene transitions or changes throughout the clip
- Setting/environment (studio, outdoor, kitchen, bathroom, etc.)
- Lighting and mood (natural, studio, warm, bright, moody)
- Any text, branding, or logos visible
- Style of footage (UGC, professional, testimonial, product demo, lifestyle, b-roll)

Write naturally — this description will be used for search, so use the kind of words someone would type when looking for this footage.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text?.trim() ?? "";

    // Parse the response
    const titleMatch = text.match(/TITLE:\s*(.+)/i);
    const descMatch = text.match(/DESCRIPTION:\s*([\s\S]+)/i);

    const name = titleMatch?.[1]?.trim() ?? "Untitled Clip";
    const description = descMatch?.[1]?.trim() ?? text;

    return { name, description };
  } finally {
    // Clean up temp files
    for (const fp of framePaths) {
      await fs.unlink(fp).catch(() => {});
    }
    await fs.rmdir(tmpDir).catch(() => {});
  }
}
