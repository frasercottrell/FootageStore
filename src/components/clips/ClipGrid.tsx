"use client";

import ClipCard from "./ClipCard";

interface Clip {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  duration: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  codec: string;
  fps: number;
  originalFilename: string;
  uploadedAt: string;
  hasThumbnail: boolean;
  hasSpriteSheet: boolean;
}

interface ClipGridProps {
  clips: Clip[];
  onSelect: (clip: Clip) => void;
}

export default function ClipGrid({ clips, onSelect }: ClipGridProps) {
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      }}
    >
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} onSelect={onSelect} />
      ))}
    </div>
  );
}
