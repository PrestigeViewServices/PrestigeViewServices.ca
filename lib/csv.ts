/**
 * Tiny CSV helpers shared by the lead export/import. Handles quoted fields,
 * doubled quotes, and commas inside quotes — the Excel / Aurora Suite /
 * Google Sheets dialect. No streaming: dashboard uploads are capped at
 * 2 MB, which is thousands of rows, far beyond a small company's history.
 */

export function parseCsvLine(line: string): string[] {
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
}

/** Splits CSV text into rows, respecting newlines inside quoted fields. */
export function parseCsv(text: string, maxRows = 5000): string[][] {
  const rows: string[][] = [];
  let cur = "";
  let inQuotes = false;
  const flush = () => {
    if (cur.trim()) rows.push(parseCsvLine(cur));
    cur = "";
  };
  for (let i = 0; i < text.length && rows.length < maxRows; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      flush();
    } else {
      cur += ch;
    }
  }
  flush();
  return rows;
}

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of rows) lines.push(r.map(csvEscape).join(","));
  // BOM so Excel opens UTF-8 (accents in Valley surnames) correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
