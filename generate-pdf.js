const puppeteer = require('puppeteer');

const pages = [
  'https://jenshoutje.github.io/vragenlijst-triple-C/',
  'https://jenshoutje.github.io/vragenlijst-triple-C/onderzoek.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/discover.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/define.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/develop.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/deliver.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/matrixchart.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/mindmapchart.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/openvragenlijst.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/thematic-analysis.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/tool1.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/tool2.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/tool3.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/reflectie.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/bronnen.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/decision-matrix.html',
  'https://jenshoutje.github.io/vragenlijst-triple-C/alternatieve_leeswijze.html',
 
  

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
