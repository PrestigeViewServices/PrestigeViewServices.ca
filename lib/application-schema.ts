import { z } from "zod";
import { CAREER_TYPES, roles } from "@/lib/content/careers";

const roleSlugs = roles.map((r) => r.slug) as [string, ...string[]];

export const YES_NO = ["yes", "no"] as const;

export const EXPERIENCE_BUCKETS = [
  "None",
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "5+ years",
] as const;

export const applicationSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .min(7, "Please enter a valid phone number")
    .max(25, "Phone number is too long")
    .regex(/^[0-9 +()\-.]+$/, "Use digits and ( ) + - only"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(roleSlugs, {
    errorMap: () => ({ message: "Choose the role you're applying for" }),
  }),
  availability: z.enum(CAREER_TYPES, {
    errorMap: () => ({ message: "Pick your availability" }),
  }),
  validLicense: z.enum(YES_NO, {
    errorMap: () => ({ message: "Please answer this question" }),
  }),
  reliableCommute: z.enum(YES_NO, {
    errorMap: () => ({ message: "Please answer this question" }),
  }),
  yearsExperience: z.enum(EXPERIENCE_BUCKETS, {
    errorMap: () => ({ message: "Pick your experience level" }),
  }),
  whyJoin: z
    .string()
    .max(1500, "Keep it under 1500 characters")
    .optional()
    .or(z.literal("")),
  resumeUrl: z
    .string()
    .url("Paste a public URL (Drive, Dropbox, LinkedIn, etc.)")
    .optional()
    .or(z.literal("")),
  /** Anti-spam honeypot — must be empty */
  hp: z.string().max(0).optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
