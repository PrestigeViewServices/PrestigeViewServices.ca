/**
 * Lead services and their pipeline divisions. Used by the CSV lead import
 * (lib/lead-import.ts) to map Aurora exports onto the admin pipeline. All
 * public lead capture runs through the Aurora Suite form.
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
 * The 8 core services plus a catch-all.
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
  { value: "snow-removal", label: "Residential Snow Removal (Seasonal)", division: "SNOWLAND" },
  { value: "commercial-snow-removal", label: "Commercial Snow Removal", division: "SNOWLAND" },
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
