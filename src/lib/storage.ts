import path from "path";
import fs from "fs/promises";

const DATA_DIR = process.env.DATA_DIR || "./data";

export function getDataDir() {
  return DATA_DIR;
}

export function getOriginalDir(clientId: string, clipId: string) {
  return path.join(DATA_DIR, "originals", clientId, clipId);
}

export function getProcessedDir(clipId: string) {
  return path.join(DATA_DIR, "processed", clipId);
}

export function getOriginalPath(clientId: string, clipId: string, ext: string) {
  return path.join(getOriginalDir(clientId, clipId), `original${ext}`);
}

export function getThumbnailPath(clipId: string) {
  return path.join(getProcessedDir(clipId), "thumbnail.jpg");
}

export function getSpriteSheetPath(clipId: string) {
  return path.join(getProcessedDir(clipId), "sprite.jpg");
}

export function getWebVTTPath(clipId: string) {
  return path.join(getProcessedDir(clipId), "sprite.vtt");
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}
