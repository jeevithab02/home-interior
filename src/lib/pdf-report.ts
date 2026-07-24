import { jsPDF } from "jspdf";
import type { HistoryEntry } from "./history";

const MARGIN = 40;

export async function exportDesignPdf(entry: HistoryEntry) {
  const { result, preview, variations } = entry;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = MARGIN;

  const addHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(20, 30, 40);
    doc.text("AI Interior Designer", MARGIN, y);
    y += 8;
    doc.setDrawColor(46, 160, 120);
    doc.setLineWidth(2);
    doc.line(MARGIN, y, MARGIN + 40, y);
    y += 24;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120, 130, 140);
    doc.text(
      `Design Report · ${new Date(entry.createdAt).toLocaleString()}`,
      MARGIN,
      y,
    );
    y += 24;
  };

  const ensure = (h: number) => {
    if (y + h > pageHeight - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const h2 = (title: string) => {
    ensure(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 30, 40);
    doc.text(title, MARGIN, y);
    y += 18;
  };

  const para = (text: string, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(50, 60, 70);
    const lines = doc.splitTextToSize(text, pageWidth - MARGIN * 2) as string[];
    for (const line of lines) {
      ensure(size + 4);
      doc.text(line, MARGIN, y);
      y += size + 4;
    }
  };

  addHeader();

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 30, 40);
  doc.text(`${result.room_type} · ${result.style}`, MARGIN, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 110, 120);
  doc.text(
    `Classification confidence: ${Math.round(result.confidence * 100)}%   ·   Overall design score: ${result.design_score.overall}/100`,
    MARGIN,
    y,
  );
  y += 24;

  // Preview image
  try {
    const imgW = pageWidth - MARGIN * 2;
    const imgH = imgW * 0.6;
    ensure(imgH + 12);
    doc.addImage(preview, "JPEG", MARGIN, y, imgW, imgH, undefined, "FAST");
    y += imgH + 20;
  } catch {
    /* ignore image errors */
  }

  // Scores
  h2("Design Scores");
  const scores: [string, number][] = [
    ["Overall", result.design_score.overall],
    ["Style match", result.design_score.style_match],
    ["Harmony", result.design_score.harmony],
    ["Functionality", result.design_score.functionality],
    ["Lighting", result.design_score.lighting],
  ];
  for (const [label, val] of scores) {
    ensure(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 70, 80);
    doc.text(label, MARGIN, y + 10);
    doc.text(`${val}/100`, pageWidth - MARGIN - 40, y + 10);
    doc.setDrawColor(230, 232, 236);
    doc.setFillColor(230, 232, 236);
    doc.roundedRect(MARGIN + 100, y + 4, pageWidth - MARGIN * 2 - 160, 8, 4, 4, "F");
    doc.setFillColor(46, 160, 120);
    doc.roundedRect(
      MARGIN + 100,
      y + 4,
      ((pageWidth - MARGIN * 2 - 160) * val) / 100,
      8,
      4,
      4,
      "F",
    );
    y += 18;
  }
  y += 10;

  // Analysis
  h2("Room Analysis");
  para(
    `Brightness: ${result.analysis.brightness}   ·   Clutter: ${result.analysis.clutter}   ·   Estimated size: ${result.analysis.estimated_size}`,
  );
  y += 4;
  para("Dominant colors detected in current room:");
  ensure(30);
  let cx = MARGIN;
  for (const hex of result.analysis.dominant_colors) {
    doc.setFillColor(hex);
    doc.roundedRect(cx, y, 60, 20, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(60, 70, 80);
    doc.text(hex, cx + 66, y + 13);
    cx += 130;
  }
  y += 34;

  // Recommendations
  h2("Recommendations");
  for (const rec of result.recommendations) {
    ensure(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 30, 40);
    doc.text(`${rec.category}  ·  ${rec.impact} impact`, MARGIN, y);
    y += 14;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(140, 60, 60);
    para(`Current: ${rec.issue}`, 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 120, 90);
    para(`Suggested: ${rec.suggestion}`, 9);
    y += 6;
  }

  // Palette
  h2(`${result.style} Color Palette`);
  ensure(50);
  cx = MARGIN;
  const swW = (pageWidth - MARGIN * 2) / result.color_palette.length - 6;
  for (const hex of result.color_palette) {
    doc.setFillColor(hex);
    doc.roundedRect(cx, y, swW, 40, 4, 4, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(hex, cx + 6, y + 24);
    cx += swW + 6;
  }
  y += 52;

  // Lighting
  h2("Lighting");
  para(result.lighting);
  y += 8;

  // Furniture
  h2("Furniture Plan");
  for (const f of result.furniture) {
    ensure(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 30, 40);
    doc.text(`${f.condition}  ·  ${f.name}`, MARGIN, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 100);
    para(f.note, 9);
    y += 4;
  }

  // Variations
  if (variations && variations.length > 0) {
    doc.addPage();
    y = MARGIN;
    h2("AI Redesign Variations");
    const imgW = (pageWidth - MARGIN * 2 - 20) / 2;
    const imgH = imgW * 0.75;
    let col = 0;
    let rowY = y;
    for (const v of variations) {
      if (col === 2) {
        col = 0;
        rowY += imgH + 20;
      }
      if (rowY + imgH > pageHeight - MARGIN) {
        doc.addPage();
        rowY = MARGIN;
      }
      try {
        doc.addImage(
          v,
          "PNG",
          MARGIN + col * (imgW + 20),
          rowY,
          imgW,
          imgH,
          undefined,
          "FAST",
        );
      } catch {
        /* ignore */
      }
      col++;
    }
  }

  doc.save(`design-report-${result.room_type.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
