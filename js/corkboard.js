"use strict";

// -------------------------
// 1. INITIALISATIE & SETUP
// -------------------------
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

  // Stel een gestapelde startpositie in (kaarten overlappen licht)
  const baseX = 20; // Beginpositie X binnen board
  const baseY = 20; // Beginpositie Y binnen board
  const offsetStep = 15; // Offset per kaart

  cards.forEach((card, index) => {
    // Zorg dat de kaarten absoluut gepositioneerd zijn
    card.style.position = "absolute";
    // Zet de kaart op een gestapelde positie met een kleine offset
    card.style.left = `${baseX + index * offsetStep}px`;
    card.style.top = `${baseY + index * offsetStep}px`;
  });

  // -------------------------
  // 2. DRAG & DROP FUNCTIE
  // -------------------------
  let activeCard = null;
  let offsetX = 0;
  let offsetY = 0;
  const gridSize = 20; // Voor snap-to-grid (optioneel)

  // Voeg eventlisteners toe voor drag & drop
  cards.forEach(card => {
    card.addEventListener("pointerdown", onPointerDown);
  });
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", () => {
    activeCard = null;
  });

  function onPointerDown(e) {
    const card = e.target.closest(".idea-card");
    if (!card) return;
    activeCard = card;
    const rect = card.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    card.setPointerCapture(e.pointerId);
    // Optioneel: voeg een visuele indicatie toe dat de kaart wordt versleept
    card.style.boxShadow = "0 6px 15px rgba(0,0,0,0.3)";
  }

  function onPointerMove(e) {
    if (!activeCard) return;

    // Bepaal de nieuwe positie binnen het board
    const boardRect = board.getBoundingClientRect();
    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    // Zorg ervoor dat de kaart binnen de grenzen van het board blijft
    const maxX = boardRect.width - activeCard.offsetWidth;
    const maxY = boardRect.height - activeCard.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Snap-to-grid: rond af op het dichtstbijzijnde gridpunt (optioneel)
    newX = Math.round(newX / gridSize) * gridSize;
    newY = Math.round(newY / gridSize) * gridSize;

    activeCard.style.left = `${newX}px`;
    activeCard.style.top = `${newY}px`;
  }

  function onPointerUp(e) {
    if (activeCard) {
      activeCard.releasePointerCapture(e.pointerId);
      // Verwijder de tijdelijke schaduw
      activeCard.style.boxShadow = "";
      // Hier kun je extra logica toevoegen, bijvoorbeeld controleren of de kaart in een 'done zone' ligt
      console.log(`Kaart "${activeCard.querySelector("h3")?.innerText || "zonder titel"}" neergezet.`);
    }
    activeCard = null;
  }

  // -------------------------
  // 3. EXTRA FUNCTIONALITEIT (OPTIONEEL)
  // -------------------------
  // Je kunt hier later toevoegen:
  // - Een functie die controleert of alle kaarten in een bepaald gebied zijn geplaatst (bijv. 'done zone')
  // - Een overlay of prototype-visualisatie tonen wanneer dat zo is.
});
