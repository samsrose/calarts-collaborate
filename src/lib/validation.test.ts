import { describe, expect, it } from "vitest";
import {
  isCalArtsEmail,
  validateAttachmentFile,
  validateAttachmentList,
  validateCalArtsEmail,
} from "@/lib/validation";

describe("isCalArtsEmail", () => {
  it("accepts calarts.edu and its subdomains", () => {
    expect(isCalArtsEmail("student@calarts.edu")).toBe(true);
    expect(isCalArtsEmail("  Name@CalArts.EDU ")).toBe(true);
    expect(isCalArtsEmail("graduate@alum.calarts.edu")).toBe(true);
    expect(isCalArtsEmail("person@dept.alum.calarts.edu")).toBe(true);
  });

  it("rejects other domains", () => {
    expect(isCalArtsEmail("student@gmail.com")).toBe(false);
    expect(isCalArtsEmail("student@fakecalarts.edu")).toBe(false);
    expect(isCalArtsEmail("student@calarts.edu.example.com")).toBe(false);
    expect(isCalArtsEmail("not-an-email")).toBe(false);
  });
});

describe("validateCalArtsEmail", () => {
  it("returns an error for empty or invalid emails", () => {
    expect(validateCalArtsEmail("")).toMatch(/required/i);
    expect(validateCalArtsEmail("a@b.com")).toMatch(/calarts\.edu/i);
    expect(validateCalArtsEmail("ok@calarts.edu")).toBeNull();
  });
});

describe("validateAttachmentFile", () => {
  it("rejects oversized and disallowed types", () => {
    expect(
      validateAttachmentFile({
        name: "big.png",
        type: "image/png",
        size: 11 * 1024 * 1024,
      }),
    ).toMatch(/10 MB/i);

    expect(
      validateAttachmentFile({
        name: "doc.pdf",
        type: "application/pdf",
        size: 100,
      }),
    ).toMatch(/unsupported/i);

    expect(
      validateAttachmentFile({
        name: "clip.mp3",
        type: "audio/mpeg",
        size: 1024,
      }),
    ).toBeNull();
  });
});

describe("validateAttachmentList", () => {
  it("enforces max count", () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      name: `f${i}.png`,
      type: "image/png",
      size: 10,
    }));
    expect(validateAttachmentList(files)).toMatch(/up to 5/i);
  });
});
