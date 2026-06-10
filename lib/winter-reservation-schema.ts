import { z } from "zod";
import {
  DRIVEWAY_TIERS,
  DRIVEWAY_SIZES,
  SHOVELING_TIERS,
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
  customerNotes: z
    .string()
    .max(1500, "Keep it under 1500 characters")
    .optional()
    .or(z.literal("")),
  /** Anti-spam honeypot — must be empty */
  hp: z.string().max(0).optional(),
});

export type WinterReservationValues = z.infer<typeof winterReservationSchema>;
