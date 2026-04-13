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
      const width = videoStream.width ?? 0;
      const height = videoStream.height ?? 0;
      const codec = videoStream.codec_name ?? "unknown";

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
