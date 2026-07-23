import { randomBytes } from "crypto";
import type { PrismaClient } from "@prisma/client";

/**
 * Generic customer → Prestige Club member provisioning, used by the CSV
 * import (Aurora Suite exports, spreadsheets, any list). Same mechanics as
 * the Jobber import: accounts are created UNCLAIMED (empty password hash,
 * sign-in impossible) with an invite token; the customer claims theirs at
 * /claim/[token] or just by signing up with the same email.
 */

export type ImportRow = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
};

export type CsvImportSummary = {
  rowsSeen: number;
  created: number;
  existed: number;
  invalid: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function provisionMembers(
  db: PrismaClient,
  rows: ImportRow[]
): Promise<CsvImportSummary> {
  const summary: CsvImportSummary = {
    rowsSeen: rows.length,
    created: 0,
    existed: 0,
    invalid: 0,
  };

  for (const row of rows) {
    const email = (row.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      summary.invalid++;
      continue;
    }
    const existing = await db.member.findUnique({ where: { email } });
    if (existing) {
      summary.existed++;
      continue;
    }
    try {
      await db.member.create({
        data: {
          email,
          passwordHash: "", // unclaimed until the customer sets a password
          firstName: (row.firstName ?? "").trim().slice(0, 60) || "Neighbour",
          lastName: (row.lastName ?? "").trim().slice(0, 60) || null,
          phone: (row.phone ?? "").trim().slice(0, 30) || null,
          inviteToken: randomBytes(16).toString("hex"),
          profile: {
            create: {
              streetAddress:
                (row.streetAddress ?? "").trim().slice(0, 140) || null,
              city: (row.city ?? "").trim().slice(0, 60) || null,
              postalCode: (row.postalCode ?? "").trim().slice(0, 12) || null,
            },
          },
        },
      });
      summary.created++;
    } catch {
      summary.existed++; // unique race — treat as existing
    }
  }
  return summary;
}

/**
 * Tiny CSV parser (quotes + commas). Maps columns by header names when a
 * header row is present ("email", "first name"/"firstname"/"name",
 * "last name", "phone", "address", "city"); otherwise assumes
 * name,email,phone positional order.
 */
export function parseCustomerCsv(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5000);
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };

  const first = parseLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader = first.some((c) => c.includes("email"));

  const col = (names: string[]): number =>
    first.findIndex((c) => names.some((n) => c.replace(/[_\s-]/g, "") === n));

  const idx = hasHeader
    ? {
        email: col(["email", "emailaddress"]),
        first: col(["firstname", "first", "name", "fullname", "customername", "client"]),
        last: col(["lastname", "last", "surname"]),
        phone: col(["phone", "phonenumber", "tel", "mobile"]),
        address: col(["address", "streetaddress", "street", "address1", "addressline1"]),
        city: col(["city", "town"]),
        postal: col(["postalcode", "postal", "zip", "zipcode"]),
      }
    : {
        first: 0,
        email: 1,
        phone: 2,
        last: -1,
        address: -1,
        city: -1,
        postal: -1,
      };

  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const cells = parseLine(line);
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "") : "");
    let firstName = get(idx.first);
    let lastName = get(idx.last);
    if (!lastName) {
      // "Last, First" in one column (common CRM export format).
      const commaMatch = firstName.match(/^(.+?),\s*(.+)$/);
      if (commaMatch) {
        lastName = commaMatch[1].trim();
        firstName = commaMatch[2].trim();
      } else if (firstName.includes(" ")) {
        // "Full Name" in one column → split on the first space.
        const parts = firstName.split(/\s+/);
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }
    }
    return {
      firstName,
      lastName,
      email: get(idx.email),
      phone: get(idx.phone),
      streetAddress: get(idx.address),
      city: get(idx.city),
      postalCode: get(idx.postal),
    };
  });
}
