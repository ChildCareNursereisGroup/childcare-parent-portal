import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import FormPrintView from "../FormPrint";

export async function generateFormPdfBlob({ f, branchLabel, billing, signatureDataUrl }) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "0";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  const root = createRoot(container);
  await new Promise((resolve) => {
    root.render(<FormPrintView f={f} branchLabel={branchLabel} billing={billing} signatureDataUrl={signatureDataUrl} />);
    setTimeout(resolve, 350);
  });

  const target = container.firstChild;
  const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

  root.unmount();
  document.body.removeChild(container);

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
}
