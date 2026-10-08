import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export function trimCanvasBottom(sourceCanvas, threshold = 248, padding = 12) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  if (!width || !height) return sourceCanvas;

  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const pixels = ctx.getImageData(0, 0, width, height).data;

  // Search upward for the last row containing meaningful non-white pixels.
  let lastContentRow = -1;
  for (let y = height - 1; y >= 0; y -= 2) {
    const rowStart = y * width * 4;
    let found = false;
    for (let x = 0; x < width; x += 2) {
      const i = rowStart + x * 4;
      if (
        pixels[i] < threshold ||
        pixels[i + 1] < threshold ||
        pixels[i + 2] < threshold ||
        pixels[i + 3] < 245
      ) {
        found = true;
        break;
      }
    }
    if (found) {
      lastContentRow = y;
      break;
    }
  }

  if (lastContentRow < 0 || lastContentRow >= height - padding) return sourceCanvas;

  const newHeight = Math.min(height, lastContentRow + padding + 1);
  const out = document.createElement("canvas");
  out.width = width;
  out.height = newHeight;
  const outCtx = out.getContext("2d");
  outCtx.fillStyle = "#ffffff";
  outCtx.fillRect(0, 0, width, newHeight);
  outCtx.drawImage(sourceCanvas, 0, 0, width, newHeight, 0, 0, width, newHeight);
  return out;
}

export async function buildPdfBlob(source, opts) {
  if (!jsPDF || !html2canvas) {
    throw new Error("PDF libraries failed to load.");
  }

  const page = opts.pageSize || "a4";
  const sizes = {
    a4: { w: 210, h: 297 },
    letter: { w: 215.9, h: 279.4 }
  };
  const size = sizes[page] || sizes.a4;
  const pageW = size.w;
  const pageH = size.h;
  const scale = Number(opts.scale || 100) / 100;
  const top = Number(opts.marginTop ?? 7);
  const right = Number(opts.marginRight ?? 10);
  const bottom = Number(opts.marginBottom ?? 7);
  const left = Number(opts.marginLeft ?? 10);
  const breakMode = opts.breakMode || "auto";
  const breakSections = opts.breakSections || [];

  if (left + right >= pageW || top + bottom >= pageH) {
    throw new Error("Margins are too large for the selected page size.");
  }

  if (!source) throw new Error("Resume page not found.");

  // Clone the resume at its native A4 layout width with proportional font scaling.
  const cloneHost = document.createElement("div");
  cloneHost.style.cssText =
    "position:fixed;left:-100000px;top:0;width:210mm;background:#fff;z-index:-1;";
  const clone = source.cloneNode(true);
  clone.style.cssText = `width:210mm;max-width:210mm;min-height:0;height:auto;margin:0;padding:0 10mm 15px 10mm;box-sizing:border-box;background:#fff;box-shadow:none;overflow:visible;font-size:${scale * 100}%;`;

  // Remove all .no-print elements (like upload placeholders, overlays) from the PDF export clone
  clone.querySelectorAll(".no-print").forEach((el) => el.remove());

  cloneHost.appendChild(clone);
  document.body.appendChild(cloneHost);

  // Wait for images, fonts, and layout to settle
  const images = Array.from(clone.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const rect = clone.getBoundingClientRect();
  const renderScale = 2.5;
  const canvas = await html2canvas(clone, {
    scale: renderScale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
    windowWidth: Math.ceil(rect.width),
    windowHeight: Math.ceil(rect.height)
  });

  // Remove trailing blank canvas rows.
  const trimmedCanvas = trimCanvasBottom(canvas);

  // The resume print layout uses 10mm horizontal internal padding.
  const internalPadMm = 10;
  const internalPadPx = Math.round((internalPadMm / 210) * canvas.width);
  const croppedX = Math.max(0, Math.min(canvas.width - 1, internalPadPx));
  const croppedWidth = Math.max(1, canvas.width - internalPadPx * 2);
  const contentCanvasBase = document.createElement("canvas");
  contentCanvasBase.width = croppedWidth;
  contentCanvasBase.height = trimmedCanvas.height;
  const contentBaseCtx = contentCanvasBase.getContext("2d");
  contentBaseCtx.fillStyle = "#ffffff";
  contentBaseCtx.fillRect(0, 0, contentBaseCtx.canvas.width, contentBaseCtx.canvas.height);
  contentBaseCtx.drawImage(
    trimmedCanvas,
    croppedX,
    0,
    croppedWidth,
    trimmedCanvas.height,
    0,
    0,
    croppedWidth,
    trimmedCanvas.height
  );

  // Capture link rectangles before removing clone
  const links = Array.from(clone.querySelectorAll("a[href]"))
    .map((a) => {
      const r = a.getBoundingClientRect();
      return {
        href: a.href,
        x: r.left - rect.left - (internalPadMm / 210) * rect.width,
        y: r.top - rect.top,
        w: r.width,
        h: r.height
      };
    })
    .filter((l) => l.href && l.w > 0 && l.h > 0);

  // Capture section boundaries for custom break mode
  const sectionBreaks =
    breakMode === "custom"
      ? breakSections
          .map((id) => {
            const el = clone.querySelector(`#${id}`);
            if (!el) return null;
            const h2 = el.querySelector("h2") || el;
            const h2Rect = h2.getBoundingClientRect();
            let prev = el.previousElementSibling;
            while (prev && (prev.offsetHeight === 0 || prev.clientHeight === 0)) {
              prev = prev.previousElementSibling;
            }
            const prevBottom = prev ? prev.getBoundingClientRect().bottom : h2Rect.top - 10;
            return {
              id,
              prevBottomY: Math.max(0, prevBottom - rect.top),
              h2TopY: Math.max(0, h2Rect.top - rect.top)
            };
          })
          .filter(Boolean)
      : [];

  // Collect candidate break positions from DOM elements
  const rawBreaks = [];
  clone
    .querySelectorAll(
      "#header-section, #summary-section, #education-section > div, #skills-section, .skills-grid, .experience-item, #projects-section > div, #certifications-section li, #achievements-section li, .custom-resume-section > div, .custom-resume-section"
    )
    .forEach((el) => {
      const r = el.getBoundingClientRect();
      const bottomY = Math.round((r.bottom - rect.top) * renderScale);
      if (bottomY > 8 && bottomY < trimmedCanvas.height - 8) rawBreaks.push(bottomY);
    });

  cloneHost.remove();

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: page,
    compress: true
  });

  const availableW = pageW - left - right;
  const availableH = pageH - top - bottom;
  const contentPxToMm = availableW / (croppedWidth / renderScale);
  const finalW = availableW;
  const xPos = left;
  const pageCanvasHeight = Math.ceil((availableH / contentPxToMm) * renderScale);
  const contentCanvas = contentCanvasBase;
  const contentHeight = contentCanvas.height;

  const contentCtx = contentCanvas.getContext("2d", { willReadFrequently: true });
  const canvasPixels = contentCtx.getImageData(0, 0, contentCanvas.width, contentCanvas.height).data;
  const canvasW = contentCanvas.width;

  function isWhiteRow(y) {
    if (y < 0 || y >= contentHeight) return true;
    const rowStart = y * canvasW * 4;
    for (let x = 0; x < canvasW; x += 3) {
      const i = rowStart + x * 4;
      if (canvasPixels[i] < 235 || canvasPixels[i + 1] < 235 || canvasPixels[i + 2] < 235) {
        return false;
      }
    }
    return true;
  }

  function findWhitespaceGapAfter(startY, maxScan = 40, minBand = 2) {
    const clampedStart = Math.max(0, Math.min(contentHeight - 1, startY));
    let consecutiveWhite = 0;
    let bandStart = -1;

    for (let y = clampedStart; y <= Math.min(contentHeight - 1, clampedStart + maxScan); y++) {
      if (isWhiteRow(y)) {
        consecutiveWhite++;
        if (bandStart < 0) bandStart = y;
        if (consecutiveWhite >= minBand) {
          return Math.round((bandStart + y) / 2);
        }
      } else {
        consecutiveWhite = 0;
        bandStart = -1;
      }
    }
    return null;
  }

  function findWhitespaceGapBefore(startY, maxScan = 240, minBand = 2) {
    const clampedStart = Math.max(0, Math.min(contentHeight - 1, startY));
    let consecutiveWhite = 0;
    let bandStart = -1;

    for (let y = clampedStart; y >= Math.max(0, clampedStart - maxScan); y--) {
      if (isWhiteRow(y)) {
        consecutiveWhite++;
        if (bandStart < 0) bandStart = y;
        if (consecutiveWhite >= minBand) {
          return Math.round((bandStart + y) / 2);
        }
      } else {
        consecutiveWhite = 0;
        bandStart = -1;
      }
    }
    return null;
  }

  const safeBreaks = [];
  rawBreaks.forEach((rawY) => {
    const clean = findWhitespaceGapAfter(rawY, 35) || rawY;
    if (clean && clean > 10 && clean < contentHeight - 10) {
      safeBreaks.push(clean);
    }
  });
  safeBreaks.sort((a, b) => a - b);

  function meaningfulRows(cv, minDarkPixels = 12) {
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let first = cv.height;
    let last = -1;
    for (let y = 0; y < cv.height; y += 2) {
      let dark = 0;
      const row = y * cv.width * 4;
      for (let x = 0; x < cv.width; x += 3) {
        const i = row + x * 4;
        if (data[i] < 235 || data[i + 1] < 235 || data[i + 2] < 235) {
          dark++;
          if (dark >= minDarkPixels) break;
        }
      }
      if (dark >= minDarkPixels) {
        if (first === cv.height) first = y;
        last = y;
      }
    }
    return last >= first ? { first, last, height: last - first + 1 } : null;
  }

  function buildAutomaticSlices() {
    const out = [];
    let cursor = 0;

    while (cursor < contentHeight - 1) {
      if (contentHeight - cursor <= pageCanvasHeight * 1.06) {
        out.push({ sy: cursor, sh: contentHeight - cursor });
        break;
      }

      const naturalEnd = Math.min(cursor + pageCanvasHeight, contentHeight);
      let end = naturalEnd;

      if (naturalEnd < contentHeight) {
        const candidates = safeBreaks.filter((y) => y > cursor + 120 && y <= naturalEnd);
        if (candidates.length > 0) {
          end = candidates[candidates.length - 1];
        } else {
          const cleanBand = findWhitespaceGapBefore(naturalEnd - 2, Math.min(320, pageCanvasHeight - 120));
          if (cleanBand && cleanBand > cursor + 40) {
            end = cleanBand;
          }
        }
      }

      const verifiedEnd = findWhitespaceGapAfter(end, 20) || findWhitespaceGapBefore(end, 20) || end;
      if (verifiedEnd <= cursor) break;
      end = verifiedEnd;

      const sh = end - cursor;
      if (sh <= 0) break;
      out.push({ sy: cursor, sh });
      cursor = end;
    }

    return out;
  }

  function buildCustomSlices() {
    const forced = [
      ...new Set(
        sectionBreaks.map((b) => {
          const prevBottomCanvas = Math.round(b.prevBottomY * renderScale);
          const h2TopCanvas = Math.round(b.h2TopY * renderScale);
          const gap = Math.max(1, h2TopCanvas - prevBottomCanvas);
          const clean =
            findWhitespaceGapAfter(prevBottomCanvas, gap + 25) ||
            Math.round((prevBottomCanvas + h2TopCanvas) / 2);
          return clean;
        })
      )
    ]
      .filter((y) => y > 8 && y < contentHeight - 8)
      .sort((a, b) => a - b);

    const out = [];
    let cursor = 0;

    for (const breakY of forced) {
      while (breakY - cursor > pageCanvasHeight) {
        if (breakY - cursor <= pageCanvasHeight * 1.06) {
          out.push({ sy: cursor, sh: breakY - cursor });
          cursor = breakY;
          break;
        }
        const naturalEnd = Math.min(cursor + pageCanvasHeight, breakY);
        let end = naturalEnd;
        const candidates = safeBreaks.filter((y) => y > cursor + 120 && y <= naturalEnd);
        if (candidates.length > 0) {
          end = candidates[candidates.length - 1];
        } else {
          const cleanBand = findWhitespaceGapBefore(naturalEnd - 2, Math.min(320, pageCanvasHeight - 120));
          if (cleanBand && cleanBand > cursor + 40) end = cleanBand;
        }
        const cleanCut = findWhitespaceGapAfter(end, 20) || findWhitespaceGapBefore(end, 20) || end;
        if (cleanCut <= cursor) break;
        out.push({ sy: cursor, sh: cleanCut - cursor });
        cursor = cleanCut;
      }

      if (breakY > cursor + 8) {
        out.push({ sy: cursor, sh: breakY - cursor });
        cursor = breakY;
      }
    }

    while (cursor < contentHeight - 1) {
      if (contentHeight - cursor <= pageCanvasHeight * 1.06) {
        out.push({ sy: cursor, sh: contentHeight - cursor });
        break;
      }
      const naturalEnd = Math.min(cursor + pageCanvasHeight, contentHeight);
      let end = naturalEnd;
      if (naturalEnd < contentHeight) {
        const candidates = safeBreaks.filter((y) => y > cursor + 120 && y <= naturalEnd);
        if (candidates.length > 0) {
          end = candidates[candidates.length - 1];
        } else {
          const cleanBand = findWhitespaceGapBefore(naturalEnd - 2, Math.min(320, pageCanvasHeight - 120));
          if (cleanBand && cleanBand > cursor + 40) end = cleanBand;
        }
      }
      const cleanCut = findWhitespaceGapAfter(end, 20) || findWhitespaceGapBefore(end, 20) || end;
      if (cleanCut <= cursor) break;
      out.push({ sy: cursor, sh: cleanCut - cursor });
      cursor = cleanCut;
    }
    return out;
  }

  const slices =
    breakMode === "custom" && sectionBreaks.length ? buildCustomSlices() : buildAutomaticSlices();

  slices.forEach((slice) => {
    const testCanvas = document.createElement("canvas");
    testCanvas.width = contentCanvas.width;
    testCanvas.height = Math.max(1, slice.sh);
    const testCtx = testCanvas.getContext("2d", { willReadFrequently: true });
    testCtx.fillStyle = "#ffffff";
    testCtx.fillRect(0, 0, testCanvas.width, testCanvas.height);
    testCtx.drawImage(
      contentCanvas,
      0,
      slice.sy,
      contentCanvas.width,
      slice.sh,
      0,
      0,
      contentCanvas.width,
      slice.sh
    );
    slice.bounds = meaningfulRows(testCanvas);
  });

  if (slices.length > 1) {
    const last = slices[slices.length - 1];
    if (!last.bounds || last.bounds.height < 4) {
      slices.pop();
    }
  }

  slices.forEach((slice, pageIdx) => {
    if (pageIdx > 0) pdf.addPage(page);

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = contentCanvas.width;
    sliceCanvas.height = Math.max(1, slice.sh);
    const sliceCtx = sliceCanvas.getContext("2d");
    sliceCtx.fillStyle = "#ffffff";
    sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    sliceCtx.drawImage(
      contentCanvas,
      0,
      slice.sy,
      contentCanvas.width,
      slice.sh,
      0,
      0,
      contentCanvas.width,
      slice.sh
    );

    const pageImgH = Math.min(availableH, (slice.sh / renderScale) * contentPxToMm);

    pdf.addImage(
      sliceCanvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      xPos,
      top,
      finalW,
      pageImgH,
      undefined,
      "FAST"
    );

    // Link annotations
    const sliceStartCss = slice.sy / renderScale;
    const sliceEndCss = (slice.sy + slice.sh) / renderScale;
    links.forEach((link) => {
      const linkY = link.y;
      const linkBottom = link.y + link.h;
      if (linkBottom <= sliceStartCss || linkY >= sliceEndCss) return;

      const yWithin = Math.max(0, linkY - sliceStartCss);
      const hWithin = Math.min(link.h, sliceEndCss - Math.max(linkY, sliceStartCss));
      if (hWithin <= 0) return;

      const xMm = xPos + link.x * contentPxToMm;
      const yMm = top + yWithin * contentPxToMm;
      const wMm = Math.min(link.w * contentPxToMm, Math.max(0, pageW - right - xMm));
      const hMm = hWithin * contentPxToMm;
      if (wMm > 0 && hMm > 0) {
        pdf.link(xMm, yMm, wMm, hMm, { url: link.href });
      }
    });
  });

  return pdf.output("blob");
}

export function downloadPdfBlob(blob, filename = "resume.pdf") {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

