/**
 * Service catalogue for the leads pipeline. The website's only quote form is
 * the Aurora Suite embed on /quote and /contact, so nothing on the public
 * site posts here any more; these labels drive the CSV importer
 * (lib/lead-import.ts), which maps Aurora exports and spreadsheets onto
 * pipeline divisions.
 */

export type LeadDivision = "LAWNPROS" | "CLEARVIEW" | "SNOWLAND";

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

export function divisionForService(service: string): LeadDivision {
  return (
    LEAD_SERVICES.find((s) => s.value === service)?.division ?? "CLEARVIEW"
  );
}
