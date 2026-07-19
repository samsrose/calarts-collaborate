"use client";

import { useRef, useState } from "react";
import { PaperclipIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_ATTACHMENTS_PER_POST } from "@/lib/constants";
import { validateAttachmentList } from "@/lib/validation";

interface FilePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FilePicker({ files, onChange, disabled }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const next = [...files, ...selected].slice(0, MAX_ATTACHMENTS_PER_POST);
    const validationError = validateAttachmentList(
      next.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    );
    setError(validationError);
    if (!validationError) onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    setError(null);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || files.length >= MAX_ATTACHMENTS_PER_POST}
          onClick={() => inputRef.current?.click()}
        >
          <PaperclipIcon data-icon="inline-start" />
          Attach files
        </Button>
        <span className="text-xs text-muted-foreground">
          Images, audio, or zip · up to {MAX_ATTACHMENTS_PER_POST} × 10 MB
        </span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/wav,audio/ogg,audio/mp4,application/zip,.zip"
          onChange={handleSelect}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-1.5 text-xs"
            >
              <span className="truncate">
                {file.name}{" "}
                <span className="text-muted-foreground">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeAt(index)}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
