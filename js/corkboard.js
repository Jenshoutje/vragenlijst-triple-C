"use strict";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ corkboard.js geladen!");

  // Zoek het 'corkboard' element (het klembord)
  const board = document.querySelector(".corkboard");
  if (!board) {
    console.error("❌ Geen element met class .corkboard gevonden.");
    return;
  }

  // Selecteer alle memo-kaarten (idea-card)
  const cards = board.querySelectorAll(".idea-card");
  if (cards.length === 0) {
    console.warn("⚠ Geen .idea-card elementen gevonden in het klembord.");
  }

  // (1) Gestapelde startpositie: een lichte offset zodat de kaarten niet allemaal exact overlappen
  const baseX = 20;      // Beginpositie X binnen board
  const baseY = 20;      // Beginpositie Y binnen board
  const offsetStep = 15; // Offset per kaart

  cards.forEach((card, index) => {
    card.style.position = "absolute";
    card.style.left = `${baseX + index * offsetStep}px`;
    card.style.top = `${baseY + index * offsetStep}px`;
  });

  // (2) DRAG & DROP-instellingen
  let activeCard = null;
  let offsetX = 0;
  let offsetY = 0;
  const gridSize = 20; // Snap-to-grid (20px)

  cards.forEach(card => {
    // Zorg dat elke kaart een positionering heeft
    if (!["absolute", "relative"].includes(window.getComputedStyle(card).position)) {
      card.style.position = "absolute";
    }
    card.addEventListener("pointerdown", onPointerDown);
  });

  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", () => {
    activeCard = null;
  });

 function onPointerDown(e) {
  // 1. Controleer of de gebruiker op de link klikt
  const link = e.target.closest(".card-link");
  if (link) {
    // Klik gebeurde op de "Lees meer"-link, dus niet gaan draggen.
    return;
  }

  // 2. Anders is het een echte drag op de kaart
  const card = e.target.closest(".idea-card");
  if (!card) return;

  activeCard = card;

  const rect = card.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;

  card.setPointerCapture(e.pointerId);
  card.style.boxShadow = "0 6px 15px rgba(0,0,0,0.3)";

  e.preventDefault();
}

  function onPointerMove(e) {
    if (!activeCard) return;

    const boardRect = board.getBoundingClientRect();
    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    const maxX = boardRect.width - activeCard.offsetWidth;
    const maxY = boardRect.height - activeCard.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Snap-to-grid
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;

    activeCard.style.left = `${newX}px`;
    activeCard.style.top = `${newY}px`;
  }

  function onPointerUp(e) {
    if (activeCard) {
      activeCard.releasePointerCapture(e.pointerId);
      activeCard.style.boxShadow = "";
      console.log(`Kaart "${activeCard.querySelector("h3")?.innerText || "zonder titel"}" neergezet.`);
    }
    activeCard = null;
  }

  // (3) "Lees meer"-knoppen logica
  let readMoreCount = 0;
  const totalNeeded = 5; // Aantal knoppen dat moet worden aangeklikt

  // Zoek alle "Lees meer" knoppen binnen de kaarten (verondersteld dat ze de class .card-link hebben)
  const readMoreButtons = board.querySelectorAll(".card-link");
  readMoreButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Zorg dat deze klik niet door de drag-events wordt opgevangen
      e.stopPropagation();
      e.preventDefault();
      readMoreCount++;
      console.log(`Lees meer geklikt! Totaal nu: ${readMoreCount}`);

      if (readMoreCount >= totalNeeded) {
        showFinalMemo();
      }
    });
  });

  // (4) Functie: Toon de 6e memo met typewriter-effect
  let finalMemoShown = false;
  function showFinalMemo() {
    if (finalMemoShown) return;
    finalMemoShown = true;

    // Maak een nieuw memo-element aan
    const finalCard = document.createElement("div");
    finalCard.classList.add("idea-card");
    finalCard.style.position = "absolute";
    // Plaats het in de rechterbovenhoek (pas aan naar wens)
    finalCard.style.right = "20px";
    finalCard.style.top = "20px";
    finalCard.style.width = "3000px";
    finalCard.style.height = "350px";
    finalCard.style.backgroundColor = "#a84db8";
    finalCard.style.padding = "10px";
    finalCard.style.borderRadius = "10px";
    finalCard.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    finalCard.innerHTML = `
      <h3>Prototype</h3>
      <div class="typing-text"></div>
    `;

    // Voeg de nieuwe memo toe aan het bord
    board.appendChild(finalCard);

    // Voeg drag functionaliteit toe aan de nieuwe kaart
    finalCard.addEventListener("pointerdown", onPointerDown);

    // Start de typewriter-animatie
    startTypingAnimation(finalCard.querySelector(".typing-text"));
  }

  // (5) Typewriter-effect voor de 6e memo
  function startTypingAnimation(textElem) {
    if (!textElem) return;
    const message = "Een AI-ondersteunde Triple C-tool \n die de werkdruk vermindert en \n eenduidige scholing bevordert!";
    let idx = 0;
    const speed = 50; // ms per character

    const timer = setInterval(() => {
      textElem.textContent = message.slice(0, idx);
      idx++;
      if (idx > message.length) {
        clearInterval(timer);
      }
    }, speed);
  }
});
