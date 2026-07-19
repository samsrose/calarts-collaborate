export const CALARTS_EMAIL_DOMAIN = "calarts.edu";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS_PER_POST = 5;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-wav",
  "application/zip",
  "application/x-zip-compressed",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const SCHOOLS = [
  { id: "art", name: "Art" },
  { id: "critical_studies", name: "Critical Studies" },
  { id: "dance", name: "Dance" },
  { id: "film_video", name: "Film/Video" },
  { id: "music", name: "Music" },
  { id: "theater", name: "Theater" },
] as const;

export type SchoolId = (typeof SCHOOLS)[number]["id"];
