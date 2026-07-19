"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/lib/actions/forum";
import type { School } from "@/lib/types";

interface SettingsFormProps {
  displayName: string;
  bio: string;
  schoolIds: string[];
  schools: School[];
}

export function SettingsForm({
  displayName,
  bio,
  schoolIds,
  schools,
}: SettingsFormProps) {
  const [selectedSchools, setSelectedSchools] = useState(schoolIds);
  const [pending, startTransition] = useTransition();

  function toggleSchool(id: string, checked: boolean) {
    setSelectedSchools((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id),
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete("schools");
    selectedSchools.forEach((id) => formData.append("schools", id));

    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.ok) {
        toast.error(result.error ?? "Could not save settings.");
        return;
      }
      toast.success("Settings saved.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          required
          defaultValue={displayName}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={4} defaultValue={bio} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="avatar">Profile picture</Label>
        <Input id="avatar" name="avatar" type="file" accept="image/*" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Your schools</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {schools.map((school) => (
            <label
              key={school.id}
              className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm"
            >
              <Checkbox
                checked={selectedSchools.includes(school.id)}
                onCheckedChange={(checked) =>
                  toggleSchool(school.id, Boolean(checked))
                }
              />
              {school.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
