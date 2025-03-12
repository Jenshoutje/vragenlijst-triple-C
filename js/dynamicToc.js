document.addEventListener("DOMContentLoaded", () => {
  // Zoek de container waar de TOC in moet komen
  const tocContainer = document.getElementById("toc-container");
  if (!tocContainer) return;

  // Zoek het <article> element met de hoofdinhoud
  const articleContent = document.querySelector("article");
  if (!articleContent) {
    console.error("Geen <article> element gevonden voor de inhoudsopgave.");
    return;
  }

  // Selecteer alle h2 en h3 elementen binnen het artikel
  const headings = articleContent.querySelectorAll("h2, h3");

  // Maak een <ul> element voor de TOC
  const tocList = document.createElement("ul");

  // Itereer door de koppen en maak voor elk een lijstitem met een link
  headings.forEach(heading => {
    // Zorg ervoor dat elk heading een unieke id heeft
    if (!heading.id) {
      heading.id = heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const listItem = document.createElement("li");
    // Voeg extra styling toe voor h3-elementen (bijvoorbeeld voor indentatie)
    if (heading.tagName.toLowerCase() === "h3") {
      listItem.classList.add("toc-h3");
    }
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });

  // Voeg de gegenereerde lijst toe aan de TOC-container
  tocContainer.appendChild(tocList);
});
