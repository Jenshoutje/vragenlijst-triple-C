const puppeteer = require('puppeteer');

const pages = [
  'https://jenshoutje.github.io/vragenlijst-triple-C/',
  'https://jenshoutje.github.io/vragenlijst-triple-C/onderzoek.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/discover.html',

];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (let url of pages) {
    const fileName = url.split('/').pop() || 'index';
    console.log(`Genereert ${fileName}.pdf...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: `${fileName}.pdf`,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    });
  }

  await browser.close();
  console.log("Alle PDF's succesvol gegenereerd.");
})();
