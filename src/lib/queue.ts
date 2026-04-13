import { Queue } from "bullmq";
import { createRedisConnection } from "./redis";

let clipQueue: Queue | null = null;

export function getClipQueue() {
  if (!clipQueue) {
    clipQueue = new Queue("clip-processing", {
      connection: createRedisConnection(),
    });
  }
  return clipQueue;
}
