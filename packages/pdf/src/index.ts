/**
 * Geração de PDFs para documentos NR1Check
 * Usa Puppeteer (Chrome headless) — funciona em Node e na maioria dos hosts.
 *
 * Se preferir, pode substituir por @react-pdf/renderer ou pdfkit no futuro.
 */
import puppeteer from "puppeteer";

type DocumentData = {
  title: string;
  companyName: string;
  content: string; // HTML
  footer?: string;
  signatureBlock?: { name: string; date: string; ip: string };
};

export async function generatePdf(data: DocumentData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const html = renderHtml(data);
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdf);
}

function renderHtml({ title, companyName, content, footer, signatureBlock }: DocumentData): string {
  return `
    <!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; line-height: 1.5; padding: 0; margin: 0; }
        .header { border-bottom: 2px solid #0052d4; padding-bottom: 10px; margin-bottom: 20px; }
        .logo { color: #0052d4; font-weight: 700; font-size: 18px; }
        h1 { font-size: 18px; margin: 0 0 5px; }
        .meta { color: #666; font-size: 11px; }
        .content { font-size: 12px; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
        .signature { margin-top: 50px; }
        .signature .line { border-top: 1px solid #000; padding-top: 5px; width: 60%; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🛡️ NR1Check</div>
        <h1>${title}</h1>
        <p class="meta">${companyName} · Emitido em ${new Date().toLocaleString("pt-BR")}</p>
      </div>
      <div class="content">${content}</div>
      ${
        signatureBlock
          ? `<div class="signature">
              <div class="line">${signatureBlock.name}</div>
              <p class="meta">Assinado em ${signatureBlock.date} · IP ${signatureBlock.ip}</p>
            </div>`
          : ""
      }
      <div class="footer">${footer ?? "NR1Check · Documento gerado eletronicamente · Hash imutável registrado"}</div>
    </body>
    </html>
  `;
}
