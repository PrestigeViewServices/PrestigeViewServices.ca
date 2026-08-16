/**
 * Shareable "my package" card, drawn with the Canvas 2D API.
 *
 * Why not html2canvas: it is ~200 kB, it re-implements CSS layout in JS (so
 * the output drifts from the real design anyway), and pulling it from a CDN
 * would need a new entry in the next.config.js CSP allowlist. Drawing the
 * card by hand costs about the same amount of code, adds zero dependencies,
 * and gives an exact, predictable 1080×1350 result on every device.
 *
 * Output is 1080×1350 (4:5), the aspect ratio Instagram, Facebook, and
 * Messages all preview without cropping.
 */

export const CARD_W = 1080;
export const CARD_H = 1350;

export type PackageCardData = {
  tierName: string;
  /** Tier accent as a hex string, e.g. "#7DD3FC". */
  accent: string;
  /** Label/value rows describing the selection. */
  lines: { label: string; value: string }[];
  /** Human date, e.g. "16 August 2026". */
  dateLabel: string;
  phone: string;
  siteLabel: string;
};

/** Resolve the real font family names next/font generated for this page. */
function fontStack(): { body: string; display: string } {
  if (typeof window === "undefined") {
    return { body: "system-ui, sans-serif", display: "system-ui, sans-serif" };
  }
  const styles = getComputedStyle(document.body);
  const body = styles.fontFamily || "system-ui, sans-serif";
  const display =
    styles.getPropertyValue("--font-sora").trim() || body;
  // The CSS var holds a bare family name; give the canvas a fallback chain.
  const displayStack = display.includes(",")
    ? display
    : `${display}, ${body}`;
  return { body, display: displayStack };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Same-origin asset, but set this so the canvas is never tainted even if
    // the logo is later moved to a CDN.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Rounded rectangle path, kept local so we don't rely on roundRect support. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw a six-spoke snowflake centred at (cx, cy). */
function snowflake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    // Two small barbs per spoke.
    const bx = cx + Math.cos(a) * r * 0.62;
    const by = cy + Math.sin(a) * r * 0.62;
    ctx.moveTo(bx, by);
    ctx.lineTo(
      bx + Math.cos(a + Math.PI / 4) * r * 0.26,
      by + Math.sin(a + Math.PI / 4) * r * 0.26
    );
    ctx.moveTo(bx, by);
    ctx.lineTo(
      bx + Math.cos(a - Math.PI / 4) * r * 0.26,
      by + Math.sin(a - Math.PI / 4) * r * 0.26
    );
  }
  ctx.stroke();
}

/**
 * Renders the card and returns the canvas. Exposed separately from the blob
 * helpers so the PNG and the PDF can share one render pass.
 */
export async function renderPackageCard(
  data: PackageCardData
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable on this device.");

  // Wait for the webfonts so the card doesn't render in a fallback face.
  try {
    await document.fonts.ready;
  } catch {
    // Non-fatal: fall through to whatever is available.
  }
  const { body, display } = fontStack();

  const PAD = 84;
  const INNER = CARD_W - PAD * 2;

  // ---- Background: deep winter night with a cool wash from the top ----
  ctx.fillStyle = "#0A1220";
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const wash = ctx.createRadialGradient(
    CARD_W * 0.5,
    -CARD_H * 0.15,
    0,
    CARD_W * 0.5,
    CARD_H * 0.55,
    CARD_H * 0.95
  );
  wash.addColorStop(0, "rgba(56,189,248,0.20)");
  wash.addColorStop(0.55, "rgba(30,58,138,0.10)");
  wash.addColorStop(1, "rgba(10,18,32,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Decorative snowflakes, deterministic placement so every card matches.
  ctx.save();
  ctx.strokeStyle = "rgba(125,211,252,0.13)";
  ctx.lineWidth = 3;
  const FLAKES: [number, number, number][] = [
    [935, 250, 54],
    [120, 470, 34],
    [990, 700, 26],
    [90, 1060, 44],
    [880, 1180, 30],
  ];
  for (const [fx, fy, fr] of FLAKES) snowflake(ctx, fx, fy, fr);
  ctx.restore();

  // ---- Accent rail down the left edge, in the tier colour ----
  ctx.fillStyle = data.accent;
  roundRect(ctx, 0, 0, 14, CARD_H, 0);
  ctx.fill();

  // ---- Header: logo, or a wordmark if the image fails ----
  let cursorY = PAD;
  const logo = await loadImage("/images/logo.png");
  if (logo && logo.width > 0) {
    const h = 76;
    const w = (logo.width / logo.height) * h;
    ctx.drawImage(logo, PAD, cursorY, Math.min(w, 420), h);
    cursorY += h + 46;
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 54px ${display}`;
    ctx.textBaseline = "top";
    ctx.fillText("Prestige View Services", PAD, cursorY);
    cursorY += 54 + 46;
  }

  // ---- Eyebrow ----
  ctx.fillStyle = data.accent;
  ctx.font = `700 26px ${body}`;
  ctx.textBaseline = "top";
  ctx.letterSpacing = "3px";
  ctx.fillText("SEASONAL SNOW PASS", PAD, cursorY);
  ctx.letterSpacing = "0px";
  cursorY += 52;

  // ---- Tier name ----
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 132px ${display}`;
  ctx.fillText(data.tierName, PAD, cursorY);
  cursorY += 158;

  // ---- Accent underline ----
  ctx.fillStyle = data.accent;
  roundRect(ctx, PAD, cursorY, 132, 10, 5);
  ctx.fill();
  cursorY += 74;

  // ---- Selection rows in a frosted panel ----
  const rowH = 96;
  const panelH = data.lines.length * rowH + 56;
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  roundRect(ctx, PAD, cursorY, INNER, panelH, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 2;
  roundRect(ctx, PAD, cursorY, INNER, panelH, 32);
  ctx.stroke();

  let rowY = cursorY + 28;
  data.lines.forEach((line, i) => {
    if (i > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD + 36, rowY);
      ctx.lineTo(PAD + INNER - 36, rowY);
      ctx.stroke();
    }
    const textY = rowY + (rowH - 58) / 2;

    ctx.fillStyle = "rgba(226,240,255,0.55)";
    ctx.font = `600 24px ${body}`;
    ctx.letterSpacing = "2px";
    ctx.fillText(line.label.toUpperCase(), PAD + 36, textY);
    ctx.letterSpacing = "0px";

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 38px ${body}`;
    ctx.fillText(line.value, PAD + 36, textY + 34);

    rowY += rowH;
  });
  cursorY += panelH + 56;

  // ---- "No payment today" reassurance ----
  ctx.fillStyle = "#6EE7B7";
  ctx.font = `600 32px ${body}`;
  ctx.fillText("Free quote. No payment today.", PAD, cursorY);

  // ---- Footer, pinned to the bottom ----
  const footTop = CARD_H - PAD - 208;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, footTop);
  ctx.lineTo(CARD_W - PAD, footTop);
  ctx.stroke();

  ctx.fillStyle = "rgba(226,240,255,0.70)";
  ctx.font = `400 27px ${body}`;
  ctx.fillText(
    "Show or send this when requesting your quote",
    PAD,
    footTop + 30
  );

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 46px ${display}`;
  ctx.fillText(data.phone, PAD, footTop + 76);

  ctx.fillStyle = data.accent;
  ctx.font = `500 27px ${body}`;
  ctx.fillText(data.siteLabel, PAD, footTop + 142);

  // Date, bottom-right.
  ctx.fillStyle = "rgba(226,240,255,0.40)";
  ctx.font = `400 24px ${body}`;
  ctx.textAlign = "right";
  ctx.fillText(data.dateLabel, CARD_W - PAD, footTop + 146);
  ctx.textAlign = "left";

  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Could not build the image.")),
      type,
      quality
    );
  });
}

export async function packageCardPng(data: PackageCardData): Promise<Blob> {
  return canvasToBlob(await renderPackageCard(data), "image/png");
}

/**
 * Wraps the rendered card in a single-page PDF.
 *
 * The image is embedded as a JPEG stream with /DCTDecode, which means the PDF
 * carries the JPEG bytes verbatim — no deflate implementation needed, so this
 * stays dependency-free. Page size is the card size in points.
 */
export async function packageCardPdf(data: PackageCardData): Promise<Blob> {
  const canvas = await renderPackageCard(data);
  const jpeg = new Uint8Array(
    await (await canvasToBlob(canvas, "image/jpeg", 0.92)).arrayBuffer()
  );

  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let length = 0;
  const offsets: number[] = [];

  const push = (part: Uint8Array | string) => {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  /** Record where an object starts, then emit its header. */
  const startObject = (n: number) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  const content = `q\n${CARD_W} 0 0 ${CARD_H} 0 0 cm\n/Im0 Do\nQ\n`;

  push("%PDF-1.4\n");

  startObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  startObject(3);
  push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${CARD_W} ${CARD_H}] ` +
      `/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  startObject(4);
  push(
    `<< /Type /XObject /Subtype /Image /Width ${CARD_W} /Height ${CARD_H} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
      `/Length ${jpeg.length} >>\nstream\n`
  );
  push(jpeg);
  push("\nendstream\nendobj\n");

  startObject(5);
  push(`<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefOffset = length;
  const OBJECT_COUNT = 6; // objects 1..5 plus the free entry 0
  let xref = `xref\n0 ${OBJECT_COUNT}\n0000000000 65535 f \n`;
  for (let i = 1; i < OBJECT_COUNT; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(
    `trailer\n<< /Size ${OBJECT_COUNT} /Root 1 0 R >>\n` +
      `startxref\n${xrefOffset}\n%%EOF\n`
  );

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

/** Filename-safe slug, e.g. "PVS-Platinum-snow-pass". */
export function cardFileName(tierName: string, ext: string): string {
  const slug = tierName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `PVS-${slug}-snow-pass.${ext}`;
}

/**
 * Hands the card to the customer using the best route the device offers:
 * the native share sheet when it can carry files (so they can save to Photos
 * or send it straight to us), otherwise a direct download.
 */
export async function sharePackageCard(
  data: PackageCardData
): Promise<"shared" | "downloaded"> {
  const blob = await packageCardPng(data);
  const file = new File([blob], cardFileName(data.tierName, "png"), {
    type: "image/png",
  });

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `My ${data.tierName} snow pass`,
        text: `My ${data.tierName} seasonal snow pass from Prestige View Services.`,
      });
      return "shared";
    } catch (err) {
      // The user dismissing the sheet is not an error worth surfacing.
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared";
      }
      // Anything else (share failed outright): fall back to a download.
    }
  }

  downloadBlob(blob, cardFileName(data.tierName, "png"));
  return "downloaded";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a beat to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
