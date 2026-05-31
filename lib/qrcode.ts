import QRCode from "qrcode";

/**
 * Generates a PNG data URL for a QR code. Sized for print-friendly use
 * (1024px gives a crisp 4"×4" at 256 DPI which is more than enough for
 * door hangers / truck decals / invoice corners).
 *
 * Returns the data URL string. The caller can use it as an <img src=> for
 * display AND as the href of an <a download="..."> link to let the user
 * save the PNG.
 *
 * High error-correction (M-level) so the QR still scans if part of it
 * is scuffed or printed at small sizes.
 */
export async function generateReviewQrPng(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 1024,
    color: {
      // Black-on-white prints sharpest; we'll style the surrounding card
      // for the dark UI.
      dark: "#0A0E17",
      light: "#FFFFFF",
    },
  });
}
