import ffmpeg from "fluent-ffmpeg";

export interface ClipMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
}

export function extractMetadata(inputPath: string): Promise<ClipMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, data) => {
      if (err) {
        return reject(new Error(`ffprobe failed: ${err.message}`));
      }

      const videoStream = data.streams.find((s) => s.codec_type === "video");
      if (!videoStream) {
        return reject(new Error("No video stream found"));
      }

      const duration = data.format.duration ?? 0;
      let width = videoStream.width ?? 0;
      let height = videoStream.height ?? 0;
      const codec = videoStream.codec_name ?? "unknown";

      // Detect rotation from all possible sources
      // Phone videos store portrait as 1920x1080 with rotation metadata
      const rawStream = videoStream as Record<string, unknown>;
      let detectedRotation = 0;

      // Source 1: direct rotation property on stream
      if (rawStream.rotation !== undefined) {
        detectedRotation = Math.abs(Number(rawStream.rotation));
      }
      // Source 2: tags.rotate
      else if (videoStream.tags?.rotate) {
        detectedRotation = Math.abs(Number(videoStream.tags.rotate));
      }
      // Source 3: side_data_list display matrix (newer ffprobe versions)
      else if (rawStream.side_data_list && Array.isArray(rawStream.side_data_list)) {
        for (const sd of rawStream.side_data_list as Array<Record<string, unknown>>) {
          if (sd.side_data_type === "Display Matrix" && sd.rotation !== undefined) {
            detectedRotation = Math.abs(Number(sd.rotation));
            break;
          }
        }
      }

      // Swap width/height for 90° or 270° rotation
      if (detectedRotation === 90 || detectedRotation === 270) {
        console.log(`[extractMetadata] Rotation ${detectedRotation}° detected — swapping ${width}x${height} to ${height}x${width}`);
        [width, height] = [height, width];
      }

      // Parse fps from r_frame_rate (e.g. "30/1" or "24000/1001")
      let fps = 0;
      if (videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split("/");
        if (parts.length === 2) {
          fps = parseFloat(parts[0]) / parseFloat(parts[1]);
        } else {
          fps = parseFloat(parts[0]);
        }
      }

      resolve({
        duration,
        width,
        height,
        codec,
        fps: Math.round(fps * 100) / 100,
      });
    });
  });
}
