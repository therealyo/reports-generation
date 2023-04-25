import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function handler(event: any) {
  const htmls = event.htmls;
  const pdfs: { [userId: string]: Buffer } = {};

  chromium.setHeadlessMode = true;
  chromium.setGraphicsMode = false;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

  for (const [userId, html] of Object.entries(htmls)) {
    const page = await browser.newPage();
    await page.setContent(html);
    const pdfFile = await page.pdf({
      printBackground: true,
      margin: { top: 30, bottom: 30 },
      width: 1300,
    });

    pdfs[userId] = pdfFile;
  }

  await browser.close();

  return pdfs;
}
