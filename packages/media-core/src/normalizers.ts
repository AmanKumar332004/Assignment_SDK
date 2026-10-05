/**
 * Data normalization helpers converting raw Pexels responses into unified MediaItem models.
 */

import { MediaItem, VideoQualityFile } from "./types.js";

interface PexelsRawPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id?: number;
  avg_color?: string;
  src: {
    original: string;
    large2x?: string;
    large?: string;
    medium?: string;
    small?: string;
    portrait?: string;
    landscape?: string;
    tiny?: string;
  };
  alt?: string;
}

interface PexelsRawVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
}

interface PexelsRawVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsRawVideoFile[];
}

export function normalizePhoto(raw: unknown): MediaItem {
  const photo = raw as PexelsRawPhoto;
  const width = photo.width || 800;
  const height = photo.height || 600;

  return {
    id: `photo-${photo.id}`,
    sourceId: photo.id,
    type: "photo",
    title: photo.alt?.trim() ? photo.alt.trim() : `Photo by ${photo.photographer}`,
    width,
    height,
    aspectRatio: width / (height || 1),
    url: photo.url,
    previewUrl: photo.src?.medium || photo.src?.large || photo.src?.small || photo.src?.original || "",
    mediaUrl: photo.src?.large2x || photo.src?.large || photo.src?.original || "",
    downloadUrl: photo.src?.original || photo.src?.large2x || photo.src?.large || "",
    author: {
      name: photo.photographer || "Unknown Photographer",
      url: photo.photographer_url || "",
    },
    avgColor: photo.avg_color,
    raw,
  };
}

export function normalizeVideo(raw: unknown): MediaItem {
  const video = raw as PexelsRawVideo;
  const width = video.width || 1920;
  const height = video.height || 1080;

  const videoFiles: VideoQualityFile[] = (video.video_files || []).map((f) => ({
    id: f.id,
    quality: f.quality,
    fileType: f.file_type,
    width: f.width,
    height: f.height,
    fps: f.fps,
    link: f.link,
  }));

  // Choose the best quality stream for web playback (prefer hd mp4, fallback to first)
  const mp4Files = videoFiles.filter((f) => f.fileType?.includes("mp4"));
  const hdFile = mp4Files.find((f) => f.quality === "hd") || mp4Files[0] || videoFiles[0];
  const downloadFile = mp4Files.find((f) => f.quality === "hd") || mp4Files.find((f) => f.quality === "sd") || videoFiles[0];

  return {
    id: `video-${video.id}`,
    sourceId: video.id,
    type: "video",
    title: `Video by ${video.user?.name || "Pexels Creator"}`,
    width,
    height,
    aspectRatio: width / (height || 1),
    url: video.url,
    previewUrl: video.image || "",
    mediaUrl: hdFile?.link || "",
    downloadUrl: downloadFile?.link || video.url,
    author: {
      name: video.user?.name || "Unknown Creator",
      url: video.user?.url || "",
    },
    duration: video.duration || 0,
    videoFiles,
    raw,
  };
}

