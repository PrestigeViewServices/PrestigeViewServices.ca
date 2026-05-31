import { z } from "zod";

export const SUPPORT_TYPES = [
  { value: "QUOTE", label: "Quote" },
  { value: "ISSUE", label: "Issue" },
  { value: "DISPATCH", label: "Dispatch" },
  { value: "GENERAL", label: "General Request" },
] as const;

export const SUPPORT_TYPE_VALUES = SUPPORT_TYPES.map((t) => t.value) as [
  "QUOTE",
  "ISSUE",
  "DISPATCH",
  "GENERAL",
];

export const supportSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .min(7, "Please enter a valid phone number")
    .max(25)
    .regex(/^[0-9 +()\-.]+$/, "Use digits and ( ) + - only"),
  email: z.string().email("Please enter a valid email"),
  type: z.enum(SUPPORT_TYPE_VALUES, {
    errorMap: () => ({ message: "Pick a request type" }),
  }),
  propertyAddress: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
  details: z
    .string()
    .min(10, "Please share a sentence or two of detail")
    .max(2000, "Keep it under 2000 characters"),
  /** Anti-spam honeypot — must be empty */
  hp: z.string().max(0).optional(),
});

export type SupportFormValues = z.infer<typeof supportSchema>;
