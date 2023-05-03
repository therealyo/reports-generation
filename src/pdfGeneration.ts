import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export async function handler(event: any) {
  try {
    const html = event.html;

    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdfFile = await page.pdf({
      printBackground: true,
      // margin: { top: 30, bottom: 30 },
      // width: 1300,
    });

    await browser.close();

    return pdfFile;
  } catch (err) {
    console.error(err);
  }
}
