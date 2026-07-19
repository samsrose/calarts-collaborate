import {
  ALLOWED_MIME_TYPES,
  CALARTS_EMAIL_DOMAIN,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_POST,
  type AllowedMimeType,
} from "@/lib/constants";

export function isCalArtsEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 1) return false;
  const domain = normalized.slice(at + 1);
  return (
    domain === CALARTS_EMAIL_DOMAIN ||
    domain.endsWith(`.${CALARTS_EMAIL_DOMAIN}`)
  );
}

export function validateCalArtsEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  if (!isCalArtsEmail(email)) {
    return "Only calarts.edu email addresses and its subdomains are allowed.";
  }
  return null;
}

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export interface FileValidationInput {
  name: string;
  type: string;
  size: number;
}

export function validateAttachmentFile(
  file: FileValidationInput,
): string | null {
  if (!file.name) return "File name is required.";
  if (file.size <= 0) return "File is empty.";
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `“${file.name}” exceeds the 10 MB limit.`;
  }
  if (!isAllowedMimeType(file.type)) {
    return `“${file.name}” has an unsupported file type (${file.type || "unknown"}).`;
  }
  return null;
}

export function validateAttachmentList(
  files: FileValidationInput[],
): string | null {
  if (files.length > MAX_ATTACHMENTS_PER_POST) {
    return `You can attach up to ${MAX_ATTACHMENTS_PER_POST} files.`;
  }
  for (const file of files) {
    const error = validateAttachmentFile(file);
    if (error) return error;
  }
  return null;
}
