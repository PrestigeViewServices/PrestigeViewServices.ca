import {
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { getService } from "./content/services";
import { siteConfig } from "./site";

/**
 * Word (.docx) export of the Lead table: one page-ready record per lead
 * with every detail the customer gave us, so the office can re-quote from
 * the document alone. Newest first, "not yet quoted" leads on top.
 *
 * Built from the same rows as the CSV export (lib/lead-export.ts); this is
 * the human-readable shape, that one is the spreadsheet shape.
 */

export type LeadDocRow = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  phone: string;
  propertyAddress: string | null;
  division: string | null;
  serviceSlugs: unknown;
  message: string | null;
  status: string;
  source: string;
  estimateCents: number | null;
  notes: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  NEW: "New, not quoted yet",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
};

const SOURCE_LABEL: Record<string, string> = {
  PUBLIC_FORM: "Website form",
  PORTAL: "Customer portal",
  MANUAL: "Entered by office",
  PHONE: "Phone call",
};

const DIVISION_LABEL: Record<string, string> = {
  LAWNPROS: "PVS LawnPros",
  CLEARVIEW: "PVS ClearView",
  SNOWLAND: "PVS SnowLand",
};

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "C9CED6" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const LABEL_SHADE = { type: ShadingType.CLEAR, color: "auto", fill: "EEF1F5" };
const HEADER_SHADE = { type: ShadingType.CLEAR, color: "auto", fill: "1F3A5F" };

function servicesOf(l: LeadDocRow): string {
  const slugs = Array.isArray(l.serviceSlugs) ? (l.serviceSlugs as string[]) : [];
  return slugs.map((s) => getService(s)?.name ?? s).join(", ");
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;
}

function when(d: Date): string {
  return d.toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function text(value: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({ text: value, bold: opts.bold, size: opts.size, color: opts.color });
}

function cell(
  content: string,
  opts: { bold?: boolean; shade?: typeof LABEL_SHADE; width: number; color?: string } 
): TableCell {
  // Preserve the customer's own line breaks in messages.
  const lines = content.split(/\r?\n/);
  return new TableCell({
    borders: BORDERS,
    shading: opts.shade,
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: lines.map(
      (line) =>
        new Paragraph({
          children: [text(line, { bold: opts.bold, size: 20, color: opts.color })],
        })
    ),
  });
}

function fieldRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      cell(label, { bold: true, shade: LABEL_SHADE, width: 28 }),
      cell(value, { width: 72 }),
    ],
  });
}

function leadSection(l: LeadDocRow, index: number): (Paragraph | Table)[] {
  const rows: TableRow[] = [
    fieldRow("Received", when(l.createdAt)),
    fieldRow("Status", STATUS_LABEL[l.status] ?? l.status),
    fieldRow("Phone", l.phone),
    fieldRow("Email", l.email),
    fieldRow("Property address", l.propertyAddress || "Not provided"),
    fieldRow("Services requested", servicesOf(l) || "Not specified"),
  ];
  if (l.division) rows.push(fieldRow("Division", DIVISION_LABEL[l.division] ?? l.division));
  rows.push(fieldRow("Message from customer", l.message?.trim() || "None"));
  if (l.estimateCents != null) rows.push(fieldRow("Previously quoted", money(l.estimateCents)));
  if (l.notes) rows.push(fieldRow("Office notes", l.notes));
  rows.push(fieldRow("Came in via", SOURCE_LABEL[l.source] ?? l.source));

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 360, after: 120 },
      children: [text(`${index}. ${l.name}`)],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
    }),
  ];
}

function summaryTable(leads: LeadDocRow[]): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell("Name", { bold: true, shade: HEADER_SHADE, width: 24, color: "FFFFFF" }),
      cell("Phone", { bold: true, shade: HEADER_SHADE, width: 18, color: "FFFFFF" }),
      cell("Email", { bold: true, shade: HEADER_SHADE, width: 30, color: "FFFFFF" }),
      cell("Services", { bold: true, shade: HEADER_SHADE, width: 28, color: "FFFFFF" }),
    ],
  });
  const body = leads.map(
    (l) =>
      new TableRow({
        children: [
          cell(l.name, { width: 24 }),
          cell(l.phone, { width: 18 }),
          cell(l.email, { width: 30 }),
          cell(servicesOf(l) || "Not specified", { width: 28 }),
        ],
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...body],
  });
}

export async function leadsToDocx(leads: LeadDocRow[]): Promise<Buffer> {
  const sorted = [...leads].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const fresh = sorted.filter((l) => l.status === "NEW");
  const worked = sorted.filter((l) => l.status !== "NEW");

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [text(`${siteConfig.name} — Website Quote Requests`)],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        text(
          `Exported ${when(new Date())} · ${leads.length} lead${leads.length === 1 ? "" : "s"} · ${fresh.length} not yet quoted`,
          { color: "555555" }
        ),
      ],
    }),
  ];

  if (leads.length === 0) {
    children.push(
      new Paragraph({
        children: [text("No quote requests have been captured by the website form.")],
      })
    );
  } else {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [text("Quick contact list")],
      }),
      summaryTable(sorted)
    );

    let n = 1;
    if (fresh.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 120 },
          children: [text(`Not yet quoted (${fresh.length})`)],
        })
      );
      for (const l of fresh) children.push(...leadSection(l, n++));
    }
    if (worked.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { after: 120 },
          children: [text(`Already quoted, won or lost (${worked.length})`)],
        })
      );
      for (const l of worked) children.push(...leadSection(l, n++));
    }
  }

  const doc = new Document({
    creator: siteConfig.name,
    title: "Website Quote Requests",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22 } },
        title: { run: { size: 40, bold: true, color: "1F3A5F" } },
        heading1: { run: { size: 30, bold: true, color: "1F3A5F" } },
        heading2: { run: { size: 26, bold: true, color: "111111" } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

