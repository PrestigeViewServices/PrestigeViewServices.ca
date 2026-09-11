import type { LeadSource, LeadStatus, PrismaClient } from "@prisma/client";
import { parseCsv } from "./csv";
import { LEAD_SERVICES, divisionForService } from "./lead-schema";
import { services } from "./content/services";

/**
 * Lead import from any CSV — Aurora Suite lead exports, the CSV this
 * dashboard itself exports, a spreadsheet typed up from voicemails. Rows
 * become Lead records in the pipeline so every lead the business has ever
 * received is followed up from ONE inbox.
 *
 * Re-running is safe: a row is skipped when a lead with the same email
 * already exists from the same day (or, when the row has no date, with the
 * same email and the same service). Nothing existing is ever modified.
 */

export type LeadImportRow = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  services?: string;
  message?: string;
  created?: string;
  status?: string;
  source?: string;
  notes?: string;
};

export type LeadImportSummary = {
  rowsSeen: number;
  created: number;
  duplicates: number;
  invalid: number;
  /** First few reasons rows were rejected, for the result banner. */
  problems: string[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Header aliases. Matching is case-insensitive and ignores punctuation, so
 * "Phone Number", "phone_number" and "Mobile" all land on `phone`.
 */
const HEADER_ALIASES: Record<keyof LeadImportRow, string[]> = {
  name: ["name", "fullname", "full name", "contact", "contactname", "customer", "customername", "client"],
  email: ["email", "emailaddress", "e-mail", "mail"],
  phone: ["phone", "phonenumber", "mobile", "cell", "telephone", "tel"],
  address: ["address", "propertyaddress", "streetaddress", "street", "property", "location"],
  services: ["services", "service", "servicetype", "interestedin", "interest", "category", "type", "job", "jobtype"],
  message: ["message", "notes from customer", "customernotes", "comments", "comment", "details", "description", "request", "inquiry"],
  created: ["created", "createdat", "date", "submitted", "submittedat", "received", "receivedat", "timestamp", "time"],
  status: ["status", "stage"],
  source: ["source", "channel", "origin"],
  notes: ["notes", "internalnotes", "adminnotes"],
};

function normHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Looser second pass for headers no alias list can anticipate ("Date
 * Submitted", "Customer Email", "Best Phone"). Order matters: the first
 * fragment found wins, so "Email Address" is email before it is address.
 */
const HEADER_FRAGMENTS: Array<[keyof LeadImportRow, string[]]> = [
  ["email", ["email"]],
  ["phone", ["phone", "mobile", "cell", "tel"]],
  ["created", ["date", "created", "submitted", "received", "timestamp"]],
  ["status", ["status", "stage"]],
  ["source", ["source", "channel"]],
  ["address", ["address", "street"]],
  ["services", ["service"]],
  ["message", ["message", "comment", "detail", "description", "request"]],
  ["notes", ["note"]],
  ["name", ["name", "contact", "customer", "client"]],
];

function matchHeader(h: string): keyof LeadImportRow | "firstName" | "lastName" | null {
  const n = normHeader(h);
  if (n === "firstname" || n === "first") return "firstName";
  if (n === "lastname" || n === "last" || n === "surname") return "lastName";
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((a) => normHeader(a) === n)) return key as keyof LeadImportRow;
  }
  if (n.includes("first") && n.includes("name")) return "firstName";
  if (n.includes("last") && n.includes("name")) return "lastName";
  if (n.endsWith("id")) return null; // "Lead ID", "Contact ID"
  for (const [key, fragments] of HEADER_FRAGMENTS) {
    if (fragments.some((f) => n.includes(f))) return key;
  }
  return null;
}

/**
 * Parses CSV text to import rows. With a header row, columns are matched by
 * name; without one, the order name,email,phone,services,message is assumed.
 */
export function parseLeadCsv(text: string): LeadImportRow[] {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length === 0) return [];

  const header = rows[0];
  const mapped = header.map(matchHeader);
  const hasHeader = mapped.some((m) => m === "email" || m === "name" || m === "phone");

  if (!hasHeader) {
    return rows.map((c) => ({
      name: c[0],
      email: c[1],
      phone: c[2],
      services: c[3],
      message: c[4],
    }));
  }

  return rows.slice(1).map((cells) => {
    const row: LeadImportRow & { firstName?: string; lastName?: string } = {};
    mapped.forEach((key, i) => {
      if (!key) return;
      const v = cells[i] ?? "";
      if (!v) return;
      // First non-empty wins so "Notes" + "Comments" don't clobber each other.
      if (!row[key]) row[key] = v;
    });
    if (!row.name && (row.firstName || row.lastName)) {
      row.name = [row.firstName, row.lastName].filter(Boolean).join(" ");
    }
    delete row.firstName;
    delete row.lastName;
    return row;
  });
}

/** "windows" ~ "window", "gutters" ~ "gutter": plural-insensitive compare. */
function stem(s: string): string {
  return s.toLowerCase().replace(/s\b/g, "").replace(/\s+/g, " ").trim();
}

/** Free text like "Gutter Cleaning; window cleaning" → known service slugs. */
export function resolveServiceSlugs(text: string | undefined): string[] {
  if (!text) return [];
  const parts = text
    .split(/[;,|/]+|\band\b|\+/i)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const ps = stem(p);
    const bySlug = services.find((s) => s.slug === p.replace(/\s+/g, "-"));
    const byName = services.find((s) => stem(s.name) === ps);
    const byForm = LEAD_SERVICES.find(
      (s) => s.value === p || stem(s.label) === ps
    );
    // Fuzzy: the row text contains the service name, or the first word of
    // the service name ("window" from "Window Cleaning") appears in the row.
    const fuzzy =
      services.find((s) => ps.includes(stem(s.name))) ??
      services.find((s) => {
        const head = stem(s.name).split(" ")[0];
        return head.length > 3 && ps.split(" ").includes(head);
      });
    const slug = bySlug?.slug ?? byName?.slug ?? byForm?.value ?? fuzzy?.slug;
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

const STATUS_ALIASES: Record<string, LeadStatus> = {
  new: "NEW",
  open: "NEW",
  uncontacted: "NEW",
  contacted: "QUOTED",
  quoted: "QUOTED",
  estimate: "QUOTED",
  estimated: "QUOTED",
  won: "WON",
  booked: "WON",
  converted: "WON",
  customer: "WON",
  closed: "WON",
  lost: "LOST",
  declined: "LOST",
  dead: "LOST",
  spam: "LOST",
};

function parseStatus(s: string | undefined): LeadStatus {
  const key = (s ?? "").trim().toLowerCase();
  return STATUS_ALIASES[key] ?? "NEW";
}

function parseSource(s: string | undefined): LeadSource {
  const key = (s ?? "").trim().toLowerCase();
  if (key.includes("phone") || key.includes("call")) return "PHONE";
  if (key.includes("door")) return "DOOR_TO_DOOR";
  if (key.includes("portal") || key.includes("account")) return "PORTAL";
  if (key.includes("form") || key.includes("web") || key.includes("aurora")) return "PUBLIC_FORM";
  return "MANUAL";
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function sameDayRange(d: Date): { gte: Date; lt: Date } {
  const gte = new Date(d);
  gte.setHours(0, 0, 0, 0);
  const lt = new Date(gte.getTime() + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

export async function importLeads(
  db: PrismaClient,
  rows: LeadImportRow[]
): Promise<LeadImportSummary> {
  const summary: LeadImportSummary = {
    rowsSeen: rows.length,
    created: 0,
    duplicates: 0,
    invalid: 0,
    problems: [],
  };

  for (const [i, row] of rows.entries()) {
    const email = (row.email ?? "").trim().toLowerCase();
    const name = (row.name ?? "").trim().slice(0, 80);
    const phone = (row.phone ?? "").trim().slice(0, 25);
    if (!EMAIL_RE.test(email) || !name) {
      summary.invalid++;
      if (summary.problems.length < 5) {
        summary.problems.push(
          `Row ${i + 1}: ${!name ? "no name" : `bad email "${row.email ?? ""}"`}`
        );
      }
      continue;
    }

    const slugs = resolveServiceSlugs(row.services);
    const created = parseDate(row.created);

    // Duplicate guard: same email on the same day, or same email + same
    // service when the row carries no date.
    const dupe = await db.lead.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        ...(created
          ? { createdAt: sameDayRange(created) }
          : slugs.length
            ? { serviceSlugs: { equals: slugs } }
            : {}),
      },
      select: { id: true },
    });
    if (dupe) {
      summary.duplicates++;
      continue;
    }

    const division = slugs.length ? divisionForService(slugs[0]) : null;
    const message = (row.message ?? "").trim().slice(0, 2000) || null;
    const importNote = `Imported ${new Date().toLocaleDateString("en-CA")}${row.source ? ` from ${row.source.trim()}` : ""}`;
    const notes = [row.notes?.trim(), importNote].filter(Boolean).join("\n");

    await db.lead.create({
      data: {
        name,
        email,
        phone: phone || "n/a",
        propertyAddress: (row.address ?? "").trim().slice(0, 200) || null,
        division,
        serviceSlugs: slugs.length ? slugs : undefined,
        message,
        status: parseStatus(row.status),
        source: parseSource(row.source),
        notes,
        ...(created ? { createdAt: created } : {}),
      },
    });
    summary.created++;
  }
  return summary;
}
