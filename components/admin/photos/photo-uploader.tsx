"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Sections the public site reads from. Extend as you add gallery surfaces. */
const SECTIONS = [
  { value: "home", label: "Home — Recent Work strip" },
] as const;

export function PhotoUploader() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<string>("home");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setError("Pick an image first.");
      return;
    }
    setStatus("uploading");
    setError(null);

    const form = new FormData();
    form.append("file", file);
    form.append("alt", alt);
    form.append("section", section);
    if (caption) form.append("caption", caption);

    try {
      const res = await fetch("/api/admin/photos", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data?.error || "Upload failed");
        return;
      }
      setStatus("success");
      setAlt("");
      setCaption("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch {
      setStatus("error");
      setError("Network error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold leading-tight">Upload a photo</h2>
          <p className="text-xs text-muted-foreground">
            JPEG / PNG / WebP, ≤ 5 MB. Goes live as soon as the upload finishes.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pf-file">Image file *</Label>
          <Input
            id="pf-file"
            type="file"
            ref={fileInput}
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-section">Section *</Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger id="pf-section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pf-alt">Alt text *</Label>
        <Input
          id="pf-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="e.g. Freshly mowed Petawawa lawn with crisp edging"
          required
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Describe what the photo shows. Screen readers and Google read this.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pf-caption">Caption (optional)</Label>
        <Input
          id="pf-caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Weekly mow &amp; edge · Petawawa"
          maxLength={200}
        />
      </div>

      {status === "error" && error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {status === "success" && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-start gap-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Uploaded — it's live on the public site.</span>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={status === "uploading"}
      >
        {status === "uploading" ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
