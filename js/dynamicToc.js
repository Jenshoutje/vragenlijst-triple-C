document.addEventListener("DOMContentLoaded", () => {
  // Zoek de container waarin de TOC moet worden geplaatst.
  const tocContainer = document.getElementById("toc-container");
  if (!tocContainer) {
    // Als er geen element met id="toc-container" is (bijvoorbeeld op de hubpagina),
    // stopt het script zonder foutmelding.
    return;
  }

  // Zoek het <article> element met de hoofdinhoud op fasepagina’s.
  const articleContent = document.querySelector("article");
  if (!articleContent) {
    console.error("Geen <article> element gevonden voor de inhoudsopgave.");
    return;
  }

  // Selecteer alle h2 en h3 elementen binnen het artikel.
  const headings = articleContent.querySelectorAll("h2, h3");
  if (!headings.length) {
    // Als er geen headings zijn, stoppen we hier.
    return;
  }

  // Maak een <ul> element waarin de TOC-items komen.
  const tocList = document.createElement("ul");

  // Voor elke heading maken we een lijstitem met een link.
  headings.forEach(heading => {
    // Zorg ervoor dat elk heading een unieke id heeft.
    if (!heading.id) {
      heading.id = heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const listItem = document.createElement("li");
    // Voeg extra styling toe voor h3-elementen (bijv. indentatie).
    if (heading.tagName.toLowerCase() === "h3") {
      listItem.classList.add("toc-h3");
    }
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });

  // Voeg de gegenereerde lijst toe aan de TOC-container.
  tocContainer.appendChild(tocList);
});
