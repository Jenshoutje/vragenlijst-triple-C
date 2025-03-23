// corkboard.js

"use strict";

// Globale variabelen om de 'drag state' bij te houden
let activeCard = null;
let offsetX = 0;
let offsetY = 0;

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ corkboard.js geladen!");

  // Zoek het bord en alle kaarten
  const board = document.querySelector(".corkboard");
  if (!board) {
    console.warn("⚠ Geen element met class .idea-board gevonden. Drag & drop wordt overgeslagen.");
    return; // Stop als er geen bord is
  }

  // Zorg dat .idea-board 'position: relative' heeft in CSS
  const cards = board.querySelectorAll(".idea-card");
  if (cards.length === 0) {
    console.warn("⚠ Geen .idea-card elementen gevonden binnen .idea-board.");
  }

  // Voor elke kaart: voeg eventlisteners toe
  cards.forEach(card => {
    // Zorg dat de kaart 'position: absolute' of 'position: relative' heeft
    // Als dit niet in CSS staat, zetten we het hier voor de zekerheid
    const stylePos = window.getComputedStyle(card).position;
    if (stylePos !== "absolute" && stylePos !== "relative") {
      card.style.position = "absolute";
    }

    card.addEventListener("mousedown", onMouseDown);
  });

  // Mousemove en mouseup komen op document-niveau, zodat je ook buiten de kaart kunt 'loslaten'
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  /**
   * Functie: op mousedown kijken we of we op een kaart klikken,
   * en zo ja: slaan we de referentie (activeCard) en offset op.
   */
  function onMouseDown(e) {
    // Kijk of de klik op .idea-card of een child ervan was
    let targetCard = e.target.closest(".idea-card");
    if (!targetCard) return; // Niet op een kaart geklikt

    activeCard = targetCard;

    // Bepaal offset zodat de kaart niet 'springt'
    const rect = activeCard.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Event default voorkomen (voorkomt tekstselectie)
    e.preventDefault();
  }

  /**
   * Functie: op mousemove verplaatsen we de actieve kaart (indien aanwezig)
   */
  function onMouseMove(e) {
    if (!activeCard) return; // Geen actieve kaart, dus geen drag

    // Bepaal de nieuwe positie binnen het bord
    const boardRect = board.getBoundingClientRect();
    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    // Optioneel: Kaarten binnen de randen houden
    const maxX = boardRect.width - activeCard.offsetWidth;
    const maxY = boardRect.height - activeCard.offsetHeight;

    // 'Clamp' de coördinaten zodat de kaart niet buiten de board-randen gaat
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // Pas de stijlen aan
    activeCard.style.left = newX + "px";
    activeCard.style.top = newY + "px";
  }

  /**
   * Functie: op mouseup is de drag klaar
   */
  function onMouseUp(e) {
    if (activeCard) {
      console.log(`Kaart "${activeCard.querySelector("h3")?.innerText || "zonder titel"}" neergezet.`);
    }
    activeCard = null;
  }
});
