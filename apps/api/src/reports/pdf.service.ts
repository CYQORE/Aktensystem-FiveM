import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

export interface CaseFilePdfData {
  id: string;
  type: string;
  title: string;
  summary?: string | null;
  status: string;
  securityLevel: string;
  createdAt: Date;
}

/** Erzeugt PDF-Berichte (z.B. Aktenexport). */
@Injectable()
export class PdfService {
  caseFileReport(data: CaseFilePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).text("Aktensystem — Aktenexport", { align: "center" });
      doc.moveDown();
      doc.fontSize(10).fillColor("#666").text(`Sicherheitsstufe: ${data.securityLevel}`, {
        align: "right",
      });
      doc.moveDown();

      doc.fillColor("#000").fontSize(14).text(data.title);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#444");
      doc.text(`Akten-ID: ${data.id}`);
      doc.text(`Typ: ${data.type}`);
      doc.text(`Status: ${data.status}`);
      doc.text(`Erstellt: ${data.createdAt.toISOString()}`);
      doc.moveDown();

      if (data.summary) {
        doc.fillColor("#000").fontSize(12).text("Zusammenfassung", { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor("#222").text(data.summary, { align: "justify" });
      }

      doc.end();
    });
  }
}
