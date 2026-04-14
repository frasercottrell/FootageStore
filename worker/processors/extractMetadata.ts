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

      // Handle rotation metadata — phone videos often store portrait as
      // 1920x1080 with rotation=90, so we need to swap width/height
      const rotation = parseInt(
        (videoStream as Record<string, unknown>).rotation as string ||
        videoStream.tags?.rotate ||
        "0",
        10
      );
      if (rotation === 90 || rotation === -90 || rotation === 270 || rotation === -270) {
        [width, height] = [height, width];
      }

      // Also check side_data for display matrix rotation (newer ffprobe)
      if (videoStream.side_data_list) {
        for (const sd of videoStream.side_data_list as Array<Record<string, unknown>>) {
          if (sd.rotation && (sd.rotation === 90 || sd.rotation === -90 || sd.rotation === 270 || sd.rotation === -270)) {
            // Only swap if we haven't already
            if (rotation === 0) {
              [width, height] = [height, width];
            }
          }
        }
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
