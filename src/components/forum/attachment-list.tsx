"use client";

import { DownloadIcon, FileArchiveIcon } from "lucide-react";
import type { Attachment } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface AttachmentListProps {
  attachments: Attachment[];
  urls: Record<string, string>;
}

export function AttachmentList({ attachments, urls }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {attachments.map((file) => {
        const url = urls[file.id];
        if (!url) return null;

        if (file.mime_type.startsWith("image/")) {
          return (
            <li key={file.id} className="overflow-hidden rounded-lg border border-border/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={file.file_name}
                className="max-h-80 w-full object-contain bg-muted/30"
              />
            </li>
          );
        }

        if (file.mime_type.startsWith("audio/")) {
          return (
            <li
              key={file.id}
              className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3"
            >
              <p className="mb-2 truncate text-xs text-muted-foreground">
                {file.file_name}
              </p>
              <audio controls preload="metadata" className="w-full">
                <source src={url} type={file.mime_type} />
              </audio>
            </li>
          );
        }

        return (
          <li key={file.id}>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={url} download={file.file_name} target="_blank" rel="noreferrer" />
              }
            >
              <FileArchiveIcon data-icon="inline-start" />
              {file.file_name}
              <DownloadIcon data-icon="inline-end" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
