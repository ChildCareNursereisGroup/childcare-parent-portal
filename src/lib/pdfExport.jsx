import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { buildFormBlocks, PageShell, PAGE_W, PAGE_H, PAD_X, SLIM_H, FOOT_H } from "../FormPrint";
import EvalPrintView from "../EvalPrint";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hiddenContainer() {
  const c = document.createElement("div");
  c.style.position = "fixed";
  c.style.top = "-20000px";
  c.style.left = "0";
  c.style.zIndex = "-1";
  document.body.appendChild(c);
  return c;
}

async function waitForImages(container) {
  const imgs = [...container.querySelectorAll("img")];
  await Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; setTimeout(r, 2500); }))));
}

// Renders a React element off-screen, rasterizes it with the browser's own text
// engine (so Arabic shapes correctly) and slices it into A4 pages. Used for
// simple one-flow documents (monthly report).
async function elementToPdfBlob(element) {
  const container = hiddenContainer();
  const root = createRoot(container);
  root.render(element);
  await sleep(350);
  await waitForImages(container);

  const canvas = await html2canvas(container.firstChild, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  root.unmount();
  document.body.removeChild(container);

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  return pdf.output("blob");
}

// Registration form: measure each block, pack whole blocks onto A4 pages (never
// splitting a section), then capture every page on its own.
export async function generateFormPdfBlob({ f, branch, billing, signatureDataUrl, attached }) {
  const { blocks, theme } = buildFormBlocks({ f, branch, billing, signatureDataUrl, attached });
  const branchName = branch?.name?.ar || f.branch || "";
  const GAP = 12;
  const contentW = PAGE_W - PAD_X * 2;

  // 1) measure
  const measure = hiddenContainer();
  const mroot = createRoot(measure);
  mroot.render(
    <div dir="rtl" style={{ width: contentW, fontFamily: "Tajawal, Arial, sans-serif" }}>
      {blocks.map((b) => (<div key={b.key} data-b={b.key} style={{ paddingBottom: GAP }}>{b.el}</div>))}
    </div>
  );
  await sleep(450);
  await waitForImages(measure);
  const heights = blocks.map((b) => measure.querySelector(`[data-b="${b.key}"]`).getBoundingClientRect().height);
  mroot.unmount();
  document.body.removeChild(measure);

  // 2) pack
  const pages = [[]];
  let used = 0;
  const avail = (pageIdx) => PAGE_H - FOOT_H - 28 - (pageIdx === 0 ? 0 : SLIM_H) - (pageIdx === 0 ? 16 : 10);
  blocks.forEach((b, i) => {
    const idx = pages.length - 1;
    if (used + heights[i] > avail(idx) && pages[idx].length > 0) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(b);
    used += heights[i];
  });

  // 3) capture each page
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  for (let p = 0; p < pages.length; p++) {
    const holder = hiddenContainer();
    const root = createRoot(holder);
    root.render(
      <PageShell theme={theme} branchName={branchName} childName={f.name} pageNo={p + 1} total={pages.length} first={p === 0}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {pages[p].map((b, bi) => (
            <div key={b.key} style={{ paddingBottom: GAP, ...(p === pages.length - 1 && b.key === "closing" ? { flex: 1, display: "flex", flexDirection: "column" } : {}) }}>{b.el}</div>
          ))}
        </div>
      </PageShell>
    );
    await sleep(250);
    await waitForImages(holder);
    const canvas = await html2canvas(holder.firstChild, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    root.unmount();
    document.body.removeChild(holder);
    if (p > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, pw, ph);
  }
  return pdf.output("blob");
}

export function generateReportPdfBlob({ report, branchLabel }) {
  return elementToPdfBlob(<EvalPrintView report={report} branchLabel={branchLabel} />);
}
