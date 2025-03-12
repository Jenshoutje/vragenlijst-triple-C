document.addEventListener("DOMContentLoaded", () => {
  // Selecteer de container waar de TOC in komt
  const tocContainer = document.getElementById("toc-container");
  if (!tocContainer) return;

  // Selecteer alle h2 en h3 elementen binnen het artikel (of een specifiek container)
  const content = document.querySelector("article");
  const headings = content.querySelectorAll("h2, h3");

  // Maak een lijst element voor de TOC
  const tocList = document.createElement("ul");

  headings.forEach(heading => {
    // Zorg dat elk heading een id heeft; zo niet, maak er één aan
    if (!heading.id) {
      heading.id = heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const listItem = document.createElement("li");
    // Voeg een extra klasse toe voor h3 (bijvoorbeeld voor indentatie)
    if (heading.tagName.toLowerCase() === "h3") {
      listItem.classList.add("toc-h3");
    }
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });

  tocContainer.appendChild(tocList);
});
