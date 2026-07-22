import { z } from "zod";

/**
 * Native "request service" lead form → /api/leads → Lead (pipeline NEW).
 * Replaces nothing: the external Aurora iframe on /quote stays; this is the
 * internal-pipeline intake path (brief: "public form → Lead automatically").
 */

export const LEAD_DIVISIONS = [
  { value: "LAWNPROS", label: "Lawn Care, Hedges & Landscaping" },
  { value: "CLEARVIEW", label: "Windows, Gutters & Exterior Cleaning" },
  { value: "SNOWLAND", label: "Snow Removal" },
] as const;

export const LEAD_DIVISION_VALUES = LEAD_DIVISIONS.map((d) => d.value) as [
  "LAWNPROS",
  "CLEARVIEW",
  "SNOWLAND",
];

export type LeadDivision = (typeof LEAD_DIVISION_VALUES)[number];

/**
 * The public form's service dropdown: the 8 core services plus a catch-all.
 * Each maps to the internal pipeline division for the admin dashboard.
 */
export const LEAD_SERVICES = [
  { value: "window-cleaning", label: "Window Cleaning", division: "CLEARVIEW" },
  { value: "gutter-cleaning", label: "Gutter Cleaning", division: "CLEARVIEW" },
  { value: "pressure-washing", label: "Pressure Washing", division: "CLEARVIEW" },
  { value: "house-washing", label: "House Washing / Soft Washing", division: "CLEARVIEW" },
  { value: "lawn-mowing", label: "Lawn Care & Mowing", division: "LAWNPROS" },
  { value: "hedge-trimming", label: "Hedge Trimming & Shrub Care", division: "LAWNPROS" },
  { value: "landscaping-services", label: "Landscaping Project", division: "LAWNPROS" },
  { value: "fall-cleanup", label: "Fall Cleanup", division: "LAWNPROS" },
  { value: "snow-removal", label: "Snow Removal (Seasonal Contract)", division: "SNOWLAND" },
  { value: "other", label: "Something else / not sure", division: "CLEARVIEW" },
] as const;

export const LEAD_SERVICE_VALUES = LEAD_SERVICES.map((s) => s.value) as [
  (typeof LEAD_SERVICES)[number]["value"],
  ...(typeof LEAD_SERVICES)[number]["value"][],
];

export function divisionForService(service: string): LeadDivision {
  return (
    LEAD_SERVICES.find((s) => s.value === service)?.division ?? "CLEARVIEW"
  );
}

/** Snow services show the early-bird promo checkbox while it runs. */
export const SNOW_SERVICE_VALUES = ["snow-removal"];
export const EARLYBIRD_CODE = "EARLYBIRD15";
export const EARLYBIRD_DEADLINE = "2026-08-15T00:00:00-04:00"; // through Aug 14

export const leadSchema = z.object({
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
  service: z.enum(LEAD_SERVICE_VALUES, {
    errorMap: () => ({ message: "Pick the service you need" }),
  }),
  /** Set when the early-bird checkbox is ticked on a snow request. */
  promoCode: z.string().max(30).optional().or(z.literal("")),
  propertyAddress: z.string().max(200).optional().or(z.literal("")),
  message: z
    .string()
    .max(2000, "Keep it under 2000 characters")
    .optional()
    .or(z.literal("")),
  /** Anti-spam honeypot — must be empty. */
  hp: z.string().max(0).optional(),
});

export type LeadFormValues = z.infer<typeof leadSchema>;
