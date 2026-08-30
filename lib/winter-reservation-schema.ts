import { z } from "zod";
import {
  ADD_ON_KEYS,
  DRIVEWAY_TIERS,
  DRIVEWAY_SIZES,
  SHOVELING_TIERS,
  WINTER_TOWNS,
} from "@/lib/content/winter-packages";

export const winterReservationSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter your full name")
    .max(80, "Name is too long"),
  email: z.string().email("Please enter a valid email"),
  phone: z
    .string()
    .min(7, "Please enter a valid phone number")
    .max(25, "Phone number is too long")
    .regex(/^[0-9 +()\-.]+$/, "Use digits and ( ) + - only"),
  streetAddress: z
    .string()
    .min(3, "Please enter your street address")
    .max(200, "Address is too long"),
  /**
   * Which route the property sits on. "OTHER" means outside our two snow
   * towns, in which case `city` carries the town the customer typed.
   */
  town: z.enum(WINTER_TOWNS).default("PETAWAWA"),
  city: z.string().min(2, "Please enter your city").max(80, "City is too long"),
  region: z.string().max(40).optional(),
  postalCode: z
    .string()
    .max(12, "Postal code is too long")
    .optional()
    .or(z.literal("")),
  drivewayTier: z.enum(DRIVEWAY_TIERS, {
    errorMap: () => ({ message: "Choose a driveway plowing tier" }),
  }),
  drivewaySize: z.enum(DRIVEWAY_SIZES, {
    errorMap: () => ({ message: "Choose your driveway size" }),
  }),
  shovelingTier: z.enum(SHOVELING_TIERS).default("NONE"),
  /** Multi-select extras. Deduped so a replayed payload can't inflate the list. */
  addOns: z
    .array(z.enum(ADD_ON_KEYS))
    .max(ADD_ON_KEYS.length)
    .default([])
    .transform((keys) => Array.from(new Set(keys))),
  customerNotes: z
    .string()
    .max(1500, "Keep it under 1500 characters")
    .optional()
    .or(z.literal("")),
  /** Which page/CTA produced this reservation, e.g. "winter-packages via
   * lawn-mowing". Stored for the admin winter dashboard. */
  sourcePage: z.string().max(160).optional().or(z.literal("")),
  /** Anti-spam honeypot — must be empty */
  hp: z.string().max(0).optional(),
});

export type WinterReservationValues = z.infer<typeof winterReservationSchema>;
